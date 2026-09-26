"use client";

import React, { useState } from "react";
import { 
  MonitorPlay, 
  Wifi, 
  RotateCw, 
  QrCode, 
  Plus, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle,
  Radio,
  Clock,
  Layers
} from "lucide-react";
import { ScreenQrBadgeModal } from "../ScreenQrBadgeModal";

interface MobileScreensTabProps {
  screens: any[];
  playlists: any[];
  fetchScreens: () => void;
  handleAssignPlaylist: (screenId: string, playlistId: string) => void;
  handleTestConnection: (screenId: string) => void;
}

export function MobileScreensTab({
  screens,
  playlists,
  fetchScreens,
  handleAssignPlaylist,
  handleTestConnection
}: MobileScreensTabProps) {
  const [qrModalScreen, setQrModalScreen] = useState<{ id: string; name: string } | null>(null);
  const [showPairModal, setShowPairModal] = useState(false);
  const [pairName, setPairName] = useState("");
  const [pairCode, setPairCode] = useState("");
  const [isPairing, setIsPairing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handlePairScreen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pairName.trim() && !pairCode.trim()) return;

    setIsPairing(true);
    try {
      const endpoint = pairCode ? "/api/screens/pair" : "/api/screens";
      const body = pairCode ? { name: pairName, code: pairCode } : { name: pairName };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        setShowPairModal(false);
        setPairName("");
        setPairCode("");
        fetchScreens();
        setToastMessage("Screen paired successfully!");
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to pair screen.");
      }
    } catch (e) {
      alert("Error pairing screen.");
    } finally {
      setIsPairing(false);
    }
  };

  const isScreenOnline = (screen: any) => {
    if (!screen.lastSeenAt) return false;
    return Date.now() - new Date(screen.lastSeenAt).getTime() < 60000;
  };

  const onlineCount = screens.filter(isScreenOnline).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "16px" }}>
      
      {/* ─── Header & Add Screen Bar ─── */}
      <div className="glass-panel" style={{ padding: "14px 16px", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>Network Status</span>
          <span style={{ fontSize: "16px", fontWeight: "800", color: "var(--foreground)" }}>
            {onlineCount} / {screens.length} Screens Online
          </span>
        </div>

        <button
          onClick={() => setShowPairModal(true)}
          className="btn-primary"
          style={{ height: "40px", padding: "0 14px", fontSize: "13px", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}
        >
          <Plus size={16} /> Add / Pair Screen
        </button>
      </div>

      {/* ─── Notification Toast ─── */}
      {toastMessage && (
        <div style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(16, 185, 129, 0.95)", color: "#FFFFFF", fontSize: "13px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px", boxShadow: "var(--shadow-md)" }}>
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─── Screen Cards List ─── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {screens.map((screen) => {
          const online = isScreenOnline(screen);

          return (
            <div
              key={screen.id}
              className="glass-panel"
              style={{
                borderRadius: "14px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                borderLeft: `4px solid ${online ? "#10B981" : "var(--border)"}`
              }}
            >
              {/* Screen Title & Online Badge */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <MonitorPlay size={18} style={{ color: online ? "#10B981" : "var(--brand-primary)" }} />
                  <div>
                    <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "800", color: "var(--foreground)" }}>
                      {screen.name}
                    </h4>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{screen.location || "Default Location"}</span>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "700",
                    padding: "3px 8px",
                    borderRadius: "12px",
                    background: online ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                    color: online ? "#059669" : "#DC2626",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                >
                  <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: online ? "#10B981" : "#EF4444" }} />
                  {online ? "Online" : "Offline"}
                </span>
              </div>

              {/* Playlist Switcher Dropdown */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>
                  Assigned Playlist
                </label>
                <select
                  value={screen.playlistId || ""}
                  onChange={(e) => handleAssignPlaylist(screen.id, e.target.value)}
                  className="input-field"
                  style={{ height: "40px", fontSize: "13px", fontWeight: "600" }}
                >
                  <option value="">-- No Playlist (Black Screen) --</option>
                  {playlists.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Action Buttons Row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", paddingTop: "4px" }}>
                <button
                  onClick={() => setQrModalScreen({ id: screen.id, name: screen.name })}
                  className="btn-secondary"
                  style={{ height: "38px", fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", color: "var(--brand-primary)" }}
                >
                  <QrCode size={15} /> QR Badge & Remote
                </button>

                <button
                  onClick={() => window.open(`/player/${screen.id}?testMode=true`, "_blank")}
                  className="btn-secondary"
                  style={{ height: "38px", fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                >
                  <ExternalLink size={14} /> Live View
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Pair Screen Modal ─── */}
      {showPairModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div className="glass-panel" style={{ width: "100%", maxWidth: "440px", background: "var(--card-bg)", borderRadius: "16px", padding: "20px", display: "flex", flexDirection: "column", gap: "14px", boxShadow: "var(--shadow-lg)" }}>
            <h3 style={{ margin: 0, fontSize: "17px", fontWeight: "800", color: "var(--foreground)" }}>
              Pair New TV Screen
            </h3>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>
              Enter the 6-digit pairing code shown on your TV screen.
            </p>

            <form onSubmit={handlePairScreen} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label className="form-label">Screen Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lobby Entrance TV"
                  value={pairName}
                  onChange={(e) => setPairName(e.target.value)}
                  className="input-field"
                  style={{ height: "42px" }}
                />
              </div>

              <div>
                <label className="form-label">6-Digit TV Pairing Code</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="e.g. 123456"
                  value={pairCode}
                  onChange={(e) => setPairCode(e.target.value.toUpperCase())}
                  className="input-field"
                  style={{ height: "42px", fontSize: "18px", letterSpacing: "4px", textAlign: "center", fontWeight: "bold" }}
                />
              </div>

              <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                <button type="button" onClick={() => setShowPairModal(false)} className="btn-secondary" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" disabled={isPairing} className="btn-primary" style={{ flex: 1.5, fontWeight: "800" }}>
                  {isPairing ? "Pairing..." : "Connect Screen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── QR Badge Modal ─── */}
      {qrModalScreen && (
        <ScreenQrBadgeModal
          screenId={qrModalScreen.id}
          screenName={qrModalScreen.name}
          onClose={() => setQrModalScreen(null)}
        />
      )}
    </div>
  );
}
