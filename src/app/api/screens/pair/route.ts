import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { getOrgId, canAddScreen } from '@/lib/tenant';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    // Ensure user has permission to create screens
    const { hasPermission } = await import('@/lib/auth');
    if (!hasPermission(session, 'screens:create')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { code, name } = await request.json();
    const orgId = await getOrgId(session);

    if (!code) {
      return NextResponse.json({ error: 'Pairing code is required' }, { status: 400 });
    }

    // Check screen limits
    const canAdd = await canAddScreen(orgId);
    if (!canAdd) {
      return NextResponse.json({ error: 'You have reached the maximum number of screens for your plan.' }, { status: 403 });
    }

    // Treat the code as case-insensitive and format correctly (e.g. A4X-B92)
    const normalizedCode = code.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (normalizedCode.length !== 6) {
      return NextResponse.json({ error: 'Pairing code must be 6 characters' }, { status: 400 });
    }
    const formattedCode = `${normalizedCode.substring(0, 3)}-${normalizedCode.substring(3, 6)}`;

    // Find the pairing screen
    const screen = await prisma.screen.findFirst({
      where: { 
        pairingCode: formattedCode,
        organizationId: orgId,
        status: 'pairing'
      }
    });

    if (!screen) {
      return NextResponse.json({ error: 'Invalid or expired pairing code' }, { status: 404 });
    }

    // Claim the screen
    const updatedScreen = await prisma.screen.update({
      where: { id: screen.id },
      data: {
        name: name || `Display (${formattedCode})`,
        status: 'online',
        pairingCode: null,
      }
    });

    await logAudit('CREATE_SCREEN', `Paired new screen: ${updatedScreen.name} via code ${formattedCode}`, session);

    return NextResponse.json({ success: true, screen: updatedScreen });
  } catch (error: any) {
    console.error("Pairing Screen Error:", error);
    return NextResponse.json({ 
      error: 'Failed to pair screen: ' + (error.message || String(error))
    }, { status: 500 });
  }
}
