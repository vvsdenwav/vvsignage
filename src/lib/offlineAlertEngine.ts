import { prisma } from '@/lib/prisma';
import { sendOfflineAlertEmail, sendRecoveryAlertEmail } from './email';

const globalForOfflineEngine = globalThis as unknown as {
  activeOfflineIncidents: Map<string, { offlineSince: number; alertSentAt: number; durationMinutes: number }> | undefined;
};

// In-memory tracker for active offline incidents across screens
const activeOfflineIncidents = globalForOfflineEngine.activeOfflineIncidents ?? new Map<string, { offlineSince: number; alertSentAt: number; durationMinutes: number }>();
if (process.env.NODE_ENV !== 'production') globalForOfflineEngine.activeOfflineIncidents = activeOfflineIncidents;

/**
 * Check all screens (or screens within a specific organization) and dispatch offline/recovery email alerts.
 */
export async function checkAndDispatchOfflineAlerts(specificOrgId?: string) {
  const now = Date.now();
  let checkedCount = 0;
  let offlineCount = 0;
  let alertsSent = 0;
  let recoveredCount = 0;

  try {
    // 1. Fetch screens
    const screens = await prisma.screen.findMany({
      where: specificOrgId ? { organizationId: specificOrgId } : {},
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            contactEmail: true
          }
        }
      }
    });

    checkedCount = screens.length;
    if (screens.length === 0) {
      return { success: true, checkedCount: 0, offlineCount: 0, alertsSent: 0, recoveredCount: 0 };
    }

    // 2. Fetch all system settings to extract per-organization alert settings
    const settings = await prisma.systemSetting.findMany();
    const settingsMap = new Map<string, string>();
    for (const s of settings) {
      settingsMap.set(s.key, s.value);
    }

    for (const screen of screens) {
      const orgId = screen.organizationId;
      const orgName = screen.organization?.name || 'Tropic Air Digital Signage';

      // Read org-specific settings (fallback to global settings)
      const alertsEnabledVal = (orgId && settingsMap.get(`alertsEnabled:${orgId}`)) ?? settingsMap.get('alertsEnabled') ?? 'true';
      const isAlertsEnabled = alertsEnabledVal === 'true' || alertsEnabledVal === '1';

      const emailRecipientRaw = (orgId && settingsMap.get(`alertEmailRecipient:${orgId}`)) ?? settingsMap.get('alertEmailRecipient') ?? screen.organization?.contactEmail ?? '';
      const delayMinutesRaw = (orgId && settingsMap.get(`offlineDelayMinutes:${orgId}`)) ?? settingsMap.get('offlineDelayMinutes') ?? '3';
      const delayMinutes = Math.max(1, parseInt(delayMinutesRaw, 10) || 3);
      const thresholdMs = delayMinutes * 60 * 1000;

      const recipients = String(emailRecipientRaw || '')
        .split(',')
        .map((e: string) => e.trim())
        .filter((e: string) => Boolean(e && e.includes('@')));

      const lastSeenTime = screen.lastSeenAt ? new Date(screen.lastSeenAt).getTime() : 0;
      const timeSinceHeartbeat = now - lastSeenTime;
      const isOffline = lastSeenTime === 0 || timeSinceHeartbeat > thresholdMs;

      const incident = activeOfflineIncidents.get(screen.id);

      if (isOffline) {
        offlineCount++;
        const elapsedMinutes = Math.max(delayMinutes, Math.round(timeSinceHeartbeat / 60000));

        // Update database screen status to offline if not already marked
        if (screen.status !== 'offline') {
          await prisma.screen.update({
            where: { id: screen.id },
            data: { status: 'offline' }
          }).catch(() => {});

          await prisma.screenUptimeLog.create({
            data: { screenId: screen.id, status: 'offline', timestamp: new Date() }
          }).catch(() => {});
        }

        // Check if we already alerted for this incident
        if (!incident && isAlertsEnabled && recipients.length > 0) {
          // Send offline alert email
          const emailRes = await sendOfflineAlertEmail({
            screenName: screen.name,
            screenId: screen.id,
            location: screen.location,
            lastSeenAt: screen.lastSeenAt,
            offlineDurationMinutes: elapsedMinutes,
            organizationName: orgName,
            recipients
          });

          if (emailRes.success) {
            alertsSent++;
            activeOfflineIncidents.set(screen.id, {
              offlineSince: lastSeenTime || now,
              alertSentAt: now,
              durationMinutes: elapsedMinutes
            });

            await prisma.auditLog.create({
              data: {
                organizationId: orgId,
                userName: 'System Alert Engine',
                action: 'OFFLINE_EMAIL_ALERT',
                details: `Dispatched offline alert email for "${screen.name}" (${screen.location || 'No Location'}) to ${recipients.join(', ')}`
              }
            }).catch(() => {});
          }
        }
      } else {
        // Screen is ONLINE
        // If an incident was active and alerted, send recovery notification!
        if (incident && isAlertsEnabled && recipients.length > 0) {
          const totalDowntime = Math.max(1, Math.round((now - incident.offlineSince) / 60000));
          await sendRecoveryAlertEmail({
            screenName: screen.name,
            screenId: screen.id,
            location: screen.location,
            recoveredAt: new Date(),
            totalDowntimeMinutes: totalDowntime,
            organizationName: orgName,
            recipients
          });

          recoveredCount++;
          activeOfflineIncidents.delete(screen.id);

          await prisma.auditLog.create({
            data: {
              organizationId: orgId,
              userName: 'System Alert Engine',
              action: 'RECOVERY_EMAIL_ALERT',
              details: `Dispatched recovery alert email for "${screen.name}" (Back online after ${totalDowntime} mins) to ${recipients.join(', ')}`
            }
          }).catch(() => {});
        } else if (incident) {
          activeOfflineIncidents.delete(screen.id);
        }
      }
    }

    return {
      success: true,
      checkedCount,
      offlineCount,
      alertsSent,
      recoveredCount
    };
  } catch (error: any) {
    console.error('[OFFLINE ALERT ENGINE ERROR]', error);
    return {
      success: false,
      error: error.message,
      checkedCount,
      offlineCount,
      alertsSent,
      recoveredCount
    };
  }
}
