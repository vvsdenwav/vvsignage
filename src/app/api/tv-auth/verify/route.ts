import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { authRateLimiter } from '@/lib/rateLimit';

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    if (!authRateLimiter.check(ip)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { accountId, password } = await req.json();

    if (!accountId || !password) {
      return NextResponse.json({ error: 'Account ID and password are required' }, { status: 400 });
    }

    const account = await prisma.tvAccount.findUnique({
      where: { id: accountId }
    });

    if (!account) {
      return NextResponse.json({ error: 'Invalid account' }, { status: 401 });
    }

    // Support both plaintext and bcrypt (for smooth migration)
    const isBcrypt = account.password.startsWith('$2a$') || account.password.startsWith('$2b$');
    const isValidPassword = isBcrypt 
      ? await bcrypt.compare(password, account.password)
      : account.password === password;

    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
