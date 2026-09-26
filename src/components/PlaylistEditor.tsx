import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, MonitorPlay, Globe, LayoutTemplate, ChevronUp, ChevronDown, Trash2, Plus, Check, GripVertical, CheckCircle2, X, HardDriveDownload, CloudSun, History, Calendar, RotateCcw, Clock, AlertCircle } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface PlaylistEditorProps {
  editingPlaylist: any;
  setEditingPlaylist: (playlist: any) => void;
  mediaAssets: any[];
  folders: any[];
  widgets: any[];
  screens: any[];
  setEditingWidget: (widget: any) => void;
  refreshPlaylists: () => Promise<void>;
  handleAssignPlaylist: (screenId: string, playlistId: string) => void;
  isScreenOnline: (screen: any) => boolean;
  onExit: () => void;
}

function SortablePlaylistItem({ 
  item, 
  idx, 
  playlistLength,
  updateItemDuration, 
  updateItemTransition, 
  updateItemCondition,
  updateItemSchedule,
  handleMoveItem, 
  removeFromPlaylist 
}: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const [showConditions, setShowConditions] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

  let parsedCondition: any = null;
  try {
    if (item.conditionPayload) parsedCondition = JSON.parse(item.conditionPayload);
  } catch (e) {}

  const now = new Date();
  const effectiveUntil = item.activeUntil || item.media?.expiresAt;
  const isExpired = effectiveUntil && new Date(effectiveUntil) < now;
  const isFuture = item.activeFrom && new Date(item.activeFrom) > now;
  const hasSchedule = item.activeFrom || effectiveUntil;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : (isExpired ? 0.6 : 1),
    zIndex: isDragging ? 10 : 1,
    position: 'relative' as any,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div 
        style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: '8px',
          padding: '12px 16px', 
          background: isExpired ? 'rgba(239, 68, 68, 0.05)' : 'var(--background)', 
          border: `1px solid ${isExpired ? 'rgba(239, 68, 68, 0.3)' : 'var(--border)'}`, 
          borderRadius: '12px' 
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div 
            {...attributes} 
            {...listeners} 
            style={{ cursor: 'grab', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}
          >
            <GripVertical size={20} />
          </div>
          <div style={{ fontWeight: 'bold', color: 'var(--text-muted)', width: '24px', fontSize: '14px', textAlign: 'center' }}>
            {idx + 1}
          </div>
          <div style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', background: 'var(--card-bg)' }}>
            {item.media ? (
              item.media.type === 'image' ? (
                <img src={item.media.url} alt={item.media.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : item.media.type === 'video' ? (
                <video src={item.media.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted playsInline preload="metadata" />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-primary)' }}>
                  <Globe size={24} />
                </div>
              )
            ) : item.widget ? (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(138, 146, 255, 0.1)', color: 'var(--brand-primary)' }}>
                <LayoutTemplate size={24} />
              </div>
            ) : null}
          </div>
          
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '600', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span>{item.media ? item.media.name : item.widget ? item.widget.name : 'Unknown Item'}</span>
              
              {isExpired && (
                <span style={{ fontSize: '10px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                  🔴 Expired
                </span>
              )}
              {isFuture && (
                <span style={{ fontSize: '10px', background: 'rgba(234, 179, 8, 0.15)', color: '#eab308', border: '1px solid rgba(234, 179, 8, 0.3)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                  🟡 Scheduled
                </span>
              )}
              {!isExpired && !isFuture && hasSchedule && (
                <span style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                  🟢 Active Schedule
                </span>
              )}

              {parsedCondition?.enabled && (
                <span style={{ fontSize: '10px', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--brand-primary)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>
                  ⛅ {parsedCondition.type === 'temperature' ? `${parsedCondition.tempOperator === 'gt' ? '>' : '<'} ${parsedCondition.tempValue}°` : parsedCondition.weatherCondition}
                </span>
              )}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '2px' }}>
              {item.media ? item.media.type : item.widget ? `Widget (${item.widget.type})` : 'Slide'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Duration (s):</label>
            <input 
              type="number" 
              min="1"
              value={item.duration || 10}
              onChange={(e) => updateItemDuration(item.id, parseInt(e.target.value) || 10)}
              style={{ width: '60px', padding: '6px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--foreground)' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold' }}>ANIMATION:</label>
            <select 
              value={item.transition || ''}
              onChange={(e) => updateItemTransition(item.id, e.target.value === '' ? null : e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--foreground)', fontSize: '12px' }}
            >
              <option value="">Default (Playlist)</option>
              <option value="none">None (Cut)</option>
              <option value="fade">Fade (Cross-fade)</option>
              <option value="zoom-in">Zoom In</option>
              <option value="flip-in">Flip In</option>
              <option value="blur-fade">Blur Fade</option>
              <option value="slide-left">Slide Left</option>
              <option value="slide-right">Slide Right</option>
              <option value="slide-up">Slide Up</option>
              <option value="slide-down">Slide Down</option>
            </select>
          </div>

          {/* Schedule / Auto-Expiration button */}
          <button
            onClick={() => setShowSchedule(!showSchedule)}
            title={hasSchedule ? "Active Date Window Configured (Click to edit)" : "Set Start / Expiration Dates"}
            style={{
              background: hasSchedule ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              color: hasSchedule ? '#10b981' : 'var(--text-muted)',
              border: `1px solid ${hasSchedule ? 'rgba(16, 185, 129, 0.3)' : 'var(--border)'}`,
              padding: '6px 8px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Calendar size={15} />
          </button>

          {/* Weather condition button */}
          <button
            onClick={() => setShowConditions(!showConditions)}
            title={parsedCondition?.enabled ? "Weather Rule Active (Click to edit)" : "Configure Weather-Conditional Playback (Optional)"}
            style={{
              background: parsedCondition?.enabled ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
              color: parsedCondition?.enabled ? 'var(--brand-primary)' : 'var(--text-muted)',
              border: `1px solid ${parsedCondition?.enabled ? 'rgba(59, 130, 246, 0.3)' : 'var(--border)'}`,
              padding: '6px 8px',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <CloudSun size={15} />
          </button>

          <div style={{ display: 'flex', gap: '4px' }}>
            <button 
              onClick={() => handleMoveItem(idx, 'up')}
              disabled={idx === 0}
              style={{ background: 'transparent', border: 'none', color: idx === 0 ? 'var(--border)' : 'var(--foreground)', cursor: idx === 0 ? 'default' : 'pointer', padding: '4px' }}
            >
              <ChevronUp size={18} />
            </button>
            <button 
              onClick={() => handleMoveItem(idx, 'down')}
              disabled={idx === playlistLength - 1}
              style={{ background: 'transparent', border: 'none', color: idx === playlistLength - 1 ? 'var(--border)' : 'var(--foreground)', cursor: idx === playlistLength - 1 ? 'default' : 'pointer', padding: '4px' }}
            >
              <ChevronDown size={18} />
            </button>
            <button 
              onClick={() => removeFromPlaylist(item.id)}
              style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        {/* Collapsible Auto-Expiration / Schedule Panel */}
        {showSchedule && (
          <aside style={{ padding: '12px 16px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={15} color="var(--brand-primary)" /> Campaign Active & Expiration Dates
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Slide automatically starts and self-evicts at scheduled times</span>
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>ACTIVE FROM (OPTIONAL):</label>
                <input 
                  type="datetime-local"
                  value={item.activeFrom ? new Date(new Date(item.activeFrom).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                  onChange={e => updateItemSchedule(item.id, e.target.value ? new Date(e.target.value).toISOString() : null, item.activeUntil)}
                  style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '12px' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>AUTO-EXPIRE AT (OPTIONAL):</label>
                <input 
                  type="datetime-local"
                  value={item.activeUntil ? new Date(new Date(item.activeUntil).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                  onChange={e => updateItemSchedule(item.id, item.activeFrom, e.target.value ? new Date(e.target.value).toISOString() : null)}
                  style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '12px' }}
                />
              </div>

              {(item.activeFrom || item.activeUntil) && (
                <button
                  onClick={() => updateItemSchedule(item.id, null, null)}
                  style={{ alignSelf: 'flex-end', padding: '6px 12px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer' }}
                >
                  Clear Dates
                </button>
              )}
            </div>
          </aside>
        )}

        {/* Collapsible Weather Rules Panel */}
        {showConditions && (
          <aside style={{ padding: '12px 16px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                <input 
                  type="checkbox"
                  checked={parsedCondition?.enabled || false}
                  onChange={e => {
                    const updated = {
                      enabled: e.target.checked,
                      type: parsedCondition?.type || 'condition',
                      weatherCondition: parsedCondition?.weatherCondition || 'Rain',
                      tempOperator: parsedCondition?.tempOperator || 'gt',
                      tempValue: parsedCondition?.tempValue !== undefined ? parsedCondition.tempValue : 75
                    };
                    updateItemCondition(item.id, e.target.checked ? JSON.stringify(updated) : null);
                  }}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <span>Enable Weather-Conditional Playback</span>
              </label>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Slide plays only when matching local weather</span>
            </div>

            {parsedCondition?.enabled && (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                <select
                  value={parsedCondition.type || 'condition'}
                  onChange={e => {
                    const updated = { ...parsedCondition, type: e.target.value };
                    updateItemCondition(item.id, JSON.stringify(updated));
                  }}
                  style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '12px' }}
                >
                  <option value="condition">Match Weather Condition (Rain, Snow, Sunny, Clouds)</option>
                  <option value="temperature">Match Local Temperature Range</option>
                </select>

                {parsedCondition.type === 'temperature' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <select
                      value={parsedCondition.tempOperator || 'gt'}
                      onChange={e => {
                        const updated = { ...parsedCondition, tempOperator: e.target.value };
                        updateItemCondition(item.id, JSON.stringify(updated));
                      }}
                      style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '12px' }}
                    >
                      <option value="gt">Warmer Than (&gt;)</option>
                      <option value="lt">Colder Than (&lt;)</option>
                    </select>
                    <input 
                      type="number"
                      value={parsedCondition.tempValue !== undefined ? parsedCondition.tempValue : 75}
                      onChange={e => {
                        const updated = { ...parsedCondition, tempValue: parseInt(e.target.value) || 0 };
                        updateItemCondition(item.id, JSON.stringify(updated));
                      }}
                      style={{ width: '60px', padding: '6px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '12px' }}
                    />
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>°F</span>
                  </div>
                ) : (
                  <select
                    value={parsedCondition.weatherCondition || 'Rain'}
                    onChange={e => {
                      const updated = { ...parsedCondition, weatherCondition: e.target.value };
                      updateItemCondition(item.id, JSON.stringify(updated));
                    }}
                    style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '12px' }}
                  >
                    <option value="Rain">🌧️ Raining / Drizzle</option>
                    <option value="Snow">❄️ Snowing / Freezing</option>
                    <option value="Clear">☀️ Clear / Sunny</option>
                    <option value="Clouds">☁️ Overcast / Cloudy</option>
                    <option value="Thunderstorm">⛈️ Thunderstorm</option>
                  </select>
                )}
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}

export function PlaylistEditor({
  editingPlaylist, setEditingPlaylist, mediaAssets, folders, widgets, screens,
  setEditingWidget, refreshPlaylists, handleAssignPlaylist, isScreenOnline, onExit
}: PlaylistEditorProps) {
  const [playlistMediaFolder, setPlaylistMediaFolder] = useState<string>('all');
  const [playlistMediaSort, setPlaylistMediaSort] = useState<'date' | 'name'>('date');

  // Real-time Offline Ready Sync Toasts State
  interface SyncToast {
    id: string;
    screenName: string;
    message: string;
    timestamp: number;
  }
  const [syncToasts, setSyncToasts] = useState<SyncToast[]>([]);
  const [syncedScreens, setSyncedScreens] = useState<Record<string, { timestamp: number; message: string }>>({});
  const lastCheckedRef = useRef<number>(Date.now() - 5000);
  const seenEventsRef = useRef<Set<string>>(new Set());

  // Poll for TV sync events while editing this playlist
  useEffect(() => {
    if (!editingPlaylist?.id) return;

    const checkSyncStatus = async () => {
      try {
        const res = await fetch(`/api/playlists/${editingPlaylist.id}/sync-status?since=${lastCheckedRef.current}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.events && Array.isArray(data.events) && data.events.length > 0) {
          lastCheckedRef.current = Date.now();
          const newToasts: SyncToast[] = [];

          data.events.forEach((evt: any) => {
            if (!seenEventsRef.current.has(evt.id)) {
              seenEventsRef.current.add(evt.id);
              newToasts.push({
                id: evt.id,
                screenName: evt.screenName || 'TV Screen',
                message: evt.message || `New playlist ready for offline on: ${evt.screenName} (old cache removed)`,
                timestamp: evt.timestamp || Date.now()
              });

              if (evt.screenId) {
                setSyncedScreens(prev => ({
                  ...prev,
                  [evt.screenId]: { timestamp: evt.timestamp, message: evt.message }
                }));
              }
            }
          });

          if (newToasts.length > 0) {
            setSyncToasts(prev => [...prev, ...newToasts]);

            // Auto-dismiss each toast after 6 seconds with smooth fade
            newToasts.forEach(toast => {
              setTimeout(() => {
                setSyncToasts(prev => prev.filter(t => t.id !== toast.id));
              }, 6000);
            });
          }
        }
      } catch (e) {
        // Silently skip on error
      }
    };

    const interval = setInterval(checkSyncStatus, 2500);
    checkSyncStatus();

    return () => clearInterval(interval);
  }, [editingPlaylist?.id]);

  const addToPlaylist = async (mediaId: string) => {
    if (!editingPlaylist) return;
    try {
      const res = await fetch(`/api/playlists/${editingPlaylist.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaId, duration: 10 })
      });
      if (res.ok) {
        await refreshPlaylists();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const addWidgetToPlaylist = async (widgetId: string) => {
    if (!editingPlaylist) return;
    try {
      const res = await fetch(`/api/playlists/${editingPlaylist.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ widgetId, duration: 10 })
      });
      if (res.ok) {
        await refreshPlaylists();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const addOverlayToPlaylist = async (widgetId: string) => {
    if (!editingPlaylist) return;
    try {
      const res = await fetch(`/api/playlists/${editingPlaylist.id}/overlays`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ widgetId })
      });
      if (res.ok) {
        await refreshPlaylists();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const removeOverlay = async (overlayId: string) => {
    if (!editingPlaylist) return;
    try {
      const res = await fetch(`/api/playlists/${editingPlaylist.id}/overlays/${overlayId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setEditingPlaylist({ ...editingPlaylist, overlays: editingPlaylist.overlays.filter((o: any) => o.id !== overlayId) });
        await refreshPlaylists();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const removeFromPlaylist = async (itemId: string) => {
    try {
      const res = await fetch(`/api/playlists/items/${itemId}`, { method: 'DELETE' });
      if (res.ok) {
        setEditingPlaylist({ ...editingPlaylist, items: editingPlaylist.items.filter((i: any) => i.id !== itemId) });
        await refreshPlaylists();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updatePlaylistTransition = async (transition: string) => {
    try {
      const res = await fetch(`/api/playlists/${editingPlaylist.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transition })
      });
      if (res.ok) {
        setEditingPlaylist({ ...editingPlaylist, transition });
        await refreshPlaylists();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updatePlaylistSchedule = async (updates: { startTime?: string; endTime?: string; daysOfWeek?: string }) => {
    try {
      const res = await fetch(`/api/playlists/${editingPlaylist.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        setEditingPlaylist({ ...editingPlaylist, ...updates });
        await refreshPlaylists();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateItemTransition = async (itemId: string, transition: string | null) => {
    try {
      const res = await fetch(`/api/playlists/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transition })
      });
      if (res.ok) {
        await refreshPlaylists();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleMoveItem = async (index: number, direction: 'up' | 'down') => {
    if (!editingPlaylist || !editingPlaylist.items) return;
    const items = [...editingPlaylist.items];
    if (direction === 'up' && index > 0) {
      [items[index - 1], items[index]] = [items[index], items[index - 1]];
    } else if (direction === 'down' && index < items.length - 1) {
      [items[index], items[index + 1]] = [items[index + 1], items[index]];
    } else {
      return;
    }
    setEditingPlaylist({ ...editingPlaylist, items });
    try {
      await fetch(`/api/playlists/${editingPlaylist.id}/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds: items.map(item => item.id) })
      });
      await refreshPlaylists();
    } catch (e) {
      console.error(e);
    }
  };

  const updateItemDuration = async (itemId: string, duration: number) => {
    try {
      const res = await fetch('/api/playlists/items/' + itemId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration })
      });
      if (res.ok) {
        await refreshPlaylists();
      }
    } catch (e) {
      console.error(e);
    }
  };
  const updateItemCondition = async (itemId: string, conditionPayload: string | null) => {
    try {
      const res = await fetch('/api/playlists/items/' + itemId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conditionPayload })
      });
      if (res.ok) {
        if (editingPlaylist?.items) {
          const updatedItems = editingPlaylist.items.map((it: any) => 
            it.id === itemId ? { ...it, conditionPayload } : it
          );
          setEditingPlaylist({ ...editingPlaylist, items: updatedItems });
        }
        await refreshPlaylists();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updateItemSchedule = async (itemId: string, activeFrom: string | null, activeUntil: string | null) => {
    try {
      const res = await fetch('/api/playlists/items/' + itemId, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeFrom, activeUntil })
      });
      if (res.ok) {
        if (editingPlaylist?.items) {
          const updatedItems = editingPlaylist.items.map((it: any) => 
            it.id === itemId ? { ...it, activeFrom, activeUntil } : it
          );
          setEditingPlaylist({ ...editingPlaylist, items: updatedItems });
        }
        await refreshPlaylists();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Version History State & Handlers
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [checkpointLabel, setCheckpointLabel] = useState('');
  const [isSavingCheckpoint, setIsSavingCheckpoint] = useState(false);
  const [restoringVersionId, setRestoringVersionId] = useState<string | null>(null);

  const fetchVersions = async () => {
    if (!editingPlaylist?.id) return;
    setLoadingVersions(true);
    try {
      const res = await fetch(`/api/playlists/${editingPlaylist.id}/versions`);
      if (res.ok) {
        setVersions(await res.json());
      }
    } catch (e) {
      console.error('Failed to fetch versions', e);
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleOpenVersions = () => {
    setShowVersionModal(true);
    fetchVersions();
  };

  const handleCreateCheckpoint = async () => {
    if (!editingPlaylist?.id) return;
    setIsSavingCheckpoint(true);
    try {
      const res = await fetch(`/api/playlists/${editingPlaylist.id}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: checkpointLabel || 'Manual Snapshot' })
      });
      if (res.ok) {
        setCheckpointLabel('');
        await fetchVersions();
      }
    } catch (e) {
      console.error('Failed to create checkpoint', e);
    } finally {
      setIsSavingCheckpoint(false);
    }
  };

  const handleRestoreVersion = async (version: any) => {
    if (!confirm(`Are you sure you want to rollback to "${version.label || 'Checkpoint'}" from ${new Date(version.createdAt).toLocaleString()}? Your current changes will be saved automatically.`)) return;
    setRestoringVersionId(version.id);
    try {
      const res = await fetch(`/api/playlists/${editingPlaylist.id}/versions/${version.id}/restore`, {
        method: 'POST'
      });
      if (res.ok) {
        await refreshPlaylists();
        const pRes = await fetch(`/api/playlists/${editingPlaylist.id}`);
        if (pRes.ok) {
          setEditingPlaylist(await pRes.json());
        }
        setShowVersionModal(false);
        alert('Playlist rolled back successfully!');
      } else {
        alert('Failed to restore playlist version.');
      }
    } catch (e) {
      console.error('Failed to restore version', e);
      alert('Error restoring playlist version.');
    } finally {
      setRestoringVersionId(null);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !editingPlaylist || !editingPlaylist.items) return;

    const oldIndex = editingPlaylist.items.findIndex((item: any) => item.id === active.id);
    const newIndex = editingPlaylist.items.findIndex((item: any) => item.id === over.id);

    const newItems = arrayMove(editingPlaylist.items, oldIndex, newIndex);
    setEditingPlaylist({ ...editingPlaylist, items: newItems });

    try {
      await fetch('/api/playlists/' + editingPlaylist.id + '/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemIds: newItems.map((item: any) => item.id) })
      });
      await refreshPlaylists();
    } catch (e) {
      console.error(e);
    }
  };

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');

  useEffect(() => {
    if (editingPlaylist?.scheduledPushAt) {
      const d = new Date(editingPlaylist.scheduledPushAt);
      if (!isNaN(d.getTime())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');
        setScheduleDate(`${yyyy}-${mm}-${dd}`);
        setScheduleTime(`${hh}:${min}`);
      }
    }
  }, [editingPlaylist?.scheduledPushAt]);

  const handleSaveSelection = async (action: 'draft' | 'now' | 'schedule') => {
    if (!editingPlaylist) return;
    try {
      let scheduledDateISO: string | null | undefined = undefined;
      
      if (action === 'schedule') {
        if (!scheduleDate || !scheduleTime) {
          alert('Please select a date and time.');
          return;
        }
        const schedDate = new Date(`${scheduleDate}T${scheduleTime}:00`);
        if (isNaN(schedDate.getTime())) {
          alert('Please select a valid date and time.');
          return;
        }
        if (schedDate.getTime() <= Date.now()) {
          alert('Scheduled push time must be in the future.');
          return;
        }
        scheduledDateISO = schedDate.toISOString();
      } else if (action === 'draft' || action === 'now') {
        // Clear any previous pending scheduled push if saving draft or pushing now
        scheduledDateISO = null;
      }

      // 1. Save playlist metadata & schedule timestamp
      const saveRes = await fetch(`/api/playlists/${editingPlaylist.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingPlaylist.name,
          description: editingPlaylist.description,
          transition: editingPlaylist.transition,
          scheduledPushAt: scheduledDateISO,
          pushImmediately: action === 'now'
        })
      });

      if (!saveRes.ok) {
        alert('Failed to save playlist metadata.');
        return;
      }

      // 2. If 'now', trigger the force push to immediately update screens
      if (action === 'now') {
        const pushRes = await fetch(`/api/playlists/${editingPlaylist.id}/push`, { method: 'POST' });
        if (!pushRes.ok) alert('Failed to push updates to TVs.');
      } else if (action === 'schedule') {
        alert(`Playlist push scheduled for ${new Date(scheduledDateISO!).toLocaleString()}. It will automatically broadcast to your TVs at that time.`);
      }

      onExit();
    } catch (e) {
      console.error(e);
      alert('Error saving playlist updates.');
    }
  };

  if (!editingPlaylist) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
      {showSaveModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ width: '400px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Save & Push Options</h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>How would you like to apply these changes?</p>
            
            <button 
              onClick={() => handleSaveSelection('draft')}
              style={{ background: 'var(--card-bg)', color: 'var(--foreground)', border: '1px solid var(--border)', padding: '12px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontWeight: '600' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <Check size={16} /> Save as Draft
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 'normal' }}>Save changes without sending them to the TVs yet.</div>
            </button>

            <button 
              onClick={() => handleSaveSelection('now')}
              style={{ background: 'var(--brand-secondary, #10b981)', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontWeight: '600' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <MonitorPlay size={16} /> Push to TVs
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', fontWeight: 'normal' }}>Instantly force-reload TVs to show these updates.</div>
            </button>

            <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontWeight: '600', fontSize: '14px' }}>Schedule Push</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Automatically push to TVs at a specific date and time.</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="date" 
                  value={scheduleDate} 
                  onChange={e => setScheduleDate(e.target.value)} 
                  style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                />
                <input 
                  type="time" 
                  value={scheduleTime} 
                  onChange={e => setScheduleTime(e.target.value)} 
                  style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
                />
              </div>
              <button 
                onClick={() => handleSaveSelection('schedule')}
                style={{ background: 'var(--brand-primary)', color: 'white', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginTop: '4px' }}
              >
                Confirm Schedule
              </button>
            </div>

            <button onClick={() => setShowSaveModal(false)} style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer', marginTop: '8px' }}>Cancel</button>
          </div>
        </div>
      )}
      
      {/* Version History Modal */}
      {showVersionModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="glass-panel" style={{ width: '600px', maxWidth: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <History size={20} color="var(--brand-primary)" />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Playlist Version History</h3>
              </div>
              <button onClick={() => setShowVersionModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Create Checkpoint bar */}
            <div style={{ padding: '16px 24px', background: 'var(--card-bg)', borderBottom: '1px solid var(--border)', display: 'flex', gap: '8px' }}>
              <input 
                type="text"
                placeholder="Checkpoint label (e.g. 'Pre-holiday layout')..."
                value={checkpointLabel}
                onChange={e => setCheckpointLabel(e.target.value)}
                style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '13px' }}
              />
              <button
                onClick={handleCreateCheckpoint}
                disabled={isSavingCheckpoint}
                style={{ background: 'var(--brand-primary)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={16} /> Save Checkpoint
              </button>
            </div>

            {/* Versions List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {loadingVersions ? (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>Loading version snapshots...</div>
              ) : versions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  No previous versions recorded yet. Checkpoints are automatically generated before publishes or can be saved above.
                </div>
              ) : (
                versions.map((ver: any) => {
                  let itemCount = 0;
                  try {
                    const snap = JSON.parse(ver.snapshot);
                    itemCount = snap.items ? snap.items.length : 0;
                  } catch (e) {}

                  return (
                    <div 
                      key={ver.id}
                      style={{
                        padding: '14px 16px',
                        background: 'var(--background)',
                        border: '1px solid var(--border)',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '16px'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{ver.label || 'Snapshot'}</span>
                          <span style={{ fontSize: '11px', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-muted)' }}>
                            {itemCount} slides
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Saved {new Date(ver.createdAt).toLocaleString()} by {ver.createdBy || 'System'}
                        </div>
                      </div>

                      <button
                        onClick={() => handleRestoreVersion(ver)}
                        disabled={restoringVersionId === ver.id}
                        style={{
                          background: 'rgba(59, 130, 246, 0.12)',
                          color: 'var(--brand-primary)',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.15s'
                        }}
                      >
                        <RotateCcw size={14} />
                        {restoringVersionId === ver.id ? 'Restoring...' : 'Rollback to This'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', background: 'var(--card-bg)' }}>
              <button onClick={() => setShowVersionModal(false)} className="btn-secondary" style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button 
          onClick={onExit}
          style={{ background: 'transparent', border: 'none', color: 'var(--foreground)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 'bold' }}
        >
          <ChevronLeft size={20} /> Back to Playlists
        </button>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            onClick={handleOpenVersions}
            title="View revision history and restore previous snapshots"
            style={{ background: 'var(--card-bg)', color: 'var(--foreground)', border: '1px solid var(--border)', padding: '8px 14px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '13px' }}
          >
            <History size={16} color="var(--brand-primary)" /> History & Checkpoints
          </button>
          <button 
            onClick={() => {
              window.open(`/player?previewPlaylistId=${editingPlaylist.id}`, 'PreviewPlayer', 'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no');
            }}
            style={{ background: 'var(--muted)', color: 'var(--foreground)', border: '1px solid var(--border)', padding: '8px 16px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '13px' }}
          >
            <MonitorPlay size={16} /> Preview Playlist
          </button>
          <button 
            onClick={() => setShowSaveModal(true)}
            style={{ background: 'var(--brand-primary)', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '13px', boxShadow: 'var(--shadow-sm)' }}
          >
            <Check size={16} /> Save & Exit
          </button>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '28px', flex: 1, minHeight: '600px' }}>
        {/* Playlist Builder Timeline (Left) */}
        <div className="glass-panel" style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '22px', margin: 0, fontWeight: 'bold' }}>{editingPlaylist.name}</h2>
                {editingPlaylist.scheduledPushAt && new Date(editingPlaylist.scheduledPushAt).getTime() > Date.now() && (
                  <span style={{ fontSize: '11px', background: 'rgba(217, 119, 6, 0.15)', color: '#D97706', border: '1px solid rgba(217, 119, 6, 0.3)', padding: '2px 8px', borderRadius: '6px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    🕒 Scheduled Push: {new Date(editingPlaylist.scheduledPushAt).toLocaleDateString()} {new Date(editingPlaylist.scheduledPushAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
              <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: '13px' }}>
                {editingPlaylist.description || 'Click items on the right panel to build your screen sequence.'}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>Transition:</label>
              <select 
                value={editingPlaylist.transition || 'fade'}
                onChange={(e) => updatePlaylistTransition(e.target.value)}
                style={{ padding: '6px 12px', borderRadius: '8px', background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--foreground)', fontSize: '13px' }}
              >
                <option value="none">None</option>
                <option value="fade">Fade</option>
                <option value="zoom-in">Zoom In</option>
                <option value="flip-in">Flip</option>
                <option value="blur-fade">Blur Fade</option>
                <option value="slide-left">Slide Left</option>
                <option value="slide-right">Slide Right</option>
                <option value="slide-up">Slide Up</option>
                <option value="slide-down">Slide Down</option>
              </select>
            </div>
          </div>

          {/* Daily Operating Schedule */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '16px', padding: '12px 16px', background: 'var(--background)', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '13px' }}>
            <div style={{ fontWeight: '600', color: 'var(--foreground)' }}>Operating Schedule:</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ color: 'var(--text-muted)' }}>From:</label>
              <input
                type="time"
                value={editingPlaylist.startTime || ''}
                onChange={(e) => updatePlaylistSchedule({ startTime: e.target.value })}
                style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--foreground)' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ color: 'var(--text-muted)' }}>To:</label>
              <input
                type="time"
                value={editingPlaylist.endTime || ''}
                onChange={(e) => updatePlaylistSchedule({ endTime: e.target.value })}
                style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--foreground)' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayName, index) => {
                const dayNum = (index + 1).toString();
                const currentDays = editingPlaylist.daysOfWeek ? editingPlaylist.daysOfWeek.split(',') : ['1','2','3','4','5','6','7'];
                const active = currentDays.includes(dayNum);
                return (
                  <button
                    key={dayNum}
                    onClick={() => {
                      const newDays = active ? currentDays.filter((d: string) => d !== dayNum) : [...currentDays, dayNum];
                      updatePlaylistSchedule({ daysOfWeek: newDays.sort().join(',') });
                    }}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      background: active ? 'var(--brand-primary)' : 'transparent',
                      color: active ? 'white' : 'var(--text-muted)'
                    }}
                  >
                    {dayName}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Timeline Items List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
            {(!editingPlaylist.items || editingPlaylist.items.length === 0) ? (
              <div style={{ padding: '48px', textAlign: 'center', border: '2px dashed var(--border)', borderRadius: '12px', color: 'var(--text-muted)' }}>
                <p>No media or widgets in this playlist yet. Add assets from the right panel.</p>
              </div>
            ) : (
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={editingPlaylist.items.map((i: any) => i.id)} strategy={verticalListSortingStrategy}>
                  {editingPlaylist.items.map((item: any, idx: number) => (
                    <SortablePlaylistItem
                      key={item.id}
                      item={item}
                      idx={idx}
                      playlistLength={editingPlaylist.items.length}
                      updateItemDuration={updateItemDuration}
                      updateItemTransition={updateItemTransition}
                      updateItemCondition={updateItemCondition}
                      updateItemSchedule={updateItemSchedule}
                      handleMoveItem={handleMoveItem}
                      removeFromPlaylist={removeFromPlaylist}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            )}
          </div>

          {/* Active Overlays Section */}
          {editingPlaylist.overlays && editingPlaylist.overlays.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h4 style={{ fontSize: '16px', margin: 0, fontWeight: 'bold' }}>Active Overlays on Playlist</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {editingPlaylist.overlays.map((overlay: any) => (
                  <div key={overlay.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--brand-primary)', borderRadius: '8px', color: 'var(--brand-primary)', fontSize: '13px', fontWeight: '600' }}>
                    <span>{overlay.widget.name} ({overlay.widget.type})</span>
                    <button 
                      onClick={() => removeOverlay(overlay.id)}
                      style={{ background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (400px wide) */}
        <div style={{ width: '390px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Media Picker Card */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '420px', boxSizing: 'border-box' }}>
            <h3 style={{ fontSize: '16px', margin: '0 0 12px 0', fontWeight: 'bold', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>Add Media</h3>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <select 
                value={playlistMediaFolder}
                onChange={e => setPlaylistMediaFolder(e.target.value)}
                style={{ flex: 1, padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '12px' }}
              >
                <option value="all">All Folders</option>
                <option value="root">Root (No Folder)</option>
                {folders.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
              <select 
                value={playlistMediaSort}
                onChange={e => setPlaylistMediaSort(e.target.value as 'date' | 'name')}
                style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '12px' }}
              >
                <option value="date">Recently Added</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', overflowY: 'auto', flex: 1, paddingRight: '6px' }} className="custom-scroll">
              {mediaAssets
                .filter(asset => {
                  const effectiveFolderId = (asset.folderId && folders.some(f => f.id === asset.folderId)) ? asset.folderId : null;
                  
                  if (playlistMediaFolder === 'all') return true;
                  if (playlistMediaFolder === 'root') return !effectiveFolderId;
                  return effectiveFolderId === playlistMediaFolder;
                })
                .sort((a, b) => {
                  if (playlistMediaSort === 'name') return a.name.localeCompare(b.name);
                  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                })
                .map(asset => (
                <div 
                  key={asset.id} 
                  onClick={() => addToPlaylist(asset.id)}
                  style={{ cursor: 'pointer', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', aspectRatio: '1/1', background: 'var(--card-bg)', borderRadius: '10px', border: '1px solid var(--border)', transition: 'transform 0.15s ease' }}
                >
                  {asset.type === 'image' ? (
                    <img src={asset.url} alt={asset.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : asset.type === 'video' ? (
                    <video src={asset.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted playsInline preload="metadata" />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.05)', color: 'var(--brand-primary)' }}>
                      <Globe size={24} opacity={0.5} />
                    </div>
                  )}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '4px 6px', background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', color: 'white', fontSize: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: '500' }}>
                    {asset.name}
                  </div>
                </div>
              ))}
            </div>
          </div>



          {/* Broadcast to Screens Checklist */}
          <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '220px', boxSizing: 'border-box' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: '0 0 10px 0', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
              Broadcast to Screens
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', flex: 1, paddingRight: '4px' }} className="custom-scroll">
              {screens.length === 0 && <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '12px' }}>No screens paired yet.</span>}
              {screens.map(screen => {
                const isAssigned = screen.playlistId === editingPlaylist.id;
                const isSyncedOffline = !!syncedScreens[screen.id];
                return (
                  <label 
                    key={screen.id} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px', 
                      padding: '8px 12px', 
                      borderRadius: '8px', 
                      border: isAssigned ? (isSyncedOffline ? '1px solid #10b981' : '1px solid var(--brand-primary)') : '1px solid var(--border)', 
                      background: isAssigned ? (isSyncedOffline ? 'rgba(16, 185, 129, 0.08)' : 'rgba(44, 76, 124, 0.08)') : 'var(--background)', 
                      cursor: 'pointer', 
                      fontSize: '12px' 
                    }}
                  >
                    <input 
                      type="checkbox" 
                      checked={isAssigned}
                      onChange={(e) => {
                        handleAssignPlaylist(screen.id, e.target.checked ? editingPlaylist.id : '');
                      }}
                      style={{ accentColor: 'var(--brand-primary)', cursor: 'pointer' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                        <div style={{ fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: isAssigned ? 'var(--brand-primary)' : 'var(--foreground)' }}>{screen.name}</div>
                        {isSyncedOffline && (
                          <span style={{ fontSize: '9px', background: '#10b981', color: 'white', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.02em', flexShrink: 0 }}>
                            Offline Ready
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600', marginTop: '2px' }}>
                        {isScreenOnline(screen) ? '🟢 Online' : '⚪ Offline'}
                        {isSyncedOffline && <span style={{ color: '#10b981', marginLeft: '6px' }}>• Cache updated</span>}
                      </div>
                    </div>
                  </label>
                )
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Real-time Fading Toast Notifications for Offline Sync */}
      <aside 
        aria-label="Screen Sync Notifications"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          pointerEvents: 'none',
          maxWidth: '440px',
          width: 'calc(100vw - 48px)',
        }}
      >
        {syncToasts.map(toast => (
          <article
            key={toast.id}
            className="sync-toast-notification"
            role="status"
            aria-live="polite"
            style={{
              pointerEvents: 'auto',
              background: 'var(--card-bg)',
              border: '1px solid #10b981',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: 'var(--shadow-lg), 0 4px 20px rgba(16, 185, 129, 0.2)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              color: 'var(--foreground)',
              animation: 'syncToastSlideIn 6s ease-in-out forwards',
            }}
          >
            <div 
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <CheckCircle2 size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Offline Ready
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Just now
                </span>
              </div>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', fontWeight: '600', lineHeight: 1.4, color: 'var(--foreground)' }}>
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => setSyncToasts(prev => prev.filter(t => t.id !== toast.id))}
              aria-label="Dismiss notification"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px'
              }}
            >
              <X size={16} />
            </button>
          </article>
        ))}
      </aside>
    </div>
  );
}