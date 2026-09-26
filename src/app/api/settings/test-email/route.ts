import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getOrgId } from '@/lib/tenant';
import { prisma } from '@/lib/prisma';
import { sendTestAlertEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const orgId = await getOrgId(session);
    const body = await req.json().catch(() => ({}));

    // Fetch org details
    const org = orgId ? await prisma.organization.findUnique({
      where: { id: orgId },
      select: { name: true, contactEmail: true }
    }) : null;

    let recipients: string[] = [];
    if (body.emails && Array.isArray(body.emails) && body.emails.length > 0) {
      recipients = body.emails;
    } else {
      // Read saved recipients for this org
      const savedRecipientSetting = orgId ? await prisma.systemSetting.findUnique({
        where: { key: `alertEmailRecipient:${orgId}` }
      }) : null;

      const raw = savedRecipientSetting?.value || (await prisma.systemSetting.findUnique({ where: { key: 'alertEmailRecipient' } }))?.value || org?.contactEmail || '';
      recipients = raw.split(',').map((e: string) => e.trim()).filter((e: string) => e && e.includes('@'));
    }

    if (recipients.length === 0) {
      return NextResponse.json({ 
        error: 'No valid recipient email addresses found. Please enter and save at least one email address first.' 
      }, { status: 400 });
    }

    const orgName = org?.name || 'Tropic Air Digital Signage';
    const emailResult = await sendTestAlertEmail({
      recipients,
      organizationName: orgName
    });

    if (!emailResult.success) {
      const errMsg = (emailResult as any).error || (emailResult as any).reason || 'Unknown error';
      return NextResponse.json({ 
        error: `Failed to dispatch test email: ${errMsg}` 
      }, { status: 500 });
    }

    await prisma.auditLog.create({
      data: {
        userId: (session.user as any)?.id,
        userName: (session.user as any)?.name || 'Admin',
        organizationId: orgId,
        action: 'TEST_EMAIL_ALERT',
        details: `Sent test alert email to ${recipients.join(', ')}`
      }
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      recipients,
      message: `Test email successfully dispatched to ${recipients.join(', ')}!`
    });
  } catch (error: any) {
    console.error('Test email route error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
