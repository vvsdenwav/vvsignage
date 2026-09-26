const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE "Playlist" ADD COLUMN "transition" TEXT DEFAULT \'fade\'');
    console.log('Added transition');
  } catch(e) {
    console.log('Transition likely exists:', e.message);
  }
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE "Playlist" ADD COLUMN "startTime" TEXT');
    console.log('Added startTime');
  } catch(e) {
    console.log('startTime exists:', e.message);
  }
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE "Playlist" ADD COLUMN "endTime" TEXT');
    console.log('Added endTime');
  } catch(e) {
    console.log('endTime exists:', e.message);
  }
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE "Playlist" ADD COLUMN "daysOfWeek" TEXT');
    console.log('Added daysOfWeek');
  } catch(e) {
    console.log('daysOfWeek exists:', e.message);
  }
}

main().then(()=>process.exit(0));
