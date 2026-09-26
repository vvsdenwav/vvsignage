import { authOptions } from '@/lib/auth';
import { getOrgId } from '@/lib/tenant';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const orgId = await getOrgId(session);

  try {
    const { id } = await context.params;

    const existing = await prisma.tvDevice.findUnique({
      where: { id },
      include: { account: true }
    });
    if (!existing || existing.account.organizationId !== orgId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.tvDevice.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete TV device' }, { status: 500 });
  }
}

export async function PATCH(req: Request, context: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const orgId = await getOrgId(session);

  try {
    const { id } = await context.params;
    const { screenId, name, autoStart, location, commandQueue } = await req.json();

    const existing = await prisma.tvDevice.findUnique({
      where: { id },
      include: { account: true }
    });
    if (!existing || existing.account.organizationId !== orgId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    
    const updated = await prisma.tvDevice.update({
      where: { id },
      data: {
        ...(screenId !== undefined && { screenId }),
        ...(name !== undefined && { name }),
        ...(autoStart !== undefined && { autoStart }),
        ...(location !== undefined && { location }),
        ...(commandQueue !== undefined && { commandQueue })
      }
    });
    
    return NextResponse.json({ success: true, device: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update TV device' }, { status: 500 });
  }
}
