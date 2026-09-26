import { authOptions } from '@/lib/auth';
import { getOrgId } from '@/lib/tenant';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ overlayId: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const orgId = await getOrgId(session);

  try {
    const { overlayId } = await params;

    const existing = await prisma.playlistOverlay.findUnique({
      where: { id: overlayId },
      include: { playlist: true }
    });
    if (!existing || existing.playlist.organizationId !== orgId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.playlistOverlay.delete({
      where: { id: overlayId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete overlay error:", error);
    return NextResponse.json({ success: false, error: 'Failed to delete overlay' }, { status: 500 });
  }
}
