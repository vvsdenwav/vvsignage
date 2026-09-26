import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { userUpdateSchema } from '@/lib/validations';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions, requireAdmin } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

import { getOrgId } from '@/lib/tenant';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const orgId = await getOrgId(session);
    const { id } = await params;

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser || targetUser.organizationId !== orgId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Protect primary organization administrator and super admin from deletion
    if (targetUser.role === 'SUPER_ADMIN' || targetUser.role === 'ADMIN' || targetUser.username.toLowerCase() === 'admin') {
      return NextResponse.json({ error: 'Cannot delete the primary organization administrator account' }, { status: 403 });
    }

    const currentUserId = (session.user as any)?.id;
    if (targetUser.id === currentUserId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id }
    });

    await logAudit('DELETE_USER', `Deleted user ${targetUser.username}`, session, orgId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete user error", error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const orgId = await getOrgId(session);
    const { id } = await params;

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser || targetUser.organizationId !== orgId) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const rawData = await request.json();
    const validation = userUpdateSchema.safeParse(rawData);
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', details: validation.error.format() }, { status: 400 });
    }
    const data = validation.data;

    const updateData: any = {};
    
    if (data.role) {
      updateData.role = data.role;
    }
    if (data.permissions !== undefined) updateData.permissions = data.permissions;
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, username: true, role: true, permissions: true }
    });
    await logAudit('UPDATE_USER', `Updated user ${user.username}`, session, orgId);
    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Update user error", error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
