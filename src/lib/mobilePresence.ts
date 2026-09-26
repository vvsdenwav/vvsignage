export interface MobileSession {
  sessionId: string;
  userId?: string;
  userName: string;
  orgId?: string;
  screenId?: string;
  screenName?: string;
  deviceType: 'Mobile Remote' | 'QR Web Remote' | string;
  lastPingAt: number;
  ipAddress?: string;
  userAgent?: string;
}

const globalForMobilePresence = globalThis as unknown as {
  activeMobileSessions: Map<string, MobileSession> | undefined;
};

const activeMobileSessions = globalForMobilePresence.activeMobileSessions ?? new Map<string, MobileSession>();
if (process.env.NODE_ENV !== "production") {
  globalForMobilePresence.activeMobileSessions = activeMobileSessions;
}

const TIMEOUT_MS = 75 * 1000; // 75 seconds timeout for active mobile session

export function touchMobilePresence(session: Omit<MobileSession, 'lastPingAt'>): MobileSession {
  const now = Date.now();
  const entry: MobileSession = {
    ...session,
    lastPingAt: now
  };
  activeMobileSessions.set(session.sessionId, entry);
  pruneExpiredMobileSessions();
  return entry;
}

export function removeMobilePresence(sessionId: string) {
  activeMobileSessions.delete(sessionId);
}

export function pruneExpiredMobileSessions() {
  const now = Date.now();
  for (const [key, session] of activeMobileSessions.entries()) {
    if (now - session.lastPingAt > TIMEOUT_MS) {
      activeMobileSessions.delete(key);
    }
  }
}

export function getActiveMobileSessions(orgId?: string): MobileSession[] {
  pruneExpiredMobileSessions();
  const sessions = Array.from(activeMobileSessions.values());
  if (!orgId) return sessions;
  return sessions.filter(s => !s.orgId || s.orgId === orgId);
}
