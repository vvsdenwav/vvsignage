"use client";

import React, { useState, useEffect } from "react";
import { 
  QrCode, 
  Printer, 
  RotateCw, 
  ExternalLink, 
  Copy, 
  Check, 
  X, 
  ShieldAlert, 
  Sparkles,
  Info
} from "lucide-react";

interface ScreenQrBadgeModalProps {
  screenId: string;
  screenName: string;
  onClose: () => void;
}

export function ScreenQrBadgeModal({ screenId, screenName, onClose }: ScreenQrBadgeModalProps) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRenewing, setIsRenewing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showRenewConfirm, setShowRenewConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTokenData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/screens/${screenId}/qr-token`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setError(null);
      } else {
        const err = await res.json();
        setError(err.error || "Failed to load QR token");
      }
    } catch (e) {
      setError("Network error fetching QR token");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTokenData();
  }, [screenId]);

  const handleRenewToken = async () => {
    setIsRenewing(true);
    try {
      const res = await fetch(`/api/screens/${screenId}/qr-token`, { method: "POST" });
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setShowRenewConfirm(false);
        alert("QR Code renewed successfully! Any previously printed codes are now revoked and will no longer work.");
      } else {
        alert("Failed to renew QR token.");
      }
    } catch (e) {
      alert("Error renewing QR token.");
    } finally {
      setIsRenewing(false);
    }
  };

  const handleCopyLink = () => {
    if (data?.remoteUrl) {
      navigator.clipboard.writeText(data.remoteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.65)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      
      {/* Printable Badge CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-qr-badge, #printable-qr-badge * {
            visibility: visible;
          }
          #printable-qr-badge {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 100%;
            max-width: 400px;
            box-shadow: none !important;
            border: 2px solid #000000 !important;
          }
        }
      `}} />

      <div className="glass-panel" style={{ width: "100%", maxWidth: "560px", background: "var(--card-bg)", borderRadius: "18px", padding: "28px", display: "flex", flexDirection: "column", gap: "20px", maxHeight: "92vh", overflowY: "auto", boxShadow: "var(--shadow-lg)" }}>
        
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "var(--brand-accent)", color: "var(--brand-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <QrCode size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "var(--foreground)" }}>
                Screen QR Remote & Badge
              </h2>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>
                Instant phone controller for <strong>{screenName}</strong>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "6px" }}
          >
            <X size={20} />
          </button>
        </div>

        {isLoading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
            <RotateCw size={28} style={{ animation: "spin 1s linear infinite", marginBottom: "12px" }} />
            <p style={{ margin: 0, fontSize: "14px" }}>Generating secure QR code...</p>
          </div>
        ) : error ? (
          <div style={{ padding: "24px", background: "rgba(239, 68, 68, 0.1)", borderRadius: "12px", color: "#EF4444", textAlign: "center" }}>
            <ShieldAlert size={32} style={{ marginBottom: "8px" }} />
            <p style={{ margin: 0, fontWeight: "700" }}>{error}</p>
          </div>
        ) : (
          <>
            {/* ─── Printable Card Preview ─── */}
            <div 
              id="printable-qr-badge" 
              style={{ 
                background: "#FFFFFF", 
                color: "#1E293B", 
                border: "2px solid #E2E8F0", 
                borderRadius: "16px", 
                padding: "24px", 
                textAlign: "center", 
                display: "flex", 
                flexDirection: "column", 
                alignItems: "center", 
                gap: "12px",
                boxShadow: "var(--shadow-sm)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                <img src="/logo.png" alt="Logo" style={{ height: "26px", objectFit: "contain" }} />
                <span style={{ fontSize: "13px", fontWeight: "800", color: "#0F172A", letterSpacing: "0.05em", textTransform: "uppercase" }}>Tropic Air Signage</span>
              </div>

              <div style={{ background: "#F8FAFC", padding: "10px 16px", borderRadius: "8px", width: "100%", border: "1px solid #E2E8F0" }}>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#0F172A" }}>{data.screenName}</h3>
                <span style={{ fontSize: "12px", color: "#64748B" }}>{data.location}</span>
              </div>

              {/* QR Image */}
              <div style={{ background: "#FFFFFF", padding: "12px", borderRadius: "12px", border: "1px solid #CBD5E1", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
                <img 
                  src={data.qrDataUrl} 
                  alt={`QR Code for ${data.screenName}`} 
                  style={{ width: "200px", height: "200px", display: "block" }} 
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontSize: "14px", fontWeight: "800", color: "#1E293B" }}>Scan with phone to control screen</span>
                <span style={{ fontSize: "11px", color: "#64748B" }}>No app installation required &bull; Works with iPhone & Android</span>
              </div>
            </div>

            {/* ─── Action Buttons ─── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <button
                onClick={handlePrint}
                className="btn-primary"
                style={{ height: "44px", fontSize: "14px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              >
                <Printer size={16} /> Print Badge
              </button>

              <button
                onClick={() => window.open(data.remoteUrl, "_blank")}
                className="btn-secondary"
                style={{ height: "44px", fontSize: "14px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              >
                <ExternalLink size={16} /> Open in New Tab
              </button>
            </div>

            {/* ─── Link & Renewal Bar ─── */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "var(--muted)", padding: "14px 16px", borderRadius: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, fontSize: "12px", fontFamily: "monospace", color: "var(--foreground)" }}>
                  {data.remoteUrl}
                </div>
                <button
                  onClick={handleCopyLink}
                  style={{ background: "var(--card-bg)", border: "1px solid var(--border)", borderRadius: "6px", padding: "6px 10px", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", color: "var(--foreground)" }}
                >
                  {copied ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                  {copied ? "Copied" : "Copy Link"}
                </button>
              </div>

              <div style={{ borderTop: "1px solid var(--border)", paddingTop: "10px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "12px" }}>
                  <Info size={14} />
                  <span>Tamper Protection</span>
                </div>

                {!showRenewConfirm ? (
                  <button
                    onClick={() => setShowRenewConfirm(true)}
                    style={{ background: "transparent", border: "none", color: "#EF4444", fontSize: "12px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                  >
                    <RotateCw size={13} /> Renew / Revoke QR Code
                  </button>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "12px", color: "#EF4444", fontWeight: "600" }}>Revoke previous codes?</span>
                    <button
                      onClick={handleRenewToken}
                      disabled={isRenewing}
                      style={{ background: "#EF4444", color: "white", border: "none", borderRadius: "6px", padding: "4px 10px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
                    >
                      {isRenewing ? "Renewing..." : "Yes, Renew"}
                    </button>
                    <button
                      onClick={() => setShowRenewConfirm(false)}
                      style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: "6px", padding: "4px 8px", fontSize: "12px", cursor: "pointer", color: "var(--foreground)" }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
