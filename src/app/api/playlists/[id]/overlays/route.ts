import { authOptions } from '@/lib/auth';
import { getOrgId } from '@/lib/tenant';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const orgId = await getOrgId(session);

  try {
    const { id: playlistId } = await params;
    const body = await request.json();
    const { widgetId } = body;

    const playlist = await prisma.playlist.findUnique({ where: { id: playlistId } });
    if (!playlist || playlist.organizationId !== orgId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (!widgetId) {
      return NextResponse.json({ success: false, error: 'Widget ID is required' }, { status: 400 });
    }

    const overlay = await prisma.playlistOverlay.create({
      data: {
        playlistId,
        widgetId,
      },
      include: {
        widget: true
      }
    });

    return NextResponse.json({ success: true, overlay });
  } catch (error) {
    console.error("Add overlay error:", error);
    return NextResponse.json({ success: false, error: 'Failed to add overlay' }, { status: 500 });
  }
}
