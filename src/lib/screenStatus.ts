import { prisma } from "@/lib/prisma";

const globalForScreenStatus = globalThis as unknown as {
  screenLastSeenCache: Map<string, number> | undefined;
};

const screenLastSeenCache = globalForScreenStatus.screenLastSeenCache ?? new Map<string, number>();
if (process.env.NODE_ENV !== "production") globalForScreenStatus.screenLastSeenCache = screenLastSeenCache;

const THROTTLE_MS = 60 * 1000; // Throttle DB updates to once per 60 seconds per screen

export async function touchScreenLastSeen(screenId: string, force: boolean = false) {
  if (!screenId) return;

  const now = Date.now();
  const lastUpdated = screenLastSeenCache.get(screenId) || 0;

  if (force || now - lastUpdated >= THROTTLE_MS) {
    screenLastSeenCache.set(screenId, now);
    try {
      const screen = await prisma.screen.findUnique({ where: { id: screenId }, select: { status: true } });
      const wasOffline = screen?.status !== "online";

      await prisma.screen.update({
        where: { id: screenId },
        data: { lastSeenAt: new Date(), status: "online" },
      });

      if (wasOffline) {
        await prisma.screenUptimeLog.create({
          data: { screenId, status: "online", timestamp: new Date() }
        });
      }
    } catch {
      // Ignore update errors (e.g. if screen was deleted)
    }
  }
}

export async function markScreenOffline(screenId: string) {
  if (!screenId) return;
  screenLastSeenCache.delete(screenId);
  try {
    const screen = await prisma.screen.findUnique({ where: { id: screenId }, select: { status: true } });
    const wasOnline = screen?.status === "online";

    await prisma.screen.update({
      where: { id: screenId },
      data: { status: "offline" },
    });

    if (wasOnline) {
      await prisma.screenUptimeLog.create({
        data: { screenId, status: "offline", timestamp: new Date() }
      });
    }
  } catch {
    // Ignore
  }
}
