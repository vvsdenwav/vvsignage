import { prisma } from './prisma';

export async function logAudit(
  action: string, 
  details: string | null = null, 
  session: any = null,
  forcedOrgId: string | null = null
) {
  try {
    let userId = null;
    let userName = null;
    let organizationId = forcedOrgId || null;

    if (session?.user) {
      userId = (session.user as any).id || null;
      userName = session.user.name || session.user.username || null;
      if (!organizationId) {
        organizationId = (session.user as any).organizationId || null;
      }
    }

    await prisma.auditLog.create({
      data: {
        action,
        details,
        userId,
        userName,
        organizationId,
      },
    });
  } catch (error) {
    console.error('Failed to write audit log', error);
  }
}
