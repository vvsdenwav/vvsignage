import React, { useState, useEffect, useRef } from 'react';
import { Globe, UploadCloud, FileVideo, Trash2, Folder, FolderPlus, MoreVertical, Search, ArrowDownAZ, Clock, LayoutTemplate, Edit2, ExternalLink, FolderInput, Sparkles, Tag as TagIcon, Calendar, ShieldCheck, Send, Plus, X, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useI18n } from '@/lib/i18n';

interface MediaLibraryTabProps {
  mediaAssets: any[];
  folders: any[];
  refreshMedia: () => Promise<void>;
  refreshFolders: () => Promise<void>;
  onEditCreative?: (creative: any) => void;
  onCreateCreative?: () => void;
  onOpenTemplates?: () => void;
  stats?: any;
}

export function MediaLibraryTab({ mediaAssets, folders, refreshMedia, refreshFolders, onEditCreative, onCreateCreative, onOpenTemplates, stats }: MediaLibraryTabProps) {
  const { data: session } = useSession();
  const { t } = useI18n();
  const userRole = (session?.user as any)?.role;
  const isAgent = userRole === 'AGENT';

  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
  const [visibleLimit, setVisibleLimit] = useState(60);
  
  // Modals
  const [showWebEmbedModal, setShowWebEmbedModal] = useState(false);
  const [webEmbedName, setWebEmbedName] = useState('');
  const [webEmbedUrl, setWebEmbedUrl] = useState('');
  const [newFolderName, setNewFolderName] = useState('');

  // Tag Management State
  const [taggingAsset, setTaggingAsset] = useState<any>(null);
  const [tagInput, setTagInput] = useState('');
  const [allTags, setAllTags] = useState<any[]>([]);

  // Expiration Modal State
  const [expiringAsset, setExpiringAsset] = useState<any>(null);
  const [expirationDateInput, setExpirationDateInput] = useState('');
  
  // Fixed Position Context Menu State (works on right-click & 3 dots)
  const [contextMenu, setContextMenu] = useState<{
    asset: any;
    x: number;
    y: number;
  } | null>(null);

  // Close context menu on global click or scroll
  useEffect(() => {
    const handleClose = () => setContextMenu(null);
    window.addEventListener('click', handleClose);
    window.addEventListener('scroll', handleClose, true);
    return () => {
      window.removeEventListener('click', handleClose);
      window.removeEventListener('scroll', handleClose, true);
    };
  }, []);

  const handleOpenContextMenu = (e: React.MouseEvent, asset: any) => {
    e.preventDefault();
    e.stopPropagation();

    // Keep menu within viewport boundaries
    const menuWidth = 220;
    const menuHeight = 260;
    const x = Math.min(e.clientX, window.innerWidth - menuWidth - 10);
    const y = Math.min(e.clientY, window.innerHeight - menuHeight - 10);

    setContextMenu({ asset, x, y });
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await fetch('/api/media/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName })
      });
      setNewFolderName('');
      refreshFolders();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteFolder = async (id: string) => {
    if (!confirm('Delete this folder? Media will be moved to root.')) return;
    try {
      await fetch(`/api/media/folders/${id}`, { method: 'DELETE' });
      if (selectedFolderId === id) setSelectedFolderId(null);
      refreshFolders();
      refreshMedia();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (selectedFolderId) {
        formData.append('folderId', selectedFolderId);
      }

      const res = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Upload failed');
      }

      await refreshMedia();
    } catch (err: any) {
      console.error("Upload failed", err);
      alert(`Upload Failed: ${err?.message || 'Network error during file upload.'}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleWebEmbed = async () => {
    try {
      await fetch('/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: webEmbedName, url: webEmbedUrl, folderId: selectedFolderId })
      });
      setShowWebEmbedModal(false);
      setWebEmbedName('');
      setWebEmbedUrl('');
      refreshMedia();
    } catch (err) {
      console.error("Embed failed", err);
    }
  };

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const res = await fetch('/api/tags');
      if (res.ok) setAllTags(await res.json());
    } catch (e) {}
  };

  const handleSaveTags = async (assetId: string, tagsArray: string[]) => {
    try {
      const res = await fetch(`/api/media/${assetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagNames: tagsArray })
      });
      if (res.ok) {
        await refreshMedia();
        await fetchTags();
        setTaggingAsset(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveExpiration = async (assetId: string, expiresAt: string | null) => {
    try {
      const res = await fetch(`/api/media/${assetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresAt })
      });
      if (res.ok) {
        await refreshMedia();
        setExpiringAsset(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmitApproval = async (asset: any) => {
    try {
      const res = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'media', targetId: asset.id })
      });
      if (res.ok) {
        await refreshMedia();
        alert(`"${asset.name}" submitted for admin review.`);
      } else {
        alert('Failed to submit approval request.');
      }
    } catch (e) {
      console.error(e);
      alert('Error submitting approval request.');
    }
  };

  const handleDeleteMedia = async (id: string) => {
    if (!confirm("Are you sure you want to delete this media?")) return;
    try {
      await fetch(`/api/media/${id}`, { method: 'DELETE' });
      refreshMedia();
    } catch (e) {
      console.error(e);
    }
  };

  const handleMoveMedia = async (mediaId: string, targetFolderId: string | null) => {
    try {
      await fetch(`/api/media/${mediaId}/move`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId: targetFolderId })
      });
      refreshMedia();
      refreshFolders();
    } catch (e) {
      console.error(e);
    }
  };

  // Drag and Drop Logic
  const onDragStart = (e: React.DragEvent, mediaId: string) => {
    e.dataTransfer.setData('mediaId', mediaId);
  };
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  const onDropToFolder = (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    const mediaId = e.dataTransfer.getData('mediaId');
    if (mediaId) {
      handleMoveMedia(mediaId, targetFolderId);
    }
  };

  // Filtering & Sorting
  const folderIds = new Set(folders.map((f: any) => f.id));
  let currentAssets = mediaAssets.filter(a => {
    const effectiveFolderId = (a.folderId && folderIds.has(a.folderId)) ? a.folderId : null;
    const matchFolder = selectedFolderId ? effectiveFolderId === selectedFolderId : !effectiveFolderId;
    const matchTag = selectedTag ? a.tags?.some((t: any) => t.name === selectedTag) : true;
    return matchFolder && matchTag;
  });
  
  if (searchQuery) {
    currentAssets = currentAssets.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }
  
  currentAssets.sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const isAtStorageLimit = stats?.plan?.storageLimitMb ? (stats?.storageUsedMb || 0) >= stats.plan.storageLimitMb : false;

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 216px)', gap: '24px', color: 'var(--foreground)' }}>
      
      {/* ─── Left Pane: Folders ─── */}
      <div style={{ width: '256px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '16px', borderRight: '1px solid var(--border)', paddingRight: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>{t('media.folders', 'Folders')}</h3>
        </div>
        
        {/* Create Folder Form */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <input 
            type="text" 
            placeholder={t('media.new_folder_placeholder', 'New folder name...')} 
            value={newFolderName} 
            onChange={e => setNewFolderName(e.target.value)}
            style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', flex: 1 }}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
          />
          <button 
            onClick={handleCreateFolder} 
            style={{ padding: '8px', borderRadius: '8px', background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--foreground)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            title={t('media.folders', 'Create Folder')}
          >
            <FolderPlus size={16} />
          </button>
        </div>

        {/* Folder List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', paddingRight: '4px' }} className="custom-scroll">
          {/* Root Folder */}
          <div 
            onClick={() => setSelectedFolderId(null)}
            onDragOver={onDragOver}
            onDrop={(e) => onDropToFolder(e, null)}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', userSelect: 'none', transition: 'all 0.2s', background: selectedFolderId === null ? 'var(--brand-primary)' : 'transparent', color: selectedFolderId === null ? 'white' : 'var(--foreground)', fontWeight: selectedFolderId === null ? 'bold' : 'normal', boxShadow: selectedFolderId === null ? 'var(--shadow-sm)' : 'none' }}
          >
            <Folder size={16} style={{ color: selectedFolderId === null ? 'rgba(255,255,255,0.7)' : 'var(--brand-primary)' }} />
            <span style={{ fontSize: '12px', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t('media.root_directory', 'Root Directory')}</span>
            <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace', background: selectedFolderId === null ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)', color: selectedFolderId === null ? 'white' : 'var(--text-muted)' }}>
              {mediaAssets.filter(a => !(a.folderId && folderIds.has(a.folderId))).length}
            </span>
          </div>

          {/* Subfolders */}
          {folders.map(f => (
            <div 
              key={f.id}
              onClick={() => setSelectedFolderId(f.id)}
              onDragOver={onDragOver}
              onDrop={(e) => onDropToFolder(e, f.id)}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', userSelect: 'none', transition: 'all 0.2s', background: selectedFolderId === f.id ? 'var(--brand-primary)' : 'transparent', color: selectedFolderId === f.id ? 'white' : 'var(--foreground)', fontWeight: selectedFolderId === f.id ? 'bold' : 'normal', boxShadow: selectedFolderId === f.id ? 'var(--shadow-sm)' : 'none', position: 'relative' }}
              onMouseOver={(e) => {
                const btn = e.currentTarget.querySelector('button');
                if(btn) btn.style.opacity = '1';
                if(selectedFolderId !== f.id) e.currentTarget.style.background = 'var(--muted)';
              }}
              onMouseOut={(e) => {
                const btn = e.currentTarget.querySelector('button');
                if(btn) btn.style.opacity = '0';
                if(selectedFolderId !== f.id) e.currentTarget.style.background = 'transparent';
              }}
            >
              <Folder size={16} style={{ color: selectedFolderId === f.id ? 'rgba(255,255,255,0.7)' : 'var(--brand-secondary)' }} />
              <span style={{ fontSize: '12px', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.name}</span>
              <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace', background: selectedFolderId === f.id ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)', color: selectedFolderId === f.id ? 'white' : 'var(--text-muted)' }}>
                {f._count?.assets || 0}
              </span>
              {selectedFolderId === f.id && (
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteFolder(f.id); }} 
                  style={{ opacity: 0, transition: 'opacity 0.2s', padding: '2px', background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}
                  title={t('btn.delete', 'Delete Folder')}
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ─── Right Pane: Media Assets ─── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', paddingRight: '8px' }} className="custom-scroll">
        
        {/* Top Controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '384px' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder={t('media.search_placeholder', 'Search media...')} 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ padding: '8px 12px 8px 36px', fontSize: '12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', width: '100%' }}
              />
            </div>
            <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
              <button 
                onClick={() => setSortBy('date')} 
                style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', border: 'none', background: sortBy === 'date' ? 'var(--accent)' : 'var(--card-bg)', color: sortBy === 'date' ? 'var(--brand-primary)' : 'var(--text-muted)', fontWeight: sortBy === 'date' ? 'bold' : 'normal' }}
              >
                <Clock size={12}/> {t('media.sort_date', 'Date')}
              </button>
              <button 
                onClick={() => setSortBy('name')} 
                style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', border: 'none', borderLeft: '1px solid var(--border)', background: sortBy === 'name' ? 'var(--accent)' : 'var(--card-bg)', color: sortBy === 'name' ? 'var(--brand-primary)' : 'var(--text-muted)', fontWeight: sortBy === 'name' ? 'bold' : 'normal' }}
              >
                <ArrowDownAZ size={12}/> {t('media.sort_name', 'Name')}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {onOpenTemplates && (
              <button 
                onClick={onOpenTemplates}
                style={{ fontSize: '12px', padding: '6px 14px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, #0284c7, var(--brand-primary))', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)' }}
              >
                <Sparkles size={14} /> {t('media.browse_templates', 'Browse Templates')}
              </button>
            )}

            {isAtStorageLimit ? (
              <button 
                onClick={() => alert('Storage limit reached! Please upgrade your plan to upload more media.')}
                style={{ fontSize: '12px', padding: '6px 14px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}
              >
                <UploadCloud size={14} /> {t('media.upgrade_storage', 'Upgrade Storage')}
              </button>
            ) : (
              <>
                <button 
                  onClick={() => setShowWebEmbedModal(true)} 
                  style={{ fontSize: '12px', padding: '6px 12px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--foreground)', cursor: 'pointer' }}
                >
                  <Globe size={14} /> {t('media.add_embed', 'Add Embed')}
                </button>
                <input type="file" accept="image/*,video/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleUpload} />
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={isUploading}
                  style={{ fontSize: '12px', padding: '6px 14px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--brand-primary)', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  <UploadCloud size={14} /> {isUploading ? 'Uploading...' : t('btn.upload', 'Upload File')}
                </button>
                <button 
                  onClick={() => onCreateCreative?.()}
                  style={{ fontSize: '12px', padding: '6px 14px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px', background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-accent))', border: 'none', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  <LayoutTemplate size={14} /> {t('media.create_creative', 'Create Creative')}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tags Filter Row */}
        {allTags.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', marginRight: '4px' }}>
              <TagIcon size={12} /> Tags:
            </span>
            <button
              onClick={() => setSelectedTag(null)}
              style={{
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: '12px',
                border: `1px solid ${selectedTag === null ? 'var(--brand-primary)' : 'var(--border)'}`,
                background: selectedTag === null ? 'var(--brand-primary)' : 'transparent',
                color: selectedTag === null ? 'white' : 'var(--text-muted)',
                cursor: 'pointer',
                fontWeight: selectedTag === null ? 'bold' : 'normal'
              }}
            >
              All
            </button>
            {allTags.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTag(selectedTag === t.name ? null : t.name)}
                style={{
                  fontSize: '11px',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  border: `1px solid ${selectedTag === t.name ? (t.color || 'var(--brand-primary)') : 'var(--border)'}`,
                  background: selectedTag === t.name ? (t.color || 'var(--brand-primary)') : 'transparent',
                  color: selectedTag === t.name ? 'white' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontWeight: selectedTag === t.name ? 'bold' : 'normal'
                }}
              >
                #{t.name}
              </button>
            ))}
          </div>
        )}

        {/* Media Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
          {currentAssets.slice(0, visibleLimit).map(asset => {
            const isExpired = asset.expiresAt && new Date(asset.expiresAt).getTime() < Date.now();
            const hasExpiration = !!asset.expiresAt;
            return (
              <div 
                key={asset.id} 
                draggable
                onDragStart={(e) => onDragStart(e, asset.id)}
                onContextMenu={(e) => handleOpenContextMenu(e, asset)}
                className="glass-panel"
                style={{ 
                  borderRadius: '12px', 
                  overflow: 'hidden', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  border: isExpired ? '1px solid #EF4444' : '1px solid var(--border)',
                  opacity: isExpired ? 0.65 : 1,
                  position: 'relative'
                }}
              >
                {/* Media Preview Box */}
                <div style={{ height: '120px', background: 'var(--muted)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {asset.type === 'video' ? (
                    <video src={asset.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted />
                  ) : asset.type === 'canvas' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', color: 'var(--brand-secondary)' }}>
                      <LayoutTemplate size={32} />
                      <span style={{ fontSize: '10px', fontWeight: 'bold' }}>Creative Canvas</span>
                    </div>
                  ) : asset.type === 'web' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', color: 'var(--brand-primary)' }}>
                      <Globe size={32} />
                      <span style={{ fontSize: '10px', fontWeight: 'bold' }}>Web Embed</span>
                    </div>
                  ) : (
                    <img src={asset.url} alt={asset.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}

                  {/* Top-Right Action Menu Trigger */}
                  <button 
                    onClick={(e) => handleOpenContextMenu(e, asset)}
                    style={{ position: 'absolute', top: '6px', right: '6px', width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
                  >
                    <MoreVertical size={14} />
                  </button>

                  {/* Approval Status Badge */}
                  {asset.approvalStatus && asset.approvalStatus !== 'DRAFT' && (
                    <div style={{ 
                      position: 'absolute', bottom: '6px', left: '6px', 
                      fontSize: '9px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px',
                      background: asset.approvalStatus === 'APPROVED' ? '#10B981' : asset.approvalStatus === 'PENDING_REVIEW' ? '#F59E0B' : '#EF4444',
                      color: 'white', display: 'flex', alignItems: 'center', gap: '3px'
                    }}>
                      {asset.approvalStatus === 'APPROVED' ? <CheckCircle2 size={10} /> : <AlertTriangle size={10} />}
                      {asset.approvalStatus === 'PENDING_REVIEW' ? 'PENDING' : asset.approvalStatus}
                    </div>
                  )}

                  {/* Expiration Badge */}
                  {hasExpiration && (
                    <div style={{
                      position: 'absolute', top: '6px', left: '6px',
                      fontSize: '9px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px',
                      background: isExpired ? '#EF4444' : 'rgba(0,0,0,0.6)',
                      color: 'white', display: 'flex', alignItems: 'center', gap: '3px'
                    }}>
                      <Calendar size={10} />
                      {isExpired ? 'EXPIRED' : new Date(asset.expiresAt).toLocaleDateString([], { month: 'numeric', day: 'numeric' })}
                    </div>
                  )}
                </div>

                {/* Footer Info */}
                <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={asset.name}>
                    {asset.name}
                  </span>
                  
                  {/* Tag Chips */}
                  {asset.tags && asset.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '2px' }}>
                      {asset.tags.slice(0, 3).map((tg: any) => (
                        <span key={tg.id} style={{ fontSize: '10px', color: 'var(--brand-primary)', background: 'rgba(59, 130, 246, 0.1)', padding: '1px 5px', borderRadius: '4px' }}>
                          #{tg.name}
                        </span>
                      ))}
                      {asset.tags.length > 3 && (
                        <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>+{asset.tags.length - 3}</span>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {new Date(asset.createdAt).toLocaleDateString()}
                    </span>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                      {asset.type}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {currentAssets.length === 0 && (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <FileVideo size={48} style={{ opacity: 0.3 }} />
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>No media assets found</h4>
            <p style={{ margin: 0, fontSize: '13px' }}>Upload images/videos or create a canvas design to get started.</p>
          </div>
        )}

        {/* Load More Button */}
        {currentAssets.length > visibleLimit && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
            <button onClick={() => setVisibleLimit(prev => prev + 60)} className="btn-secondary" style={{ fontSize: '13px' }}>
              Load More Assets ({currentAssets.length - visibleLimit} remaining)
            </button>
          </div>
        )}

        {/* Fixed Context Menu */}
        {contextMenu && (
          <div 
            style={{
              position: 'fixed',
              left: `${contextMenu.x}px`,
              top: `${contextMenu.y}px`,
              zIndex: 999999,
              background: 'var(--card-bg)',
              border: '1px solid var(--border)',
              borderRadius: '10px',
              boxShadow: 'var(--shadow-lg)',
              minWidth: '200px',
              padding: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {contextMenu.asset.type === 'canvas' && onEditCreative && (
              <button 
                onClick={() => { onEditCreative(contextMenu.asset); setContextMenu(null); }}
                style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', borderRadius: '6px', color: 'var(--foreground)', cursor: 'pointer', fontSize: '13px', textAlign: 'left' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--muted)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Edit2 size={14} color="var(--brand-primary)" /> {t('media.edit_creative', 'Edit Creative')}
              </button>
            )}

            <button 
              onClick={() => { setTaggingAsset(contextMenu.asset); setContextMenu(null); }}
              style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', borderRadius: '6px', color: 'var(--foreground)', cursor: 'pointer', fontSize: '13px', textAlign: 'left' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--muted)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <TagIcon size={14} color="var(--brand-primary)" /> {t('media.manage_tags', 'Manage Tags')}
            </button>

            <button 
              onClick={() => { 
                setExpiringAsset(contextMenu.asset); 
                setExpirationDateInput(contextMenu.asset.expiresAt ? new Date(contextMenu.asset.expiresAt).toISOString().slice(0, 16) : '');
                setContextMenu(null); 
              }}
              style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', borderRadius: '6px', color: 'var(--foreground)', cursor: 'pointer', fontSize: '13px', textAlign: 'left' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--muted)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Calendar size={14} color="var(--brand-primary)" /> {t('media.set_expiration', 'Set Expiration Date')}
            </button>

            {isAgent && (
              <button 
                onClick={() => { handleSubmitApproval(contextMenu.asset); setContextMenu(null); }}
                style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', borderRadius: '6px', color: 'var(--foreground)', cursor: 'pointer', fontSize: '13px', textAlign: 'left' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--muted)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Send size={14} color="var(--brand-secondary)" /> {t('media.submit_approval', 'Submit for Approval')}
              </button>
            )}

            <a 
              href={contextMenu.asset.url} 
              target="_blank" 
              rel="noreferrer"
              style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', borderRadius: '6px', color: 'var(--foreground)', textDecoration: 'none', fontSize: '13px', textAlign: 'left' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--muted)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <ExternalLink size={14} /> {t('media.open_new_tab', 'Open in New Tab')}
            </a>

            <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />

            <button 
              onClick={() => { handleDeleteMedia(contextMenu.asset.id); setContextMenu(null); }}
              style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', borderRadius: '6px', color: '#EF4444', cursor: 'pointer', fontSize: '13px', textAlign: 'left' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Trash2 size={14} /> {t('media.delete_media', 'Delete Media')}
            </button>
          </div>
        )}

        {/* Tag Management Modal */}
        {taggingAsset && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div className="glass-panel" style={{ width: '420px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', borderRadius: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TagIcon size={16} color="var(--brand-primary)" /> Manage Tags for "{taggingAsset.name}"
                </h3>
                <button onClick={() => setTaggingAsset(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Enter tag (e.g. promo, seasonal)..."
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && tagInput.trim()) {
                      e.preventDefault();
                      const existing = (taggingAsset.tags || []).map((t: any) => t.name);
                      if (!existing.includes(tagInput.trim().toLowerCase())) {
                        handleSaveTags(taggingAsset.id, [...existing, tagInput.trim().toLowerCase()]);
                        setTagInput('');
                      }
                    }
                  }}
                  style={{ flex: 1, padding: '8px 12px', fontSize: '13px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                />
                <button
                  onClick={() => {
                    if (!tagInput.trim()) return;
                    const existing = (taggingAsset.tags || []).map((t: any) => t.name);
                    if (!existing.includes(tagInput.trim().toLowerCase())) {
                      handleSaveTags(taggingAsset.id, [...existing, tagInput.trim().toLowerCase()]);
                      setTagInput('');
                    }
                  }}
                  style={{ padding: '8px 14px', borderRadius: '8px', background: 'var(--brand-primary)', border: 'none', color: 'white', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer' }}
                >
                  Add
                </button>
              </div>

              {/* Current Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', minHeight: '40px' }}>
                {(taggingAsset.tags || []).length === 0 ? (
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No tags assigned yet.</span>
                ) : (
                  taggingAsset.tags.map((t: any) => (
                    <span key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--brand-primary)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                      #{t.name}
                      <button
                        onClick={() => {
                          const filtered = (taggingAsset.tags || []).map((tg: any) => tg.name).filter((n: string) => n !== t.name);
                          handleSaveTags(taggingAsset.id, filtered);
                        }}
                        style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                <button onClick={() => setTaggingAsset(null)} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '12px' }}>
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Expiration Date Modal */}
        {expiringAsset && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div className="glass-panel" style={{ width: '400px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', borderRadius: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={16} color="var(--brand-primary)" /> Set Expiration Date
                </h3>
                <button onClick={() => setExpiringAsset(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>

              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                This media will automatically stop playing in all playlists after this date.
              </p>

              <input
                type="datetime-local"
                value={expirationDateInput}
                onChange={e => setExpirationDateInput(e.target.value)}
                style={{ padding: '8px 12px', fontSize: '13px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                <button
                  onClick={() => handleSaveExpiration(expiringAsset.id, null)}
                  style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                >
                  Clear Expiration
                </button>
                <button
                  onClick={() => handleSaveExpiration(expiringAsset.id, expirationDateInput ? new Date(expirationDateInput).toISOString() : null)}
                  style={{ background: 'var(--brand-primary)', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Save Date
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
