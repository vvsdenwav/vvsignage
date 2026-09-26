import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getOrgId } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const orgId = await getOrgId(session);
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const screenId = searchParams.get('screenId');

    const where: any = { organizationId: orgId };

    if (startDate || endDate) {
      where.scannedAt = {};
      if (startDate) where.scannedAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.scannedAt.lte = end;
      }
    }

    if (screenId && screenId !== 'all') {
      where.screenId = screenId;
    }

    // Fetch individual scans to compute total and unique by userAgent
    const scans = await prisma.qrScan.findMany({
      where,
      orderBy: { scannedAt: 'desc' },
      take: 1000
    });

    // Aggregate by campaignName and screenId
    const aggregatedMap = new Map<string, {
      code: string;
      campaignName: string;
      screenId: string;
      screenName: string;
      destinationUrl: string;
      totalScans: number;
      uniqueScans: number;
      lastScannedAt: Date;
      userAgents: Set<string>;
    }>();

    for (const scan of scans) {
      const key = `${scan.campaignName || 'General'}_${scan.screenId || 'unassigned'}`;
      let entry = aggregatedMap.get(key);
      if (!entry) {
        entry = {
          code: scan.code,
          campaignName: scan.campaignName || 'General Campaign',
          screenId: scan.screenId || '',
          screenName: scan.screenName || 'Unknown Screen',
          destinationUrl: scan.destinationUrl,
          totalScans: 0,
          uniqueScans: 0,
          lastScannedAt: scan.scannedAt,
          userAgents: new Set()
        };
        aggregatedMap.set(key, entry);
      }

      entry.totalScans += 1;
      if (scan.userAgent) {
        entry.userAgents.add(scan.userAgent);
      }
      if (scan.scannedAt > entry.lastScannedAt) {
        entry.lastScannedAt = scan.scannedAt;
      }
    }

    const reportRows = Array.from(aggregatedMap.values()).map(item => ({
      code: item.code,
      campaignName: item.campaignName,
      screenId: item.screenId,
      screenName: item.screenName,
      destinationUrl: item.destinationUrl,
      totalScans: item.totalScans,
      uniqueScans: item.userAgents.size || item.totalScans,
      lastScannedAt: item.lastScannedAt.toISOString()
    }));

    return NextResponse.json(reportRows);
  } catch (error) {
    console.error('Failed to fetch QR scan report:', error);
    return NextResponse.json({ error: 'Failed to fetch QR scan report' }, { status: 500 });
  }
}
