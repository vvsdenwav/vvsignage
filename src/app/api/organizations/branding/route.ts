import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getOrgId, isSuperAdmin } from '@/lib/tenant';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const orgId = await getOrgId(session);
    const body = await req.json();
    const { brandingColor, brandingLogoUrl } = body;

    // Optional: Only let ADMIN update branding
    if ((session.user as any).role !== 'ADMIN' && !isSuperAdmin(session)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await prisma.organization.update({
      where: { id: orgId },
      data: {
        brandingColor: brandingColor !== undefined ? brandingColor : undefined,
        brandingLogoUrl: brandingLogoUrl !== undefined ? brandingLogoUrl : undefined,
      }
    });

    return NextResponse.json({ success: true, org: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
