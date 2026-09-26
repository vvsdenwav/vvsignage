import { prisma } from './src/lib/prisma';

async function main() {
  console.log('Starting migration to multi-tenant...');

  // 1. Create default Plan
  let plan = await prisma.plan.findUnique({ where: { name: 'Legacy' } });
  if (!plan) {
    plan = await prisma.plan.create({
      data: {
        name: 'Legacy',
        maxScreens: 999,
        storageLimitMb: 50000,
        priceUsd: 0,
      }
    });
    console.log('Created default Plan: Legacy');
  } else {
    console.log('Plan "Legacy" already exists.');
  }

  // 2. Create default Organization
  let org = await prisma.organization.findUnique({ where: { slug: 'tropic-air' } });
  if (!org) {
    org = await prisma.organization.create({
      data: {
        name: 'Tropic Air',
        slug: 'tropic-air',
        contactEmail: 'admin@tropicair.com',
        contactName: 'Tropic Air Admin',
        status: 'ACTIVE',
        planId: plan.id,
      }
    });
    console.log('Created default Organization: Tropic Air');
  } else {
    console.log('Organization "Tropic Air" already exists.');
  }

  const orgId = org.id;

  // 3. Update all existing records to be linked to this organization
  const tables = [
    'user',
    'screenGroup',
    'screen',
    'playlist',
    'mediaFolder',
    'mediaAsset',
    'widget',
    'template',
    'tvAccount',
    'auditLog'
  ] as const;

  for (const table of tables) {
    console.log(`Updating ${table}...`);
    try {
      // @ts-ignore - Dynamic access for migration script
      const result = await prisma[table].updateMany({
        where: {
          organizationId: null
        },
        data: {
          organizationId: orgId
        }
      });
      console.log(`Updated ${result.count} records in ${table}`);
    } catch (e) {
      console.error(`Error updating ${table}:`, e);
    }
  }

  console.log('Migration complete.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
