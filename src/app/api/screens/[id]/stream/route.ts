import { authOptions } from '@/lib/auth';
import { getOrgId } from '@/lib/tenant';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyDeviceToken } from '@/lib/deviceAuth';
import { touchScreenLastSeen, markScreenOffline } from '@/lib/screenStatus';

// A simple global emitter for Server-Sent Events in a single-server deployment.
// In a multi-server deployment (like AWS), we'd use Redis Pub/Sub here.
import { EventEmitter } from 'events';

// Create a global event emitter for SSE
const globalForSse = globalThis as unknown as {
  sseEmitter: EventEmitter | undefined
}
export const sseEmitter = globalForSse.sseEmitter ?? new EventEmitter();
if (process.env.NODE_ENV !== 'production') globalForSse.sseEmitter = sseEmitter;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
    const session = await getServerSession(authOptions);
    const device = verifyDeviceToken(request);
    if (!session && !device) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  // Mark screen as active
  await touchScreenLastSeen(id, true);

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      
      // Send an initial heartbeat
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));

      const sendUpdate = () => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'UPDATE_CONFIG' })}\n\n`));
      };

      const sendTest = () => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'TEST_CONNECTION' })}\n\n`));
      };

      const sendSync = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'SYNC_STATE', ...data })}\n\n`));
      };

      // Listen for commits specifically to this screen or global commits
      sseEmitter.on(`commit:${id}`, sendUpdate);
      sseEmitter.on('commit:all', sendUpdate);
      sseEmitter.on(`test:${id}`, sendTest);
      sseEmitter.on(`sync:${id}`, sendSync);

      // Keep connection alive with pings every 15s
      const pingInterval = setInterval(async () => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'ping' })}\n\n`));
        // Update lastSeenAt (throttled)
        await touchScreenLastSeen(id);
      }, 15000);

      request.signal.addEventListener('abort', () => {
        sseEmitter.off(`commit:${id}`, sendUpdate);
        sseEmitter.off('commit:all', sendUpdate);
        sseEmitter.off(`test:${id}`, sendTest);
        sseEmitter.off(`sync:${id}`, sendSync);
        clearInterval(pingInterval);
        
        // Mark as offline when disconnected
        markScreenOffline(id);
        
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
