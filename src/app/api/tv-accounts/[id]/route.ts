import { authOptions } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { getServerSession } from 'next-auth';
import { tvAccountUpdateSchema } from '@/lib/validations';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

import { getOrgId } from '@/lib/tenant';

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { requireAdmin } = await import('@/lib/auth');
  if (!requireAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const orgId = await getOrgId(session);
    const { id } = await context.params;

    const existing = await prisma.tvAccount.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== orgId) {
      return NextResponse.json({ error: 'TV Account not found' }, { status: 404 });
    }

    await prisma.tvAccount.delete({
      where: { id }
    });
    await logAudit('DELETE_TV_ACCOUNT', `Deleted TV account ${existing.username}`, session, orgId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete TV account' }, { status: 500 });
  }
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { requireAdmin } = await import('@/lib/auth');
  if (!requireAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const orgId = await getOrgId(session);
    const { id } = await context.params;

    const existing = await prisma.tvAccount.findUnique({ where: { id } });
    if (!existing || existing.organizationId !== orgId) {
      return NextResponse.json({ error: 'TV Account not found' }, { status: 404 });
    }

    const rawData = await req.json();
    const validation = tvAccountUpdateSchema.safeParse(rawData);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || 'Validation failed';
      return NextResponse.json({ error: firstError, details: validation.error.format() }, { status: 400 });
    }
    const { username, password, screenIds } = validation.data;

    const data: any = {};
    if (username) data.username = username;
    if (password) {
      if (password.startsWith('$2a$') || password.startsWith('$2b$')) {
        data.password = password;
      } else {
        data.password = await bcrypt.hash(password, 10);
      }
    }
    if (screenIds !== undefined) {
      data.screens = {
        set: screenIds.map((sid: string) => ({ id: sid }))
      };
    }

    const updated = await prisma.tvAccount.update({
      where: { id },
      data,
      include: { screens: true, devices: true }
    });

    await logAudit('UPDATE_TV_ACCOUNT', `Updated TV account ${updated.username}`, session, orgId);

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update TV account:", error);
    return NextResponse.json({ error: 'Failed to update TV account' }, { status: 500 });
  }
}

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const { verifyDeviceToken } = await import('@/lib/deviceAuth');
  const device = verifyDeviceToken(req);
  
  if (!session && !device) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await context.params;
    let orgId = '';
    if (session) {
      orgId = await getOrgId(session);
    } else if (device) {
      orgId = (device as any).organizationId;
    }

    const account = await prisma.tvAccount.findUnique({
      where: { id },
      include: { screens: true, devices: true }
    });
    if (!account || (orgId && account.organizationId !== orgId)) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(account);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch TV account' }, { status: 500 });
  }
}
