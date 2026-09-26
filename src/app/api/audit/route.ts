import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

import { getOrgId, isSuperAdmin } from '@/lib/tenant';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url, 'http://localhost');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = (page - 1) * limit;

    const cookieStore = await cookies();
    const isImpersonating = isSuperAdmin(session) && Boolean(cookieStore.get('impersonate-org-id')?.value);
    
    let whereClause: any = {};
    if (!isSuperAdmin(session) || isImpersonating) {
      const orgId = await getOrgId(session);
      whereClause = { organizationId: orgId };
    } else {
      const targetOrgId = searchParams.get('orgId');
      if (targetOrgId) {
        whereClause = { organizationId: targetOrgId };
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.auditLog.count({ where: whereClause })
    ]);
    
    return NextResponse.json({ logs, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
