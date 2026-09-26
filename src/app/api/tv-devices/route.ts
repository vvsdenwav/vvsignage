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

  try {
    const devices = await prisma.tvDevice.findMany({
      include: {
        account: true,
      },
      orderBy: { lastPingAt: 'desc' }
    });
    
    return NextResponse.json(devices);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch TV devices' }, { status: 500 });
  }
}
