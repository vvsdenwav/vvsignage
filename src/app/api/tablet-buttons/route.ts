import { authOptions } from '@/lib/auth';
import { getOrgId } from '@/lib/tenant';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';
import { verifyDeviceToken } from '@/lib/deviceAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const deviceTokenPayload = verifyDeviceToken(request);
    const { searchParams } = new URL(request.url, 'http://localhost');
    const accountId = searchParams.get('tvAccountId');

    if (!session && !deviceTokenPayload && !accountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const whereClause = accountId ? { tvAccountId: accountId } : {};

    const buttons = await prisma.tabletButton.findMany({
      where: whereClause,
      include: {
        media: true
      },
      orderBy: { order: 'asc' }
    });
    return NextResponse.json(buttons);
  } catch (error) {
    console.error("GET tablet-buttons error:", error);
    return NextResponse.json({ error: 'Failed to fetch buttons' }, { status: 500 });
  }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const orgId = await getOrgId(session);

  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.label || !body.actionType) {
      return NextResponse.json({ error: 'Label and actionType are required' }, { status: 400 });
    }

    const newButton = await prisma.tabletButton.create({
      data: {
        label: body.label,
        color: body.color || "linear-gradient(135deg, #1e3a8a, #3b82f6)",
        actionType: body.actionType,
        tvAccount: body.tvAccountId ? { connect: { id: body.tvAccountId } } : undefined,
        media: body.mediaId ? { connect: { id: body.mediaId } } : undefined,
        mediaUrl: body.mediaUrl || null,
        htmlTitle: body.htmlTitle || null,
        htmlSubtitle: body.htmlSubtitle || null,
        htmlBgColor: body.htmlBgColor || null,
        htmlTextColor: body.htmlTextColor || null,
        duration: body.duration || 0,
        order: body.order || 0
      }
    });

    await logAudit('CREATE_TABLET_BUTTON', `Created tablet button "${body.label}"`, session);

    return NextResponse.json({ success: true, button: newButton });
  } catch (error) {
    console.error("POST tablet-buttons error:", error);
    return NextResponse.json({ error: 'Failed to create button' }, { status: 500 });
  }
}
