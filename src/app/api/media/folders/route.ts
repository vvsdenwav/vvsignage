import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

import { getOrgId } from '@/lib/tenant';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const orgId = await getOrgId(session);
    const folders = await prisma.mediaFolder.findMany({
      where: { organizationId: orgId },
      include: {
        _count: {
          select: { assets: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(folders);
  } catch (error: any) {
    console.error('Failed to fetch media folders:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const orgId = await getOrgId(session);
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const folder = await prisma.mediaFolder.create({
      data: { 
        name,
        organizationId: orgId
      }
    });

    await logAudit('CREATE_FOLDER', `Created media folder "${name}"`, session);

    return NextResponse.json(folder);
  } catch (error: any) {
    console.error('Failed to create media folder:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
