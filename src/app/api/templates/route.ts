import { authOptions } from '@/lib/auth';
import { getOrgId } from '@/lib/tenant';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const orgId = await getOrgId(session);

  try {
    const templates = await prisma.template.findMany({
      include: { zones: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(templates);
  } catch (error) {
    console.error("Fetch Templates error", error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const orgId = await getOrgId(session);

  try {
    const data = await req.json();
    const { name, zones } = data; // zones is an array of objects

    if (!name || !zones || !Array.isArray(zones)) {
      return NextResponse.json({ error: 'Missing name or zones' }, { status: 400 });
    }

    const template = await prisma.template.create({
      data: {
        name,
        zones: {
          create: zones.map((z: any) => ({
            name: z.name,
            x: z.x,
            y: z.y,
            width: z.width,
            height: z.height,
            zIndex: z.zIndex || 0
          }))
        }
      },
      include: { zones: true }
    });

    await logAudit('CREATE_TEMPLATE', `Created layout template "${name}"`, session);

    return NextResponse.json(template);
  } catch (error) {
    console.error("Create Template error", error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}
