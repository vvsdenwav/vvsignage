import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

import { getOrgId } from '@/lib/tenant';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const orgId = await getOrgId(session);
    const { searchParams } = new URL(req.url, 'http://localhost');
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');
    const screenId = searchParams.get('screenId');
    const reportType = searchParams.get('type') || 'proof_of_play';

    if (reportType === 'uptime') {
      const screens = await prisma.screen.findMany({
        where: {
          organizationId: orgId,
          ...(screenId ? { id: screenId } : {})
        },
        select: { id: true, name: true, status: true, lastSeenAt: true }
      });

      const allowedScreenIds = screens.map((s: any) => s.id);

      const uptimeLogs = await prisma.screenUptimeLog.findMany({
        where: {
          screenId: { in: allowedScreenIds },
          ...(startDateStr || endDateStr ? {
            timestamp: {
              ...(startDateStr ? { gte: new Date(startDateStr) } : {}),
              ...(endDateStr ? { lte: new Date(endDateStr) } : {})
            }
          } : {})
        },
        orderBy: { timestamp: 'desc' }
      });

      const uptimeData = screens.map((s: any) => {
        const screenLogs = uptimeLogs.filter((l: any) => l.screenId === s.id);
        const onlineLogs = screenLogs.filter((l: any) => l.status === 'online').length;
        const offlineLogs = screenLogs.filter((l: any) => l.status === 'offline').length;
        const totalLogs = screenLogs.length;

        const uptimePercent = totalLogs > 0 
          ? Math.round((onlineLogs / totalLogs) * 100)
          : (s.status === 'online' ? 100 : 0);

        return {
          screenId: s.id,
          screenName: s.name,
          currentStatus: s.status,
          lastSeenAt: s.lastSeenAt ? s.lastSeenAt.toISOString() : 'Never',
          onlineEvents: onlineLogs,
          offlineEvents: offlineLogs,
          uptimePercent: `${uptimePercent}%`
        };
      });

      return NextResponse.json(uptimeData);
    }

    let dateFilter = {};
    if (startDateStr || endDateStr) {
      dateFilter = {
        playedAt: {
          ...(startDateStr ? { gte: new Date(startDateStr) } : {}),
          ...(endDateStr ? { lte: new Date(endDateStr) } : {})
        }
      };
    }

    let screenFilter = screenId ? { screenId } : {};

    const stats = await prisma.proofOfPlay.groupBy({
      by: ['mediaId', 'screenId'],
      _sum: {
        duration: true
      },
      _count: {
        _all: true
      },
      where: {
        ...dateFilter,
        ...screenFilter,
        screen: {
          organizationId: orgId
        }
      }
    });

    const mediaIds = [...new Set(stats.map((s: any) => s.mediaId))];
    const screenIds = [...new Set(stats.map((s: any) => s.screenId))];

    const mediaItems = await prisma.mediaAsset.findMany({
      where: { 
        id: { in: mediaIds },
        organizationId: orgId
      }
    });

    const screens = await prisma.screen.findMany({
      where: { 
        id: { in: screenIds },
        organizationId: orgId
      }
    });

    const reportData = stats.map((stat: any) => {
      const media = mediaItems.find((m: any) => m.id === stat.mediaId);
      const screen = screens.find((s: any) => s.id === stat.screenId);
      
      const totalSeconds = stat._sum.duration || 0;
      const days = Math.floor(totalSeconds / 86400);
      const hours = Math.floor((totalSeconds % 86400) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);

      return {
        mediaId: stat.mediaId,
        mediaName: media?.name || 'Unknown Media',
        mediaType: media?.type || 'unknown',
        screenId: stat.screenId,
        screenName: screen?.name || 'Unknown Screen',
        plays: stat._count._all,
        totalSeconds,
        formattedDuration: `${days}d ${hours}h ${minutes}m`
      };
    }).sort((a: any, b: any) => b.totalSeconds - a.totalSeconds);

    return NextResponse.json(reportData);
  } catch (error) {
    console.error("Reports API Error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
