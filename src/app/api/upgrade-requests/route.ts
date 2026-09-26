import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getOrgId, isSuperAdmin } from '@/lib/tenant';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

// GET all upgrade requests (Super Admin only)
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isSuperAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url, 'http://localhost');
    const status = searchParams.get('status');

    const whereClause: any = {};
    if (status && status !== 'all') {
      whereClause.status = status;
    }

    const requests = await prisma.planUpgradeRequest.findMany({
      where: whereClause,
      include: {
        organization: {
          include: {
            plan: true,
            _count: {
              select: { screens: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(requests);
  } catch (error: any) {
    console.error('Failed to fetch upgrade requests', error);
    return NextResponse.json({ error: 'Failed to fetch upgrade requests' }, { status: 500 });
  }
}

// POST create a new upgrade request (Org or Super Admin)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const orgId = await getOrgId(session);
    const body = await request.json();
    const { requestedType = 'screens', requestedCount = 1, notes, contactEmail, contactPhone } = body;

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: { plan: true }
    });

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const upgradeRequest = await prisma.planUpgradeRequest.create({
      data: {
        organizationId: orgId,
        requestedType,
        requestedCount: Number(requestedCount) || 1,
        notes: notes || null,
        status: 'PENDING',
        contactEmail: contactEmail || (session.user as any)?.email || null,
        contactPhone: contactPhone || null
      }
    });

    await logAudit(
      'UPGRADE_REQUEST_SUBMITTED',
      `Requested upgrade: +${requestedCount} ${requestedType} for ${org.name}`,
      session,
      orgId
    );

    return NextResponse.json({ success: true, request: upgradeRequest });
  } catch (error: any) {
    console.error('Failed to submit upgrade request', error);
    return NextResponse.json({ error: 'Failed to submit upgrade request' }, { status: 500 });
  }
}

// PATCH update upgrade request status (Super Admin only)
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isSuperAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
    }

    const updated = await prisma.planUpgradeRequest.update({
      where: { id },
      data: { status }
    });

    return NextResponse.json({ success: true, request: updated });
  } catch (error: any) {
    console.error('Failed to update upgrade request', error);
    return NextResponse.json({ error: 'Failed to update upgrade request' }, { status: 500 });
  }
}
