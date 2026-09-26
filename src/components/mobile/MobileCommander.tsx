"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Zap, 
  Folder, 
  MonitorPlay, 
  Settings, 
  LogOut, 
  Monitor, 
  ShieldCheck, 
  Sparkles,
  ChevronRight,
  User,
  Layers,
  LayoutDashboard
} from "lucide-react";
import { signOut } from "next-auth/react";
import { MobileRemoteTab } from "./MobileRemoteTab";
import { MobileMediaTab } from "./MobileMediaTab";
import { MobileScreensTab } from "./MobileScreensTab";

interface MobileCommanderProps {
  session: any;
  stats: any;
  screens: any[];
  mediaAssets: any[];
  folders: any[];
  playlists: any[];
  fetchScreens: () => void;
  fetchMedia: () => Promise<void>;
  fetchFolders: () => Promise<void>;
  handleAssignPlaylist: (screenId: string, playlistId: string) => void;
  handleTestConnection: (screenId: string) => void;
  onSwitchToDesktop?: () => void;
}

export function MobileCommander({
  session,
  stats,
  screens,
  mediaAssets,
  folders,
  playlists,
  fetchScreens,
  fetchMedia,
  fetchFolders,
  handleAssignPlaylist,
  handleTestConnection
}: MobileCommanderProps) {
  const [activeTab, setActiveTab] = useState<"remote" | "media" | "screens" | "settings">("remote");

  const userName = session?.user?.name || "Admin User";
  const userRole = (session?.user as any)?.role || "AGENT";

  // Stable Mobile Presence Heartbeat
  const sessionIdRef = useRef<string>("");
  if (!sessionIdRef.current) {
    sessionIdRef.current = "mob_" + Math.random().toString(36).substring(2, 9);
  }

  useEffect(() => {
    const sessionId = sessionIdRef.current;
    const userName = session?.user?.name || "Mobile Staff";

    const sendPing = async () => {
      try {
        await fetch("/api/presence/mobile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            deviceType: "Mobile Remote",
            userName
          })
        });
      } catch (_) {}
    };

    sendPing();
    const interval = setInterval(sendPing, 12000); // Heartbeat every 12s

    const handleUnload = () => {
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          "/api/presence/mobile",
          JSON.stringify({ sessionId, action: "disconnect" })
        );
      }
    };

    window.addEventListener("pagehide", handleUnload);
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener("pagehide", handleUnload);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [session?.user?.name]);

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", width: "100vw", backgroundColor: "var(--background)", color: "var(--foreground)" }}>
      
      {/* ─── Sticky Mobile Top Header ─── */}
      <header style={{ height: "60px", background: "var(--card-bg)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", position: "sticky", top: 0, zIndex: 40, boxShadow: "var(--shadow-sm)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img 
            src={stats?.brandingLogoUrl || "/logo.png"} 
            alt="Logo" 
            style={{ height: "30px", maxHeight: "30px", maxWidth: "120px", objectFit: "contain" }} 
          />
          <span style={{ fontSize: "11px", fontWeight: "800", background: "var(--brand-accent)", color: "var(--brand-primary)", padding: "2px 8px", borderRadius: "10px" }}>
            Mobile Remote
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ 
            fontSize: "11px", 
            fontWeight: "700", 
            padding: "4px 10px", 
            borderRadius: "12px", 
            background: "rgba(16, 185, 129, 0.1)", 
            color: "#059669", 
            display: "flex", 
            alignItems: "center", 
            gap: "5px",
            border: "1px solid rgba(16, 185, 129, 0.25)" 
          }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10B981" }} />
            <span>Online</span>
          </div>
        </div>
      </header>

      {/* ─── Main Content Scroll Area ─── */}
      <main style={{ flex: 1, overflowY: "auto", paddingBottom: "calc(74px + env(safe-area-inset-bottom))" }}>
        
        {activeTab === "remote" && (
          <MobileRemoteTab 
            screens={screens} 
            fetchScreens={fetchScreens} 
          />
        )}

        {activeTab === "media" && (
          <MobileMediaTab
            mediaAssets={mediaAssets}
            folders={folders}
            screens={screens}
            playlists={playlists}
            refreshMedia={fetchMedia}
            refreshFolders={fetchFolders}
            stats={stats}
          />
        )}

        {activeTab === "screens" && (
          <MobileScreensTab
            screens={screens}
            playlists={playlists}
            fetchScreens={fetchScreens}
            handleAssignPlaylist={handleAssignPlaylist}
            handleTestConnection={handleTestConnection}
          />
        )}

        {activeTab === "settings" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "16px" }}>
            
            {/* User Profile Card */}
            <div className="glass-panel" style={{ padding: "20px", borderRadius: "14px", display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--brand-primary)", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: "800" }}>
                {userName[0].toUpperCase()}
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "16px", fontWeight: "800", color: "var(--foreground)" }}>{userName}</span>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Role: {userRole}</span>
              </div>
            </div>

            {/* Quick Links & Sign Out */}
            <div className="glass-panel" style={{ padding: "16px", borderRadius: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                style={{
                  width: "100%",
                  height: "46px",
                  borderRadius: "8px",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  background: "rgba(239, 68, 68, 0.08)",
                  color: "#EF4444",
                  fontSize: "14px",
                  fontWeight: "800",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                }}
              >
                <LogOut size={16} /> Sign Out of Account
              </button>
            </div>

          </div>
        )}
      </main>

      {/* ─── Fixed Mobile Bottom Tab Navigation Bar ─── */}
      <nav style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "64px",
        paddingBottom: "env(safe-area-inset-bottom)",
        background: "var(--card-bg)",
        borderTop: "1px solid var(--border)",
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        alignItems: "center",
        zIndex: 50,
        boxShadow: "0 -4px 12px rgba(0, 0, 0, 0.05)"
      }}>
        
        {/* Remote / Overrides Tab */}
        <button
          onClick={() => setActiveTab("remote")}
          style={{
            background: "transparent",
            border: "none",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
            color: activeTab === "remote" ? "var(--brand-primary)" : "var(--text-muted)",
            cursor: "pointer"
          }}
        >
          <Zap size={20} strokeWidth={activeTab === "remote" ? 2.5 : 2} />
          <span style={{ fontSize: "11px", fontWeight: activeTab === "remote" ? "800" : "500" }}>Remote</span>
        </button>

        {/* Media Tab */}
        <button
          onClick={() => setActiveTab("media")}
          style={{
            background: "transparent",
            border: "none",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
            color: activeTab === "media" ? "var(--brand-primary)" : "var(--text-muted)",
            cursor: "pointer"
          }}
        >
          <Folder size={20} strokeWidth={activeTab === "media" ? 2.5 : 2} />
          <span style={{ fontSize: "11px", fontWeight: activeTab === "media" ? "800" : "500" }}>Media</span>
        </button>

        {/* Screens Tab */}
        <button
          onClick={() => setActiveTab("screens")}
          style={{
            background: "transparent",
            border: "none",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
            color: activeTab === "screens" ? "var(--brand-primary)" : "var(--text-muted)",
            cursor: "pointer"
          }}
        >
          <MonitorPlay size={20} strokeWidth={activeTab === "screens" ? 2.5 : 2} />
          <span style={{ fontSize: "11px", fontWeight: activeTab === "screens" ? "800" : "500" }}>Screens</span>
        </button>

        {/* Settings Tab */}
        <button
          onClick={() => setActiveTab("settings")}
          style={{
            background: "transparent",
            border: "none",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
            color: activeTab === "settings" ? "var(--brand-primary)" : "var(--text-muted)",
            cursor: "pointer"
          }}
        >
          <Settings size={20} strokeWidth={activeTab === "settings" ? 2.5 : 2} />
          <span style={{ fontSize: "11px", fontWeight: activeTab === "settings" ? "800" : "500" }}>Settings</span>
        </button>

      </nav>
    </div>
  );
}
