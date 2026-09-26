import { NextResponse } from 'next/server';
import { getOrgId } from '@/lib/tenant';
import { prisma } from '@/lib/prisma';
import { verifyDeviceToken } from '@/lib/deviceAuth';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/screens/status?id=XXXXXX - Called by Edge Device
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url, 'http://localhost');
    const id = searchParams.get('id');

    if (id) {
       // Device is checking its status using its ID
       // Require device auth OR session auth (for CMS preview/checks)
       const deviceToken = verifyDeviceToken(request);
       const session = await getServerSession(authOptions);

       if (!deviceToken && !session) {
         return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
       }

       const screen = await prisma.screen.findUnique({
         where: { id }
       });
       if (!screen) return NextResponse.json({ error: 'Not found' }, { status: 404 });
       
       return NextResponse.json({
         status: screen.status,
         playlistId: screen.playlistId
       });
    }

    return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 });
  }
}
