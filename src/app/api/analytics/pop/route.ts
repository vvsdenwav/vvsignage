import { authOptions } from '@/lib/auth';
import { getOrgId } from '@/lib/tenant';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyDeviceToken } from '@/lib/deviceAuth';

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    const device = verifyDeviceToken(request);
    if (!session && !device) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { screenId, mediaId } = body;

    if (!screenId || !mediaId) {
      return NextResponse.json({ error: 'Missing screenId or mediaId' }, { status: 400 });
    }

    const pop = await prisma.proofOfPlay.create({
      data: {
        screenId,
        mediaId
      }
    });

    return NextResponse.json(pop);
  } catch (error) {
    console.error("Proof of Play error", error);
    return NextResponse.json({ error: 'Failed to record proof of play' }, { status: 500 });
  }
}
