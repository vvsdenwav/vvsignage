import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const getJwtSecret = () => {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error('NEXTAUTH_SECRET environment variable is not set');
  return secret;
};

export interface DeviceTokenPayload {
  accountId: string;
  deviceId: string;
}

export function verifyDeviceToken(request: Request): DeviceTokenPayload | null {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split(' ')[1];
    if (!token) return null;

    const decoded = jwt.verify(token, getJwtSecret()) as any as DeviceTokenPayload;
    return decoded;
  } catch (error) {
    console.error('Device token verification failed:', error);
    return null;
  }
}
