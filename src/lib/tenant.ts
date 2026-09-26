import { cookies } from 'next/headers';

export async function getOrgId(session: any): Promise<string> {
  if (isSuperAdmin(session)) {
    const cookieStore = await cookies();
    const impersonated = cookieStore.get('impersonate-org-id')?.value;
    if (impersonated) return impersonated;
  }
  
  if (!session?.user?.organizationId) {
    throw new Error("No organization context found for this user");
  }
  return session.user.organizationId;
}

export function isSuperAdmin(session: any): boolean {
  return session?.user?.role === 'SUPER_ADMIN';
}

export function checkSuspended(session: any): boolean {
  return session?.user?.orgStatus === 'SUSPENDED';
}

import { prisma } from './prisma';

export interface OrgLimits {
  effectiveMaxScreens: number;
  effectiveStorageLimitMb: number;
  effectivePriceUsd: number;
  effectivePriceBzd: number;
  isCustomScreens: boolean;
  isCustomStorage: boolean;
  isCustomPrice: boolean;
}

export function getEffectiveLimits(org: any): OrgLimits {
  const hasPlan = Boolean(org?.plan);
  const basePlan = org?.plan;

  // Screen limit: custom override -> plan limit -> fallback unlimited (999)
  const isCustomScreens = org?.customMaxScreens !== null && org?.customMaxScreens !== undefined;
  const effectiveMaxScreens = isCustomScreens
    ? (org.customMaxScreens as number)
    : hasPlan
    ? basePlan.maxScreens
    : 999;

  // Storage limit: custom override -> plan limit -> fallback 50,000 MB
  const isCustomStorage = org?.customStorageLimitMb !== null && org?.customStorageLimitMb !== undefined;
  const effectiveStorageLimitMb = isCustomStorage
    ? (org.customStorageLimitMb as number)
    : hasPlan
    ? basePlan.storageLimitMb
    : 50000;

  // Price calculation
  const isCustomPrice = org?.customPriceUsd !== null && org?.customPriceUsd !== undefined;
  let effectivePriceUsd = 0;

  if (isCustomPrice) {
    effectivePriceUsd = org.customPriceUsd as number;
  } else if (hasPlan) {
    const basePrice = basePlan.priceUsd || 0;
    const baseScreens = basePlan.maxScreens || 1;
    const ratePerExtra = org?.pricePerExtraScreenUsd ?? (baseScreens > 0 ? basePrice / baseScreens : 25);
    
    // If the org has more allowed screens than base plan, dynamically bill for extra screens
    const extraScreens = Math.max(0, effectiveMaxScreens - baseScreens);
    effectivePriceUsd = basePrice + (extraScreens * ratePerExtra);
  }

  return {
    effectiveMaxScreens,
    effectiveStorageLimitMb,
    effectivePriceUsd: Math.round(effectivePriceUsd * 100) / 100,
    effectivePriceBzd: Math.round(effectivePriceUsd * 2 * 100) / 100,
    isCustomScreens,
    isCustomStorage,
    isCustomPrice
  };
}

export async function canAddScreen(orgId: string): Promise<boolean> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    include: { plan: true, _count: { select: { screens: true } } }
  });
  
  if (!org) return false;
  // If no plan and no custom override, allow by default
  if (!org.plan && org.customMaxScreens === null) return true;

  const limits = getEffectiveLimits(org);
  return org._count.screens < limits.effectiveMaxScreens;
}

export async function canUpload(orgId: string, fileSizeMb: number): Promise<boolean> {
  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    include: { plan: true }
  });
  
  if (!org) return false;
  if (!org.plan && org.customStorageLimitMb === null) return true;

  const limits = getEffectiveLimits(org);
  return (org.storageUsedMb + fileSizeMb) <= limits.effectiveStorageLimitMb;
}
