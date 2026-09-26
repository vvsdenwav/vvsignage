import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { getOrgId, canAddScreen } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

// GET all screens
export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url, 'http://localhost');
    const accountId = searchParams.get('accountId');
    const orgId = await getOrgId(session);

    const whereClause: any = { organizationId: orgId };
    if (accountId) {
      whereClause.tvAccounts = {
        some: { id: accountId }
      };
    }

    const screens = await prisma.screen.findMany({
      where: whereClause,
      include: {
        playlist: true,
        zoneMappings: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Asynchronously evaluate offline screen alerts in the background
    if (orgId) {
      import('@/lib/offlineAlertEngine')
        .then(m => m.checkAndDispatchOfflineAlerts(orgId))
        .catch(() => {});
    }

    return NextResponse.json(screens);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch screens' }, { status: 500 });
  }
}

// POST create a new screen
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { hasPermission } = await import('@/lib/auth');
    if (!hasPermission(session, 'screens:create')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { name, tvAccountId } = await request.json();
    const orgId = await getOrgId(session);

    const canAdd = await canAddScreen(orgId);
    if (!canAdd) {
      return NextResponse.json({ error: 'You have reached the maximum number of screens for your plan.' }, { status: 403 });
    }

    const screen = await prisma.screen.create({
      data: {
        name: name || 'New Screen',
        status: 'offline',
        organizationId: orgId,
        ...(tvAccountId ? { tvAccounts: { connect: { id: tvAccountId } } } : {})
      }
    });

    await logAudit('CREATE_SCREEN', `Created screen: ${screen.name}`, session);
    return NextResponse.json({ success: true, screen });
  } catch (error: any) {
    console.error("Create screen error:", error);
    return NextResponse.json({ 
      error: 'Failed to create screen: ' + (error.message || String(error))
    }, { status: 500 });
  }
}
