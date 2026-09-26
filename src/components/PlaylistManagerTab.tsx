import React, { useState, useEffect } from 'react';
import { Plus, ListVideo, Trash2, MonitorPlay, Zap, Tag as TagIcon, ShieldCheck, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useI18n } from '@/lib/i18n';

interface PlaylistManagerTabProps {
  playlists: any[];
  showCreatePlaylist: boolean;
  setShowCreatePlaylist: (show: boolean) => void;
  newPlaylistName: string;
  setNewPlaylistName: (name: string) => void;
  handleCreatePlaylist: () => void;
  setEditingPlaylist: (playlist: any) => void;
  setActiveTab: (tab: string) => void;
  handleDeletePlaylist: (id: string) => void;
}

export function PlaylistManagerTab({
  playlists,
  showCreatePlaylist,
  setShowCreatePlaylist,
  newPlaylistName,
  setNewPlaylistName,
  handleCreatePlaylist,
  setEditingPlaylist,
  setActiveTab,
  handleDeletePlaylist
}: PlaylistManagerTabProps) {
  const { data: session } = useSession();
  const { t } = useI18n();
  const userRole = (session?.user as any)?.role;
  const isAgent = userRole === 'AGENT';

  // Smart Playlist Modal State
  const [showSmartModal, setShowSmartModal] = useState(false);
  const [smartName, setSmartName] = useState('');
  const [selectedIncludeTags, setSelectedIncludeTags] = useState<string[]>([]);
  const [selectedSortBy, setSelectedSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [maxSmartItems, setMaxSmartItems] = useState(20);
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  const [isCreatingSmart, setIsCreatingSmart] = useState(false);

  useEffect(() => {
    fetch('/api/tags').then(r => r.ok ? r.json() : []).then(setAvailableTags).catch(() => {});
  }, []);

  const handleCreateSmartPlaylist = async () => {
    if (!smartName.trim()) {
      alert('Please enter a playlist name.');
      return;
    }
    setIsCreatingSmart(true);
    try {
      const res = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: smartName.trim(),
          isSmartPlaylist: true,
          smartRules: {
            includeTags: selectedIncludeTags,
            sortBy: selectedSortBy,
            maxItems: maxSmartItems
          }
        })
      });
      if (res.ok) {
        setShowSmartModal(false);
        setSmartName('');
        setSelectedIncludeTags([]);
        window.location.reload(); // Refresh playlists
      } else {
        alert('Failed to create smart playlist.');
      }
    } catch (e) {
      console.error(e);
      alert('Error creating smart playlist.');
    } finally {
      setIsCreatingSmart(false);
    }
  };

  const handleSubmitApproval = async (playlist: any) => {
    try {
      const res = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'playlist', targetId: playlist.id })
      });
      if (res.ok) {
        alert(`Playlist "${playlist.name}" submitted for admin approval.`);
        window.location.reload();
      } else {
        alert('Failed to submit approval request.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const calculateDuration = (playlist: any) => {
    if (!playlist.items) return 0;
    return playlist.items.reduce((total: number, item: any) => {
      if (item.duration) return total + item.duration;
      if (item.media?.duration) return total + item.media.duration;
      if (item.media?.type === 'video') return total;
      return total + 10;
    }, 0);
  };

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return 'Unknown';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>
          {t('playlists.sub_header', 'Create standard slide sequences or rule-based Smart Playlists that auto-populate from tagged content.')}
        </p>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setShowSmartModal(true)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)'
            }}
          >
            <Zap size={16} /> {t('playlists.new_smart', 'New Smart Playlist')}
          </button>
          <button
            onClick={() => setShowCreatePlaylist(true)}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            <Plus size={18} /> {t('playlists.create', 'Create Playlist')}
          </button>
        </div>
      </div>

      {/* Smart Playlist Creator Modal */}
      {showSmartModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="glass-panel" style={{ width: '500px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <Zap size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 'bold' }}>Create Dynamic Smart Playlist</h3>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>Auto-curates slides based on content tags and rules</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="form-label">Playlist Name</label>
              <input
                type="text"
                placeholder="e.g. Flight Promos & Weather"
                value={smartName}
                onChange={e => setSmartName(e.target.value)}
                className="input-field"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label className="form-label">Auto-Include Media with Tags:</label>
              {availableTags.length === 0 ? (
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No tags found. You can add tags in the Media Library.</span>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {availableTags.map(t => {
                    const isSelected = selectedIncludeTags.includes(t.name);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedIncludeTags(selectedIncludeTags.filter(n => n !== t.name));
                          } else {
                            setSelectedIncludeTags([...selectedIncludeTags, t.name]);
                          }
                        }}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          border: `1px solid ${isSelected ? '#8b5cf6' : 'var(--border)'}`,
                          background: isSelected ? '#8b5cf6' : 'var(--background)',
                          color: isSelected ? 'white' : 'var(--text-muted)'
                        }}
                      >
                        #{t.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="form-label">Sort Order</label>
                <select
                  className="input-field"
                  value={selectedSortBy}
                  onChange={e => setSelectedSortBy(e.target.value as any)}
                >
                  <option value="newest">Newest Added First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name">Alphabetical</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="form-label">Max Slides</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={maxSmartItems}
                  onChange={e => setMaxSmartItems(parseInt(e.target.value) || 20)}
                  className="input-field"
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <button className="btn-secondary" onClick={() => setShowSmartModal(false)}>
                Cancel
              </button>
              <button
                onClick={handleCreateSmartPlaylist}
                disabled={isCreatingSmart}
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                  color: 'white',
                  border: 'none',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {isCreatingSmart ? 'Creating...' : 'Create Smart Playlist'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Standard Playlist Form */}
      {showCreatePlaylist && (
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--foreground)', marginBottom: '4px' }}>New Playlist</h3>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Give your playlist a memorable name to get started.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="form-label" htmlFor="playlistName">Playlist Name</label>
            <input
              id="playlistName"
              type="text"
              placeholder="e.g. Morning Ads"
              value={newPlaylistName}
              onChange={e => setNewPlaylistName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreatePlaylist()}
              className="input-field"
              style={{ maxWidth: '480px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              className="btn-secondary"
              onClick={() => setShowCreatePlaylist(false)}
            >
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={handleCreatePlaylist}
            >
              Save Playlist
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {playlists.length === 0 ? (
        <div className="glass-panel" style={{ padding: '64px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <ListVideo size={48} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
          <p style={{ color: 'var(--text-muted)', fontWeight: '500' }}>No playlists created yet.</p>
          <button className="btn-primary" onClick={() => setShowCreatePlaylist(true)} style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} /> Create your first playlist
          </button>
        </div>
      ) : (
        /* Playlist Grid */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {playlists.map(playlist => {
            const isSmart = playlist.isSmartPlaylist;
            const isPendingApproval = playlist.approvalStatus === 'PENDING_REVIEW';
            const isRejected = playlist.approvalStatus === 'REJECTED';

            return (
              <div
                key={playlist.id}
                className="glass-panel"
                style={{ padding: '0', display: 'flex', flexDirection: 'column', minHeight: '220px', overflow: 'hidden', border: isSmart ? '1px solid rgba(139, 92, 246, 0.4)' : undefined }}
              >
                {/* Card Body */}
                <div style={{ padding: '20px 24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Title & Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, overflow: 'hidden' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: isSmart ? 'rgba(139, 92, 246, 0.15)' : 'rgba(44, 76, 124, 0.1)', color: isSmart ? '#8b5cf6' : 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {isSmart ? <Zap size={20} /> : <ListVideo size={20} />}
                      </div>
                      <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {playlist.name}
                      </span>
                    </div>

                    {isSmart && (
                      <span style={{ fontSize: '10px', background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6', border: '1px solid rgba(139, 92, 246, 0.3)', padding: '2px 6px', borderRadius: '6px', fontWeight: 'bold' }}>
                        ⚡ {t('playlists.smart_badge', 'Smart')}
                      </span>
                    )}
                  </div>

                  {/* Status pills */}
                  {(isPendingApproval || isRejected) && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {isPendingApproval && (
                        <span style={{ fontSize: '10px', background: 'rgba(234, 179, 8, 0.15)', color: '#eab308', border: '1px solid rgba(234, 179, 8, 0.3)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                          🟡 {t('playlists.pending_approval', 'Pending Approval')}
                        </span>
                      )}
                      {isRejected && (
                        <span style={{ fontSize: '10px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                          🔴 {t('playlists.rejected', 'Rejected')}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                    {[
                      { label: isSmart ? t('playlists.active_matching', 'Active Matching Slides') : t('playlists.media_items', 'Media Items'), value: playlist.items?.length || 0 },
                      { label: t('playlists.cycle_time', 'Estimated Cycle'), value: formatDuration(calculateDuration(playlist)) },
                      { label: t('playlists.screens_attached', 'Screens Attached'), value: playlist._count?.screens || 0 },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                        <span style={{ color: 'var(--text-muted)' }}>{label}</span>
                        <span style={{ fontWeight: '600', color: 'var(--foreground)' }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Footer */}
                <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    className="btn-secondary"
                    style={{ flex: 1, fontSize: '13px', padding: '8px 12px', height: 'auto' }}
                    onClick={() => { setEditingPlaylist(playlist); setActiveTab('playlists'); }}
                  >
                    {t('playlists.edit_sequence', 'Edit Sequence')}
                  </button>
                  {isAgent && (
                    <button
                      title={t('media.submit_approval', 'Submit for Approval')}
                      className="btn-secondary"
                      style={{ padding: '8px', height: 'auto', flexShrink: 0 }}
                      onClick={() => handleSubmitApproval(playlist)}
                    >
                      <Send size={16} />
                    </button>
                  )}
                  <button
                    title={t('btn.preview', 'Preview Playlist')}
                    className="btn-secondary"
                    style={{ padding: '8px', height: 'auto', flexShrink: 0 }}
                    onClick={() => window.open(`/player?previewPlaylistId=${playlist.id}`, 'TestPlayer', 'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no')}
                  >
                    <MonitorPlay size={16} />
                  </button>
                  <button
                    title={t('btn.delete', 'Delete Playlist')}
                    style={{ padding: '8px', border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', borderRadius: '6px', cursor: 'pointer', color: '#ef4444', flexShrink: 0, transition: 'all 0.2s' }}
                    onClick={() => handleDeletePlaylist(playlist.id)}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

