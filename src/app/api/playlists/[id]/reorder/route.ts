import { authOptions } from '@/lib/auth';
import { getOrgId } from '@/lib/tenant';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/playlists/[id]/reorder
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const orgId = await getOrgId(session);

  try {
    const { id } = await params;

    const playlist = await prisma.playlist.findUnique({ where: { id } });
    if (!playlist || playlist.organizationId !== orgId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const body = await request.json();
    const { itemIds } = body; // Array of PlaylistItem IDs in their new order

    if (!Array.isArray(itemIds)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Update the order sequentially using transactions
    const transactions = itemIds.map((itemId, index) => {
      return prisma.playlistItem.update({
        where: { id: itemId },
        data: { order: index }
      });
    });

    await prisma.$transaction(transactions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reorder error:", error);
    return NextResponse.json({ success: false, error: 'Failed to reorder playlist' }, { status: 500 });
  }
}
