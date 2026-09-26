import { NextResponse } from 'next/server';
import { getOrgId } from '@/lib/tenant';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

// GET /api/screens/[id]/snapshot - Get latest snapshot metadata
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const orgId = await getOrgId(session);

    const { id } = await params;
    const screen = await prisma.screen.findUnique({
      where: { id },
      select: { id: true, name: true, lastScreenshotUrl: true, lastScreenshotAt: true, status: true, lastSeenAt: true }
    });

    if (!screen) return NextResponse.json({ error: 'Screen not found' }, { status: 404 });
    return NextResponse.json({ success: true, screen });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch snapshot' }, { status: 500 });
  }
}

// POST /api/screens/[id]/snapshot
// 1. Admin action: { action: "REQUEST_SNAPSHOT" } -> queues command for TV
// 2. TV Player upload: { imageBase64: "data:image/jpeg;base64,..." } -> saves file and updates Screen
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    // Action 1: CMS User requesting a snapshot
    if (body.action === 'REQUEST_SNAPSHOT') {
      const session = await getServerSession(authOptions);
      if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const orgId = await getOrgId(session);

      const updatedDevices = await prisma.tvDevice.updateMany({
        where: { screenId: id },
        data: { commandQueue: 'TAKE_SNAPSHOT' }
      });

      await logAudit('REQUEST_SNAPSHOT', `Requested snapshot for screen ${id}`, session);
      return NextResponse.json({ success: true, queuedDevices: updatedDevices.count });
    }

    // Action 2: TV player uploading the captured snapshot
    if (body.imageBase64) {
      // Use the raw base64 string as the URL directly to bypass Vercel readonly file system limits
      const timestamp = new Date();
      const screenshotUrl = body.imageBase64.startsWith('data:image') 
        ? body.imageBase64 
        : `data:image/jpeg;base64,${body.imageBase64.replace(/^data:image\/\w+;base64,/, '')}`;

      const updatedScreen = await prisma.screen.update({
        where: { id },
        data: {
          lastScreenshotUrl: screenshotUrl,
          lastScreenshotAt: timestamp
        }
      });

      if (body.deviceId) {
        await prisma.tvDevice.update({
          where: { id: body.deviceId },
          data: {
            lastScreenshotUrl: screenshotUrl,
            lastScreenshotAt: timestamp
          }
        }).catch(() => {});
      }

      return NextResponse.json({
        success: true,
        lastScreenshotUrl: updatedScreen.lastScreenshotUrl,
        lastScreenshotAt: updatedScreen.lastScreenshotAt
      });
    }

    return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
  } catch (error: any) {
    console.error('Snapshot API error:', error);
    return NextResponse.json({ error: 'Snapshot processing failed: ' + (error.message || String(error)) }, { status: 500 });
  }
}
