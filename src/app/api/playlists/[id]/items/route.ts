import { authOptions } from '@/lib/auth';
import { getOrgId } from '@/lib/tenant';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST add an item to a playlist
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const orgId = await getOrgId(session);

  try {
    const { id: playlistId } = await params;

    const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
    if (!playlist || playlist.organizationId !== orgId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const body = await request.json();
    const { mediaId, widgetId, duration, conditionPayload, activeFrom, activeUntil } = body;

    if (!mediaId && !widgetId) {
      return NextResponse.json({ success: false, error: 'Media ID or Widget ID is required' }, { status: 400 });
    }

    // Determine the next order index
    const lastItem = await prisma.playlistItem.findFirst({
      where: { playlistId },
      orderBy: { order: 'desc' },
    });
    
    const nextOrder = lastItem ? lastItem.order + 1 : 0;

    const playlistItem = await prisma.playlistItem.create({
      data: {
        playlistId,
        mediaId: mediaId || null,
        widgetId: widgetId || null,
        order: nextOrder,
        duration: duration || null,
        conditionPayload: conditionPayload || null,
        activeFrom: activeFrom ? new Date(activeFrom) : null,
        activeUntil: activeUntil ? new Date(activeUntil) : null,
      },
      include: {
        media: true,
        widget: true
      }
    });

    return NextResponse.json({ success: true, item: playlistItem });
  } catch (error) {
    console.error("Add playlist item error:", error);
    return NextResponse.json({ success: false, error: 'Failed to add item to playlist' }, { status: 500 });
  }
}
