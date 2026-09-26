import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sseEmitter } from '../stream/route';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { playlistId, playlistName, status, deviceId } = body;

    // Fetch the screen and its organization
    const screen = await prisma.screen.findUnique({
      where: { id },
      include: {
        tvAccounts: {
          include: {
            devices: true
          }
        }
      }
    });

    if (!screen) {
      return NextResponse.json({ error: 'Screen not found' }, { status: 404 });
    }

    const screenName = screen.name || 'Screen';
    const plName = playlistName || 'Playlist';

    // Find if a specific TV device matches
    let tvDeviceName: string | null = null;
    if (deviceId) {
      const dev = await prisma.tvDevice.findUnique({ where: { id: deviceId } });
      if (dev && dev.name) {
        tvDeviceName = dev.name;
      }
    }

    const displayName = tvDeviceName ? `${tvDeviceName} (${screenName})` : screenName;
    const message = `New playlist ready for offline on: ${displayName} (old cache removed)`;

    // Update TvDevice offline readiness state
    if (deviceId) {
      await prisma.tvDevice.update({
        where: { id: deviceId },
        data: {
          offlineReady: true,
          offlineSyncedAt: new Date(),
          offlinePlaylistId: playlistId || null
        }
      }).catch(() => {});
    } else {
      await prisma.tvDevice.updateMany({
        where: { screenId: id },
        data: {
          offlineReady: true,
          offlineSyncedAt: new Date(),
          offlinePlaylistId: playlistId || null
        }
      }).catch(() => {});
    }

    // Record in AuditLog for cross-instance and historical retrieval
    await prisma.auditLog.create({
      data: {
        organizationId: screen.organizationId,
        action: 'PLAYLIST_OFFLINE_READY',
        details: JSON.stringify({
          screenId: id,
          screenName: displayName,
          playlistId,
          playlistName: plName,
          status: status || 'OFFLINE_READY',
          message,
          timestamp: new Date().toISOString()
        })
      }
    });

    // Touch screen status
    await prisma.screen.update({
      where: { id },
      data: {
        status: 'online',
        lastSeenAt: new Date(),
        lastPing: new Date()
      }
    });

    // Broadcast through SSE emitter
    if (sseEmitter) {
      sseEmitter.emit('sync-status', {
        screenId: id,
        screenName: displayName,
        playlistId,
        playlistName: plName,
        message,
        timestamp: Date.now()
      });
      sseEmitter.emit(`sync:${id}`, {
        status: 'OFFLINE_READY',
        playlistId,
        screenName: displayName,
        message
      });
    }

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error('Error reporting screen sync status:', error);
    return NextResponse.json({ success: false, error: 'Failed to record sync status' }, { status: 500 });
  }
}
