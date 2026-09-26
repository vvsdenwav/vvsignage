import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { getOrgId } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

// GET /api/screens/broadcast - Get active broadcast status
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const orgId = await getOrgId(session);
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        broadcastAlertActive: true,
        broadcastAlertPayload: true,
      }
    });

    const activeScreens = await prisma.screen.findMany({
      where: { organizationId: orgId, alertActive: true },
      select: { id: true, name: true, alertActive: true, alertPayload: true }
    });

    return NextResponse.json({
      success: true,
      orgBroadcast: org,
      screenAlerts: activeScreens
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch broadcast status' }, { status: 500 });
  }
}

// POST /api/screens/broadcast - Trigger or Clear broadcast alerts
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const orgId = await getOrgId(session);
    const body = await request.json();
    const { action, title, message, severity, targetType, targetId } = body;

    if (action === 'CLEAR_BROADCAST') {
      if (targetType === 'screen' && targetId) {
        await prisma.screen.update({
          where: { id: targetId },
          data: { alertActive: false, alertPayload: null }
        });
      } else if (targetType === 'group' && targetId) {
        await prisma.screen.updateMany({
          where: { groupId: targetId },
          data: { alertActive: false, alertPayload: null }
        });
      } else {
        // Clear Org-wide & All screens
        await prisma.organization.update({
          where: { id: orgId },
          data: { broadcastAlertActive: false, broadcastAlertPayload: null }
        });
        await prisma.screen.updateMany({
          where: { organizationId: orgId },
          data: { alertActive: false, alertPayload: null }
        });
      }

      await logAudit('CLEAR_BROADCAST_ALERT', `Cleared broadcast alert for target: ${targetType || 'all'}`, session);
      return NextResponse.json({ success: true, message: 'Broadcast alert cleared' });
    }

    if (action === 'SET_BROADCAST') {
      if (!title || !message) {
        return NextResponse.json({ error: 'Title and message are required' }, { status: 400 });
      }

      const alertPayload = JSON.stringify({
        title,
        message,
        severity: severity || 'warning', // 'info' | 'warning' | 'urgent'
        createdAt: new Date().toISOString()
      });

      if (targetType === 'screen' && targetId) {
        await prisma.screen.update({
          where: { id: targetId },
          data: { alertActive: true, alertPayload }
        });
      } else if (targetType === 'group' && targetId) {
        await prisma.screen.updateMany({
          where: { groupId: targetId },
          data: { alertActive: true, alertPayload }
        });
      } else {
        // Broadcast to whole organization
        await prisma.organization.update({
          where: { id: orgId },
          data: { broadcastAlertActive: true, broadcastAlertPayload: alertPayload }
        });
      }

      await logAudit('SET_BROADCAST_ALERT', `Broadcasted ${severity || 'warning'} alert: "${title}"`, session);
      return NextResponse.json({ success: true, message: 'Broadcast alert activated' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Broadcast API error:', error);
    return NextResponse.json({ error: 'Broadcast action failed: ' + (error.message || String(error)) }, { status: 500 });
  }
}
