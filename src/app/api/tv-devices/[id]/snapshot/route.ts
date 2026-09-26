import { NextResponse } from 'next/server';
import { getOrgId } from '@/lib/tenant';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// GET /api/tv-devices/[id]/snapshot - Get latest snapshot metadata for a TV Device
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const orgId = await getOrgId(session);

    const { id } = await params;
    const device = await prisma.tvDevice.findUnique({
      where: { id },
      include: {
        account: {
          select: { username: true }
        }
      }
    });

    if (!device) return NextResponse.json({ error: 'TV Device not found' }, { status: 404 });

    // Look up assigned screen if available
    let assignedScreen: any = null;
    if (device.screenId) {
      assignedScreen = await prisma.screen.findUnique({
        where: { id: device.screenId },
        select: { id: true, name: true, lastScreenshotUrl: true, lastScreenshotAt: true, status: true, lastSeenAt: true }
      });
    }

    return NextResponse.json({
      success: true,
      device: {
        id: device.id,
        name: device.name,
        screenId: device.screenId,
        assignedScreenName: assignedScreen?.name || 'Unassigned',
        lastScreenshotUrl: device.lastScreenshotUrl || assignedScreen?.lastScreenshotUrl || null,
        lastScreenshotAt: device.lastScreenshotAt || assignedScreen?.lastScreenshotAt || null,
        lastPingAt: device.lastPingAt,
        accountUsername: device.account.username
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch TV snapshot' }, { status: 500 });
  }
}

// POST /api/tv-devices/[id]/snapshot
// 1. Admin action: { action: "REQUEST_SNAPSHOT" } -> queues command for this TV device
// 2. TV Player upload: { imageBase64: "...", screenId?: "..." } -> saves file and updates TvDevice & Screen
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    // Action 1: CMS User requesting a snapshot for this specific TV
    if (body.action === 'REQUEST_SNAPSHOT') {
      const session = await getServerSession(authOptions);
      if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const orgId = await getOrgId(session);

      const updatedDevice = await prisma.tvDevice.update({
        where: { id },
        data: { commandQueue: 'TAKE_SNAPSHOT' }
      });

      // If this TV has an assigned screen, also queue for that screen
      if (updatedDevice.screenId) {
        await prisma.tvDevice.updateMany({
          where: { screenId: updatedDevice.screenId },
          data: { commandQueue: 'TAKE_SNAPSHOT' }
        });
      }

      await logAudit('REQUEST_TV_SNAPSHOT', `Requested snapshot for TV device ${id}`, session);
      return NextResponse.json({ success: true, deviceId: id });
    }

    // Action 2: TV player uploading captured snapshot
    if (body.imageBase64) {
      // Use the raw base64 string as the URL directly to bypass Vercel readonly file system limits
      const timestamp = new Date();
      const screenshotUrl = body.imageBase64.startsWith('data:image') 
        ? body.imageBase64 
        : `data:image/jpeg;base64,${body.imageBase64.replace(/^data:image\/\w+;base64,/, '')}`;

      // Update TV device in DB
      await prisma.tvDevice.update({
        where: { id },
        data: {
          lastScreenshotUrl: screenshotUrl,
          lastScreenshotAt: timestamp
        }
      }).catch(() => {});

      // If screenId is passed or device has assigned screen, also update Screen record
      const screenIdToUpdate = body.screenId;
      if (screenIdToUpdate) {
        await prisma.screen.update({
          where: { id: screenIdToUpdate },
          data: {
            lastScreenshotUrl: screenshotUrl,
            lastScreenshotAt: timestamp
          }
        }).catch(() => {});
      }

      return NextResponse.json({
        success: true,
        lastScreenshotUrl: screenshotUrl,
        lastScreenshotAt: timestamp
      });
    }

    return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
  } catch (error: any) {
    console.error('TV Snapshot API error:', error);
    return NextResponse.json({ error: 'Snapshot processing failed: ' + (error.message || String(error)) }, { status: 500 });
  }
}
