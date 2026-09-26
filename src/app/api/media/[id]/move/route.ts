import { authOptions } from '@/lib/auth';
import { getOrgId } from '@/lib/tenant';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const orgId = await getOrgId(session);

  try {
    const id = (await params).id;
    const body = await request.json();
    const { folderId } = body; // folderId can be string or null

    const existing = await prisma.mediaAsset.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== orgId) {
       return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const asset = await prisma.mediaAsset.update({
      where: { id },
      data: { folderId: folderId || null }
    });

    await logAudit('MOVE_MEDIA', `Moved media asset ${id} to folder ${folderId || 'root'}`, session);

    return NextResponse.json(asset);
  } catch (error: any) {
    console.error('Failed to move media asset:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
