import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getOrgId } from '@/lib/tenant';
import { touchMobilePresence, getActiveMobileSessions, removeMobilePresence } from '@/lib/mobilePresence';

export const dynamic = 'force-dynamic';

// GET /api/presence/mobile - Fetch active mobile sessions
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    let orgId: string | undefined = undefined;
    if (session) {
      orgId = await getOrgId(session);
    }

    const activeSessions = getActiveMobileSessions(orgId);

    return NextResponse.json({
      success: true,
      activeSessions,
      count: activeSessions.length
    });
  } catch (error) {
    console.error('Failed to get mobile presence:', error);
    return NextResponse.json({ activeSessions: [], count: 0 });
  }
}

// POST /api/presence/mobile - Heartbeat / Register mobile presence
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const session = await getServerSession(authOptions);

    let orgId = body.orgId;
    let userId = body.userId;
    let userName = body.userName;

    if (session) {
      try {
        orgId = orgId || (await getOrgId(session));
        userId = userId || (session.user as any)?.id;
        userName = userName || session.user?.name;
      } catch (_) {}
    }

    const sessionId = body.sessionId || `session_${Math.random().toString(36).substring(2, 9)}`;

    if (body.action === 'disconnect') {
      removeMobilePresence(sessionId);
      return NextResponse.json({ success: true, disconnected: true });
    }

    const entry = touchMobilePresence({
      sessionId,
      userId,
      userName: userName || body.screenName || 'Mobile User',
      orgId,
      screenId: body.screenId,
      screenName: body.screenName,
      deviceType: body.deviceType || 'Mobile Remote',
      userAgent: request.headers.get('user-agent') || undefined
    });

    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error('Failed to update mobile presence:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
