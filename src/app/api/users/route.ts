import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { userSchema } from '@/lib/validations';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import { authOptions, requireAdmin } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

import { getOrgId } from '@/lib/tenant';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!requireAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const orgId = await getOrgId(session);
    const users = await prisma.user.findMany({
      where: {
        organizationId: orgId,
        role: { not: 'SUPER_ADMIN' }
      },
      select: {
        id: true,
        username: true,
        role: true,
        permissions: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const { apiRateLimiter } = await import('@/lib/rateLimit');
    if (!apiRateLimiter.check(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const session = await getServerSession(authOptions);
    if (!requireAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const rawData = await request.json();
    const validation = userSchema.safeParse(rawData);
    
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', details: validation.error.format() }, { status: 400 });
    }
    const data = validation.data;
    const orgId = await getOrgId(session);

    // Check if user exists
    const existing = await prisma.user.findUnique({ where: { username: data.username } });
    if (existing) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        username: data.username,
        password: hashedPassword,
        role: data.role || 'AGENT',
        permissions: data.permissions || '[]',
        organizationId: orgId
      },
      select: { id: true, username: true, role: true, permissions: true }
    });

    await logAudit('CREATE_USER', `Created user ${user.username} with role ${user.role}`, session, orgId);

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Failed to create user", error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
