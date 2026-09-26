import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sseEmitter } from '@/app/api/screens/[id]/stream/route';

export const dynamic = 'force-dynamic';

// GET /api/remote/[token] - Fetch screen details and configured buttons by controlToken
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    const screen = await prisma.screen.findUnique({
      where: { controlToken: token },
      include: {
        tvAccounts: {
          include: {
            tabletButtons: {
              orderBy: { order: 'asc' },
              include: {
                media: {
                  select: { id: true, name: true, url: true, type: true }
                }
              }
            }
          }
        },
        playlist: {
          select: { id: true, name: true }
        },
        organization: {
          select: { name: true, brandingLogoUrl: true, brandingColor: true }
        }
      }
    });

    if (!screen) {
      return NextResponse.json(
        { error: 'Invalid or revoked remote control code. Please scan the current QR code on the display or CMS.' },
        { status: 404 }
      );
    }

    // Collect tablet buttons across all linked TV accounts without duplicates
    const buttonMap = new Map<string, any>();
    for (const tvAcc of screen.tvAccounts) {
      for (const btn of tvAcc.tabletButtons) {
        if (!buttonMap.has(btn.id)) {
          buttonMap.set(btn.id, {
            id: btn.id,
            label: btn.label,
            color: btn.color,
            actionType: btn.actionType,
            mediaUrl: btn.mediaUrl || btn.media?.url || null,
            htmlTitle: btn.htmlTitle,
            htmlSubtitle: btn.htmlSubtitle,
            htmlBgColor: btn.htmlBgColor,
            htmlTextColor: btn.htmlTextColor,
            duration: btn.duration || 0,
            order: btn.order
          });
        }
      }
    }

    const buttons = Array.from(buttonMap.values()).sort((a, b) => a.order - b.order);

    let parsedOverridePayload = null;
    if (screen.overridePayload) {
      try {
        parsedOverridePayload = JSON.parse(screen.overridePayload);
      } catch (_) {
        parsedOverridePayload = screen.overridePayload;
      }
    }

    const isOnline = screen.lastSeenAt
      ? Date.now() - new Date(screen.lastSeenAt).getTime() < 60000
      : false;

    return NextResponse.json({
      success: true,
      screen: {
        id: screen.id,
        name: screen.name,
        location: screen.location || null,
        isOnline,
        status: screen.status,
        playlistName: screen.playlist?.name || 'Standard Advertising Loop',
        overrideType: screen.overrideType,
        overridePayload: parsedOverridePayload,
        orgName: screen.organization?.name || 'Signage Network',
        brandingLogoUrl: screen.organization?.brandingLogoUrl || '/logo.png',
        brandingColor: screen.organization?.brandingColor || '#2C4C7C'
      },
      buttons
    });
  } catch (error: any) {
    console.error('Error fetching remote details:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST /api/remote/[token] - Execute screen override from QR remote
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();

    const screen = await prisma.screen.findUnique({
      where: { controlToken: token }
    });

    if (!screen) {
      return NextResponse.json(
        { error: 'Invalid or revoked remote control code.' },
        { status: 404 }
      );
    }

    const { type, payload, clear } = body;

    if (clear || type === null) {
      await prisma.screen.update({
        where: { id: screen.id },
        data: {
          overrideType: null,
          overridePayload: null
        }
      });

      // Realtime SSE broadcast
      sseEmitter.emit(`commit:${screen.id}`);

      await prisma.auditLog.create({
        data: {
          organizationId: screen.organizationId,
          action: 'QR_REMOTE_OVERRIDE_CLEARED',
          details: `Override cleared via QR Web Remote for screen "${screen.name}"`
        }
      });

      return NextResponse.json({ success: true, cleared: true });
    }

    // Attach nonce to ensure re-triggers when tapping same button
    const enrichedPayload = payload ? { ...payload, nonce: Date.now() } : null;

    await prisma.screen.update({
      where: { id: screen.id },
      data: {
        overrideType: type || 'html',
        overridePayload: enrichedPayload ? JSON.stringify(enrichedPayload) : null
      }
    });

    // Realtime SSE broadcast to TV
    sseEmitter.emit(`commit:${screen.id}`);

    await prisma.auditLog.create({
      data: {
        organizationId: screen.organizationId,
        action: 'QR_REMOTE_OVERRIDE_TRIGGERED',
        details: `Override "${type}" triggered via QR Web Remote on screen "${screen.name}"`
      }
    });

    return NextResponse.json({
      success: true,
      overrideType: type,
      overridePayload: enrichedPayload
    });
  } catch (error: any) {
    console.error('Error executing QR remote override:', error);
    return NextResponse.json({ error: 'Failed to execute override' }, { status: 500 });
  }
}
