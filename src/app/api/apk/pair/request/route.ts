import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

function generatePairingCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // removed confusing I, 1, O, 0
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // Format as XXX-XXX for readability
  return `${code.substring(0, 3)}-${code.substring(3, 6)}`;
}

export async function POST(request: Request) {
  try {
    const { orgId } = await request.json();

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // Verify org exists
    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) {
      return NextResponse.json({ error: 'Invalid organization' }, { status: 404 });
    }

    // Generate a unique 6-char pairing code
    let code = generatePairingCode();
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 5) {
      const existing = await prisma.screen.findUnique({ where: { pairingCode: code } });
      if (!existing) {
        isUnique = true;
      } else {
        code = generatePairingCode();
        attempts++;
      }
    }

    if (!isUnique) {
      return NextResponse.json({ error: 'Failed to generate a unique code. Please try again.' }, { status: 500 });
    }

    // Create a new screen in 'pairing' state
    const screen = await prisma.screen.create({
      data: {
        name: `New Display (${code})`,
        status: 'pairing',
        pairingCode: code,
        organizationId: orgId,
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        screenId: screen.id,
        pairingCode: code,
      }
    });

  } catch (error) {
    console.error("Pairing Request Error:", error);
    return NextResponse.json({ error: 'Failed to request pairing code' }, { status: 500 });
  }
}
