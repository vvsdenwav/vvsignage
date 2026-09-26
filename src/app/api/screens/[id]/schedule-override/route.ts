import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    const params = await props.params;
    const { id } = params;
    const { overrideType, overridePayload, scheduledAt } = await req.json();

    if (!scheduledAt) {
      return NextResponse.json({ error: 'scheduledAt date/time is required' }, { status: 400 });
    }

    const scheduled = await prisma.scheduledOverride.create({
      data: {
        screenId: id,
        overrideType: overrideType || 'html',
        overridePayload: typeof overridePayload === 'object' ? JSON.stringify(overridePayload) : (overridePayload || '{}'),
        scheduledAt: new Date(scheduledAt)
      }
    });

    return NextResponse.json(scheduled);
  } catch (error: any) {
    console.error('Schedule override error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
