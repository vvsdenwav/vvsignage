import { authOptions } from '@/lib/auth';
import { widgetSchema } from '@/lib/validations';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

import { getOrgId } from '@/lib/tenant';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const orgId = await getOrgId(session);
    const widgets = await prisma.widget.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(widgets);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch widgets' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const orgId = await getOrgId(session);
    const rawData = await request.json();
    const validation = widgetSchema.safeParse(rawData);
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', details: validation.error.format() }, { status: 400 });
    }
    const data = validation.data;
    const widget = await prisma.widget.create({
      data: {
        name: data.name,
        type: data.type,
        position: data.position || 'bottom-right',
        dataPayload: data.dataPayload,
        backgroundColor: data.backgroundColor,
        organizationId: orgId
      }
    });

    await logAudit('CREATE_WIDGET', `Created widget "${data.name}" (${data.type})`, session, orgId);

    return NextResponse.json({ success: true, widget });
  } catch (error) {
    console.error("Failed to create widget", error);
    return NextResponse.json({ error: 'Failed to create widget' }, { status: 500 });
  }
}
