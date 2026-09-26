import { authOptions } from '@/lib/auth';
import { getOrgId } from '@/lib/tenant';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

export async function PUT(request: Request, context: any) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const orgId = await getOrgId(session);

  try {
    const { id } = await context.params;
    const body = await request.json();
    const { name, description, playlistId } = body;

    const existing = await prisma.screenGroup.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== orgId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const group = await prisma.screenGroup.update({
      where: { id },
      data: { name, description, playlistId }
    });

    // If the group playlist changed, update all screens in the group
    if (playlistId !== undefined) {
      await prisma.screen.updateMany({
        where: { groupId: id },
        data: { playlistId }
      });
    }

    await logAudit('UPDATE_GROUP', `Updated screen group ${id}`, session);

    return NextResponse.json(group);
  } catch (error) {
    console.error("Update group error", error);
    return NextResponse.json({ error: 'Failed to update group' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: any) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const orgId = await getOrgId(session);

  try {
    const { id } = await context.params;

    const existing = await prisma.screenGroup.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== orgId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Disconnect screens before deleting
    await prisma.screen.updateMany({
      where: { groupId: id },
      data: { groupId: null }
    });

    await prisma.screenGroup.delete({
      where: { id }
    });

    await logAudit('DELETE_GROUP', `Deleted screen group ${id}`, session);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete group error", error);
    return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 });
  }
}
