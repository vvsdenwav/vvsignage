import { authOptions } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { getServerSession } from 'next-auth';
import { tvAccountSchema } from '@/lib/validations';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

import { getOrgId } from '@/lib/tenant';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const orgId = await getOrgId(session);
    const accounts = await prisma.tvAccount.findMany({
      where: { organizationId: orgId },
      include: {
        devices: true,
        screens: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    // Map devices count based on active pings (last 5 minutes), but retain ALL devices (both online and offline)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const mapped = accounts.map((acc: any) => {
      const activeCount = acc.devices.filter((d: any) => d.lastPingAt && new Date(d.lastPingAt) > fiveMinutesAgo).length;
      return {
        ...acc,
        activeDevicesCount: activeCount,
        devices: acc.devices
      };
    });

    return NextResponse.json(mapped);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch TV accounts' }, { status: 500 });
  }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { requireAdmin } = await import('@/lib/auth');
    if (!requireAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const orgId = await getOrgId(session);
    const rawData = await req.json();
    const validation = tvAccountSchema.safeParse(rawData);
    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || 'Validation failed';
      return NextResponse.json({ error: firstError, details: validation.error.format() }, { status: 400 });
    }
    const { username, password, screenIds } = validation.data;
    
    const hashedPassword = await bcrypt.hash(password, 10);

    const data: any = { 
      username, 
      password: hashedPassword,
      organizationId: orgId
    };
    if (screenIds && screenIds.length > 0) {
      data.screens = { connect: screenIds.map((id: string) => ({ id })) };
    }

    const account = await prisma.tvAccount.create({
      data,
      include: { screens: true }
    });

    await logAudit('CREATE_TV_ACCOUNT', `Created TV account ${username}`, session, orgId);

    return NextResponse.json(account);
  } catch (error: any) {
    console.error("Failed to create TV account:", error);
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A TV account with this username already exists.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create TV account' }, { status: 500 });
  }
}
