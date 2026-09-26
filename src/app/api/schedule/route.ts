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

    // Fetch all screens with assigned playlists and their items
    const screens = await prisma.screen.findMany({
      where: { organizationId: orgId },
      include: {
        playlist: {
          include: {
            items: {
              include: {
                media: true,
                widget: true
              },
              orderBy: { order: 'asc' }
            }
          }
        },
        group: {
          include: {
            playlist: {
              include: {
                items: {
                  include: {
                    media: true,
                    widget: true
                  },
                  orderBy: { order: 'asc' }
                }
              }
            }
          }
        },
        zoneMappings: {
          include: {
            playlist: {
              include: {
                items: {
                  include: { media: true, widget: true }
                }
              }
            },
            zone: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    const scheduleData = screens.map((screen: any) => {
      const activePlaylist = screen.playlist || screen.group?.playlist || null;
      return {
        screenId: screen.id,
        screenName: screen.name,
        status: screen.status,
        operatingHoursActive: screen.operatingHoursActive,
        wakeTime: screen.wakeTime,
        sleepTime: screen.sleepTime,
        playlist: activePlaylist ? {
          id: activePlaylist.id,
          name: activePlaylist.name,
          startTime: activePlaylist.startTime,
          endTime: activePlaylist.endTime,
          daysOfWeek: activePlaylist.daysOfWeek,
          itemsCount: activePlaylist.items.length,
          items: activePlaylist.items.map((item: any) => ({
            id: item.id,
            title: item.media?.name || item.widget?.name || 'Item',
            type: item.media?.type || item.widget?.type || 'media',
            activeFrom: item.activeFrom,
            activeUntil: item.activeUntil || item.media?.expiresAt,
            duration: item.duration || item.media?.duration || 10,
            conditionPayload: item.conditionPayload
          }))
        } : null,
        zonePlaylists: screen.zoneMappings.map((zm: any) => ({
          zoneName: zm.zone.name,
          playlistId: zm.playlist?.id,
          playlistName: zm.playlist?.name
        }))
      };
    });

    return NextResponse.json(scheduleData);
  } catch (error) {
    console.error('Failed to fetch schedule data:', error);
    return NextResponse.json({ error: 'Failed to fetch schedule data' }, { status: 500 });
  }
}
