"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  UploadCloud, 
  Camera, 
  Image as ImageIcon, 
  Film, 
  Folder, 
  Plus, 
  Search, 
  MoreVertical, 
  Trash2, 
  Cast, 
  ListPlus, 
  X, 
  CheckCircle2, 
  ExternalLink,
  Eye,
  RotateCw
} from "lucide-react";
import { upload } from "@vercel/blob/client";

interface MobileMediaTabProps {
  mediaAssets: any[];
  folders: any[];
  screens: any[];
  playlists: any[];
  refreshMedia: () => Promise<void>;
  refreshFolders: () => Promise<void>;
  stats?: any;
}

export function MobileMediaTab({
  mediaAssets,
  folders,
  screens,
  playlists,
  refreshMedia,
  refreshFolders,
  stats
}: MobileMediaTabProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // File Inputs
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Action Sheet / Modals
  const [selectedAsset, setSelectedAsset] = useState<any | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState<any | null>(null);
  const [showCastModal, setShowCastModal] = useState<any | null>(null);
  const [castScreenId, setCastScreenId] = useState<string>("");
  const [castDuration, setCastDuration] = useState<number>(30);
  const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState<any | null>(null);
  const [targetPlaylistId, setTargetPlaylistId] = useState<string>("");

  // Auto-fetch media assets and folders on mount
  useEffect(() => {
    refreshMedia();
    refreshFolders();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(`Uploading ${file.name}...`);

    try {
      await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/media/upload",
        clientPayload: selectedFolderId ? JSON.stringify({ folderId: selectedFolderId }) : undefined,
      });

      setUploadProgress("Finalizing asset...");
      setTimeout(async () => {
        await refreshMedia();
        setIsUploading(false);
        setUploadProgress(null);
        setToastMessage(`"${file.name}" uploaded successfully!`);
        setTimeout(() => setToastMessage(null), 3000);
      }, 1200);
    } catch (err: any) {
      console.error("Mobile upload error:", err);
      alert(`Upload Failed: ${err?.message || "Error uploading file"}`);
      setIsUploading(false);
      setUploadProgress(null);
    } finally {
      if (cameraInputRef.current) cameraInputRef.current.value = "";
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  };

  const handleDeleteMedia = async (asset: any) => {
    if (!confirm(`Delete "${asset.name}"?`)) return;
    try {
      await fetch(`/api/media/${asset.id}`, { method: "DELETE" });
      setSelectedAsset(null);
      await refreshMedia();
      setToastMessage("Media deleted.");
      setTimeout(() => setToastMessage(null), 2500);
    } catch (e) {
      alert("Failed to delete media.");
    }
  };

  const handleCastToScreen = async () => {
    if (!showCastModal || !castScreenId) return;
    try {
      const res = await fetch(`/api/screens/${castScreenId}/override`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: showCastModal.type === "video" ? "video" : "image",
          payload: {
            url: showCastModal.url,
            imageUrl: showCastModal.url,
            mediaUrl: showCastModal.url,
            name: showCastModal.name,
            duration: castDuration,
            nonce: Date.now()
          }
        })
      });

      if (res.ok) {
        setShowCastModal(null);
        setSelectedAsset(null);
        setToastMessage(`Cast "${showCastModal.name}" to TV!`);
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        alert("Failed to cast to screen.");
      }
    } catch (e) {
      alert("Error casting to screen.");
    }
  };

  const handleAddToPlaylist = async () => {
    if (!showAddToPlaylistModal || !targetPlaylistId) return;
    try {
      const res = await fetch(`/api/playlists/${targetPlaylistId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaId: showAddToPlaylistModal.id,
          duration: 10
        })
      });

      if (res.ok) {
        setShowAddToPlaylistModal(null);
        setSelectedAsset(null);
        setToastMessage(`Added to playlist!`);
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        alert("Failed to add to playlist.");
      }
    } catch (e) {
      alert("Error adding to playlist.");
    }
  };

  // Filter Assets: When selectedFolderId is null, show all media assets
  let filteredAssets = selectedFolderId
    ? mediaAssets.filter((a) => a.folderId === selectedFolderId)
    : mediaAssets;

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    filteredAssets = filteredAssets.filter((a) =>
      a.name.toLowerCase().includes(q)
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "16px" }}>
      
      {/* ─── Upload Action Bar ─── */}
      <div className="glass-panel" style={{ padding: "14px 16px", borderRadius: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: "12px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>
            Pocket Media Upload
          </span>
          <button
            onClick={() => refreshMedia()}
            style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center", gap: "4px", fontSize: "11px" }}
          >
            <RotateCw size={13} /> Refresh
          </button>
        </div>

        {/* Hidden Native File Inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*,video/*"
          capture="environment"
          onChange={handleFileUpload}
          style={{ display: "none" }}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={handleFileUpload}
          style={{ display: "none" }}
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <button
            onClick={() => cameraInputRef.current?.click()}
            disabled={isUploading}
            style={{
              height: "46px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, var(--brand-primary), var(--brand-primary-hover, #1F3A61))",
              color: "#FFFFFF",
              border: "none",
              fontWeight: "700",
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: "var(--shadow-sm)"
            }}
          >
            <Camera size={18} /> Snap Photo / Video
          </button>

          <button
            onClick={() => galleryInputRef.current?.click()}
            disabled={isUploading}
            className="btn-secondary"
            style={{
              height: "46px",
              borderRadius: "10px",
              fontWeight: "700",
              fontSize: "13px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px"
            }}
          >
            <UploadCloud size={18} /> Photo Library
          </button>
        </div>

        {/* Upload Progress Bar */}
        {isUploading && (
          <div style={{ background: "rgba(44, 76, 124, 0.08)", border: "1px solid rgba(44, 76, 124, 0.2)", borderRadius: "8px", padding: "8px 12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: "2px solid var(--border)", borderTopColor: "var(--brand-primary)", animation: "spin 1s linear infinite" }} />
            <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--brand-primary)" }}>{uploadProgress}</span>
          </div>
        )}
      </div>

      {/* ─── Notification Toast ─── */}
      {toastMessage && (
        <div style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(16, 185, 129, 0.95)", color: "#FFFFFF", fontSize: "13px", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px", boxShadow: "var(--shadow-md)" }}>
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─── Search Bar ─── */}
      <div style={{ position: "relative" }}>
        <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
        <input
          type="text"
          placeholder="Search media assets..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field"
          style={{ height: "40px", paddingLeft: "36px", fontSize: "13px" }}
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* ─── Horizontal Scrollable Folder Chips ─── */}
      <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }} className="custom-scroll">
        <button
          onClick={() => setSelectedFolderId(null)}
          style={{
            padding: "6px 14px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: selectedFolderId === null ? "700" : "500",
            background: selectedFolderId === null ? "var(--brand-primary)" : "var(--card-bg)",
            color: selectedFolderId === null ? "#FFFFFF" : "var(--foreground)",
            border: "1px solid var(--border)",
            cursor: "pointer",
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <Folder size={14} /> All Media ({mediaAssets.length})
        </button>

        {folders.map((f) => (
          <button
            key={f.id}
            onClick={() => setSelectedFolderId(f.id)}
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              fontSize: "12px",
              fontWeight: selectedFolderId === f.id ? "700" : "500",
              background: selectedFolderId === f.id ? "var(--brand-primary)" : "var(--card-bg)",
              color: selectedFolderId === f.id ? "#FFFFFF" : "var(--foreground)",
              border: "1px solid var(--border)",
              cursor: "pointer",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <Folder size={14} /> {f.name} ({f._count?.assets || 0})
          </button>
        ))}
      </div>

      {/* ─── Media Assets Grid ─── */}
      {filteredAssets.length === 0 ? (
        <div className="glass-panel" style={{ padding: "36px 16px", textAlign: "center", color: "var(--text-muted)", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
          <ImageIcon size={36} style={{ opacity: 0.3 }} />
          <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--foreground)" }}>No media found</span>
          <span style={{ fontSize: "12px" }}>Snap a photo or upload from your device to add media.</span>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              onClick={() => setSelectedAsset(asset)}
              className="glass-panel"
              style={{
                borderRadius: "12px",
                overflow: "hidden",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                position: "relative"
              }}
            >
              {/* Media Preview Box */}
              <div style={{ width: "100%", height: "110px", background: "#000000", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                {asset.type === "video" ? (
                  <video src={asset.url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <img src={asset.url} alt={asset.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                )}
                {asset.type === "video" && (
                  <span style={{ position: "absolute", bottom: "6px", right: "6px", background: "rgba(0,0,0,0.7)", color: "#FFFFFF", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", display: "flex", alignItems: "center", gap: "3px" }}>
                    <Film size={10} /> Video
                  </span>
                )}
              </div>

              {/* Media Title & Info */}
              <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {asset.name}
                </span>
                <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                  {new Date(asset.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Touch Action Sheet (When tapping a media item) ─── */}
      {selectedAsset && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.6)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          <div className="glass-panel" style={{ width: "100%", maxWidth: "500px", background: "var(--card-bg)", borderRadius: "20px 20px 0 0", padding: "20px", display: "flex", flexDirection: "column", gap: "14px", boxShadow: "var(--shadow-lg)" }}>
            
            {/* Sheet Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: "10px" }}>
              <div style={{ overflow: "hidden", flex: 1, paddingRight: "10px" }}>
                <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "800", color: "var(--foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {selectedAsset.name}
                </h4>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Media Actions</span>
              </div>
              <button
                onClick={() => setSelectedAsset(null)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Sheet Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              
              <button
                onClick={() => {
                  setShowPreviewModal(selectedAsset);
                }}
                className="btn-secondary"
                style={{ height: "44px", justifyContent: "flex-start", padding: "0 14px", gap: "10px", fontSize: "13px", fontWeight: "700" }}
              >
                <Eye size={16} color="var(--brand-primary)" /> Fullscreen Preview
              </button>

              <button
                onClick={() => {
                  setShowCastModal(selectedAsset);
                  if (screens.length > 0) setCastScreenId(screens[0].id);
                }}
                className="btn-secondary"
                style={{ height: "44px", justifyContent: "flex-start", padding: "0 14px", gap: "10px", fontSize: "13px", fontWeight: "700", color: "var(--brand-primary)" }}
              >
                <Cast size={16} /> Cast as Live Screen Override
              </button>

              <button
                onClick={() => {
                  setShowAddToPlaylistModal(selectedAsset);
                  if (playlists.length > 0) setTargetPlaylistId(playlists[0].id);
                }}
                className="btn-secondary"
                style={{ height: "44px", justifyContent: "flex-start", padding: "0 14px", gap: "10px", fontSize: "13px", fontWeight: "700" }}
              >
                <ListPlus size={16} /> Add to Playlist
              </button>

              <button
                onClick={() => handleDeleteMedia(selectedAsset)}
                style={{
                  height: "44px",
                  borderRadius: "8px",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  background: "rgba(239, 68, 68, 0.08)",
                  color: "#EF4444",
                  fontSize: "13px",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  padding: "0 14px",
                  gap: "10px"
                }}
              >
                <Trash2 size={16} /> Delete Media
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Fullscreen Preview Modal ─── */}
      {showPreviewModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.9)", zIndex: 120, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ position: "absolute", top: "16px", right: "16px", display: "flex", gap: "12px", zIndex: 130 }}>
            <button
              onClick={() => window.open(showPreviewModal.url, "_blank")}
              style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#FFFFFF", borderRadius: "8px", padding: "8px", cursor: "pointer" }}
            >
              <ExternalLink size={18} />
            </button>
            <button
              onClick={() => setShowPreviewModal(null)}
              style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "#FFFFFF", borderRadius: "8px", padding: "8px", cursor: "pointer" }}
            >
              <X size={18} />
            </button>
          </div>

          <div style={{ maxWidth: "90vw", maxHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {showPreviewModal.type === "video" ? (
              <video src={showPreviewModal.url} controls autoPlay style={{ maxWidth: "100%", maxHeight: "80vh", borderRadius: "8px" }} />
            ) : (
              <img src={showPreviewModal.url} alt={showPreviewModal.name} style={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain", borderRadius: "8px" }} />
            )}
          </div>
          <span style={{ color: "#FFFFFF", marginTop: "12px", fontSize: "14px", fontWeight: "700" }}>{showPreviewModal.name}</span>
        </div>
      )}

      {/* ─── Cast Media Override Modal ─── */}
      {showCastModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.6)", zIndex: 110, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div className="glass-panel" style={{ width: "100%", maxWidth: "440px", background: "var(--card-bg)", borderRadius: "16px", padding: "20px", display: "flex", flexDirection: "column", gap: "14px", boxShadow: "var(--shadow-lg)" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "var(--foreground)" }}>
              Cast "{showCastModal.name}" to TV
            </h3>

            <div>
              <label className="form-label">Select Target Screen</label>
              <select
                value={castScreenId}
                onChange={(e) => setCastScreenId(e.target.value)}
                className="input-field"
                style={{ height: "42px" }}
              >
                {screens.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Display Duration</label>
              <select
                value={castDuration}
                onChange={(e) => setCastDuration(parseInt(e.target.value, 10))}
                className="input-field"
                style={{ height: "42px" }}
              >
                <option value={30}>30 Seconds</option>
                <option value={60}>1 Minute</option>
                <option value={300}>5 Minutes</option>
                <option value={0}>Infinite (Until Cleared)</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
              <button onClick={() => setShowCastModal(null)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button onClick={handleCastToScreen} className="btn-primary" style={{ flex: 1.5, fontWeight: "800" }}>
                Cast to TV Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Add to Playlist Modal ─── */}
      {showAddToPlaylistModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.6)", zIndex: 110, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div className="glass-panel" style={{ width: "100%", maxWidth: "440px", background: "var(--card-bg)", borderRadius: "16px", padding: "20px", display: "flex", flexDirection: "column", gap: "14px", boxShadow: "var(--shadow-lg)" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "var(--foreground)" }}>
              Add to Playlist
            </h3>

            <div>
              <label className="form-label">Select Playlist</label>
              <select
                value={targetPlaylistId}
                onChange={(e) => setTargetPlaylistId(e.target.value)}
                className="input-field"
                style={{ height: "42px" }}
              >
                {playlists.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
              <button onClick={() => setShowAddToPlaylistModal(null)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
              <button onClick={handleAddToPlaylist} className="btn-primary" style={{ flex: 1.5, fontWeight: "800" }}>
                Add to Playlist
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
