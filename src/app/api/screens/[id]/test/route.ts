import { authOptions } from '@/lib/auth';
import { getOrgId } from '@/lib/tenant';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { sseEmitter } from '../stream/route';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const orgId = await getOrgId(session);

  try {
    const { id } = await params;
    
    // Emit the test connection event to the specific screen
    sseEmitter.emit(`test:${id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Test connection error:", error);
    return NextResponse.json({ success: false, error: 'Failed to send test connection' }, { status: 500 });
  }
}
