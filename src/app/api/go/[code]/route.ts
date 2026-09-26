import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, context: any) {
  try {
    const params = await context.params;
    const { code } = params;

    if (!code) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    const { searchParams } = new URL(request.url);
    const screenId = searchParams.get('s') || searchParams.get('screenId');
    const userAgent = request.headers.get('user-agent') || 'Unknown';

    // Look up existing scan record or find destination by code
    const existingScan = await prisma.qrScan.findFirst({
      where: { code },
      orderBy: { scannedAt: 'desc' }
    });

    let destinationUrl = searchParams.get('dest');
    let campaignName = searchParams.get('c') || 'QR Campaign';
    let organizationId = existingScan?.organizationId;

    if (!destinationUrl && existingScan) {
      destinationUrl = existingScan.destinationUrl;
      campaignName = existingScan.campaignName || campaignName;
    }

    // Try to resolve screen if screenId is present
    let screenName: string | undefined = undefined;
    if (screenId) {
      const screen = await prisma.screen.findUnique({
        where: { id: screenId },
        select: { name: true, organizationId: true }
      });
      if (screen) {
        screenName = screen.name;
        if (!organizationId && screen.organizationId) {
          organizationId = screen.organizationId;
        }
      }
    }

    if (!organizationId) {
      // Fallback to first organization if unknown
      const firstOrg = await prisma.organization.findFirst({ select: { id: true } });
      organizationId = firstOrg?.id || '';
    }

    if (destinationUrl && organizationId) {
      // Record scan asynchronously
      try {
        await prisma.qrScan.create({
          data: {
            code,
            screenId: screenId || null,
            screenName: screenName || null,
            campaignName,
            destinationUrl,
            userAgent,
            organizationId
          }
        });
      } catch (err) {
        console.warn('Failed to record QR scan log:', err);
      }

      // Ensure destination has protocol
      const targetUrl = destinationUrl.startsWith('http://') || destinationUrl.startsWith('https://')
        ? destinationUrl
        : `https://${destinationUrl}`;

      return NextResponse.redirect(targetUrl, 302);
    }

    return NextResponse.redirect(new URL('/', request.url));
  } catch (error) {
    console.error('QR Redirect Error:', error);
    return NextResponse.redirect(new URL('/', request.url));
  }
}
