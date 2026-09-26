import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url, 'http://localhost');
    const screenId = searchParams.get('screenId');
    const code = searchParams.get('code');

    if (!screenId || !code) {
      return NextResponse.json({ error: 'screenId and code are required' }, { status: 400 });
    }

    const screen = await prisma.screen.findUnique({
      where: { id: screenId },
      include: {
        organization: true,
      }
    });

    if (!screen) {
      return NextResponse.json({ status: 'aborted', error: 'Pairing session was cancelled or deleted' }, { status: 404 });
    }

    // If the pairingCode is STILL the same code, it hasn't been paired yet
    if (screen.pairingCode === code) {
      return NextResponse.json({
        success: true,
        status: 'pending'
      });
    }

    // If the pairingCode is null (or different, meaning it was somehow reused), it means the admin linked it!
    // The CMS clears the pairingCode when successful.
    if (screen.pairingCode === null && screen.status === 'online') {
      return NextResponse.json({
        success: true,
        status: 'paired',
        data: {
          screenId: screen.id,
          name: screen.name,
          organizationId: screen.organizationId,
          // You could return initial auth tokens or initial playlist data here if needed
        }
      });
    }

    return NextResponse.json({
      success: true,
      status: 'pending'
    });

  } catch (error) {
    console.error("Pairing Status Error:", error);
    return NextResponse.json({ error: 'Failed to check pairing status' }, { status: 500 });
  }
}
