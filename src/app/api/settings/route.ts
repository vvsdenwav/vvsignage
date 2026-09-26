import { authOptions } from '@/lib/auth';
import { getOrgId } from '@/lib/tenant';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const orgId = await getOrgId(session);
  if ((session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 });
  }

  try {
    const settings = await prisma.systemSetting.findMany();
    const settingsMap: Record<string, string> = {};

    // 1. Load global settings first
    for (const setting of settings) {
      if (!setting.key.includes(':')) {
        settingsMap[setting.key] = setting.value;
      }
    }

    // 2. Override with org-specific settings if orgId is present
    if (orgId) {
      for (const setting of settings) {
        if (setting.key.endsWith(`:${orgId}`)) {
          const baseKey = setting.key.replace(`:${orgId}`, '');
          settingsMap[baseKey] = setting.value;
        }
      }
    }

    return NextResponse.json(settingsMap);
  } catch (error) {
    console.error('Settings GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
  }

  try {
    const orgId = await getOrgId(session);
    const body = await req.json();
    const { key, value } = body;

    if (!key || typeof value !== 'string') {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    const orgKey = orgId ? `${key}:${orgId}` : key;

    const setting = await prisma.systemSetting.upsert({
      where: { key: orgKey },
      update: { value },
      create: { key: orgKey, value },
    });

    // Also update base key if no orgId
    if (!orgId) {
      await prisma.systemSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      }).catch(() => {});
    }

    await prisma.auditLog.create({
      data: {
        userId: (session.user as any)?.id,
        userName: (session.user as any)?.name || 'Unknown',
        organizationId: orgId,
        action: 'UPDATE_SETTING',
        details: `Updated setting ${key}`
      }
    }).catch(() => {});

    return NextResponse.json({ success: true, key, value });
  } catch (error) {
    console.error('Settings POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
