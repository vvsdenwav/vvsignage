import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const assets = await prisma.mediaAsset.findMany({ 
    orderBy: { createdAt: 'desc' }, 
    take: 3 
  });
  console.log(JSON.stringify(assets, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
