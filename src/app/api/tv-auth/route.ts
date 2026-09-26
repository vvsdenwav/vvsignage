import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authRateLimiter } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

const getJwtSecret = () => {
  return process.env.NEXTAUTH_SECRET || 'dev-secret-key-32-chars-long-12345';
};

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    if (!authRateLimiter.check(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { username, password, deviceId, tvName } = await req.json();

    if (!username || !password || !deviceId) {
      return NextResponse.json({ error: 'Username, password, and deviceId are required' }, { status: 400 });
    }

    const account = await prisma.tvAccount.findUnique({
      where: { username },
      include: { 
        screens: true,
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            companyCode: true,
            brandingLogoUrl: true,
            brandingColor: true,
            apkServerUrl: true,
          }
        }
      }
    });

    if (!account) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    // Support both plaintext and bcrypt (for smooth migration)
    const isBcrypt = account.password.startsWith('$2a$') || account.password.startsWith('$2b$');
    const isValidPassword = isBcrypt 
      ? await bcrypt.compare(password, account.password)
      : account.password === password;

    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    // If it was plaintext, hash it and update the DB so it's secure moving forward
    if (!isBcrypt) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.tvAccount.update({
        where: { id: account.id },
        data: { password: hashedPassword }
      });
    }

    // Generate JWT token (expires in 30 days)
    const token = jwt.sign(
      { accountId: account.id, deviceId },
      getJwtSecret(),
      { expiresIn: '30d' }
    );

    let device = await prisma.tvDevice.findUnique({
      where: { id: deviceId }
    });

    if (device) {
      device = await prisma.tvDevice.update({
        where: { id: deviceId },
        data: { 
          lastPingAt: new Date(), 
          accountId: account.id,
          name: tvName || device.name
        }
      });
    } else {
      device = await prisma.tvDevice.create({
        data: { 
          id: deviceId, 
          accountId: account.id, 
          name: tvName || `TV ${deviceId.substring(0,6)}`
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      accountId: account.id, 
      token,
      username: account.username,
      organizationId: account.organizationId,
      organizationName: account.organization?.name || null,
      organizationSlug: account.organization?.slug || null,
      location: device.location || null,
      screens: account.screens 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
