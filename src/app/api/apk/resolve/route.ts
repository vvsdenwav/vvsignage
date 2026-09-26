import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url, 'http://localhost');
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Company code is required' }, { status: 400 });
    }

    // Treat the code as case-insensitive and trim whitespace
    const normalizedCode = code.trim().toUpperCase();

    // Look up the organization by its companyCode
    const org = await prisma.organization.findUnique({
      where: { companyCode: normalizedCode }
    });

    if (!org) {
      return NextResponse.json({ error: 'Invalid company code' }, { status: 404 });
    }

    // Only return the safe branding fields, do NOT return sensitive org data
    return NextResponse.json({
      success: true,
      data: {
        id: org.id,
        name: org.name,
        brandingLogoUrl: org.brandingLogoUrl,
        brandingColor: org.brandingColor,
        apkServerUrl: org.apkServerUrl
      }
    });
  } catch (error) {
    console.error("Resolve Company Code Error:", error);
    return NextResponse.json({ error: 'Failed to resolve company code' }, { status: 500 });
  }
}
