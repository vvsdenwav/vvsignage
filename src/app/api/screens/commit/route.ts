import { authOptions } from '@/lib/auth';
import { getOrgId } from '@/lib/tenant';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sseEmitter } from '../[id]/stream/route'; // We exported the emitter

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const orgId = await getOrgId(session);

  try {
    // Audit log the commit
    await prisma.auditLog.create({
      data: {
        action: 'Global Commit',
        details: 'Admin pushed latest configurations to all screens.'
      }
    });

    // Fire the SSE event to all connected clients
    sseEmitter.emit('commit:all');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Commit error:", error);
    return NextResponse.json({ success: false, error: 'Failed to commit updates' }, { status: 500 });
  }
}
