import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url, 'http://localhost');
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json({ error: 'Organization code is required' }, { status: 400 });
    }

    // Find the organization by its short code (slug)
    const org = await prisma.organization.findUnique({
      where: { slug: code.toLowerCase().trim() }
    });

    if (!org) {
      return NextResponse.json({ error: 'Invalid organization code' }, { status: 404 });
    }

    if (org.status === 'SUSPENDED' || org.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Organization is inactive' }, { status: 403 });
    }

    // Return the config for the TV
    // serverUrl can be determined by the host header if this is deployed, 
    // or passed via an environment variable like NEXT_PUBLIC_BASE_URL.
    // For now, we return the host from the request.
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    
    return NextResponse.json({
      serverUrl: `${protocol}://${host}`,
      apkServerUrl: org.apkServerUrl || `${protocol}://${host}`,
      orgSlug: org.slug,
      orgName: org.name,
      tvAccountId: null // Will be assigned during actual TV pairing later
    });

  } catch (error) {
    console.error("Device config error:", error);
    return NextResponse.json({ error: 'Failed to fetch device config' }, { status: 500 });
  }
}
