import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Redirect /dashboard to /
    if (path.startsWith("/dashboard")) {
      return NextResponse.redirect(new URL("/", req.nextUrl.origin || "http://localhost:3000"));
    }

    // Block access if organization is suspended
    if (token && (token as any).orgStatus === 'SUSPENDED') {
      if (path !== "/suspended" && !path.startsWith("/api/tv-ping") && !path.startsWith("/api/tv-auth") && !path.startsWith("/api/apk") && !path.startsWith("/api/tv-devices") && !path.startsWith("/api/screens") && !path.startsWith("/api/analytics")) {
        return NextResponse.redirect(new URL("/suspended", req.nextUrl.origin || "http://localhost:3000"));
      }
    }

    // Protect root CMS workspace
    if (path === "/") {
      if (!token) {
        return NextResponse.redirect(new URL("/login", req.nextUrl.origin || "http://localhost:3000"));
      }
      if ((token as any).role === 'SUPER_ADMIN') {
        const isImpersonating = req.cookies.has('impersonate-org-id');
        if (!isImpersonating) {
          return NextResponse.redirect(new URL("/super-admin", req.nextUrl.origin || "http://localhost:3000"));
        }
      }
    }
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const path = req.nextUrl.pathname;

        // Allow NextAuth endpoints
        if (path.startsWith("/api/auth")) return true;

        // Public endpoints for TV/tablet devices and background cron jobs.
        // Keep this list as narrow as possible — route handlers enforce their
        // own auth, but middleware is the first line of defence.
        const isPublicDeviceOrTelemetryRoute =
          // TV & tablet device auth + heartbeat & provisioning
          path.startsWith("/api/device-config") ||
          path.startsWith("/api/tv-ping") ||
          path.startsWith("/api/tv-auth") ||
          path.startsWith("/api/tv-devices") ||
          path.startsWith("/api/tablet-buttons") ||
          // APK Setup & Provisioning Wizard
          path.startsWith("/api/apk") ||
          // Screen config fetch (JWT-protected at route level)
          path.startsWith("/api/screens") ||
          // Widgets used by TV player
          path.startsWith("/api/weather") ||
          path.startsWith("/api/rss") ||
          // Analytics from TV player (JWT-protected at route level)
          path.startsWith("/api/analytics") ||
          // Automated cron jobs (CRON_SECRET protected at route level)
          path.startsWith("/api/cron") ||
          // Media downloads for TV player
          path.startsWith("/api/downloads") ||
          // Public QR code tracking redirect endpoints
          path.startsWith("/api/go") ||
          // Vercel Blob webhooks (must bypass middleware since they come from Vercel, auth is handled in route.ts)
          path.startsWith("/api/media/upload");
          // NOTE: /api/playlists is intentionally NOT public — it requires
          // a valid CMS session token.

        if (isPublicDeviceOrTelemetryRoute) return true;

        // All other routes require NextAuth session token
        return !!token;
      },
    },
    secret: process.env.NEXTAUTH_SECRET || "dev-secret-key-32-chars-long-12345",
  }
);

export const config = {
  matcher: ["/", "/dashboard/:path*", "/api/:path*"],
};
