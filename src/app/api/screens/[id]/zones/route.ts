import { authOptions } from '@/lib/auth';
import { getOrgId } from '@/lib/tenant';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const orgId = await getOrgId(session);

  try {
    const p = await params;
    const data = await req.json();
    const { zoneMappings } = data; // Array of { zoneId, playlistId, widgetId }

    // Clear existing mappings
    await prisma.screenZoneMapping.deleteMany({
      where: { screenId: p.id }
    });

    if (zoneMappings && zoneMappings.length > 0) {
      await prisma.screenZoneMapping.createMany({
        data: zoneMappings.map((m: any) => ({
          screenId: p.id,
          zoneId: m.zoneId,
          playlistId: m.playlistId || null,
          widgetId: m.widgetId || null
        }))
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update Zone Mappings error", error);
    return NextResponse.json({ error: 'Failed to update zone mappings' }, { status: 500 });
  }
}
