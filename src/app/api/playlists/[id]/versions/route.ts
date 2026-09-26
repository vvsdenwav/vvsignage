import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getOrgId } from '@/lib/tenant';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

// GET all versions for a playlist
export async function GET(request: Request, context: any) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const orgId = await getOrgId(session);
    const params = await context.params;
    const { id } = params;

    // Verify playlist belongs to org
    const playlist = await prisma.playlist.findFirst({
      where: { id, organizationId: orgId }
    });

    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    const versions = await prisma.playlistVersion.findMany({
      where: { playlistId: id },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return NextResponse.json(versions);
  } catch (error) {
    console.error('Failed to fetch playlist versions:', error);
    return NextResponse.json({ error: 'Failed to fetch playlist versions' }, { status: 500 });
  }
}

// POST create a named version checkpoint manually
export async function POST(request: Request, context: any) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const orgId = await getOrgId(session);
    const params = await context.params;
    const { id } = params;
    const body = await request.json().catch(() => ({}));
    const label = body.label || 'Manual Snapshot';

    // Verify and fetch full current playlist
    const playlist = await prisma.playlist.findFirst({
      where: { id, organizationId: orgId },
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

    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    const snapshotData = {
      name: playlist.name,
      description: playlist.description,
      transition: playlist.transition,
      startTime: playlist.startTime,
      endTime: playlist.endTime,
      daysOfWeek: playlist.daysOfWeek,
      items: playlist.items.map((item: any) => ({
        mediaId: item.mediaId,
        widgetId: item.widgetId,
        order: item.order,
        duration: item.duration,
        transition: item.transition,
        conditionPayload: item.conditionPayload,
        activeFrom: item.activeFrom,
        activeUntil: item.activeUntil
      })),
      overlays: playlist.overlays.map((overlay: any) => ({
        widgetId: overlay.widgetId
      }))
    };

    const version = await prisma.playlistVersion.create({
      data: {
        playlistId: id,
        snapshot: JSON.stringify(snapshotData),
        label,
        createdBy: (session.user as any)?.name || (session.user as any)?.username || 'User'
      }
    });

    await logAudit('SNAPSHOT_PLAYLIST', `Created snapshot "${label}" for playlist "${playlist.name}"`, session);

    return NextResponse.json({ success: true, version });
  } catch (error) {
    console.error('Failed to create version checkpoint:', error);
    return NextResponse.json({ error: 'Failed to create version checkpoint' }, { status: 500 });
  }
}
