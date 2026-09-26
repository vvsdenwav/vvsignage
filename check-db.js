const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');
const prisma = new PrismaClient();
async function main() {
  const screens = await prisma.screen.findMany();
  for (const s of screens) {
    if (!s.controlToken) {
      await prisma.screen.update({
        where: { id: s.id },
        data: { controlToken: randomUUID() }
      });
    }
  }
  const updated = await prisma.screen.findMany({ select: { id: true, name: true, controlToken: true } });
  console.log('Screens with control tokens:', updated);
}
main().finally(() => prisma.$disconnect());

