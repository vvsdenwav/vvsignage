import { NextResponse } from 'next/server';
import { getOrgId } from '@/lib/tenant';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import QRCode from 'qrcode';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';

function getBaseUrl(request: Request): string {
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  const host = forwardedHost || request.headers.get('host') || 'localhost:3000';
  const proto = host.includes('localhost') ? 'http' : forwardedProto;
  return `${proto}://${host}`;
}

// GET /api/screens/[id]/qr-token
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const orgId = await getOrgId(session);

    const { id } = await params;
    const screen = await prisma.screen.findUnique({
      where: { id },
      include: {
        tvAccounts: {
          include: {
            tabletButtons: {
              orderBy: { order: 'asc' }
            }
          }
        },
        playlist: {
          select: { id: true, name: true }
        }
      }
    });

    if (!screen || screen.organizationId !== orgId) {
      return NextResponse.json({ error: 'Screen not found' }, { status: 404 });
    }

    let token = screen.controlToken;
    if (!token) {
      token = randomUUID();
      await prisma.screen.update({
        where: { id: screen.id },
        data: { controlToken: token }
      });
    }

    const baseUrl = getBaseUrl(request);
    const remoteUrl = `${baseUrl}/remote/${token}`;
    const qrDataUrl = await QRCode.toDataURL(remoteUrl, {
      width: 512,
      margin: 2,
      color: {
        dark: '#1E293B',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H'
    });

    const configuredButtonsCount = screen.tvAccounts.reduce(
      (acc: number, curr: any) => acc + (curr.tabletButtons?.length || 0),
      0
    );

    return NextResponse.json({
      success: true,
      screenId: screen.id,
      screenName: screen.name,
      location: screen.location || 'Default Location',
      controlToken: token,
      remoteUrl,
      qrDataUrl,
      playlistName: screen.playlist?.name || 'No playlist assigned',
      buttonsCount: configuredButtonsCount,
      updatedAt: screen.updatedAt
    });
  } catch (error: any) {
    console.error('Error getting screen QR token:', error);
    return NextResponse.json({ error: 'Failed to generate QR token' }, { status: 500 });
  }
}

// POST /api/screens/[id]/qr-token - Renew/Revoke token
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const orgId = await getOrgId(session);

    const { id } = await params;
    const screen = await prisma.screen.findUnique({
      where: { id },
      include: {
        tvAccounts: {
          include: {
            tabletButtons: {
              orderBy: { order: 'asc' }
            }
          }
        },
        playlist: {
          select: { id: true, name: true }
        }
      }
    });

    if (!screen || screen.organizationId !== orgId) {
      return NextResponse.json({ error: 'Screen not found' }, { status: 404 });
    }

    // Generate fresh token
    const newToken = randomUUID();
    await prisma.screen.update({
      where: { id: screen.id },
      data: { controlToken: newToken }
    });

    await logAudit('RENEW_SCREEN_QR_CODE', `Renewed QR remote token for screen "${screen.name}". Previous codes revoked.`, session);

    const baseUrl = getBaseUrl(request);
    const remoteUrl = `${baseUrl}/remote/${newToken}`;
    const qrDataUrl = await QRCode.toDataURL(remoteUrl, {
      width: 512,
      margin: 2,
      color: {
        dark: '#1E293B',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H'
    });

    const configuredButtonsCount = screen.tvAccounts.reduce(
      (acc: number, curr: any) => acc + (curr.tabletButtons?.length || 0),
      0
    );

    return NextResponse.json({
      success: true,
      screenId: screen.id,
      screenName: screen.name,
      location: screen.location || 'Default Location',
      controlToken: newToken,
      remoteUrl,
      qrDataUrl,
      playlistName: screen.playlist?.name || 'No playlist assigned',
      buttonsCount: configuredButtonsCount,
      renewed: true
    });
  } catch (error: any) {
    console.error('Error renewing screen QR token:', error);
    return NextResponse.json({ error: 'Failed to renew QR token' }, { status: 500 });
  }
}
