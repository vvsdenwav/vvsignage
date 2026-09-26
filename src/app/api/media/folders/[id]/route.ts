import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

import { getOrgId } from '@/lib/tenant';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const orgId = await getOrgId(session);
    const id = (await params).id;
    const body = await request.json();
    const { name } = body;

    const existing = await prisma.mediaFolder.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== orgId) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    const folder = await prisma.mediaFolder.update({
      where: { id },
      data: { name }
    });

    await logAudit('UPDATE_FOLDER', `Updated media folder ${id}`, session);

    return NextResponse.json(folder);
  } catch (error: any) {
    console.error('Failed to update media folder:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const orgId = await getOrgId(session);
    const id = (await params).id;
    
    const existing = await prisma.mediaFolder.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== orgId) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    await prisma.mediaFolder.delete({
      where: { id }
    });

    await logAudit('DELETE_FOLDER', `Deleted media folder ${id}`, session);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete media folder:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
