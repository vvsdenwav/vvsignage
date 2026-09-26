import { NextResponse } from 'next/server';
import { getOrgId } from '@/lib/tenant';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  context: any
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const orgId = await getOrgId(session);

  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const sinceParam = searchParams.get('since');

    // Look back up to 30 seconds ago by default, or since the provided timestamp
    let sinceDate: Date;
    if (sinceParam) {
      const parsed = new Date(isNaN(Number(sinceParam)) ? sinceParam : Number(sinceParam));
      sinceDate = isNaN(parsed.getTime()) ? new Date(Date.now() - 30000) : parsed;
    } else {
      sinceDate = new Date(Date.now() - 30000);
    }

    // Find AuditLogs with action 'PLAYLIST_OFFLINE_READY' created since `sinceDate`
    const recentLogs = await prisma.auditLog.findMany({
      where: {
        action: 'PLAYLIST_OFFLINE_READY',
        createdAt: { gte: sinceDate },
        organizationId: orgId
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    const matchingEvents: any[] = [];
    for (const log of recentLogs) {
      if (!log.details) continue;
      try {
        const details = JSON.parse(log.details);
        if (details.playlistId === id) {
          matchingEvents.push({
            id: log.id,
            screenId: details.screenId,
            screenName: details.screenName,
            playlistId: details.playlistId,
            playlistName: details.playlistName,
            message: details.message || `New playlist ready for offline on: ${details.screenName} (old cache removed)`,
            timestamp: new Date(log.createdAt).getTime()
          });
        }
      } catch (e) {
        // Fallback text check if details wasn't JSON
        if (log.details.includes(id)) {
          matchingEvents.push({
            id: log.id,
            message: log.details,
            timestamp: new Date(log.createdAt).getTime()
          });
        }
      }
    }

    return NextResponse.json({ success: true, events: matchingEvents });
  } catch (error) {
    console.error('Error fetching playlist sync status:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch sync status' }, { status: 500 });
  }
}
