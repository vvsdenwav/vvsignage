import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

function generateCompanyCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function GET() {
  const orgs = await prisma.organization.findMany({
    where: { companyCode: null }
  });

  let count = 0;
  for (const org of orgs) {
    let code = generateCompanyCode();
    let exists = await prisma.organization.findUnique({ where: { companyCode: code } });
    while (exists) {
      code = generateCompanyCode();
      exists = await prisma.organization.findUnique({ where: { companyCode: code } });
    }
    await prisma.organization.update({
      where: { id: org.id },
      data: { companyCode: code }
    });
    count++;
  }

  return NextResponse.json({ success: true, count });
}
