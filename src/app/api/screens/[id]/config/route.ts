import { authOptions } from '@/lib/auth';
import { getOrgId } from '@/lib/tenant';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export const dynamic = 'force-dynamic';

function getJwtSecret() {
  return process.env.NEXTAUTH_SECRET || 'fallback-dev-secret-32-chars-long!!';
}

// GET /api/screens/[id]/config - Fetch the full layout for the screen
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
    let isAuthorized = false;
    
    // Check Session Auth (Web preview)
    const session = await getServerSession(authOptions);
    if (session) {
      isAuthorized = true;
    }
    
    let deviceLocation: string | null = null;

    // Check JWT Auth (TV Device)
    if (!isAuthorized) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
          const decoded = jwt.verify(token, getJwtSecret()) as any;
          isAuthorized = true;
          if (decoded?.deviceId) {
            const dev = await prisma.tvDevice.findUnique({
              where: { id: decoded.deviceId },
              select: { location: true }
            });
            if (dev?.location) {
              deviceLocation = dev.location;
            }
          }
        } catch (err) {}
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const { id } = await params;
    const screen = await prisma.screen.findUnique({
      where: { id },
      include: {
        playlist: {
          include: {
            overlays: {
              include: { widget: true }
            },
            items: {
              include: { media: true, widget: true },
              orderBy: { order: 'asc' }
            }
          }
        },
        interactivePlaylist: {
          include: {
            overlays: {
              include: { widget: true }
            },
            items: {
              include: { media: true, widget: true },
              orderBy: { order: 'asc' }
            }
          }
        },
        group: {
          include: {
            playlist: {
              include: {
                overlays: { include: { widget: true } },
                items: { include: { media: true, widget: true }, orderBy: { order: 'asc' } }
              }
            }
          }
        },
        template: {
          include: { zones: true }
        },
        zoneMappings: {
          include: {
            playlist: {
              include: {
                overlays: { include: { widget: true } },
                items: { include: { media: true, widget: true }, orderBy: { order: 'asc' } }
              }
            }
          }
        }
      }
    });

    if (!screen) {
      return NextResponse.json({ error: 'Screen not found' }, { status: 404 });
    }

    // Touch lastSeenAt to mark screen as online in CMS dashboard
    await prisma.screen.update({
      where: { id },
      data: { lastSeenAt: new Date(), status: 'online' }
    }).catch(() => {});

    // Inherit group playlist if direct playlist is null
    const effectivePlaylist = screen.playlist || screen.group?.playlist || null;

    if (!effectivePlaylist && !screen.template) {
      return NextResponse.json({ message: 'No playlist or template assigned' }, { status: 200 });
    }

    // Check scheduling
    const p = effectivePlaylist;
    let isActive = true;
    const now = new Date();

    // Check if playlist is scheduled for a future push
    if (p && p.scheduledPushAt && new Date(p.scheduledPushAt).getTime() > now.getTime()) {
      isActive = false;
    }
    
    // Check Days of Week (1 = Mon, 7 = Sun)
    if (isActive && p && p.daysOfWeek) {
      const currentDay = now.getDay() === 0 ? 7 : now.getDay();
      const allowedDays = p.daysOfWeek.split(',').map((d: any) => parseInt(d.trim()));
      if (!allowedDays.includes(currentDay)) {
        isActive = false;
      }
    }

    // Check Time Window
    if (isActive && p && p.startTime && p.endTime) {
      const [startHour, startMin] = p.startTime.split(':').map(Number);
      const [endHour, endMin] = p.endTime.split(':').map(Number);
      
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
        isActive = false;
      }
    }

    if (!isActive) {
      return NextResponse.json({
        screenName: screen.name,
        overrideType: screen.overrideType,
        overridePayload: screen.overridePayload ? JSON.parse(screen.overridePayload) : null,
        playlist: null // Let the player show a blank or standby screen
      });
    }

    const setting = await prisma.systemSetting.findUnique({ where: { key: 'allowedWebDomains' } });
    const allowedDomains: string[] = setting?.value ? JSON.parse(setting.value) : [];

    const formatPlaylist = (pl: any) => {
      if (!pl) return null;
      return {
        id: pl.id,
        name: pl.name,
        transition: pl.transition,
        scheduledPushAt: pl.scheduledPushAt,
        overlays: pl.overlays.map((o: any) => {
          let dataPayload = o.widget.dataPayload ? JSON.parse(o.widget.dataPayload) : null;
          if (o.widget.type === 'embed' || o.widget.type === 'canva' || o.widget.type === 'webpage') {
             if (dataPayload?.url) {
                try {
                  const url = dataPayload.url.startsWith('http') ? dataPayload.url : `https://${dataPayload.url}`;
                  const hostname = new URL(url).hostname.toLowerCase();
                  const isAllowed = allowedDomains.some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
                  if (!isAllowed) return null;
                } catch(e) { return null; }
             }
          }
          return {
            id: o.widget.id,
            type: o.widget.type,
            position: o.widget.position,
            dataPayload
          };
        }).filter(Boolean),
        items: pl.items.map((item: any) => {
          if (item.widget) {
            let dataPayload = item.widget.dataPayload ? JSON.parse(item.widget.dataPayload) : null;
            if (item.widget.type === 'embed' || item.widget.type === 'canva' || item.widget.type === 'webpage') {
               if (dataPayload?.url) {
                  try {
                    const url = dataPayload.url.startsWith('http') ? dataPayload.url : `https://${dataPayload.url}`;
                    const hostname = new URL(url).hostname.toLowerCase();
                    const isAllowed = allowedDomains.some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
                    if (!isAllowed) return null; // Strip the whole widget if unallowed
                  } catch(e) { return null; }
               }
            }
            return {
              id: item.widget.id,
              type: 'widget',
              widgetType: item.widget.type,
              position: item.widget.position,
              backgroundColor: item.widget.backgroundColor,
              dataPayload,
              duration: item.duration || 10,
              transition: item.transition || null
            };
          }
          if (item.media) {
            if (item.media.type === 'web') {
              try {
                const url = item.media.url.startsWith('http') ? item.media.url : `https://${item.media.url}`;
                const hostname = new URL(url).hostname.toLowerCase();
                const isAllowed = allowedDomains.some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
                if (!isAllowed) return null; // Strip non-allowed web items
              } catch(e) { return null; }
            }
            return {
              id: item.media.id,
              type: item.media.type,
              url: item.media.url,
              duration: item.duration || (item.media.type === 'image' || item.media.type === 'web' ? 10 : null),
              transition: item.transition || null
            };
          }
          return null;
        }).filter(Boolean)
      };
    };

    let overrideType = screen.overrideType;
    let overridePayload = screen.overridePayload ? JSON.parse(screen.overridePayload) : null;

    if (overrideType === 'web' || overrideType === 'canva' || overrideType === 'embed' || overrideType === 'webpage') {
       if (overridePayload?.url) {
          try {
            const url = overridePayload.url.startsWith('http') ? overridePayload.url : `https://${overridePayload.url}`;
            const hostname = new URL(url).hostname.toLowerCase();
            const isAllowed = allowedDomains.some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
            if (!isAllowed) {
              overrideType = null;
              overridePayload = null;
            }
          } catch(e) {
            overrideType = null;
            overridePayload = null;
          }
       }
    }

    const throttlingSetting = await prisma.systemSetting.findUnique({ where: { key: 'networkThrottlingEnabled' } });
    const jitterSetting = await prisma.systemSetting.findUnique({ where: { key: 'downloadJitterMinutes' } });
    
    const networkThrottlingEnabled = throttlingSetting?.value !== 'false';
    const downloadJitterMinutes = parseInt(jitterSetting?.value || '15');
    const maxJitterSec = Math.max(1, downloadJitterMinutes) * 60;
    const screenHash = screen.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    const staggerDelaySeconds = networkThrottlingEnabled ? (screenHash % maxJitterSec) : 0;

    const response = NextResponse.json({
      screenName: screen.name,
      location: deviceLocation || screen.location || null,
      overrideType,
      overridePayload,
      playlist: effectivePlaylist ? formatPlaylist(effectivePlaylist) : null,
      interactivePlaylist: screen.interactivePlaylist ? formatPlaylist(screen.interactivePlaylist) : null,
      inactivityTimeout: screen.inactivityTimeout || 30,
      networkThrottlingEnabled,
      downloadJitterMinutes,
      staggerDelaySeconds,
      autoStart: screen.autoStart,
      template: screen.template ? {
        id: screen.template.id,
        zones: screen.template.zones.map((z: any) => {
          const mapping = screen.zoneMappings.find((m: any) => m.zoneId === z.id);
          return {
            ...z,
            playlist: mapping?.playlist ? formatPlaylist(mapping.playlist) : null
          };
        })
      } : null
    });

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error: any) {
    console.error("Config fetch error:", error);
    console.error('[screens/config] Unhandled error:', error);
    return NextResponse.json({ error: 'Failed to fetch screen configuration' }, { status: 500 });
  }
}
