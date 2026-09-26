import { NextResponse } from 'next/server';
import { getOrgId } from '@/lib/tenant';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions, requireAdmin } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

// GET a single playlist
export async function GET(request: Request, context: any) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const orgId = await getOrgId(session);

  try {
    const { id } = await context.params;
    const playlist = await prisma.playlist.findUnique({
      where: { id },
      include: {
        items: {
          include: { media: true, widget: true },
          orderBy: { order: 'asc' }
        },
        overlays: {
          include: { widget: true }
        }
      }
    });
    
    if (!playlist || playlist.organizationId !== orgId) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(playlist);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch playlist' }, { status: 500 });
  }
}

// PUT update playlist
export async function PUT(request: Request, context: any) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const orgId = await getOrgId(session);

  try {
    const { id } = await context.params;
    const body = await request.json();
    const { name, description, startTime, endTime, daysOfWeek, transition, scheduledPushAt, pushImmediately, isSmartPlaylist, smartRules, approvalStatus } = body;

    const existingPlaylist = await prisma.playlist.findUnique({ where: { id } });
    if (!existingPlaylist || existingPlaylist.organizationId !== orgId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Auto-create a snapshot before updating if pushing or significant update
    if (pushImmediately) {
      try {
        const current = await prisma.playlist.findUnique({
          where: { id },
          include: { items: true, overlays: true }
        });
        if (current) {
          await prisma.playlistVersion.create({
            data: {
              playlistId: id,
              snapshot: JSON.stringify({
                name: current.name,
                description: current.description,
                transition: current.transition,
                startTime: current.startTime,
                endTime: current.endTime,
                daysOfWeek: current.daysOfWeek,
                items: current.items.map((item: any) => ({
                  mediaId: item.mediaId,
                  widgetId: item.widgetId,
                  order: item.order,
                  duration: item.duration,
                  transition: item.transition,
                  conditionPayload: item.conditionPayload,
                  activeFrom: item.activeFrom,
                  activeUntil: item.activeUntil
                })),
                overlays: current.overlays.map((overlay: any) => ({
                  widgetId: overlay.widgetId
                }))
              }),
              label: `Auto-snapshot prior to push (${new Date().toLocaleTimeString()})`,
              createdBy: (session.user as any)?.name || 'System'
            }
          });
        }
      } catch (snapErr) {
        console.warn('Auto-snapshot before push failed:', snapErr);
      }
    }

    const playlist = await prisma.playlist.update({
      where: { id },
      data: {
        name,
        description,
        startTime,
        endTime,
        daysOfWeek,
        transition,
        isSmartPlaylist: isSmartPlaylist !== undefined ? isSmartPlaylist : undefined,
        smartRules: smartRules !== undefined ? (typeof smartRules === 'object' ? JSON.stringify(smartRules) : smartRules) : undefined,
        approvalStatus: approvalStatus !== undefined ? approvalStatus : undefined,
        scheduledPushAt: scheduledPushAt !== undefined ? (scheduledPushAt ? new Date(scheduledPushAt) : null) : undefined
      },
      include: {
        items: {
          include: { media: true, widget: true }
        },
        overlays: {
          include: { widget: true }
        },
        _count: {
          select: { screens: true }
        }
      }
    });
    await logAudit('UPDATE_PLAYLIST', `Updated playlist ${playlist.name}`, session);

    // ONLY push to TVs immediately if explicitly requested (pushImmediately === true)
    // AND the scheduled time is not in the future.
    const isFutureSchedule = scheduledPushAt && new Date(scheduledPushAt).getTime() > Date.now();

    if (pushImmediately && !isFutureSchedule) {
      const affectedScreens = await prisma.screen.findMany({
        where: {
          OR: [
            { playlistId: id },
            { interactivePlaylistId: id },
            { group: { playlistId: id } },
            { zoneMappings: { some: { playlistId: id } } }
          ]
        },
        select: { id: true }
      });
      const affectedScreenIds = affectedScreens.map((s: any) => s.id);
      if (affectedScreenIds.length > 0) {
        await prisma.tvDevice.updateMany({
          where: { screenId: { in: affectedScreenIds } },
          data: { commandQueue: 'FORCE_RELOAD' }
        });
      }
    }

    return NextResponse.json({ success: true, playlist });
  } catch (error) {
    console.error("Update playlist error:", error);
    return NextResponse.json({ success: false, error: 'Failed to update playlist' }, { status: 500 });
  }
}

// DELETE a playlist — ADMIN only (deleting affects all screens playing this playlist)
export async function DELETE(request: Request, context: any) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const orgId = await getOrgId(session);
  if (!requireAdmin(session)) return NextResponse.json({ error: 'Forbidden: only admins can delete playlists' }, { status: 403 });

  try {
    const { id } = await context.params;
    
    const existing = await prisma.playlist.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== orgId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const affectedScreens = await prisma.screen.findMany({
      where: { playlistId: id },
      select: { id: true }
    });
    const affectedScreenIds = affectedScreens.map((s: any) => s.id);

    await prisma.screen.updateMany({
      where: { playlistId: id },
      data: { playlistId: null }
    });

    if (affectedScreenIds.length > 0) {
      await prisma.tvDevice.updateMany({
        where: { screenId: { in: affectedScreenIds } },
        data: { commandQueue: 'FORCE_RELOAD' }
      });
    }

    await prisma.playlist.delete({
      where: { id }
    });
    await logAudit('DELETE_PLAYLIST', `Deleted playlist ${id}`, session);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete playlist error:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete playlist' }, { status: 500 });
  }
}

export const PATCH = PUT;
