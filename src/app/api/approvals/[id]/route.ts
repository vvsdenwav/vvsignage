import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions, requireAdmin } from '@/lib/auth';
import { getOrgId } from '@/lib/tenant';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request, context: any) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!requireAdmin(session)) {
    return NextResponse.json({ error: 'Forbidden: Only admins can review approvals' }, { status: 403 });
  }

  try {
    const orgId = await getOrgId(session);
    const params = await context.params;
    const { id } = params;
    const body = await request.json();
    const { action, note } = body; // action: 'approve' | 'reject'

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json({ error: 'Action must be approve or reject' }, { status: 400 });
    }

    const approval = await prisma.approvalRequest.findFirst({
      where: { id, organizationId: orgId }
    });

    if (!approval) {
      return NextResponse.json({ error: 'Approval request not found' }, { status: 404 });
    }

    const reviewerId = (session.user as any)?.id || 'admin';
    const reviewerName = (session.user as any)?.name || (session.user as any)?.username || 'Admin';
    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';

    // 1. Update the approval request
    const updatedApproval = await prisma.approvalRequest.update({
      where: { id },
      data: {
        status: newStatus,
        reviewedBy: reviewerId,
        reviewerName,
        reviewNote: note || null,
        reviewedAt: new Date()
      }
    });

    // 2. Update the target resource
    if (approval.type === 'media') {
      await prisma.mediaAsset.updateMany({
        where: { id: approval.targetId, organizationId: orgId },
        data: { approvalStatus: newStatus }
      });
    } else if (approval.type === 'playlist') {
      await prisma.playlist.updateMany({
        where: { id: approval.targetId, organizationId: orgId },
        data: { approvalStatus: newStatus }
      });
    }

    await logAudit(
      action === 'approve' ? 'APPROVE_CONTENT' : 'REJECT_CONTENT',
      `${action === 'approve' ? 'Approved' : 'Rejected'} ${approval.type} "${approval.targetName}"${note ? ` with note: ${note}` : ''}`,
      session
    );

    return NextResponse.json({ success: true, approval: updatedApproval });
  } catch (error) {
    console.error('Failed to review approval:', error);
    return NextResponse.json({ error: 'Failed to review approval' }, { status: 500 });
  }
}
