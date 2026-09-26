import { authOptions } from '@/lib/auth';
import { getOrgId } from '@/lib/tenant';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sseEmitter } from '../../../screens/[id]/stream/route';
import { verifyDeviceToken } from '@/lib/deviceAuth';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const deviceTokenPayload = verifyDeviceToken(request);

    const { id } = await params;

    // Allow CMS Session OR matching TV Account Device Token
    if (!session) {
      if (!deviceTokenPayload || deviceTokenPayload.accountId !== id) {
        return NextResponse.json({ error: 'Unauthorized override action' }, { status: 401 });
    const orgId = await getOrgId(session);
      }
    }

    const body = await request.json();
    const { type, payload } = body; // type="html" | null (to clear)

    // Find all screens associated with this TV Account
    const account = await prisma.tvAccount.findUnique({
      where: { id },
      include: { screens: true }
    });

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Attach nonce to force TV player state refresh even when clicking the same button multiple times
    const enrichedPayload = payload ? { ...payload, nonce: Date.now() } : null;

    // Update all screens
    const screenIds = account.screens.map((s: any) => s.id);
    
    if (screenIds.length > 0) {
      await prisma.screen.updateMany({
        where: { id: { in: screenIds } },
        data: {
          overrideType: type || null,
          overridePayload: enrichedPayload ? JSON.stringify(enrichedPayload) : null,
        }
      });

      // Notify all screens instantly via SSE
      for (const screenId of screenIds) {
        sseEmitter.emit(`commit:${screenId}`);
      }

      await prisma.auditLog.create({
        data: {
          action: type ? 'TV_ACCOUNT_OVERRIDE_ENABLED' : 'TV_ACCOUNT_OVERRIDE_CLEARED',
          details: `Overrides updated for ${screenIds.length} screens on account ${account.username}`
        }
      });
    }

    return NextResponse.json({ success: true, screensUpdated: screenIds.length });
  } catch (error) {
    console.error("TV Account Override error:", error);
    return NextResponse.json({ success: false, error: 'Failed to set overrides' }, { status: 500 });
  }
}
