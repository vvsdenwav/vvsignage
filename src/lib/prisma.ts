import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prismaCacheSignage: PrismaClient | undefined
}

export const prisma = globalForPrisma.prismaCacheSignage ?? (() => {
  if (typeof window !== "undefined") return null as any;
  if (!process.env.DATABASE_URL) {
    return new Proxy({}, {
      get: () => {
        return () => Promise.resolve([])
      }
    }) as unknown as PrismaClient;
  }
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
})()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prismaCacheSignage = prisma
