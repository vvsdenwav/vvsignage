import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getOrgId } from '@/lib/tenant';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

// GET all approval requests
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const orgId = await getOrgId(session);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: any = { organizationId: orgId };
    if (status && status !== 'all') {
      where.status = status;
    }

    const requests = await prisma.approvalRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Failed to fetch approvals:', error);
    return NextResponse.json({ error: 'Failed to fetch approvals' }, { status: 500 });
  }
}

// POST submit for approval
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const orgId = await getOrgId(session);
    const body = await request.json();
    const { type, targetId } = body; // type: 'media' | 'playlist'

    if (!type || !targetId) {
      return NextResponse.json({ error: 'Type and targetId are required' }, { status: 400 });
    }

    const userId = (session.user as any)?.id || 'unknown';
    const userName = (session.user as any)?.name || (session.user as any)?.username || 'Agent';

    let targetName = 'Item';
    let thumbnailUrl: string | null = null;

    if (type === 'media') {
      const media = await prisma.mediaAsset.findFirst({
        where: { id: targetId, organizationId: orgId }
      });
      if (!media) return NextResponse.json({ error: 'Media not found' }, { status: 404 });
      targetName = media.name;
      thumbnailUrl = media.url;

      await prisma.mediaAsset.update({
        where: { id: targetId },
        data: { approvalStatus: 'PENDING_REVIEW' }
      });
    } else if (type === 'playlist') {
      const playlist = await prisma.playlist.findFirst({
        where: { id: targetId, organizationId: orgId }
      });
      if (!playlist) return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
      targetName = playlist.name;

      await prisma.playlist.update({
        where: { id: targetId },
        data: { approvalStatus: 'PENDING_REVIEW' }
      });
    }

    const approval = await prisma.approvalRequest.create({
      data: {
        type,
        targetId,
        targetName,
        thumbnailUrl,
        status: 'PENDING_REVIEW',
        submittedBy: userId,
        submitterName: userName,
        organizationId: orgId
      }
    });

    await logAudit('SUBMIT_APPROVAL', `Submitted ${type} "${targetName}" for approval`, session);

    return NextResponse.json({ success: true, approval });
  } catch (error) {
    console.error('Failed to submit approval request:', error);
    return NextResponse.json({ error: 'Failed to submit approval request' }, { status: 500 });
  }
}
