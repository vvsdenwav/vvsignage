import { authOptions } from '@/lib/auth';
import { getOrgId } from '@/lib/tenant';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH a playlist item (e.g. update duration)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const orgId = await getOrgId(session);

  try {
    const { itemId } = await params;

    const existing = await prisma.playlistItem.findUnique({
      where: { id: itemId },
      include: { playlist: true }
    });
    if (!existing || existing.playlist.organizationId !== orgId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const body = await request.json();
    
    const updated = await prisma.playlistItem.update({
      where: { id: itemId },
      data: {
        ...(body.duration !== undefined && { duration: body.duration }),
        ...(body.order !== undefined && { order: body.order }),
        ...(body.transition !== undefined && { transition: body.transition }),
        ...(body.conditionPayload !== undefined && { conditionPayload: body.conditionPayload }),
        ...(body.activeFrom !== undefined && { activeFrom: body.activeFrom ? new Date(body.activeFrom) : null }),
        ...(body.activeUntil !== undefined && { activeUntil: body.activeUntil ? new Date(body.activeUntil) : null }),
      }
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (error) {
    console.error("Update playlist item error:", error);
    return NextResponse.json({ success: false, error: 'Failed to update item' }, { status: 500 });
  }
}

// DELETE a playlist item
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const orgId = await getOrgId(session);

  try {
    const { itemId } = await params;
    
    const existing = await prisma.playlistItem.findUnique({
      where: { id: itemId },
      include: { playlist: true }
    });
    if (!existing || existing.playlist.organizationId !== orgId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.playlistItem.delete({
      where: { id: itemId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete playlist item error:", error);
    return NextResponse.json({ success: false, error: 'Failed to delete item' }, { status: 500 });
  }
}
