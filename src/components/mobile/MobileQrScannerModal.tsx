"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Camera, 
  X, 
  RotateCw, 
  Flashlight, 
  CheckCircle2, 
  AlertTriangle, 
  Keyboard, 
  QrCode,
  Sparkles
} from "lucide-react";
import jsQR from "jsqr";

interface MobileQrScannerModalProps {
  screens: any[];
  onSelectScreen: (screenId: string) => void;
  onClose: () => void;
}

export function MobileQrScannerModal({ screens, onSelectScreen, onClose }: MobileQrScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [matchedScreenName, setMatchedScreenName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const animationFrameIdRef = useRef<number | null>(null);

  // Trigger haptic feedback
  const triggerHaptic = (success = true) => {
    try {
      if (typeof window !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(success ? [50, 60, 100] : [200]);
      }
    } catch (_) {}
  };

  // Start Camera Stream
  const startCamera = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(newStream);
      setHasCameraPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
      }

      // Check for torch support
      const track = newStream.getVideoTracks()[0];
      const capabilities = (track.getCapabilities?.()) as any;
      if (capabilities && "torch" in capabilities) {
        setHasTorch(true);
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setHasCameraPermission(false);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

  // Toggle Torch
  const toggleTorch = async () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    try {
      const newTorchState = !isTorchOn;
      await (track.applyConstraints as any)({
        advanced: [{ torch: newTorchState }]
      });
      setIsTorchOn(newTorchState);
    } catch (e) {
      console.error("Failed to toggle torch:", e);
    }
  };

  // Switch between front and rear cameras
  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  // Process Scanned Token or URL
  const handleDetectedCode = async (code: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setScannedResult(code);

    let token = code.trim();
    if (token.includes("/remote/")) {
      const parts = token.split("/remote/");
      token = parts[1]?.split("?")[0]?.split("#")[0] || token;
    } else if (token.includes("token=")) {
      const match = token.match(/token=([^&]+)/);
      if (match) token = match[1];
    }

    // Check if token matches any existing screen in organization
    const matched = screens.find(
      (s) => (s.controlToken && s.controlToken === token) || s.id === token
    );

    if (matched) {
      setMatchedScreenName(matched.name);
      triggerHaptic(true);
      setTimeout(() => {
        onSelectScreen(matched.id);
        onClose();
      }, 700);
      return;
    }

    // Try resolving token via API
    try {
      const res = await fetch(`/api/remote/${token}`);
      if (res.ok) {
        const data = await res.json();
        if (data.screen?.id) {
          setMatchedScreenName(data.screen.name);
          triggerHaptic(true);
          setTimeout(() => {
            onSelectScreen(data.screen.id);
            onClose();
          }, 700);
          return;
        }
      }
    } catch (e) {
      console.error("Error verifying scanned remote token:", e);
    }

    triggerHaptic(false);
    alert(`Unrecognized screen QR code: "${token}". Please scan a valid TV remote QR code.`);
    setIsProcessing(false);
    setScannedResult(null);
  };

  // QR Scanning Loop using jsQR on requestAnimationFrame
  useEffect(() => {
    const scanFrame = () => {
      if (
        !isProcessing &&
        videoRef.current &&
        videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA &&
        canvasRef.current
      ) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });

        if (ctx) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert"
          });

          if (qrCode && qrCode.data) {
            handleDetectedCode(qrCode.data);
            return;
          }
        }
      }

      if (!isProcessing) {
        animationFrameIdRef.current = requestAnimationFrame(scanFrame);
      }
    };

    animationFrameIdRef.current = requestAnimationFrame(scanFrame);
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [isProcessing, screens]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleDetectedCode(manualCode.trim());
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0, 0, 0, 0.92)",
      zIndex: 120,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "20px 16px calc(20px + env(safe-area-inset-bottom)) 16px",
      color: "#FFFFFF"
    }}>
      
      {/* Top Header */}
      <div style={{ width: "100%", maxWidth: "480px", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <QrCode size={20} color="var(--brand-primary, #3B82F6)" />
          <span style={{ fontSize: "16px", fontWeight: "800" }}>Scan TV QR Code to Connect</span>
        </div>

        <button
          onClick={onClose}
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.15)",
            border: "none",
            color: "#FFFFFF",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Viewfinder */}
      <div style={{
        position: "relative",
        width: "100%",
        maxWidth: "320px",
        height: "320px",
        borderRadius: "24px",
        overflow: "hidden",
        border: matchedScreenName ? "4px solid #10B981" : "2px solid rgba(255, 255, 255, 0.3)",
        boxShadow: matchedScreenName ? "0 0 30px #10B981" : "0 8px 32px rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#000000"
      }}>
        <canvas ref={canvasRef} style={{ display: "none" }} />

        <video
          ref={videoRef}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover"
          }}
        />

        <div style={{
          position: "absolute",
          width: "200px",
          height: "200px",
          border: "2px dashed rgba(255, 255, 255, 0.6)",
          borderRadius: "16px",
          pointerEvents: "none"
        }} />

        {!matchedScreenName && (
          <div 
            style={{
              position: "absolute",
              left: "30px",
              right: "30px",
              height: "3px",
              background: "linear-gradient(90deg, transparent, #3B82F6, #60A5FA, transparent)",
              boxShadow: "0 0 12px #3B82F6",
              borderRadius: "2px",
              animation: "scanLaser 2.2s ease-in-out infinite alternate"
            }} 
          />
        )}

        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes scanLaser {
            0% { top: 60px; opacity: 0.8; }
            100% { top: 260px; opacity: 0.8; }
          }
        ` }} />

        {hasCameraPermission === false && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(0, 0, 0, 0.85)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "20px", textAlign: "center", gap: "10px" }}>
            <AlertTriangle size={36} color="#EF4444" />
            <span style={{ fontSize: "14px", fontWeight: "700" }}>Camera Access Required</span>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
              Please allow camera permissions or enter code manually.
            </p>
          </div>
        )}

        {matchedScreenName && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(16, 185, 129, 0.92)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px", padding: "20px", textAlign: "center", animation: "fadeIn 0.2s ease" }}>
            <CheckCircle2 size={54} color="#FFFFFF" />
            <span style={{ fontSize: "18px", fontWeight: "900", color: "#FFFFFF" }}>Connected!</span>
            <span style={{ fontSize: "14px", fontWeight: "700", color: "rgba(255, 255, 255, 0.95)" }}>{matchedScreenName}</span>
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div style={{ width: "100%", maxWidth: "480px", display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
        <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.75)", textAlign: "center", margin: 0, maxWidth: "300px" }}>
          Point camera at the QR code printed on the screen badge or displayed in TV settings.
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={toggleCameraFacing}
            title="Flip Camera"
            style={{
              padding: "10px 14px",
              borderRadius: "12px",
              background: "rgba(255, 255, 255, 0.15)",
              border: "none",
              color: "#FFFFFF",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              fontWeight: "700"
            }}
          >
            <RotateCw size={15} /> Flip Camera
          </button>

          {hasTorch && (
            <button
              onClick={toggleTorch}
              title="Toggle Flashlight"
              style={{
                padding: "10px 14px",
                borderRadius: "12px",
                background: isTorchOn ? "#FBBF24" : "rgba(255, 255, 255, 0.15)",
                border: "none",
                color: isTorchOn ? "#000000" : "#FFFFFF",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                fontWeight: "700"
              }}
            >
              <Flashlight size={15} /> {isTorchOn ? "Flash On" : "Flash Off"}
            </button>
          )}

          <button
            onClick={() => setShowManualInput(!showManualInput)}
            style={{
              padding: "10px 14px",
              borderRadius: "12px",
              background: showManualInput ? "var(--brand-primary, #3B82F6)" : "rgba(255, 255, 255, 0.15)",
              border: "none",
              color: "#FFFFFF",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "12px",
              fontWeight: "700"
            }}
          >
            <Keyboard size={15} /> Enter Code
          </button>
        </div>

        {showManualInput && (
          <form onSubmit={handleManualSubmit} style={{ width: "100%", display: "flex", gap: "8px" }}>
            <input
              type="text"
              placeholder="Paste URL or Screen Code..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              style={{
                flex: 1,
                height: "42px",
                borderRadius: "10px",
                background: "rgba(255, 255, 255, 0.15)",
                border: "1px solid rgba(255, 255, 255, 0.25)",
                color: "#FFFFFF",
                padding: "0 12px",
                fontSize: "13px",
                outline: "none"
              }}
            />
            <button
              type="submit"
              disabled={!manualCode.trim() || isProcessing}
              style={{
                height: "42px",
                padding: "0 16px",
                borderRadius: "10px",
                background: "var(--brand-primary, #3B82F6)",
                border: "none",
                color: "#FFFFFF",
                fontSize: "13px",
                fontWeight: "800",
                cursor: "pointer"
              }}
            >
              Connect
            </button>
          </form>
        )}
      </div>

    </div>
  );
}
