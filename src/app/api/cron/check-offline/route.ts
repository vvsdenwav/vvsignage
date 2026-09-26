import { NextResponse } from 'next/server';
import { checkAndDispatchOfflineAlerts } from '@/lib/offlineAlertEngine';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url, 'http://localhost');
    const orgId = searchParams.get('orgId') || undefined;

    const result = await checkAndDispatchOfflineAlerts(orgId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Check offline cron error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const orgId = body.orgId || undefined;

    const result = await checkAndDispatchOfflineAlerts(orgId);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Check offline cron error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
