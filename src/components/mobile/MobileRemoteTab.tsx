"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  XCircle, 
  Wifi, 
  RotateCw, 
  Zap, 
  Monitor, 
  Clock, 
  SlidersHorizontal, 
  QrCode, 
  CheckCircle2, 
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  X,
  Image as ImageIcon,
  Camera,
  Link2,
  Trash2
} from "lucide-react";
import { ScreenQrBadgeModal } from "../ScreenQrBadgeModal";
import { MobileQrScannerModal } from "./MobileQrScannerModal";

interface MobileRemoteTabProps {
  screens: any[];
  fetchScreens: () => void;
}

export function MobileRemoteTab({ screens, fetchScreens }: MobileRemoteTabProps) {
  const [selectedScreenId, setSelectedScreenId] = useState<string>("");
  const [buttons, setButtons] = useState<any[]>([]);
  const [isLoadingButtons, setIsLoadingButtons] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  // QR Modals
  const [qrModalScreen, setQrModalScreen] = useState<{ id: string; name: string } | null>(null);
  const [showQrScanner, setShowQrScanner] = useState(false);

  // Flash Announcement Modal
  const [showFlashModal, setShowFlashModal] = useState(false);
  const [flashTitle, setFlashTitle] = useState("");
  const [flashSubtitle, setFlashSubtitle] = useState("");
  const [flashImageUrl, setFlashImageUrl] = useState("");
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [flashDuration, setFlashDuration] = useState(60);
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

  // Set default selected screen if available
  useEffect(() => {
    if (screens.length > 0 && !selectedScreenId) {
      setSelectedScreenId(screens[0].id);
    }
  }, [screens, selectedScreenId]);

  const selectedScreen = screens.find((s) => s.id === selectedScreenId) || screens[0];

  // Fetch configured buttons whenever selected screen changes
  useEffect(() => {
    if (!selectedScreen) return;
    const fetchButtons = async () => {
      setIsLoadingButtons(true);
      try {
        if (selectedScreen.controlToken) {
          const res = await fetch(`/api/remote/${selectedScreen.controlToken}`);
          if (res.ok) {
            const data = await res.json();
            setButtons(data.buttons || []);
          }
        }
      } catch (e) {
        console.error("Failed to load buttons for screen:", e);
      } finally {
        setIsLoadingButtons(false);
      }
    };
    fetchButtons();
  }, [selectedScreen?.id, selectedScreen?.controlToken]);

  const triggerHaptic = () => {
    try {
      if (typeof window !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(40);
      }
    } catch (_) {}
  };

  const handleExecuteButton = async (btn: any) => {
    if (!selectedScreen) return;
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

      const res = await fetch(`/api/screens/${selectedScreen.id}/override`, {
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
        fetchScreens();
      } else {
        alert("Failed to send override.");
      }
    } catch (e) {
      alert("Error executing override.");
    } finally {
      setIsSending(false);
    }
  };

  const handleClearOverride = async () => {
    if (!selectedScreen) return;
    triggerHaptic();
    setIsSending(true);
    try {
      const res = await fetch(`/api/screens/${selectedScreen.id}/override`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: null, payload: null })
      });
      if (res.ok) {
        setActionSuccessMessage("Override cleared. Normal playlist resumed.");
        setTimeout(() => setActionSuccessMessage(null), 3000);
        fetchScreens();
      } else {
        alert("Failed to clear override.");
      }
    } catch (e) {
      alert("Error clearing override.");
    } finally {
      setIsSending(false);
    }
  };

  const handleSendFlash = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScreen) return;
    if (!flashTitle.trim() && !flashImageUrl) {
      alert("Please provide a title/message or attach an image to cast.");
      return;
    }

    triggerHaptic();
    setIsSending(true);
    try {
      const preset = FLASH_PRESETS.find((p) => p.id === flashPreset) || FLASH_PRESETS[0];
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

      const res = await fetch(`/api/screens/${selectedScreen.id}/override`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(overrideData)
      });

      if (res.ok) {
        setShowFlashModal(false);
        setFlashTitle("");
        setFlashSubtitle("");
        setFlashImageUrl("");
        setActionSuccessMessage(isOnlyImage ? "Photo casted to screen!" : "Announcement broadcasted to screen!");
        setTimeout(() => setActionSuccessMessage(null), 3000);
        fetchScreens();
      } else {
        alert("Failed to cast to screen.");
      }
    } catch (e) {
      alert("Error broadcasting to screen.");
    } finally {
      setIsSending(false);
    }
  };

  if (screens.length === 0) {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
        <Monitor size={48} style={{ opacity: 0.3 }} />
        <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "var(--foreground)" }}>No Screens Found</h3>
        <p style={{ margin: 0, fontSize: "13px" }}>Add a TV Screen in the Screens tab to begin triggering live overrides.</p>
      </div>
    );
  }

  const isScreenOnline = selectedScreen?.lastSeenAt
    ? Date.now() - new Date(selectedScreen.lastSeenAt).getTime() < 60000
    : false;

  let parsedPayload: any = null;
  if (selectedScreen?.overridePayload) {
    try {
      parsedPayload = JSON.parse(selectedScreen.overridePayload);
    } catch (_) {
      parsedPayload = selectedScreen.overridePayload;
    }
  }

  const hasActiveOverride = !!selectedScreen?.overrideType;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "16px" }}>
      
      {/* ─── Target Screen Selector Bar ─── */}
      <div className="glass-panel" style={{ padding: "12px 16px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
          <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>
            Controlling Screen
          </span>
          <div style={{ position: "relative" }}>
            <select
              value={selectedScreenId}
              onChange={(e) => setSelectedScreenId(e.target.value)}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                fontSize: "16px",
                fontWeight: "800",
                color: "var(--foreground)",
                paddingRight: "24px",
                cursor: "pointer",
                outline: "none"
              }}
            >
              {screens.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.location ? `(${s.location})` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* QR Action: Scan QR to Connect */}
        <button
          onClick={() => setShowQrScanner(true)}
          title="Scan TV QR code to connect and switch screen"
          style={{
            padding: "8px 14px",
            background: "var(--brand-primary, #2C4C7C)",
            border: "none",
            borderRadius: "8px",
            color: "#FFFFFF",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "12px",
            fontWeight: "800",
            boxShadow: "var(--shadow-sm)",
            flexShrink: 0
          }}
        >
          <Camera size={15} /> Scan QR
        </button>
      </div>

      {/* ─── Action Success Toast ─── */}
      {actionSuccessMessage && (
        <div style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(16, 185, 129, 0.95)", color: "#FFFFFF", fontSize: "13px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px", boxShadow: "var(--shadow-md)" }}>
          <CheckCircle2 size={16} />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* ─── Current Screen Status / Override Active Banner ─── */}
      <div className="glass-panel" style={{ padding: "16px", borderRadius: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: isScreenOnline ? "#10B981" : "#EF4444" }} />
            <span style={{ fontSize: "12px", fontWeight: "700", color: isScreenOnline ? "#059669" : "#DC2626" }}>
              {isScreenOnline ? "TV Online" : "TV Offline"}
            </span>
          </div>

          <button
            onClick={fetchScreens}
            style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center", gap: "4px", fontSize: "11px" }}
          >
            <RotateCw size={13} /> Refresh
          </button>
        </div>

        {hasActiveOverride ? (
          <div style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.25)", borderRadius: "10px", padding: "12px 14px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <span style={{ fontSize: "10px", fontWeight: "800", background: "#EF4444", color: "#FFFFFF", padding: "2px 6px", borderRadius: "4px", textTransform: "uppercase" }}>
                  Active Override
                </span>
                <h4 style={{ margin: "6px 0 0 0", fontSize: "15px", fontWeight: "800", color: "#DC2626" }}>
                  {parsedPayload?.title || parsedPayload?.name || `Live Override (${selectedScreen.overrideType})`}
                </h4>
                {parsedPayload?.subtitle && (
                  <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--foreground)" }}>{parsedPayload.subtitle}</p>
                )}
              </div>
            </div>

            <button
              onClick={handleClearOverride}
              disabled={isSending}
              style={{
                width: "100%",
                height: "40px",
                borderRadius: "8px",
                border: "none",
                background: "#EF4444",
                color: "#FFFFFF",
                fontWeight: "700",
                fontSize: "13px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px"
              }}
            >
              <XCircle size={16} /> Clear Override
            </button>
          </div>
        ) : (
          <div style={{ background: "var(--muted)", padding: "10px 14px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Looping Playlist:</span>
            <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--foreground)" }}>
              {selectedScreen.playlist?.name || "Standard Loop"}
            </span>
          </div>
        )}
      </div>

      {/* ─── Flash Announcement / Image Cast Launcher ─── */}
      <button
        onClick={() => setShowFlashModal(true)}
        style={{
          width: "100%",
          height: "48px",
          background: "linear-gradient(135deg, var(--brand-primary), var(--brand-primary-hover, #1F3A61))",
          color: "#FFFFFF",
          border: "none",
          borderRadius: "12px",
          padding: "0 16px",
          fontSize: "14px",
          fontWeight: "800",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "var(--shadow-sm)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Zap size={18} color="#FBBF24" />
          <span>+ Cast Announcement or Photo</span>
        </div>
        <ChevronRight size={16} />
      </button>

      {/* ─── One-Touch Trigger Action Buttons Grid ─── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <h3 style={{ fontSize: "13px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", margin: 0 }}>
          One-Touch Buttons ({buttons.length})
        </h3>

        {isLoadingButtons ? (
          <div style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
            Loading action buttons...
          </div>
        ) : buttons.length === 0 ? (
          <div className="glass-panel" style={{ padding: "24px 16px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", color: "var(--text-muted)" }}>
            <SlidersHorizontal size={28} style={{ opacity: 0.3 }} />
            <span style={{ fontSize: "13px", fontWeight: "600", color: "var(--foreground)" }}>No action buttons for this TV account</span>
            <span style={{ fontSize: "12px", maxWidth: "280px" }}>Configure buttons in TV Accounts &rarr; Tablet Builder, or use Quick Cast Announcement above.</span>
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
                <Sparkles size={20} />
                <span style={{ fontSize: "13px", fontWeight: "800", lineHeight: 1.2 }}>{btn.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─── Flash Announcement / Media Cast Modal ─── */}
      {showFlashModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.65)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0 0 env(safe-area-inset-bottom) 0" }}>
          <div className="glass-panel" style={{ width: "100%", maxWidth: "500px", background: "var(--card-bg)", borderRadius: "20px 20px 0 0", padding: "20px", display: "flex", flexDirection: "column", gap: "14px", maxHeight: "92vh", overflowY: "auto", boxShadow: "var(--shadow-lg)" }}>
            
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Zap size={18} color="var(--brand-primary)" />
                <h3 style={{ fontSize: "16px", fontWeight: "800", margin: 0, color: "var(--foreground)" }}>Cast to Screen</h3>
              </div>
              <button 
                onClick={() => setShowFlashModal(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px" }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSendFlash} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label className="form-label" style={{ fontSize: "12px" }}>
                  Message / Title {flashImageUrl ? "(Optional)" : "*"}
                </label>
                <input
                  type="text"
                  placeholder={flashImageUrl ? "Optional caption or headline..." : "e.g. Flight 104 Boarding Gate 3"}
                  value={flashTitle}
                  onChange={(e) => setFlashTitle(e.target.value)}
                  className="input-field"
                  style={{ height: "42px", fontSize: "14px" }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: "12px" }}>Subtitle / Details (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Please proceed to Gate 3 now"
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
                      style={{ height: "40px", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                    >
                      <Camera size={14} />
                      <span>{isProcessingImage ? "Processing..." : "Take Photo / Library"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const url = prompt("Enter public image URL:");
                        if (url && url.trim()) setFlashImageUrl(url.trim());
                      }}
                      className="btn-secondary"
                      style={{ height: "40px", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                    >
                      <Link2 size={14} />
                      <span>Paste URL</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Alert Style Presets */}
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

              {/* Display Duration Selector */}
              <div>
                <label className="form-label" style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "5px" }}>
                  <Clock size={13} /> Display Duration
                </label>
                <select
                  value={flashDuration}
                  onChange={(e) => setFlashDuration(parseInt(e.target.value, 10))}
                  className="input-field"
                  style={{ height: "40px", fontSize: "13px" }}
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

              <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                <button
                  type="button"
                  onClick={() => setShowFlashModal(false)}
                  className="btn-secondary"
                  style={{ flex: 1, height: "42px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={(!flashTitle.trim() && !flashImageUrl) || isSending || isProcessingImage}
                  className="btn-primary"
                  style={{ flex: 2, height: "42px", fontSize: "14px", fontWeight: "800" }}
                >
                  {!flashTitle.trim() && flashImageUrl ? "🖼️ Cast Photo to Screen" : "⚡ Cast to Screen"}
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

      {/* ─── Camera QR Scanner Modal ─── */}
      {showQrScanner && (
        <MobileQrScannerModal
          screens={screens}
          onSelectScreen={(screenId) => {
            setSelectedScreenId(screenId);
            setShowQrScanner(false);
            setActionSuccessMessage("Connected to screen!");
            setTimeout(() => setActionSuccessMessage(null), 3000);
          }}
          onClose={() => setShowQrScanner(false)}
        />
      )}
    </div>
  );
}
