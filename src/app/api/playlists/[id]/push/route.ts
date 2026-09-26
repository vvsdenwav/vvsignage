import { NextResponse } from 'next/server';
import { getOrgId } from '@/lib/tenant';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

export async function POST(request: Request, context: any) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const orgId = await getOrgId(session);

  try {
    const { id } = await context.params;

    const existing = await prisma.playlist.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== orgId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Find all screens playing this playlist (directly, interactively, via group, or via template zone)
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
    
    let updatedCount = 0;
    if (affectedScreenIds.length > 0) {
      const result = await prisma.tvDevice.updateMany({
        where: { screenId: { in: affectedScreenIds } },
        data: { commandQueue: 'FORCE_RELOAD' }
      });
      updatedCount = result.count;
    }

    await logAudit('PUSH_PLAYLIST', `Pushed playlist updates for playlist ${id} to ${updatedCount} TVs`, session);

    return NextResponse.json({ success: true, count: updatedCount });
  } catch (error) {
    console.error("Push playlist error:", error);
    return NextResponse.json({ success: false, error: 'Failed to push playlist' }, { status: 500 });
  }
}
