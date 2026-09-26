import { NextResponse } from 'next/server';
import { getOrgId } from '@/lib/tenant';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { verifyDeviceToken } from '@/lib/deviceAuth';
import { touchScreenLastSeen } from '@/lib/screenStatus';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { 
      accountId, 
      deviceId, 
      currentScreenId, 
      action, 
      screenId,
      appVersion,
      cpuUsage,
      freeStorageMb,
      totalStorageMb,
      memoryAvailableMb,
      wifiSignalStrength
    } = body;

    // Handle Admin CMS Actions (LOGOUT device, DELETE_DEVICE, FORCE_SYNC, PUSH_UPDATE, PUSH_UPDATE_ALL)
    if (action === 'LOGOUT' || action === 'SCREEN_LOGOUT' || action === 'DELETE_DEVICE' || action === 'FORCE_SYNC' || action === 'PUSH_UPDATE' || action === 'PUSH_UPDATE_ALL') {
      const session = await getServerSession(authOptions);
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized CMS action' }, { status: 401 });
    const orgId = await getOrgId(session);
      }

      if (action === 'DELETE_DEVICE') {
        await prisma.tvDevice.delete({ where: { id: deviceId } }).catch(() => {});
        return NextResponse.json({ success: true });
      }

      if (action === 'LOGOUT' || action === 'SCREEN_LOGOUT') {
        await prisma.tvDevice.update({
          where: { id: deviceId },
          data: { screenId: null, commandQueue: 'LOGOUT' }
        }).catch(() => {});
        return NextResponse.json({ success: true });
      }

      if (action === 'FORCE_SYNC') {
        await prisma.tvDevice.update({
          where: { id: deviceId },
          data: { commandQueue: 'FORCE_RELOAD' }
        });
        return NextResponse.json({ success: true });
      }

      if (action === 'PUSH_UPDATE') {
        const updateUrl = body.updateUrl || '/api/downloads/tv-app.apk';
        await prisma.tvDevice.update({
          where: { id: deviceId },
          data: { commandQueue: `INSTALL_UPDATE|${updateUrl}` }
        });
        return NextResponse.json({ success: true, message: 'Update push queued' });
      }

      if (action === 'PUSH_UPDATE_ALL') {
        const updateUrl = body.updateUrl || '/api/downloads/tv-app.apk';
        const deviceIds = body.deviceIds;
        const filter = deviceIds && Array.isArray(deviceIds) && deviceIds.length > 0
          ? { id: { in: deviceIds } }
          : {};
        await prisma.tvDevice.updateMany({
          where: filter,
          data: { commandQueue: `INSTALL_UPDATE|${updateUrl}` }
        });
        return NextResponse.json({ success: true, message: 'Bulk update push queued' });
      }
    }

    // Handle regular player heartbeat & TV Device screen selection
    const deviceTokenPayload = verifyDeviceToken(req);
    if (!deviceTokenPayload || deviceTokenPayload.accountId !== accountId || deviceTokenPayload.deviceId !== deviceId) {
       return NextResponse.json({ error: 'Unauthorized device heartbeat' }, { status: 401 });
    }

    if (action === 'SYNC_SCREEN') {
      // TV device selecting its screen directly from the APK
      await prisma.tvDevice.update({
        where: { id: deviceId },
        data: { screenId: screenId || null, lastPingAt: new Date() }
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'UPDATE_LOCATION') {
      const { location: newLocation } = await req.json().catch(() => ({}));
      if (newLocation) {
        await prisma.tvDevice.update({
          where: { id: deviceId },
          data: { location: newLocation, lastPingAt: new Date() }
        }).catch(() => {});
      }
      return NextResponse.json({ success: true });
    }

    if (!accountId || !deviceId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Check if account still exists
    const account = await prisma.tvAccount.findUnique({ where: { id: accountId } });
    if (!account) {
      // Return a logout command so the player clears credentials
      return NextResponse.json({ command: 'LOGOUT' });
    }

    let screenConfig: any = null;
    let device = await prisma.tvDevice.findUnique({
      where: { id: deviceId }
    });

    if (device) {
      let commandToReturn = null;
      let updateUrlToReturn = null;
      let targetScreenId = null;
      let needsDbUpdate = false;
      const dataToUpdate: any = {};

      // Check for queued commands
      if (device.commandQueue === 'FORCE_RELOAD') {
        commandToReturn = 'RELOAD';
        dataToUpdate.commandQueue = null; // Clear queue
        needsDbUpdate = true;
      } else if (device.commandQueue === 'LOGOUT') {
        commandToReturn = 'LOGOUT';
        dataToUpdate.commandQueue = null;
        needsDbUpdate = true;
      } else if (device.commandQueue === 'FULL_LOGOUT') {
        commandToReturn = 'FULL_LOGOUT';
        dataToUpdate.commandQueue = null;
        needsDbUpdate = true;
      } else if (device.commandQueue === 'TAKE_SNAPSHOT') {
        commandToReturn = 'TAKE_SNAPSHOT';
        dataToUpdate.commandQueue = null;
        needsDbUpdate = true;
      } else if (device.commandQueue?.startsWith('INSTALL_UPDATE')) {
        commandToReturn = 'INSTALL_UPDATE';
        const parts = device.commandQueue.split('|');
        updateUrlToReturn = parts[1] || '/api/downloads/tv-app.apk';
        dataToUpdate.commandQueue = null;
        needsDbUpdate = true;
      } else if (device.screenId && device.screenId !== currentScreenId) {
        commandToReturn = 'SYNC_SCREEN';
        targetScreenId = device.screenId;
      }

      // Check if telemetry or version was reported in the ping
      if (appVersion && device.appVersion !== String(appVersion)) {
        dataToUpdate.appVersion = String(appVersion);
        needsDbUpdate = true;
      }
      if (cpuUsage !== undefined && cpuUsage !== null) {
        dataToUpdate.cpuUsage = Number(cpuUsage);
        needsDbUpdate = true;
      }
      if (freeStorageMb !== undefined && freeStorageMb !== null) {
        dataToUpdate.freeStorageMb = Number(freeStorageMb);
        needsDbUpdate = true;
      }
      if (totalStorageMb !== undefined && totalStorageMb !== null) {
        dataToUpdate.totalStorageMb = Number(totalStorageMb);
        needsDbUpdate = true;
      }
      if (memoryAvailableMb !== undefined && memoryAvailableMb !== null) {
        dataToUpdate.memoryAvailableMb = Number(memoryAvailableMb);
        needsDbUpdate = true;
      }
      if (wifiSignalStrength !== undefined && wifiSignalStrength !== null) {
        dataToUpdate.wifiSignalStrength = Math.round(Number(wifiSignalStrength));
        needsDbUpdate = true;
      }

      // Client IP
      const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.headers.get('x-real-ip');
      if (clientIp && device.ipAddress !== clientIp) {
        dataToUpdate.ipAddress = clientIp;
        needsDbUpdate = true;
      }

      // Check if lastPingAt is older than 30 seconds
      const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
      if (!device.lastPingAt || device.lastPingAt < thirtySecondsAgo) {
        dataToUpdate.lastPingAt = new Date();
        needsDbUpdate = true;
      }

      if (needsDbUpdate) {
        device = await prisma.tvDevice.update({
          where: { id: deviceId },
          data: dataToUpdate
        });
      }

      // Update screen lastSeenAt timestamp for CMS online status (throttled)
      const activeScreenId = currentScreenId || device.screenId;
      if (activeScreenId) {
        await touchScreenLastSeen(activeScreenId);
        try {
          const scr = await prisma.screen.findUnique({
            where: { id: activeScreenId },
            select: {
              alertActive: true,
              alertPayload: true,
              operatingHoursActive: true,
              wakeTime: true,
              sleepTime: true,
              sleepMode: true,
              location: true,
              organization: {
                select: {
                  broadcastAlertActive: true,
                  broadcastAlertPayload: true
                }
              }
            }
          });
          if (scr) {
            screenConfig = {
              alertActive: scr.alertActive || scr.organization?.broadcastAlertActive || false,
              alertPayload: scr.alertActive ? scr.alertPayload : scr.organization?.broadcastAlertPayload,
              operatingHoursActive: scr.operatingHoursActive,
              wakeTime: scr.wakeTime,
              sleepTime: scr.sleepTime,
              sleepMode: scr.sleepMode,
              location: (device as any)?.location || scr.location || null
            };
          }
        } catch (e) {
          // ignore error fetching config
        }
      }
      
      if (commandToReturn) {
        return NextResponse.json({ 
          success: true, 
          command: commandToReturn, 
          updateUrl: updateUrlToReturn || undefined,
          screenId: targetScreenId, 
          autoStart: device.autoStart, 
          location: (device as any)?.location, 
          screenConfig 
        });
      }
    } else {
      // Device was deleted remotely from CMS (Full remote wipe: company code & TV account)
      return NextResponse.json({ command: 'FULL_LOGOUT' });
    }

    // ==========================================
    // PIGGYBACK CRON: Check for Scheduled Pushes
    // ==========================================
    // Since Vercel Hobby limits cron jobs to 1/day, we use the frequent TV pings
    // as a heartbeat engine to check for scheduled pushes.
    try {
      const now = new Date();
      const pendingPush = await prisma.playlist.findFirst({
        where: { scheduledPushAt: { lte: now } },
        select: { id: true, name: true }
      });

      if (pendingPush) {
        // Atomic update to ensure only one ping triggers the push
        const updateResult = await prisma.playlist.updateMany({
          where: { id: pendingPush.id, scheduledPushAt: { lte: now } },
          data: { scheduledPushAt: null }
        });

        if (updateResult.count > 0) {
          const affectedScreens = await prisma.screen.findMany({
            where: {
              OR: [
                { playlistId: pendingPush.id },
                { interactivePlaylistId: pendingPush.id },
                { group: { playlistId: pendingPush.id } },
                { zoneMappings: { some: { playlistId: pendingPush.id } } }
              ]
            },
            select: { id: true }
          });
          
          const affectedScreenIds = affectedScreens.map((s: { id: string }) => s.id);
          
          if (affectedScreenIds.length > 0) {
            await prisma.tvDevice.updateMany({
              where: { screenId: { in: affectedScreenIds } },
              data: { commandQueue: 'FORCE_RELOAD' }
            });
            
            // If the current pinging device is in this list, give it the reload command immediately
            if (device && device.screenId && affectedScreenIds.includes(device.screenId)) {
               return NextResponse.json({ success: true, command: 'RELOAD', screenId: device.screenId });
            }
          }
        }
      }
      // Check for Scheduled Overrides
      const pendingOverride = await prisma.scheduledOverride.findFirst({
        where: { scheduledAt: { lte: now }, executed: false },
        orderBy: { scheduledAt: 'asc' }
      });

      if (pendingOverride) {
        const updateCount = await prisma.scheduledOverride.updateMany({
          where: { id: pendingOverride.id, executed: false },
          data: { executed: true }
        });

        if (updateCount.count > 0) {
          await prisma.screen.update({
            where: { id: pendingOverride.screenId },
            data: {
              overrideType: pendingOverride.overrideType,
              overridePayload: pendingOverride.overridePayload
            }
          });
        }
      }
    } catch (err) {
      console.error('Piggyback cron error:', err);
    }

    return NextResponse.json({ success: true, autoStart: device?.autoStart, location: (device as any)?.location, screenConfig });
  } catch (error) {
    return NextResponse.json({ error: 'Ping failed' }, { status: 500 });
  }
}
