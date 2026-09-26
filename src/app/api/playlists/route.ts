import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { getOrgId } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

// GET all playlists
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const orgId = await getOrgId(session);
    const playlists = await prisma.playlist.findMany({
      where: { organizationId: orgId },
      include: {
        items: {
          include: {
            media: {
              include: { tags: true }
            },
            widget: true
          },
          orderBy: {
            order: 'asc'
          }
        },
        overlays: {
          include: {
            widget: true
          }
        },
        _count: {
          select: { screens: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Dynamically resolve smart playlist items if empty items and smartRules exist
    const resolvedPlaylists = await Promise.all(playlists.map(async (pl: any) => {
      if (pl.isSmartPlaylist && pl.smartRules) {
        try {
          const rules = typeof pl.smartRules === 'string' ? JSON.parse(pl.smartRules) : pl.smartRules;
          const { includeTags = [], excludeTags = [], sortBy = 'newest', maxItems = 20 } = rules;

          const whereClause: any = {
            organizationId: orgId,
            approvalStatus: 'APPROVED'
          };

          if (includeTags.length > 0) {
            whereClause.tags = {
              some: {
                name: { in: includeTags }
              }
            };
          }

          if (excludeTags.length > 0) {
            whereClause.NOT = {
              tags: {
                some: {
                  name: { in: excludeTags }
                }
              }
            };
          }

          const orderByClause: any = sortBy === 'oldest' ? { createdAt: 'asc' } : (sortBy === 'name' ? { name: 'asc' } : { createdAt: 'desc' });

          const matchingMedia = await prisma.mediaAsset.findMany({
            where: whereClause,
            include: { tags: true },
            orderBy: orderByClause,
            take: maxItems || 20
          });

          const dynamicItems = matchingMedia.map((m: any, idx: number) => ({
            id: `smart-${pl.id}-${m.id}`,
            playlistId: pl.id,
            mediaId: m.id,
            widgetId: null,
            order: idx,
            duration: m.duration || 10,
            transition: pl.transition || 'fade',
            conditionPayload: null,
            activeFrom: null,
            activeUntil: m.expiresAt,
            createdAt: m.createdAt,
            updatedAt: m.updatedAt,
            media: m,
            widget: null
          }));

          return {
            ...pl,
            items: dynamicItems
          };
        } catch (e) {
          console.error('Error resolving smart playlist:', e);
        }
      }
      return pl;
    }));

    return NextResponse.json(resolvedPlaylists);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch playlists' }, { status: 500 });
  }
}

// POST create a new playlist
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const { name, description, startTime, endTime, daysOfWeek, transition, isSmartPlaylist, smartRules, approvalStatus } = body;

    if (!name) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 });
    }

    const orgId = await getOrgId(session);

    const playlist = await prisma.playlist.create({
      data: {
        name,
        organizationId: orgId,
        description,
        startTime,
        endTime,
        daysOfWeek,
        transition,
        isSmartPlaylist: !!isSmartPlaylist,
        smartRules: smartRules ? (typeof smartRules === 'object' ? JSON.stringify(smartRules) : smartRules) : null,
        approvalStatus: approvalStatus || 'APPROVED'
      },
      include: {
        items: {
          include: {
            media: {
              include: { tags: true }
            },
            widget: true
          }
        },
        overlays: {
          include: {
            widget: true
          }
        },
        _count: {
          select: { screens: true }
        }
      }
    });

    await logAudit('CREATE_PLAYLIST', `Created playlist: ${name}${isSmartPlaylist ? ' (Smart Playlist)' : ''}`, session);

    return NextResponse.json({ success: true, playlist });
  } catch (error) {
    console.error("Create playlist error:", error);
    return NextResponse.json({ success: false, error: 'Failed to create playlist' }, { status: 500 });
  }
}
