import { authOptions } from '@/lib/auth';
import { getOrgId } from '@/lib/tenant';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const orgId = await getOrgId(session);

  try {
    const { id } = await params;

    const existing = await prisma.tabletButton.findUnique({
      where: { id },
      include: { tvAccount: true }
    });
    if (!existing || existing.tvAccount?.organizationId !== orgId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await prisma.tabletButton.delete({
      where: { id }
    });
    await logAudit('DELETE_TABLET_BUTTON', `Deleted tablet button ${id}`, session);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE tablet-button error:", error);
    return NextResponse.json({ error: 'Failed to delete button' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const orgId = await getOrgId(session);

  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.tabletButton.findUnique({
      where: { id },
      include: { tvAccount: true }
    });
    if (!existing || existing.tvAccount?.organizationId !== orgId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const updatedButton = await prisma.tabletButton.update({
      where: { id },
      data: {
        label: body.label,
        color: body.color,
        actionType: body.actionType,
        media: body.mediaId ? { connect: { id: body.mediaId } } : body.mediaId === null ? { disconnect: true } : undefined,
        mediaUrl: body.mediaUrl,
        htmlTitle: body.htmlTitle,
        htmlSubtitle: body.htmlSubtitle,
        htmlBgColor: body.htmlBgColor,
        htmlTextColor: body.htmlTextColor,
        duration: body.duration,
        order: body.order
      }
    });

    await logAudit('UPDATE_TABLET_BUTTON', `Updated tablet button ${id}`, session);

    return NextResponse.json({ success: true, button: updatedButton });
  } catch (error) {
    console.error("PUT tablet-button error:", error);
    return NextResponse.json({ error: 'Failed to update button' }, { status: 500 });
  }
}
