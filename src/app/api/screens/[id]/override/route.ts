import { authOptions } from '@/lib/auth';
import { getOrgId } from '@/lib/tenant';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sseEmitter } from '../stream/route';
import { verifyDeviceToken } from '@/lib/deviceAuth';

export const dynamic = 'force-dynamic';

// POST /api/screens/[id]/override
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { type, payload } = body; // type="html" | null (to clear)
    
    // Authenticate: Allow CMS session, OR device token, OR allow clearing if they have the Screen ID
    const session = await getServerSession(authOptions);
    const deviceTokenPayload = verifyDeviceToken(request);
    
    if (!session) {
      if (!deviceTokenPayload) {
        return NextResponse.json({ error: 'Unauthorized override action' }, { status: 401 });
      }
    }

    await prisma.screen.update({
      where: { id },
      data: {
        overrideType: type || null,
        overridePayload: payload ? JSON.stringify(payload) : null,
      }
    });

    // Notify the specific screen to reload its config
    sseEmitter.emit(`commit:${id}`);

    // Create an audit log
    await prisma.auditLog.create({
      data: {
        action: type ? 'SCREEN_OVERRIDE_ENABLED' : 'SCREEN_OVERRIDE_CLEARED',
        details: `Screen ${id.substring(0,8)} ${type ? `overridden with ${type}` : 'override cleared'}`
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Override error:", error);
    return NextResponse.json({ success: false, error: 'Failed to set override' }, { status: 500 });
  }
}

// GET /api/screens/[id]/override
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const screen = await prisma.screen.findUnique({
      where: { id },
      select: { overrideType: true, overridePayload: true }
    });
    if (!screen) return NextResponse.json({ error: 'Screen not found' }, { status: 404 });

    let overrideType = screen.overrideType;
    let overridePayload = screen.overridePayload ? JSON.parse(screen.overridePayload) : null;

    if (overrideType === 'web' || overrideType === 'canva' || overrideType === 'embed' || overrideType === 'webpage') {
      if (overridePayload?.url) {
        try {
          const setting = await prisma.systemSetting.findUnique({ where: { key: 'allowedWebDomains' } });
          const allowedDomains: string[] = setting?.value ? JSON.parse(setting.value) : [];
          
          const url = overridePayload.url.startsWith('http') ? overridePayload.url : `https://${overridePayload.url}`;
          const hostname = new URL(url).hostname.toLowerCase();
          const isAllowed = allowedDomains.some((domain: string) => hostname === domain || hostname.endsWith(`.${domain}`));
          
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

    return NextResponse.json({ 
      overrideType, 
      overridePayload 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch override' }, { status: 500 });
  }
}
