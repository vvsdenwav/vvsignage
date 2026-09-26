"use client";

import React, { useState, useEffect, use, useCallback, useRef } from "react";
import { 
  Sparkles, 
  XCircle, 
  Wifi, 
  WifiOff, 
  RotateCw, 
  MessageSquarePlus, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Monitor, 
  X, 
  ExternalLink,
  Zap,
  SlidersHorizontal,
  ChevronRight,
  Image as ImageIcon,
  Camera,
  UploadCloud,
  Link2,
  Trash2
} from "lucide-react";

interface RemotePageProps {
  params: Promise<{ token: string }>;
}

export default function QrRemotePage({ params }: RemotePageProps) {
  const { token } = use(params);

  const [screen, setScreen] = useState<any>(null);
  const [buttons, setButtons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Flash Announcement Modal
  const [showFlashModal, setShowFlashModal] = useState(false);
  const [flashTitle, setFlashTitle] = useState("");
  const [flashSubtitle, setFlashSubtitle] = useState("");
  const [flashImageUrl, setFlashImageUrl] = useState("");
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [flashDuration, setFlashDuration] = useState(60); // 60s default
  const [flashPreset, setFlashPreset] = useState<"urgent" | "warning" | "info" | "success" | "flight" | "dark">("urgent");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const FLASH_PRESETS = [
    { id: "urgent", label: "🚨 Urgent / Alert", bg: "#EF4444", text: "#FFFFFF" },
    { id: "warning", label: "⚠️ Notice / Delay", bg: "#D97706", text: "#FFFFFF" },
    { id: "info", label: "ℹ️ Info / Gate", bg: "#2563EB", text: "#FFFFFF" },
    { id: "success", label: "🟢 Boarding / Welcome", bg: "#059669", text: "#FFFFFF" },
    { id: "flight", label: "✈️ Flight Schedule", bg: "#2C4C7C", text: "#FFFFFF" },
    { id: "dark", label: "🌑 Dark Contrast", bg: "#1E293B", text: "#FFFFFF" },
  ];

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingImage(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1280;
        const MAX_HEIGHT = 720;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setFlashImageUrl(dataUrl);
        setIsProcessingImage(false);
      };
      img.onerror = () => setIsProcessingImage(false);
      img.src = event.target?.result as string;
    };
    reader.onerror = () => setIsProcessingImage(false);
    reader.readAsDataURL(file);
  };

  const fetchScreenData = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/remote/${token}`);
      if (res.ok) {
        const data = await res.json();
        setScreen(data.screen);
        setButtons(data.buttons || []);
        setErrorMessage(null);
      } else {
        const err = await res.json();
        setErrorMessage(err.error || "Invalid or revoked remote link.");
      }
    } catch (e) {
      setErrorMessage("Network error connecting to screen controller.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchScreenData();
    // Poll every 4 seconds to keep live override state up-to-date
    const interval = setInterval(fetchScreenData, 4000);
    return () => clearInterval(interval);
  }, [fetchScreenData]);

  // Stable Mobile Presence Ping for QR Remote
  const sessionIdRef = useRef<string>("");
  if (!sessionIdRef.current) {
    sessionIdRef.current = "qr_rem_" + Math.random().toString(36).substring(2, 9);
  }

  useEffect(() => {
    if (!token) return;
    const sessionId = sessionIdRef.current;

    const sendPresence = async () => {
      try {
        await fetch("/api/presence/mobile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            deviceType: "QR Web Remote",
            screenId: screen?.id,
            screenName: screen?.name,
            userName: screen?.name ? `${screen.name} Controller` : "QR Remote User"
          })
        });
      } catch (_) {}
    };

    sendPresence();
    const presenceInterval = setInterval(sendPresence, 12000); // Heartbeat every 12s

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
      clearInterval(presenceInterval);
      window.removeEventListener("pagehide", handleUnload);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [token, screen?.id, screen?.name]);

  const triggerHaptic = () => {
    try {
      if (typeof window !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(40);
      }
    } catch (_) {}
  };

  const handleExecuteButton = async (btn: any) => {
    triggerHaptic();
    setIsSending(true);
    try {
      const payload: any = {
        title: btn.htmlTitle || btn.label,
        subtitle: btn.htmlSubtitle,
        bgColor: btn.htmlBgColor || "#000000",
        color: btn.htmlTextColor || "#FFFFFF",
        duration: btn.duration || 0,
        url: btn.mediaUrl,
        nonce: Date.now()
      };

      const res = await fetch(`/api/remote/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: btn.actionType || "html",
          payload
        })
      });

      if (res.ok) {
        setActionSuccessMessage(`Triggered "${btn.label}"!`);
        setTimeout(() => setActionSuccessMessage(null), 3000);
        fetchScreenData();
      } else {
        alert("Failed to broadcast action to TV.");
      }
    } catch (e) {
      alert("Network error sending command to TV.");
    } finally {
      setIsSending(false);
    }
  };

  const handleClearOverride = async () => {
    triggerHaptic();
    setIsSending(true);
    try {
      const res = await fetch(`/api/remote/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clear: true })
      });
      if (res.ok) {
        setActionSuccessMessage("Screen override cleared. Resumed normal loop.");
        setTimeout(() => setActionSuccessMessage(null), 3000);
        fetchScreenData();
      } else {
        alert("Failed to clear override.");
      }
    } catch (e) {
      alert("Network error clearing override.");
    } finally {
      setIsSending(false);
    }
  };

  const handleSendFlash = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flashTitle.trim() && !flashImageUrl) {
      alert("Please provide a message/title or attach an image to cast.");
      return;
    }

    triggerHaptic();
    setIsSending(true);
    try {
      const preset = FLASH_PRESETS.find(p => p.id === flashPreset) || FLASH_PRESETS[0];
      const isOnlyImage = !flashTitle.trim() && !!flashImageUrl;

      const overrideData = isOnlyImage
        ? {
            type: "image",
            payload: {
              url: flashImageUrl,
              imageUrl: flashImageUrl,
              mediaUrl: flashImageUrl,
              name: "Mobile Cast Image",
              duration: flashDuration,
              nonce: Date.now()
            }
          }
        : {
            type: "html",
            payload: {
              title: flashTitle || "",
              subtitle: flashSubtitle || null,
              imageUrl: flashImageUrl || null,
              mediaUrl: flashImageUrl || null,
              bgColor: preset.bg,
              color: preset.text,
              duration: flashDuration,
              nonce: Date.now()
            }
          };

      const res = await fetch(`/api/remote/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(overrideData)
      });

      if (res.ok) {
        setShowFlashModal(false);
        setFlashTitle("");
        setFlashSubtitle("");
        setFlashImageUrl("");
        setActionSuccessMessage(isOnlyImage ? "Photo is now live on screen!" : "Announcement is now live on screen!");
        setTimeout(() => setActionSuccessMessage(null), 3500);
        fetchScreenData();
      } else {
        alert("Failed to send override to screen.");
      }
    } catch (e) {
      alert("Error broadcasting override.");
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", backgroundColor: "var(--background)", color: "var(--foreground)", padding: "24px", textAlign: "center" }}>
        <div style={{ width: "48px", height: "48px", borderRadius: "50%", border: "4px solid var(--border)", borderTopColor: "var(--brand-primary)", animation: "spin 1s linear infinite", marginBottom: "16px" }} />
        <h2 style={{ fontSize: "18px", fontWeight: "700", margin: "0 0 8px 0" }}>Connecting to TV Screen...</h2>
        <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: 0 }}>Validating secure QR access token.</p>
      </div>
    );
  }

  if (errorMessage || !screen) {
    return (
      <main style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", backgroundColor: "var(--background)", color: "var(--foreground)", padding: "24px", textAlign: "center" }}>
        <div className="glass-panel" style={{ maxWidth: "420px", width: "100%", padding: "32px 24px", borderRadius: "16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "rgba(239, 68, 68, 0.1)", color: "#EF4444", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AlertTriangle size={28} />
          </div>
          <h1 style={{ fontSize: "20px", fontWeight: "800", margin: 0 }}>Access Expired or Revoked</h1>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 }}>
            {errorMessage || "This screen's QR remote code has been renewed or is no longer valid. Please scan the current QR code on the physical display or in the CMS."}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="btn-primary"
            style={{ width: "100%", height: "44px", fontSize: "14px", marginTop: "8px" }}
          >
            <RotateCw size={16} style={{ marginRight: "8px" }} /> Retry Connection
          </button>
        </div>
      </main>
    );
  }

  const hasActiveOverride = !!screen.overrideType;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--background)", color: "var(--foreground)", display: "flex", flexDirection: "column", maxWidth: "600px", margin: "0 auto", paddingBottom: "40px" }}>
      
      {/* ─── Top Header ─── */}
      <header style={{ padding: "16px 20px", background: "var(--card-bg)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 30, boxShadow: "var(--shadow-sm)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <img 
            src={screen.brandingLogoUrl || "/logo.png"} 
            alt="Logo" 
            style={{ height: "32px", maxWidth: "120px", objectFit: "contain" }} 
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "15px", fontWeight: "800", color: "var(--foreground)" }}>{screen.name}</span>
            </div>
            {screen.location ? (
              <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                {screen.location}
              </span>
            ) : (
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                {screen.orgName || "Tropic Air Signage"}
              </span>
            )}
          </div>
        </div>

        {/* Live Status Pill */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ 
            fontSize: "11px", 
            fontWeight: "700", 
            padding: "4px 10px", 
            borderRadius: "12px", 
            display: "inline-flex", 
            alignItems: "center", 
            gap: "5px",
            background: screen.isOnline ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
            color: screen.isOnline ? "#059669" : "#DC2626",
            border: `1px solid ${screen.isOnline ? "rgba(16, 185, 129, 0.25)" : "rgba(239, 68, 68, 0.25)"}`
          }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: screen.isOnline ? "#10B981" : "#EF4444" }} />
            {screen.isOnline ? "TV Online" : "TV Offline"}
          </span>
          <button
            onClick={fetchScreenData}
            title="Refresh Status"
            style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "6px", display: "flex", alignItems: "center", borderRadius: "8px" }}
          >
            <RotateCw size={16} />
          </button>
        </div>
      </header>

      {/* ─── Notification Toast ─── */}
      {actionSuccessMessage && (
        <div style={{ margin: "16px 20px 0 20px", padding: "12px 16px", borderRadius: "10px", background: "rgba(16, 185, 129, 0.95)", color: "#FFFFFF", fontSize: "13px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px", boxShadow: "var(--shadow-md)", animation: "fadeIn 0.2s ease" }}>
          <CheckCircle2 size={18} />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* ─── Main Content Area ─── */}
      <main style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* ─── Screen Status / Active Override Card ─── */}
        <section className="glass-panel" style={{ padding: "18px 20px", borderRadius: "14px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Monitor size={18} style={{ color: "var(--brand-primary)" }} />
              <h2 style={{ fontSize: "14px", fontWeight: "700", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>Current Screen Broadcast</h2>
            </div>
            {hasActiveOverride && (
              <span style={{ fontSize: "11px", fontWeight: "800", padding: "3px 8px", borderRadius: "6px", background: "#EF4444", color: "#FFFFFF", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Active Override
              </span>
            )}
          </div>

          {hasActiveOverride ? (
            <div style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.25)", borderRadius: "10px", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#DC2626" }}>
                    {screen.overridePayload?.title || screen.overridePayload?.name || `Live Override (${screen.overrideType})`}
                  </h3>
                  {screen.overridePayload?.subtitle && (
                    <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--foreground)" }}>{screen.overridePayload.subtitle}</p>
                  )}
                  {screen.overridePayload?.duration ? (
                    <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "inline-flex", alignItems: "center", gap: "4px", marginTop: "6px" }}>
                      <Clock size={13} /> Configured Duration: {screen.overridePayload.duration}s
                    </span>
                  ) : null}
                </div>
              </div>

              <button
                onClick={handleClearOverride}
                disabled={isSending}
                style={{
                  width: "100%",
                  height: "44px",
                  borderRadius: "8px",
                  border: "1px solid rgba(239, 68, 68, 0.4)",
                  background: "#EF4444",
                  color: "#FFFFFF",
                  fontWeight: "700",
                  fontSize: "14px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  boxShadow: "var(--shadow-sm)"
                }}
              >
                <XCircle size={18} /> Clear Override & Resume Playlist
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--muted)", padding: "12px 16px", borderRadius: "10px" }}>
              <div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block" }}>Looping Playlist:</span>
                <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--foreground)" }}>{screen.playlistName}</span>
              </div>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10B981", boxShadow: "0 0 8px #10B981" }} />
            </div>
          )}
        </section>

        {/* ─── Quick Flash Announcement Generator Button ─── */}
        <button
          onClick={() => setShowFlashModal(true)}
          style={{
            width: "100%",
            height: "52px",
            background: "linear-gradient(135deg, var(--brand-primary), var(--brand-primary-hover, #1F3A61))",
            color: "#FFFFFF",
            border: "none",
            borderRadius: "12px",
            padding: "0 20px",
            fontSize: "15px",
            fontWeight: "800",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "var(--shadow-md)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Zap size={20} color="#FBBF24" />
            <span>+ Quick Flash Announcement</span>
          </div>
          <ChevronRight size={18} />
        </button>

        {/* ─── Configured Tablet Buttons Grid ─── */}
        <section style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ fontSize: "14px", fontWeight: "700", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>
              One-Touch Trigger Buttons ({buttons.length})
            </h2>
          </div>

          {buttons.length === 0 ? (
            <div className="glass-panel" style={{ padding: "36px 20px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", color: "var(--text-muted)" }}>
              <SlidersHorizontal size={36} style={{ opacity: 0.3 }} />
              <h3 style={{ fontSize: "15px", fontWeight: "700", margin: 0, color: "var(--foreground)" }}>No action buttons configured yet</h3>
              <p style={{ fontSize: "13px", margin: 0, maxWidth: "340px", lineHeight: 1.4 }}>
                Buttons configured for this TV Account in the CMS Dashboard will appear here automatically. You can also use the <strong>Quick Flash Announcement</strong> above.
              </p>
            </div>
          ) : (
            <div className="tablet-button-grid">
              {buttons.map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => handleExecuteButton(btn)}
                  disabled={isSending}
                  className="tablet-button-item"
                  style={{
                    background: btn.color || "var(--brand-primary)",
                  }}
                >
                  <Sparkles size={22} />
                  <span style={{ fontSize: "13px", fontWeight: "800", lineHeight: 1.2 }}>{btn.label}</span>
                </button>
              ))}
            </div>
          )}
        </section>

      </main>

      {/* ─── Quick Flash Announcement / Image Cast Modal ─── */}
      {showFlashModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.65)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0 0 env(safe-area-inset-bottom) 0" }}>
          <div className="glass-panel" style={{ width: "100%", maxWidth: "520px", background: "var(--card-bg)", borderRadius: "20px 20px 0 0", padding: "22px", display: "flex", flexDirection: "column", gap: "14px", maxHeight: "92vh", overflowY: "auto", boxShadow: "var(--shadow-lg)" }}>
            
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Zap size={20} color="var(--brand-primary)" />
                <h3 style={{ fontSize: "17px", fontWeight: "800", margin: 0, color: "var(--foreground)" }}>Cast to Screen</h3>
              </div>
              <button 
                onClick={() => setShowFlashModal(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSendFlash} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label className="form-label" style={{ fontSize: "12px" }}>
                  Message / Title {flashImageUrl ? "(Optional)" : "*"}
                </label>
                <input
                  type="text"
                  placeholder={flashImageUrl ? "Optional headline or caption..." : "e.g. Flight 104 Boarding Gate 3"}
                  value={flashTitle}
                  onChange={(e) => setFlashTitle(e.target.value)}
                  className="input-field"
                  style={{ height: "44px", fontSize: "14px" }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: "12px" }}>Subtitle / Details (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. All passengers please proceed to Gate 3 now"
                  value={flashSubtitle}
                  onChange={(e) => setFlashSubtitle(e.target.value)}
                  className="input-field"
                  style={{ height: "42px", fontSize: "13px" }}
                />
              </div>

              {/* Image Attachment Section */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label className="form-label" style={{ fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "space-between", margin: 0 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <ImageIcon size={14} color="var(--brand-primary)" /> Attached Picture / Photo {flashTitle.trim() ? "(Optional)" : ""}
                  </span>
                  {flashImageUrl && (
                    <button
                      type="button"
                      onClick={() => setFlashImageUrl("")}
                      style={{ background: "transparent", border: "none", color: "#EF4444", fontSize: "11px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "3px" }}
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  )}
                </label>

                {flashImageUrl ? (
                  <div style={{ position: "relative", width: "100%", height: "140px", borderRadius: "10px", overflow: "hidden", border: "1px solid var(--border)", background: "#000000" }}>
                    <img src={flashImageUrl} alt="Attachment Preview" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      accept="image/*" 
                      onChange={handleImageSelect} 
                      style={{ display: "none" }} 
                    />
                    <button
                      type="button"
                      disabled={isProcessingImage}
                      onClick={() => fileInputRef.current?.click()}
                      className="btn-secondary"
                      style={{ height: "42px", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                    >
                      <Camera size={15} />
                      <span>{isProcessingImage ? "Processing..." : "Take Photo / Pick"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const url = prompt("Enter public image URL:");
                        if (url && url.trim()) setFlashImageUrl(url.trim());
                      }}
                      className="btn-secondary"
                      style={{ height: "42px", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                    >
                      <Link2 size={15} />
                      <span>Paste URL</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Alert Color Presets */}
              {flashTitle.trim() && (
                <div>
                  <label className="form-label" style={{ fontSize: "12px" }}>Visual Alert Style</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
                    {FLASH_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setFlashPreset(p.id as any)}
                        style={{
                          padding: "8px 6px",
                          borderRadius: "8px",
                          border: flashPreset === p.id ? "2px solid var(--foreground)" : "1px solid var(--border)",
                          background: p.bg,
                          color: p.text,
                          fontSize: "11px",
                          fontWeight: "700",
                          cursor: "pointer",
                          textAlign: "center",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Duration Options */}
              <div>
                <label className="form-label" style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "5px" }}>
                  <Clock size={13} /> Display Duration
                </label>
                <select
                  value={flashDuration}
                  onChange={(e) => setFlashDuration(parseInt(e.target.value, 10))}
                  className="input-field"
                  style={{ height: "42px", fontSize: "13px" }}
                >
                  <option value={15}>15 Seconds (Quick Flash)</option>
                  <option value={30}>30 Seconds</option>
                  <option value={60}>1 Minute (Standard)</option>
                  <option value={120}>2 Minutes</option>
                  <option value={300}>5 Minutes</option>
                  <option value={600}>10 Minutes</option>
                  <option value={900}>15 Minutes</option>
                  <option value={1800}>30 Minutes</option>
                  <option value={3600}>1 Hour</option>
                  <option value={0}>Until Cleared Manually (Infinite)</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                <button
                  type="button"
                  onClick={() => setShowFlashModal(false)}
                  className="btn-secondary"
                  style={{ flex: 1, height: "44px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={(!flashTitle.trim() && !flashImageUrl) || isSending || isProcessingImage}
                  className="btn-primary"
                  style={{ flex: 2, height: "44px", fontSize: "14px", fontWeight: "800" }}
                >
                  {!flashTitle.trim() && flashImageUrl ? "🖼️ Cast Photo to Screen" : "⚡ Cast to Screen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Footer ─── */}
      <footer style={{ marginTop: "auto", textAlign: "center", padding: "16px 20px", color: "var(--text-muted)", fontSize: "12px" }}>
        <p style={{ margin: 0 }}>Tropic Air Digital Signage &bull; Standalone QR Web Remote</p>
      </footer>
    </div>
  );
}
