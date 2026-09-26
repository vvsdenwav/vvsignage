import { authOptions } from '@/lib/auth';
import { getOrgId } from '@/lib/tenant';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const orgId = await getOrgId(session);

  try {
    const groups = await prisma.screenGroup.findMany({
      where: { organizationId: orgId },
      include: {
        screens: true,
        playlist: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(groups);
  } catch (error) {
    console.error("Get groups error", error);
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
  }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const orgId = await getOrgId(session);

  try {
    const body = await request.json();
    const { name, description, playlistId } = body;
    
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const group = await prisma.screenGroup.create({
      data: {
        name,
        description,
        playlistId: playlistId || null,
        organizationId: orgId
      }
    });

    await logAudit('CREATE_GROUP', `Created screen group "${name}"`, session);

    return NextResponse.json(group);
  } catch (error) {
    console.error("Create group error", error);
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
  }
}
