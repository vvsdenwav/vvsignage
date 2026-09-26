'use server';

import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isSuperAdmin } from '@/lib/tenant';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

async function checkAuth() {
  const session = await getServerSession(authOptions);
  if (!session || !isSuperAdmin(session)) {
    throw new Error('Unauthorized');
  }
}

export async function toggleOrgStatus(orgId: string, newStatus: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'TRIAL') {
  await checkAuth();
  await prisma.organization.update({
    where: { id: orgId },
    data: { status: newStatus }
  });
  revalidatePath('/super-admin');
}

export async function updateOrgSettings(
  orgId: string, 
  planId: string, 
  apkServerUrl: string | null,
  customMaxScreens: number | null = null,
  customStorageLimitMb: number | null = null,
  customPriceUsd: number | null = null,
  pricePerExtraScreenUsd: number | null = null
) {
  await checkAuth();
  await prisma.organization.update({
    where: { id: orgId },
    data: { 
      planId: planId || null, 
      apkServerUrl,
      customMaxScreens,
      customStorageLimitMb,
      customPriceUsd,
      pricePerExtraScreenUsd
    }
  });
  revalidatePath('/super-admin');
  revalidatePath(`/super-admin/orgs/${orgId}/edit`);
}

export async function resetOrgAdminPassword(orgId: string, newPassword: string) {
  await checkAuth();
  const adminUser = await prisma.user.findFirst({
    where: { organizationId: orgId, role: 'ADMIN' },
    orderBy: { createdAt: 'asc' }
  });

  if (!adminUser) {
    throw new Error('No admin user found for this organization.');
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: adminUser.id },
    data: { password: hashedPassword }
  });
}


export async function createOrganization(formData: FormData) {
  await checkAuth();
  
  const name = formData.get('name') as string;
  const slug = formData.get('slug') as string;
  const contactEmail = formData.get('contactEmail') as string;
  const planId = formData.get('planId') as string;
  const adminUsername = formData.get('adminUsername') as string;
  const adminPassword = formData.get('adminPassword') as string;

  // 1. Generate unique 6-digit company code
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let companyCode = '';
  for (let i = 0; i < 6; i++) {
    companyCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // 2. Create Organization
  const org = await prisma.organization.create({
    data: {
      name,
      slug,
      companyCode,
      contactEmail,
      contactName: name,
      status: 'TRIAL',
      planId: planId || null,
    }
  });

  // 2. Create first Admin user for this org
  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  await prisma.user.create({
    data: {
      username: adminUsername,
      password: hashedPassword,
      role: 'ADMIN',
      organizationId: org.id
    }
  });

  revalidatePath('/super-admin');
  return { success: true, orgId: org.id };
}

export async function createPlan(formData: FormData) {
  await checkAuth();
  const name = formData.get('name') as string;
  const maxScreens = parseInt(formData.get('maxScreens') as string, 10);
  const storageLimitMb = parseInt(formData.get('storageLimitMb') as string, 10);
  const priceUsd = parseFloat(formData.get('priceUsd') as string);

  await prisma.plan.create({
    data: {
      name,
      maxScreens,
      storageLimitMb,
      priceUsd,
    }
  });
  revalidatePath('/super-admin/plans');
}

export async function updatePlan(formData: FormData) {
  await checkAuth();
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const maxScreens = parseInt(formData.get('maxScreens') as string, 10);
  const storageLimitMb = parseInt(formData.get('storageLimitMb') as string, 10);
  const priceUsd = parseFloat(formData.get('priceUsd') as string);

  if (!id || !name || isNaN(maxScreens) || isNaN(storageLimitMb) || isNaN(priceUsd)) {
    throw new Error('Invalid plan parameters');
  }

  await prisma.plan.update({
    where: { id },
    data: {
      name,
      maxScreens,
      storageLimitMb,
      priceUsd,
    }
  });
  revalidatePath('/super-admin/plans');
  revalidatePath('/super-admin');
}

export async function deletePlan(planId: string) {
  await checkAuth();
  // Check if any orgs are using this plan
  const count = await prisma.organization.count({ where: { planId } });
  if (count > 0) {
    throw new Error('Cannot delete a plan that is in use by organizations.');
  }
  await prisma.plan.delete({ where: { id: planId } });
  revalidatePath('/super-admin/plans');
}

export async function deleteOrganization(orgId: string) {
  await checkAuth();

  await prisma.$transaction(async (tx: any) => {
    await tx.proofOfPlay.deleteMany({ where: { screen: { organizationId: orgId } } });
    await tx.screenZoneMapping.deleteMany({ where: { screen: { organizationId: orgId } } });
    await tx.playlistItem.deleteMany({ where: { playlist: { organizationId: orgId } } });
    await tx.playlistOverlay.deleteMany({ where: { playlist: { organizationId: orgId } } });
    await tx.tabletButton.deleteMany({ where: { tvAccount: { organizationId: orgId } } });
    await tx.screen.deleteMany({ where: { organizationId: orgId } });
    await tx.screenGroup.deleteMany({ where: { organizationId: orgId } });
    await tx.playlist.deleteMany({ where: { organizationId: orgId } });
    await tx.mediaAsset.deleteMany({ where: { organizationId: orgId } });
    await tx.mediaFolder.deleteMany({ where: { organizationId: orgId } });
    await tx.widget.deleteMany({ where: { organizationId: orgId } });
    await tx.template.deleteMany({ where: { organizationId: orgId } });
    await tx.tvAccount.deleteMany({ where: { organizationId: orgId } });
    await tx.auditLog.deleteMany({ where: { organizationId: orgId } });
    await tx.user.deleteMany({ where: { organizationId: orgId } });
    await tx.organization.delete({ where: { id: orgId } });
  });

  revalidatePath('/super-admin');
}

import { cookies } from 'next/headers';

import { redirect } from 'next/navigation';

export async function impersonateOrganization(orgId: string) {
  await checkAuth();
  const cookieStore = await cookies();
  cookieStore.set('impersonate-org-id', orgId, { path: '/' });
  revalidatePath('/');
}

export async function stopImpersonating() {
  await checkAuth();
  const cookieStore = await cookies();
  cookieStore.delete('impersonate-org-id');
  revalidatePath('/super-admin');
  redirect('/super-admin');
}
