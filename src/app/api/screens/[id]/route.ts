import { NextResponse } from 'next/server';
import { getOrgId } from '@/lib/tenant';
import { screenUpdateSchema } from '@/lib/validations';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

// GET /api/screens/[id] - Get screen by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const orgId = await getOrgId(session);

  try {
    const { id } = await params;
    const screen = await prisma.screen.findUnique({ where: { id } });
    if (!screen || screen.organizationId !== orgId) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(screen);
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// PATCH /api/screens/[id] - Update screen (e.g. assign playlist)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const orgId = await getOrgId(session);
    const { hasPermission } = await import('@/lib/auth');
    if (!hasPermission(session, 'screens:edit')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const { id } = await params;
    const existing = await prisma.screen.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== orgId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const rawBody = await request.json();
    const validation = screenUpdateSchema.safeParse(rawBody);
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', details: validation.error.format() }, { status: 400 });
    }
    const body = validation.data;

    let playlistIdToSet = body.playlistId;

    // If grouping changed, inherit the group's playlist if it has one
    if (body.groupId !== undefined && body.groupId !== null) {
      const group = await prisma.screenGroup.findUnique({ where: { id: body.groupId } });
      if (group && group.playlistId) {
        playlistIdToSet = group.playlistId;
      }
    }

    const screen = await prisma.screen.update({
      where: { id },
      data: {
        ...(playlistIdToSet !== undefined && { playlistId: playlistIdToSet }),
        ...(body.templateId !== undefined && { templateId: body.templateId }),
        ...(body.groupId !== undefined && { groupId: body.groupId }),
        ...(body.name !== undefined && { name: body.name }),
        ...(body.showWeather !== undefined && { showWeather: body.showWeather }),
        ...(body.showClock !== undefined && { showClock: body.showClock }),
        ...(body.rssFeedUrl !== undefined && { rssFeedUrl: body.rssFeedUrl }),
        ...(body.overrideType !== undefined && { overrideType: body.overrideType }),
        ...(body.overridePayload !== undefined && { overridePayload: body.overridePayload }),
        ...(body.autoStart !== undefined && { autoStart: body.autoStart }),
        ...(body.lastScreenshotUrl !== undefined && { lastScreenshotUrl: body.lastScreenshotUrl }),
        ...(body.lastScreenshotAt !== undefined && { lastScreenshotAt: body.lastScreenshotAt ? new Date(body.lastScreenshotAt) : null }),
        ...(body.operatingHoursActive !== undefined && { operatingHoursActive: body.operatingHoursActive }),
        ...(body.wakeTime !== undefined && { wakeTime: body.wakeTime }),
        ...(body.sleepTime !== undefined && { sleepTime: body.sleepTime }),
        ...(body.sleepMode !== undefined && { sleepMode: body.sleepMode }),
        ...(body.alertActive !== undefined && { alertActive: body.alertActive }),
        ...(body.alertPayload !== undefined && { alertPayload: body.alertPayload }),
        ...(body.location !== undefined && { location: body.location })
      }
    });
    await logAudit('UPDATE_SCREEN', `Updated screen ${screen.name}`, session);

    // Only force reload TVs if the assigned playlist is not scheduled for a future push
    let shouldForceReload = true;
    if (playlistIdToSet) {
      const targetPlaylist = await prisma.playlist.findUnique({
        where: { id: playlistIdToSet },
        select: { scheduledPushAt: true }
      });
      if (targetPlaylist?.scheduledPushAt && new Date(targetPlaylist.scheduledPushAt).getTime() > Date.now()) {
        shouldForceReload = false;
      }
    }

    if (shouldForceReload) {
      await prisma.tvDevice.updateMany({
        where: { screenId: id },
        data: { commandQueue: 'FORCE_RELOAD' }
      });
    }

    return NextResponse.json({ success: true, screen });
  } catch (error) {
    console.error("Update screen error:", error);
    return NextResponse.json({ success: false, error: 'Failed to update screen' }, { status: 500 });
  }
}

// DELETE /api/screens/[id] - Unpair and delete screen
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const orgId = await getOrgId(session);
    const { hasPermission } = await import('@/lib/auth');
    if (!hasPermission(session, 'screens:delete')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const { id } = await params;
    const existing = await prisma.screen.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== orgId) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    
    const screen = await prisma.screen.delete({
      where: { id }
    });
    await logAudit('DELETE_SCREEN', `Deleted screen: ${screen.name} (${id})`, session);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete screen error:", error);
    return NextResponse.json({ success: false, error: 'Failed to delete screen' }, { status: 500 });
  }
}
