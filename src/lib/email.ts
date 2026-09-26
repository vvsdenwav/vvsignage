import nodemailer from 'nodemailer';

export interface OfflineAlertPayload {
  screenName: string;
  screenId: string;
  location?: string | null;
  lastSeenAt: Date | string | null;
  offlineDurationMinutes: number;
  organizationName?: string;
  recipients: string[];
}

export interface RecoveryAlertPayload {
  screenName: string;
  screenId: string;
  location?: string | null;
  recoveredAt: Date | string;
  totalDowntimeMinutes: number;
  organizationName?: string;
  recipients: string[];
}

export interface TestAlertPayload {
  recipients: string[];
  organizationName?: string;
}

import { prisma } from './prisma';

/**
 * Resolves mail configuration from environment variables or database SystemSetting.
 */
async function resolveMailConfig() {
  let host = process.env.SMTP_HOST;
  let port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  let user = process.env.SMTP_USER;
  let pass = process.env.SMTP_PASS;
  let from = process.env.SMTP_FROM;
  let resendApiKey = process.env.RESEND_API_KEY;

  // If env vars are not set, check system settings in database as fallback
  if ((!user || !pass) && !resendApiKey) {
    try {
      const settings = await prisma.systemSetting.findMany();
      const map = new Map<string, string>();
      settings.forEach((s: any) => map.set(s.key, s.value));

      if (map.get('resendApiKey')) resendApiKey = map.get('resendApiKey');
      if (map.get('smtpHost')) host = map.get('smtpHost');
      if (map.get('smtpPort')) port = parseInt(map.get('smtpPort') || '587', 10);
      if (map.get('smtpUser')) user = map.get('smtpUser');
      if (map.get('smtpPass')) pass = map.get('smtpPass');
      if (map.get('smtpFrom')) from = map.get('smtpFrom');
    } catch {
      // Ignore DB read errors
    }
  }

  const sender = from || (user ? `Tropic Air Digital Signage <${user}>` : `Tropic Air Digital Signage <alerts@tropicair.com>`);

  return {
    host: host || 'smtp.gmail.com',
    port: port || 587,
    user: user || '',
    pass: pass || '',
    secure: port === 465 || process.env.SMTP_SECURE === 'true',
    from: sender,
    resendApiKey
  };
}

/**
 * Dispatches an email using either Resend API or Nodemailer SMTP.
 */
async function dispatchEmail(options: { to: string[]; subject: string; text: string; html: string }) {
  const config = await resolveMailConfig();

  // 1. Resend API
  if (config.resendApiKey) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: config.from.includes('<') ? config.from : `Tropic Air Signage <${config.from}>`,
          to: options.to,
          subject: options.subject,
          text: options.text,
          html: options.html
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || `Resend error (${res.status})`);
      }
      return { success: true, messageId: data.id };
    } catch (err: any) {
      console.error('[RESEND ERROR]', err);
      return { success: false, error: `Resend API Error: ${err.message}` };
    }
  }

  // 2. SMTP Transport
  if (config.user && config.pass) {
    try {
      const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.user,
          pass: config.pass
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      const info = await transporter.sendMail({
        from: config.from,
        to: options.to.join(', '),
        subject: options.subject,
        text: options.text,
        html: options.html
      });

      return { success: true, messageId: info.messageId };
    } catch (err: any) {
      console.error('[SMTP ERROR]', err);
      return { success: false, error: `SMTP Delivery Failed: ${err.message}` };
    }
  }

  // 3. No credentials configured
  console.warn('[EMAIL NOT CONFIGURED] No SMTP credentials (SMTP_USER/SMTP_PASS) or RESEND_API_KEY configured.');
  return { 
    success: false, 
    error: 'Outgoing mail server is not yet configured. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS (or RESEND_API_KEY) in your server environment.' 
  };
}

function formatTimestamp(date: Date | string | null): string {
  if (!date) return 'Unknown (No recent heartbeat)';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return 'Unknown';
  return d.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  });
}

function formatDuration(minutes: number): string {
  if (minutes < 1) return 'Less than 1 minute';
  if (minutes === 1) return '1 minute';
  if (minutes < 60) return `${Math.round(minutes)} minutes`;
  const hours = Math.floor(minutes / 60);
  const remainingMins = Math.round(minutes % 60);
  if (remainingMins === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  return `${hours} hr ${remainingMins} min`;
}

/**
 * Send an Offline Screen Alert Email to configured recipients.
 */
export async function sendOfflineAlertEmail(payload: OfflineAlertPayload) {
  const { screenName, screenId, location, lastSeenAt, offlineDurationMinutes, organizationName, recipients } = payload;
  if (!recipients || recipients.length === 0) return { success: false, reason: 'No recipients provided' };

  const appUrl = process.env.NEXTAUTH_URL || 'https://signage.tropicair.com';
  const lastSeenStr = formatTimestamp(lastSeenAt);
  const durationStr = formatDuration(offlineDurationMinutes);
  const alertTimeStr = formatTimestamp(new Date());
  const orgStr = organizationName || 'Digital Signage Network';
  const locationStr = location || 'Unassigned Location';

  const subject = `🚨 [ALERT] TV Screen Offline: ${screenName} (${locationStr})`;

  const textContent = `
🚨 DIGITAL SIGNAGE OFFLINE ALERT

A TV screen in your signage network has disconnected and gone offline.

SCREEN DETAILS:
- Screen Name: ${screenName}
- Screen ID: ${screenId}
- Physical Location: ${locationStr}
- Organization: ${orgStr}
- Disconnected Since: ${lastSeenStr}
- Offline Duration: ${durationStr}
- Alert Dispatched At: ${alertTimeStr}

TROUBLESHOOTING CHECKLIST:
1. Verify the TV display and media player / Firestick are plugged in and powered on.
2. Check the Wi-Fi or Ethernet connection at the physical screen location.
3. Verify the Tropic Air Signage Player application is open and running on the TV.

CMS Screen Manager Link:
${appUrl}

--
Tropic Air Digital Signage Automated Alert System
  `.trim();

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;" cellspacing="0" cellpadding="0">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%); padding: 24px 28px; text-align: left; border-bottom: 3px solid #ef4444;">
              <table width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="display: inline-block; background-color: rgba(239, 68, 68, 0.2); border: 1px solid #ef4444; border-radius: 20px; padding: 4px 12px; margin-bottom: 8px;">
                      <span style="color: #fca5a5; font-size: 11px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;">
                        🔴 Screen Offline Detected
                      </span>
                    </div>
                    <h1 style="color: #ffffff; font-size: 20px; font-weight: 800; margin: 0; letter-spacing: -0.02em;">
                      ${screenName}
                    </h1>
                    <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0 0;">
                      ${orgStr} &bull; ${locationStr}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Alert Body -->
          <tr>
            <td style="padding: 24px 28px;">
              <p style="font-size: 14px; line-height: 1.6; margin: 0 0 18px 0; color: #334155;">
                This is an automated notification that the display screen <strong>${screenName}</strong> has lost connection with the signage server and stopped reporting heartbeats.
              </p>

              <!-- Details Table Card -->
              <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; width: 40%; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Current Status</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 800; color: #ef4444;">
                    🔴 OFFLINE
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Offline Duration</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 700; color: #0f172a;">
                    ${durationStr}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Last Seen Online</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #334155;">
                    ${lastSeenStr}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Location</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #334155;">
                    📍 ${locationStr}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Screen ID</td>
                  <td style="padding: 12px 16px; font-size: 12px; font-family: monospace; color: #64748b;">
                    ${screenId}
                  </td>
                </tr>
              </table>

              <!-- Troubleshooting Advice -->
              <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px;">
                <h4 style="margin: 0 0 8px 0; font-size: 13px; font-weight: 800; color: #92400e; text-transform: uppercase; letter-spacing: 0.03em;">
                  ⚡ Recommended Actions:
                </h4>
                <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #78350f; line-height: 1.6;">
                  <li>Verify that the physical TV screen and media box / Firestick have power.</li>
                  <li>Check that the Wi-Fi or Ethernet network at this screen location is functioning.</li>
                  <li>Ensure the Tropic Air Signage Player application has not been closed or switched to another TV input.</li>
                </ul>
              </div>

              <!-- Action Button -->
              <div style="text-align: center; margin: 24px 0 10px 0;">
                <a href="${appUrl}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 12px 28px; border-radius: 8px; box-shadow: 0 2px 6px rgba(37, 99, 235, 0.3);">
                  Open Signage CMS Dashboard &rarr;
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 16px 28px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8;">
              <p style="margin: 0 0 4px 0;">
                Alert dispatched at ${alertTimeStr} by Tropic Air Digital Signage Alert System.
              </p>
              <p style="margin: 0;">
                You received this email because your address is listed on the notification recipient list for <strong>${orgStr}</strong>.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return dispatchEmail({
    to: recipients,
    subject,
    text: textContent,
    html: htmlContent
  });
}

/**
 * Send a Screen Recovery / Back Online Alert Email to configured recipients.
 */
export async function sendRecoveryAlertEmail(payload: RecoveryAlertPayload) {
  const { screenName, screenId, location, recoveredAt, totalDowntimeMinutes, organizationName, recipients } = payload;
  if (!recipients || recipients.length === 0) return { success: false, reason: 'No recipients provided' };

  const appUrl = process.env.NEXTAUTH_URL || 'https://signage.tropicair.com';
  const recoveredTimeStr = formatTimestamp(recoveredAt);
  const downtimeStr = formatDuration(totalDowntimeMinutes);
  const orgStr = organizationName || 'Digital Signage Network';
  const locationStr = location || 'Unassigned Location';

  const subject = `🟢 [RESOLVED] TV Screen Back Online: ${screenName} (${locationStr})`;

  const textContent = `
🟢 DIGITAL SIGNAGE SCREEN RECOVERED

The display screen ${screenName} is now back online and actively communicating with the signage server.

RECOVERY DETAILS:
- Screen Name: ${screenName}
- Screen ID: ${screenId}
- Location: ${locationStr}
- Organization: ${orgStr}
- Reconnected At: ${recoveredTimeStr}
- Total Outage Duration: ${downtimeStr}

CMS Screen Manager Link:
${appUrl}

--
Tropic Air Digital Signage Automated Alert System
  `.trim();

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;" cellspacing="0" cellpadding="0">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #065f46 0%, #022c22 100%); padding: 24px 28px; text-align: left; border-bottom: 3px solid #10b981;">
              <div style="display: inline-block; background-color: rgba(16, 185, 129, 0.2); border: 1px solid #10b981; border-radius: 20px; padding: 4px 12px; margin-bottom: 8px;">
                <span style="color: #6ee7b7; font-size: 11px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;">
                  🟢 Connection Restored
                </span>
              </div>
              <h1 style="color: #ffffff; font-size: 20px; font-weight: 800; margin: 0; letter-spacing: -0.02em;">
                ${screenName} is Back Online
              </h1>
              <p style="color: #a7f3d0; font-size: 13px; margin: 4px 0 0 0;">
                ${orgStr} &bull; ${locationStr}
              </p>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 24px 28px;">
              <p style="font-size: 14px; line-height: 1.6; margin: 0 0 18px 0; color: #334155;">
                Good news! Heartbeat pings from <strong>${screenName}</strong> have resumed and the player is now actively displaying playlist content.
              </p>

              <!-- Details Table Card -->
              <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; width: 40%; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Current Status</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 800; color: #10b981;">
                    🟢 ONLINE & ACTIVE
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Reconnected At</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #334155;">
                    ${recoveredTimeStr}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Total Outage Duration</td>
                  <td style="padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 700; color: #0f172a;">
                    ${downtimeStr}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Location</td>
                  <td style="padding: 12px 16px; font-size: 13px; color: #334155;">
                    📍 ${locationStr}
                  </td>
                </tr>
              </table>

              <!-- Action Button -->
              <div style="text-align: center; margin: 20px 0 10px 0;">
                <a href="${appUrl}" target="_blank" style="display: inline-block; background-color: #059669; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 12px 28px; border-radius: 8px; box-shadow: 0 2px 6px rgba(5, 150, 105, 0.3);">
                  View Live Screens &rarr;
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 16px 28px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8;">
              <p style="margin: 0;">
                Recovery alert dispatched automatically by Tropic Air Digital Signage Alert System.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return dispatchEmail({
    to: recipients,
    subject,
    text: textContent,
    html: htmlContent
  });
}

/**
 * Send a Test Alert Email to confirm recipient configuration.
 */
export async function sendTestAlertEmail(payload: TestAlertPayload) {
  const { recipients, organizationName } = payload;
  if (!recipients || recipients.length === 0) return { success: false, reason: 'No recipients provided' };

  const appUrl = process.env.NEXTAUTH_URL || 'https://signage.tropicair.com';
  const testTimeStr = formatTimestamp(new Date());
  const orgStr = organizationName || 'Digital Signage Network';

  const subject = `🧪 [TEST] Digital Signage Offline Alert Test`;

  const textContent = `
🧪 DIGITAL SIGNAGE ALERT SYSTEM TEST

This is a test notification confirming that your offline email alert recipient list is configured and operational.

DETAILS:
- Organization: ${orgStr}
- Recipients: ${recipients.join(', ')}
- Timestamp: ${testTimeStr}

If a display screen loses connection or goes offline in the future, you will receive an automatic alert with full screen details, downtime duration, and troubleshooting tips.

CMS Dashboard:
${appUrl}

--
Tropic Air Digital Signage Automated Alert System
  `.trim();

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08); border: 1px solid #e2e8f0;" cellspacing="0" cellpadding="0">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); padding: 24px 28px; text-align: left; border-bottom: 3px solid #3b82f6;">
              <div style="display: inline-block; background-color: rgba(59, 130, 246, 0.2); border: 1px solid #3b82f6; border-radius: 20px; padding: 4px 12px; margin-bottom: 8px;">
                <span style="color: #93c5fd; font-size: 11px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;">
                  🧪 Alert System Test
                </span>
              </div>
              <h1 style="color: #ffffff; font-size: 20px; font-weight: 800; margin: 0;">
                Offline Email Alert Test
              </h1>
              <p style="color: #bfdbfe; font-size: 13px; margin: 4px 0 0 0;">
                ${orgStr}
              </p>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 24px 28px;">
              <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 14px 16px; margin-bottom: 20px;">
                <p style="margin: 0; font-size: 14px; color: #1e40af; font-weight: 600; line-height: 1.5;">
                  ✅ Success! Your email address is configured to receive automated offline screen alerts.
                </p>
              </div>

              <p style="font-size: 13px; line-height: 1.6; margin: 0 0 16px 0; color: #475569;">
                When any TV screen loses internet connection or stops reporting heartbeats for longer than your configured threshold, you will immediately receive an alert email containing:
              </p>

              <ul style="font-size: 13px; color: #334155; line-height: 1.6; padding-left: 20px; margin: 0 0 20px 0;">
                <li>The exact name and physical / weather location of the offline screen.</li>
                <li>Accurate downtime timestamp and elapsed duration.</li>
                <li>Immediate actionable troubleshooting steps.</li>
                <li>A follow-up recovery email as soon as the TV reconnects.</li>
              </ul>

              <!-- Details Table Card -->
              <table width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; width: 35%; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Organization</td>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 700; color: #0f172a;">${orgStr}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Delivered To</td>
                  <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #334155;">${recipients.join(', ')}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 14px; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Test Time</td>
                  <td style="padding: 10px 14px; font-size: 13px; color: #334155;">${testTimeStr}</td>
                </tr>
              </table>

              <!-- Action Button -->
              <div style="text-align: center; margin: 20px 0 10px 0;">
                <a href="${appUrl}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 12px 28px; border-radius: 8px;">
                  Open CMS Dashboard &rarr;
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 16px 28px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8;">
              <p style="margin: 0;">
                Test message generated by Tropic Air Digital Signage Alert System at ${testTimeStr}.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  return dispatchEmail({
    to: recipients,
    subject,
    text: textContent,
    html: htmlContent
  });
}
