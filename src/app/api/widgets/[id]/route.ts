import { authOptions } from '@/lib/auth';
import { widgetUpdateSchema } from '@/lib/validations';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

import { getOrgId } from '@/lib/tenant';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const orgId = await getOrgId(session);
    const { id } = await params;
    const widget = await prisma.widget.findUnique({
      where: { id }
    });
    if (!widget || widget.organizationId !== orgId) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, widget });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch widget' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const orgId = await getOrgId(session);
    const { id } = await params;

    const existing = await prisma.widget.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== orgId) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
    }

    await prisma.widget.delete({
      where: { id }
    });
    await logAudit('DELETE_WIDGET', `Deleted widget ${id}`, session, orgId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error", error);
    return NextResponse.json({ error: 'Failed to delete widget' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const orgId = await getOrgId(session);
    const { id } = await params;

    const existing = await prisma.widget.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== orgId) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
    }

    const rawData = await request.json();
    const validation = widgetUpdateSchema.safeParse(rawData);
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', details: validation.error.format() }, { status: 400 });
    }
    const data = validation.data;
    const widget = await prisma.widget.update({
      where: { id },
      data
    });
    await logAudit('UPDATE_WIDGET', `Updated widget ${id}`, session, orgId);
    return NextResponse.json({ success: true, widget });
  } catch (error) {
    console.error("Update error", error);
    return NextResponse.json({ error: 'Failed to update widget' }, { status: 500 });
  }
}
