import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyDeviceToken } from '@/lib/deviceAuth';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    const device = verifyDeviceToken(req);
    if (!session && !device) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const data = await req.json();
    
    // Handle batched events
    if (data.events && Array.isArray(data.events)) {
      if (data.events.length === 0) {
        return NextResponse.json({ success: true });
      }
      
      const log = await prisma.proofOfPlay.createMany({
        data: data.events.map((e: any) => ({
          screenId: e.screenId,
          mediaId: e.mediaId,
          duration: e.duration || 0,
        }))
      });
      return NextResponse.json({ success: true, count: log.count });
    }

    // Fallback for older clients sending single events
    const { screenId, mediaId, duration } = data;

    if (!screenId || !mediaId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const log = await prisma.proofOfPlay.create({
      data: {
        screenId,
        mediaId,
        duration: duration || 0
      }
    });

    return NextResponse.json({ success: true, log });
  } catch (error) {
    console.error("Proof of Play Error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

import { getOrgId } from '@/lib/tenant';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const device = verifyDeviceToken(req);
  if (!session && !device) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    let orgId = '';
    if (session) {
      orgId = await getOrgId(session);
    } else if (device) {
      orgId = (device as any).organizationId;
    }

    const stats = await prisma.proofOfPlay.groupBy({
      by: ['mediaId'],
      where: orgId ? {
        screen: {
          organizationId: orgId
        }
      } : {},
      _count: {
        _all: true,
      },
    });

    // Fetch media details to enrich the stats
    const mediaIds = stats.map((s: any) => s.mediaId);
    const mediaItems = await prisma.mediaAsset.findMany({
      where: { 
        id: { in: mediaIds },
        ...(orgId ? { organizationId: orgId } : {})
      }
    });

    const enrichedStats = stats.map((stat: any) => {
      const media = mediaItems.find((m: any) => m.id === stat.mediaId);
      return {
        mediaId: stat.mediaId,
        mediaName: media?.name || 'Unknown Media',
        mediaType: media?.type || 'unknown',
        plays: stat._count._all,
      };
    }).sort((a: any, b: any) => b.plays - a.plays);

    return NextResponse.json(enrichedStats);
  } catch (error) {
    console.error("Analytics Fetch Error", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
