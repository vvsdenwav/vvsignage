import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

import { getOrgId, isSuperAdmin, getEffectiveLimits } from '@/lib/tenant';
import { getActiveMobileSessions } from '@/lib/mobilePresence';
import { cookies } from 'next/headers';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const orgId = await getOrgId(session);
    const org = await prisma.organization.findUnique({ 
      where: { id: orgId }, 
      include: { plan: true }
    });
    
    let isImpersonating = false;
    const cookieStore = await cookies();
    if (isSuperAdmin(session) && cookieStore.get('impersonate-org-id')?.value) {
      isImpersonating = true;
    }

    const limits = org ? getEffectiveLimits(org) : {
      effectiveMaxScreens: 10,
      effectiveStorageLimitMb: 5000,
      effectivePriceUsd: 0,
      effectivePriceBzd: 0
    };

    const screens = await prisma.screen.findMany({ where: { organizationId: orgId } });
    const playlists = await prisma.playlist.count({ where: { organizationId: orgId } });
    const media = await prisma.mediaAsset.count({ where: { organizationId: orgId } });

    // A screen is considered "online" if it has pinged the server in the last 60 seconds
    const now = new Date().getTime();
    const activeScreens = screens.filter((s: any) => {
      if (!s.lastSeenAt) return false;
      const lastSeen = new Date(s.lastSeenAt).getTime();
      return (now - lastSeen) < 60000; // 60 seconds
    }).length;

    const mobileSessions = getActiveMobileSessions(orgId);

    return NextResponse.json({
      totalScreens: screens.length,
      activeScreens: activeScreens,
      activeMobileCount: mobileSessions.length,
      activeMobileSessions: mobileSessions,
      totalPlaylists: playlists,
      totalMedia: media,
      orgName: org?.name,
      companyCode: org?.companyCode,
      brandingLogoUrl: org?.brandingLogoUrl,
      brandingColor: org?.brandingColor,
      isImpersonating,
      planName: org?.plan?.name || 'Custom Plan',
      maxScreens: limits.effectiveMaxScreens,
      storageLimitMb: limits.effectiveStorageLimitMb,
      storageUsedMb: org?.storageUsedMb || 0
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}
