import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const seedPassword = process.env.ADMIN_SEED_PASSWORD;
  if (!seedPassword) {
    console.error('ERROR: Set ADMIN_SEED_PASSWORD environment variable before seeding.');
    console.error('Example: ADMIN_SEED_PASSWORD=MyStr0ng!Pass npx prisma db seed');
    process.exit(1);
  }
  const hashedPassword = await bcrypt.hash(seedPassword, 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {
      role: 'ADMIN',
      password: hashedPassword,
    },
    create: {
      username: 'admin',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
  console.log('Seed completed. Admin user exists:', admin.username);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
