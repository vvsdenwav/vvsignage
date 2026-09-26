import { authOptions } from '@/lib/auth';
import { getOrgId } from '@/lib/tenant';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const orgId = await getOrgId(session);

  try {
    const p = await params;
    
    const existing = await prisma.template.findUnique({ where: { id: p.id } });
    if (!existing || (existing.organizationId && existing.organizationId !== orgId)) {
       return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.template.delete({
      where: { id: p.id }
    });
    await logAudit('DELETE_TEMPLATE', `Deleted template ${p.id}`, session);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete Template error", error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}
