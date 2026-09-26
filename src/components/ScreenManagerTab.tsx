import React, { useState, useEffect } from 'react';
import { Plus, MonitorPlay, Wifi, Trash2, ExternalLink, Users, X, Search, Edit2, Check, Copy, LayoutGrid, List, ArrowLeft, FolderOpen, ChevronRight, CheckSquare, Square, RefreshCw, Radio, Camera, Bell, AlertTriangle, Moon, Clock, ShieldAlert, MapPin, CalendarRange, QrCode, Settings } from 'lucide-react';
import UpgradePlanModal from './UpgradePlanModal';
import { LocationAutocomplete } from './LocationAutocomplete';
import { ScheduleCalendarTab } from './ScheduleCalendarTab';
import { ScreenQrBadgeModal } from './ScreenQrBadgeModal';
import { useI18n } from '@/lib/i18n';

interface ScreenManagerTabProps {
  screens: any[];
  playlists: any[];
  templates?: any[];
  mediaAssets?: any[];
  showPairModal: boolean;
  setShowPairModal: (show: boolean) => void;
  pairCode: string;
  setPairCode: (code: string) => void;
  pairName: string;
  setPairName: (name: string) => void;
  pairScreenId?: string;
  handleCreateScreen: () => void;
  handleAssignPlaylist: (screenId: string, playlistId: string) => void;
  setVisualEditorScreenId: (id: string) => void;
  handleTestConnection: (id: string) => void;
  handleDeleteScreen: (id: string) => void;
  isScreenOnline: (screen: any) => boolean;
  groups: any[];
  fetchGroups: () => void;
  fetchScreens: () => void;
  handleUpdateScreen: (id: string, updates: any) => void;
  stats?: any;
}

export function ScreenManagerTab({
  screens,
  playlists,
  templates = [],
  mediaAssets = [],
  showPairModal,
  setShowPairModal,
  pairCode,
  setPairCode,
  pairName,
  setPairName,
  pairScreenId,
  handleCreateScreen,
  handleAssignPlaylist,
  setVisualEditorScreenId,
  handleTestConnection,
  handleDeleteScreen,
  isScreenOnline,
  groups,
  fetchGroups,
  fetchScreens,
  handleUpdateScreen,
  stats
}: ScreenManagerTabProps) {
  const { t } = useI18n();
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showTestScreenModal, setShowTestScreenModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'group' | 'schedule'>('table');
  const [qrModalScreen, setQrModalScreen] = useState<{ id: string; name: string } | null>(null);

  // Mobile Presence for Screens
  const [activeMobileSessions, setActiveMobileSessions] = useState<any[]>([]);

  useEffect(() => {
    const fetchPresence = async () => {
      try {
        const res = await fetch('/api/presence/mobile');
        if (res.ok) {
          const data = await res.json();
          setActiveMobileSessions(data.activeSessions || []);
        }
      } catch (_) {}
    };
    fetchPresence();
    const interval = setInterval(fetchPresence, 8000);
    return () => clearInterval(interval);
  }, []);

  // Snapshot Modal State
  const [snapshotScreen, setSnapshotScreen] = useState<any | null>(null);
  const [isRequestingSnapshot, setIsRequestingSnapshot] = useState(false);
  const [snapshotSuccessMessage, setSnapshotSuccessMessage] = useState<string | null>(null);

  // Broadcast Alert Modal & Banner State
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastSeverity, setBroadcastSeverity] = useState<'info' | 'warning' | 'urgent'>('warning');
  const [broadcastTargetType, setBroadcastTargetType] = useState<'all' | 'group' | 'screen'>('all');
  const [broadcastTargetId, setBroadcastTargetId] = useState("");
  const [activeBroadcast, setActiveBroadcast] = useState<any | null>(null);
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);

  // Operating Hours / Sleep Schedule Modal State
  const [opHoursScreen, setOpHoursScreen] = useState<any | null>(null);
  const [opHoursActive, setOpHoursActive] = useState(false);
  const [opWakeTime, setOpWakeTime] = useState("07:00");
  const [opSleepTime, setOpSleepTime] = useState("22:00");
  const [opSleepMode, setOpSleepMode] = useState("black");
  const [opLocation, setOpLocation] = useState("");

  // Override Modal State
  const [overrideScreen, setOverrideScreen] = useState<any | null>(null);
  const [overrideType, setOverrideType] = useState<string>("html");
  const [overrideMediaId, setOverrideMediaId] = useState<string>("");
  const [htmlTitle, setHtmlTitle] = useState<string>("");
  const [htmlSubtitle, setHtmlSubtitle] = useState<string>("");
  const [htmlBgColor, setHtmlBgColor] = useState<string>("#1e3a8a");
  const [htmlTextColor, setHtmlTextColor] = useState<string>("#ffffff");
  
  // Selected Group for Drill-Down View
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Bulk Screen Selection & Confirmation Modal
  const [selectedScreenIds, setSelectedScreenIds] = useState<string[]>([]);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleteConfirmInput, setBulkDeleteConfirmInput] = useState("");

  // Search & Status Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');

  // Inline Screen Label Editing
  const [editingScreenId, setEditingScreenId] = useState<string | null>(null);
  const [editingScreenName, setEditingScreenName] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Settings Hub Modal State
  const [settingsModalScreen, setSettingsModalScreen] = useState<any | null>(null);

  // Load Active Broadcasts on Mount
  useEffect(() => {
    const fetchBroadcastStatus = async () => {
      try {
        const res = await fetch('/api/screens/broadcast');
        if (res.ok) {
          const data = await res.json();
          if (data.orgBroadcast?.broadcastAlertActive && data.orgBroadcast?.broadcastAlertPayload) {
            try {
              const payload = JSON.parse(data.orgBroadcast.broadcastAlertPayload);
              setActiveBroadcast({ ...payload, target: 'all' });
            } catch (e) {}
          } else {
            setActiveBroadcast(null);
          }
        }
      } catch (e) {}
    };
    fetchBroadcastStatus();
  }, []);

  const handleStartRename = (screen: any) => {
    setEditingScreenId(screen.id);
    setEditingScreenName(screen.name);
  };

  const handleSaveRename = async (screenId: string) => {
    if (!editingScreenName.trim()) return;
    await handleUpdateScreen(screenId, { name: editingScreenName.trim() });
    setEditingScreenId(null);
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenSnapshotModal = (screen: any) => {
    setSnapshotScreen(screen);
    setSnapshotSuccessMessage(null);
  };

  const handleTriggerSnapshot = async (screenId: string) => {
    setIsRequestingSnapshot(true);
    setSnapshotSuccessMessage(null);
    try {
      const res = await fetch(`/api/screens/${screenId}/snapshot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REQUEST_SNAPSHOT' })
      });
      if (res.ok) {
        setSnapshotSuccessMessage('Snapshot request sent! Waiting for TV response...');
        let attempts = 0;
        const initialAt = snapshotScreen?.lastScreenshotAt;
        const interval = setInterval(async () => {
          attempts++;
          try {
            const checkRes = await fetch(`/api/screens/${screenId}/snapshot`);
            if (checkRes.ok) {
              const data = await checkRes.json();
              if (data.screen?.lastScreenshotAt && data.screen?.lastScreenshotAt !== initialAt) {
                setSnapshotScreen(data.screen);
                setSnapshotSuccessMessage('Fresh snapshot received!');
                setIsRequestingSnapshot(false);
                clearInterval(interval);
                fetchScreens();
                return;
              }
            }
          } catch (e) {}

          if (attempts >= 7) {
            setIsRequestingSnapshot(false);
            clearInterval(interval);
            fetchScreens();
          }
        }, 3000);
      } else {
        setIsRequestingSnapshot(false);
      }
    } catch (e) {
      console.error(e);
      setIsRequestingSnapshot(false);
    }
  };

  const handleOpenOpHoursModal = (screen: any) => {
    setOpHoursScreen(screen);
    setOpHoursActive(screen.operatingHoursActive || false);
    setOpWakeTime(screen.wakeTime || '07:00');
    setOpSleepTime(screen.sleepTime || '22:00');
    setOpSleepMode(screen.sleepMode || 'black');
    setOpLocation(screen.location || '');
  };

  const handleSaveOperatingHours = async () => {
    if (!opHoursScreen) return;
    await handleUpdateScreen(opHoursScreen.id, {
      operatingHoursActive: opHoursActive,
      wakeTime: opWakeTime,
      sleepTime: opSleepTime,
      sleepMode: opSleepMode,
      location: opLocation
    });
    setOpHoursScreen(null);
  };

  const handleBroadcastAlert = async () => {
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;
    setIsSendingBroadcast(true);
    try {
      const res = await fetch('/api/screens/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SET_BROADCAST',
          title: broadcastTitle.trim(),
          message: broadcastMessage.trim(),
          severity: broadcastSeverity,
          targetType: broadcastTargetType,
          targetId: broadcastTargetId
        })
      });
      if (res.ok) {
        setActiveBroadcast({
          title: broadcastTitle.trim(),
          message: broadcastMessage.trim(),
          severity: broadcastSeverity,
          target: broadcastTargetType
        });
        setShowBroadcastModal(false);
        setBroadcastTitle('');
        setBroadcastMessage('');
        fetchScreens();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  const handleClearBroadcast = async () => {
    try {
      const res = await fetch('/api/screens/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CLEAR_BROADCAST' })
      });
      if (res.ok) {
        setActiveBroadcast(null);
        fetchScreens();
      }
    } catch (e) {}
  };

  const handleCreateGroup = async () => {
    if (!newGroupName) return;
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGroupName })
      });
      if (res.ok) {
        setNewGroupName("");
        setShowCreateGroup(false);
        fetchGroups();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAssignGroupPlaylist = async (groupId: string, playlistId: string) => {
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playlistId: playlistId === "" ? null : playlistId })
      });
      if (res.ok) {
        fetchGroups();
        fetchScreens();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm("Are you sure you want to delete this group? The screens will not be deleted.")) return;
    try {
      const res = await fetch(`/api/groups/${groupId}`, { method: 'DELETE' });
      if (res.ok) {
        if (selectedGroupId === groupId) setSelectedGroupId(null);
        fetchGroups();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Bulk Operations
  const handleToggleSelectAll = () => {
    if (selectedScreenIds.length === filteredScreens.length) {
      setSelectedScreenIds([]);
    } else {
      setSelectedScreenIds(filteredScreens.map(s => s.id));
    }
  };

  const handleToggleSelectScreen = (id: string) => {
    if (selectedScreenIds.includes(id)) {
      setSelectedScreenIds(selectedScreenIds.filter(sId => sId !== id));
    } else {
      setSelectedScreenIds([...selectedScreenIds, id]);
    }
  };

  const handleBulkAssignPlaylist = async (playlistId: string) => {
    if (selectedScreenIds.length === 0) return;
    for (const id of selectedScreenIds) {
      await handleAssignPlaylist(id, playlistId);
    }
    setSelectedScreenIds([]);
  };

  const handleBulkAssignGroup = async (groupId: string) => {
    if (selectedScreenIds.length === 0) return;
    for (const id of selectedScreenIds) {
      await handleUpdateScreen(id, { groupId: groupId === "" ? null : groupId });
    }
    setSelectedScreenIds([]);
  };

  const handleOpenBulkDeleteModal = () => {
    setBulkDeleteConfirmInput("");
    setShowBulkDeleteModal(true);
  };

  const handleExecuteBulkDelete = async () => {
    if (bulkDeleteConfirmInput.trim().toUpperCase() !== 'DELETE') return;
    for (const id of selectedScreenIds) {
      await handleDeleteScreen(id);
    }
    setSelectedScreenIds([]);
    setShowBulkDeleteModal(false);
  };

  // Filtered Screens list
  const filteredScreens = screens.filter(screen => {
    if (viewMode === 'group' && selectedGroupId !== null) {
      if (selectedGroupId === 'unassigned') {
        if (screen.groupId) return false;
      } else if (screen.groupId !== selectedGroupId) {
        return false;
      }
    }

    const online = isScreenOnline(screen);
    if (statusFilter === 'online' && !online) return false;
    if (statusFilter === 'offline' && online) return false;

    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const nameMatch = screen.name?.toLowerCase().includes(query);
    const idMatch = screen.id?.toLowerCase().includes(query);
    const groupMatch = groups.find(g => g.id === screen.groupId)?.name?.toLowerCase().includes(query);
    return nameMatch || idMatch || groupMatch;
  });

  const onlineCount = screens.filter(s => isScreenOnline(s)).length;
  const offlineCount = screens.length - onlineCount;

  // Table Row Render
  const renderScreenTableRow = (screen: any) => {
    const online = isScreenOnline(screen);
    const isEditingThis = editingScreenId === screen.id;
    const isSelected = selectedScreenIds.includes(screen.id);

    return (
      <tr 
        key={screen.id} 
        style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s ease', background: isSelected ? 'rgba(37,99,235,0.06)' : 'transparent' }}
        onMouseEnter={e => { if(!isSelected) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'; }}
        onMouseLeave={e => { if(!isSelected) e.currentTarget.style.background = 'transparent'; }}
      >
        {/* Checkbox */}
        <td style={{ padding: '14px 16px', width: '40px' }}>
          <input 
            type="checkbox" 
            checked={isSelected}
            onChange={() => handleToggleSelectScreen(screen.id)}
            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
          />
        </td>

        {/* Status */}
        <td style={{ padding: '14px 16px', width: '110px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '12px', background: online ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.05)', color: online ? '#22c55e' : 'var(--text-muted)', fontSize: '12px', fontWeight: '600' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: online ? '#22c55e' : '#94a3b8' }} />
            {online ? 'Online' : 'Offline'}
          </div>
        </td>

        {/* Screen Name / Label & ID */}
        <td style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {isEditingThis ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="text"
                  value={editingScreenName}
                  onChange={e => setEditingScreenName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveRename(screen.id)}
                  style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--brand-primary)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '14px', fontWeight: 'bold' }}
                  autoFocus
                />
                <button onClick={() => handleSaveRename(screen.id)} style={{ padding: '4px 8px', background: 'var(--brand-primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                  <Check size={14} />
                </button>
                <button onClick={() => setEditingScreenId(null)} style={{ padding: '4px 8px', background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer' }}>
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: '700', fontSize: '15px', color: 'var(--foreground)' }}>{screen.name}</span>
                {activeMobileSessions.some((s: any) => s.screenId === screen.id) && (
                  <span style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '1px 6px', borderRadius: '10px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10B981' }} />
                    📱 Mobile Remote
                  </span>
                )}
                <button 
                  onClick={() => handleStartRename(screen)} 
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', borderRadius: '4px' }}
                  title="Rename / Label Screen"
                >
                  <Edit2 size={13} />
                </button>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                ID: {screen.id.length > 20 ? `${screen.id.slice(0, 18)}...` : screen.id}
              </span>
              <button 
                onClick={() => handleCopyId(screen.id)} 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                title="Copy Full Screen ID"
              >
                {copiedId === screen.id ? <Check size={11} color="#22c55e" /> : <Copy size={11} />}
              </button>
            </div>
          </div>
        </td>

        {/* Assigned Playlist Dropdown */}
        <td style={{ padding: '14px 16px', minWidth: '180px' }}>
          <select 
            value={screen.playlistId || ""}
            onChange={(e) => handleAssignPlaylist(screen.id, e.target.value)}
            style={{ width: '100%', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '13px', cursor: 'pointer' }}
          >
            <option value="">-- No Playlist --</option>
            {playlists.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </td>

        {/* Screen Group Dropdown */}
        <td style={{ padding: '14px 16px', minWidth: '180px' }}>
          <select 
            value={screen.groupId || ""}
            onChange={(e) => handleUpdateScreen(screen.id, { groupId: e.target.value === "" ? null : e.target.value })}
            style={{ width: '100%', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '13px', cursor: 'pointer' }}
          >
            <option value="">-- Unassigned Group --</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </td>

        {/* Actions */}
        <td style={{ padding: '14px 16px', textAlign: 'right', width: '220px' }}>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
            {/* Active Override Indicator if active */}
            {screen.overrideType && (
              <button
                onClick={() => {
                  setOverrideScreen(screen);
                  if (screen.overrideType) {
                    setOverrideType(screen.overrideType);
                    try {
                      const p = JSON.parse(screen.overridePayload || '{}');
                      if (p.title) setHtmlTitle(p.title);
                      if (p.subtitle) setHtmlSubtitle(p.subtitle);
                      if (p.backgroundColor) setHtmlBgColor(p.backgroundColor);
                      if (p.textColor) setHtmlTextColor(p.textColor);
                      if (p.mediaId) setOverrideMediaId(p.mediaId);
                    } catch (e) {}
                  }
                }}
                title="Manage Active Override"
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#ef4444',
                  border: '1px solid #ef4444',
                  cursor: 'pointer',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '12px',
                  fontWeight: '700'
                }}
              >
                <Radio size={13} /> Active Override
              </button>
            )}

            {/* Primary: Live Player */}
            <button
              onClick={() => window.open(`/player/${screen.id}?testMode=true`, 'TestPlayer', 'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no')}
              className="btn-primary"
              style={{
                height: '34px',
                padding: '0 12px',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: '700',
                whiteSpace: 'nowrap'
              }}
              title="Open Live TV Player preview"
            >
              <MonitorPlay size={14} /> Player
            </button>

            {/* Settings Hub Modal Trigger */}
            <button
              onClick={() => setSettingsModalScreen(screen)}
              className="btn-secondary"
              style={{
                height: '34px',
                padding: '0 12px',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
              title="Open Screen Settings & Actions Hub"
            >
              <Settings size={14} />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  // Card Render
  const renderScreenCard = (screen: any) => {
    const online = isScreenOnline(screen);
    const isEditingThis = editingScreenId === screen.id;
    const isSelected = selectedScreenIds.includes(screen.id);

    return (
      <div key={screen.id} className="glass-panel" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px', borderLeft: online ? '4px solid #22c55e' : '4px solid rgba(255,255,255,0.1)', background: isSelected ? 'rgba(37,99,235,0.06)' : undefined }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input 
              type="checkbox" 
              checked={isSelected}
              onChange={() => handleToggleSelectScreen(screen.id)}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <MonitorPlay size={20} style={{ color: online ? '#22c55e' : 'var(--brand-primary)' }} />
            {isEditingThis ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="text"
                  value={editingScreenName}
                  onChange={e => setEditingScreenName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveRename(screen.id)}
                  style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--brand-primary)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '14px', fontWeight: 'bold' }}
                  autoFocus
                />
                <button onClick={() => handleSaveRename(screen.id)} style={{ padding: '4px 8px', background: 'var(--brand-primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}><Check size={14} /></button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '15px', fontWeight: 'bold' }}>{screen.name}</span>
                {activeMobileSessions.some((s: any) => s.screenId === screen.id) && (
                  <span style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '1px 6px', borderRadius: '10px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10B981' }} />
                    📱 Mobile Remote
                  </span>
                )}
                <button onClick={() => handleStartRename(screen)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Edit2 size={13} /></button>
              </div>
            )}
          </div>
          <div style={{ padding: '4px 10px', borderRadius: '12px', background: online ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.05)', color: online ? '#22c55e' : 'var(--text-muted)', fontSize: '11px', fontWeight: '600' }}>
            {online ? '🟢 Online' : '⚪ Offline'}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
          <span style={{ fontFamily: 'monospace' }}>ID: {screen.id}</span>
          {screen.location ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: 'var(--foreground)', fontWeight: '600' }}>
              <MapPin size={11} color="var(--brand-primary)" /> {screen.location}
            </span>
          ) : (
            <span style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '10px' }}>No location set</span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 'bold', textTransform: 'uppercase' }}>Playlist</label>
            <select 
              value={screen.playlistId || ""}
              onChange={(e) => handleAssignPlaylist(screen.id, e.target.value)}
              style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '12px' }}
            >
              <option value="">-- No Playlist --</option>
              {playlists.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 'bold', textTransform: 'uppercase' }}>Group</label>
            <select 
              value={screen.groupId || ""}
              onChange={(e) => handleUpdateScreen(screen.id, { groupId: e.target.value === "" ? null : e.target.value })}
              style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '12px' }}
            >
              <option value="">-- Unassigned --</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '10px', borderTop: '1px solid var(--border)', alignItems: 'center' }}>
          {/* Active Override Indicator if active */}
          {screen.overrideType && (
            <button
              onClick={() => {
                setOverrideScreen(screen);
                if (screen.overrideType) {
                  setOverrideType(screen.overrideType);
                  try {
                    const p = JSON.parse(screen.overridePayload || '{}');
                    if (p.title) setHtmlTitle(p.title);
                    if (p.subtitle) setHtmlSubtitle(p.subtitle);
                    if (p.backgroundColor) setHtmlBgColor(p.backgroundColor);
                    if (p.textColor) setHtmlTextColor(p.textColor);
                    if (p.mediaId) setOverrideMediaId(p.mediaId);
                  } catch (e) {}
                }
              }}
              title="Manage Active Override"
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                border: '1px solid #ef4444',
                cursor: 'pointer',
                padding: '6px 8px',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: '700'
              }}
            >
              <Radio size={12} /> Override
            </button>
          )}

          <button
            onClick={() => window.open(`/player/${screen.id}?testMode=true`, 'TestPlayer', 'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no')}
            className="btn-primary"
            style={{
              height: '34px',
              padding: '0 12px',
              borderRadius: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: '700'
            }}
            title="Open Live TV Player preview"
          >
            <MonitorPlay size={14} /> Live View
          </button>

          {/* Settings Hub Modal Trigger */}
          <button
            onClick={() => setSettingsModalScreen(screen)}
            className="btn-secondary"
            style={{
              height: '34px',
              padding: '0 12px',
              borderRadius: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer'
            }}
            title="Open Screen Settings & Actions Hub"
          >
            <Settings size={14} />
            <span>Settings</span>
          </button>
        </div>
      </div>
    );
  };

  const renderGroupFolderGrid = () => {
    const unassignedCount = screens.filter(s => !s.groupId).length;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} style={{ color: 'var(--brand-primary)' }} /> Screen Groups ({groups.length})
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
              Select a group folder below to view and manage its assigned TV screens.
            </p>
          </div>
          <button 
            onClick={() => setShowCreateGroup(true)}
            style={{ background: 'var(--brand-primary)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={15} /> Create New Group
          </button>
        </div>

        {/* Group Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {groups.map(group => {
            const memberScreens = screens.filter(s => s.groupId === group.id);
            const onlineMembers = memberScreens.filter(s => isScreenOnline(s)).length;

            return (
              <div 
                key={group.id} 
                className="glass-panel" 
                onClick={() => setSelectedGroupId(group.id)}
                style={{ 
                  padding: '20px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '14px', 
                  borderLeft: '5px solid var(--brand-primary)', 
                  cursor: 'pointer',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(37,99,235,0.1)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FolderOpen size={20} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>{group.name}</h4>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {memberScreens.length} {memberScreens.length === 1 ? 'Screen' : 'Screens'} ({onlineMembers} Online)
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group.id); }}
                    title="Delete Group"
                    style={{ background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', padding: '4px' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Group Broadcast Playlist */}
                <div onClick={e => e.stopPropagation()} style={{ paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
                  <label style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 'bold', textTransform: 'uppercase' }}>Group Playlist Assignment</label>
                  <select 
                    value={group.playlistId || ""}
                    onChange={(e) => handleAssignGroupPlaylist(group.id, e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '12px', cursor: 'pointer' }}
                  >
                    <option value="">Let screens play their own individual playlists</option>
                    <optgroup label="Force all screens in group to play:">
                      {playlists.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', fontSize: '13px', fontWeight: '600', color: 'var(--brand-primary)' }}>
                  <span>Open Group Directory</span>
                  <ChevronRight size={16} />
                </div>
              </div>
            );
          })}

          {/* Unassigned Screens Card */}
          <div 
            className="glass-panel" 
            onClick={() => setSelectedGroupId('unassigned')}
            style={{ 
              padding: '20px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '14px', 
              borderLeft: '5px solid #94a3b8', 
              cursor: 'pointer',
              transition: 'transform 0.15s ease'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FolderOpen size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: 'var(--text-muted)' }}>Unassigned Screens</h4>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {unassignedCount} {unassignedCount === 1 ? 'Screen' : 'Screens'} without group
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid var(--border)', fontSize: '13px', fontWeight: '600', color: 'var(--foreground)' }}>
              <span>View Unassigned Screens</span>
              <ChevronRight size={16} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderScreensList = () => {
    if (filteredScreens.length === 0) {
      return (
        <div className="glass-panel" style={{ padding: '40px', minHeight: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <Search size={40} style={{ color: 'var(--text-muted)', marginBottom: '12px', opacity: 0.5 }} />
          <h4 style={{ fontSize: '16px', margin: '0 0 4px 0' }}>No screens in this section</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Try assigning screens to this group or clearing search filters.</p>
        </div>
      );
    }

    if (viewMode === 'cards') {
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {filteredScreens.map(screen => renderScreenCard(screen))}
        </div>
      );
    }

    return (
      <div className="glass-panel" style={{ overflow: 'hidden', padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.04)', borderBottom: '1px solid var(--border)', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              <th style={{ padding: '12px 16px', width: '40px' }}>
                <input 
                  type="checkbox" 
                  checked={filteredScreens.length > 0 && selectedScreenIds.length === filteredScreens.length}
                  onChange={handleToggleSelectAll}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
              </th>
              <th style={{ padding: '12px 16px' }}>Status</th>
              <th style={{ padding: '12px 16px' }}>Display Screen & ID</th>
              <th style={{ padding: '12px 16px' }}>Assigned Playlist</th>
              <th style={{ padding: '12px 16px' }}>Screen Group</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredScreens.map(screen => renderScreenTableRow(screen))}
          </tbody>
        </table>
      </div>
    );
  };

  const currentGroupObj = groups.find(g => g.id === selectedGroupId);

  const isAtScreenLimit = (stats?.maxScreens !== undefined && stats?.maxScreens !== null) 
    ? screens.length >= stats.maxScreens 
    : false;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Active Broadcast Alert Notification Banner */}
      {activeBroadcast && (
        <aside 
          aria-label="Active emergency broadcast announcement"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            padding: '16px 20px',
            borderRadius: '12px',
            background: activeBroadcast.severity === 'urgent' ? 'rgba(239, 68, 68, 0.15)' : activeBroadcast.severity === 'info' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            border: `1px solid ${activeBroadcast.severity === 'urgent' ? 'rgba(239, 68, 68, 0.4)' : activeBroadcast.severity === 'info' ? 'rgba(59, 130, 246, 0.4)' : 'rgba(245, 158, 11, 0.4)'}`,
            color: 'var(--foreground)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: activeBroadcast.severity === 'urgent' ? '#ef4444' : activeBroadcast.severity === 'info' ? '#3b82f6' : '#f59e0b',
              color: 'white'
            }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong style={{ fontSize: '15px' }}>{activeBroadcast.title}</strong>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold', padding: '2px 8px', borderRadius: '6px', background: 'rgba(0,0,0,0.2)' }}>
                  {activeBroadcast.severity || 'Notice'}
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>{activeBroadcast.message}</p>
            </div>
          </div>
          <button 
            onClick={handleClearBroadcast}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: 'none',
              background: 'var(--card-bg)',
              color: 'var(--foreground)',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '12px'
            }}
          >
            Dismiss Broadcast
          </button>
        </aside>
      )}

      {/* Centralized Toolbar */}
      <div className="glass-panel" style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '14px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 2px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MonitorPlay size={20} style={{ color: 'var(--brand-primary)' }} /> Centralized Screen Directory
            </h2>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '13px' }}>
              Search, label, group, and manage up to 100 TV displays across all stations.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button 
              onClick={() => setShowBroadcastModal(true)}
              style={{
                background: activeBroadcast ? 'rgba(239, 68, 68, 0.15)' : 'var(--card-bg)',
                color: activeBroadcast ? '#ef4444' : 'var(--foreground)',
                border: `1px solid ${activeBroadcast ? '#ef4444' : 'var(--border)'}`,
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Bell size={15} /> {activeBroadcast ? 'Manage Alert' : 'Broadcast Notice'}
            </button>
            <button 
              onClick={() => setShowCreateGroup(true)}
              style={{ background: 'var(--card-bg)', color: 'var(--foreground)', border: '1px solid var(--border)', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Users size={15} /> New Group
            </button>
            <button 
              onClick={() => setShowTestScreenModal(true)}
              style={{ background: 'var(--card-bg)', color: 'var(--foreground)', border: '1px solid var(--border)', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <ExternalLink size={15} /> Open Test Screen
            </button>
            {isAtScreenLimit ? (
              <button 
                onClick={() => setShowUpgradeModal(true)} 
                style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.9 }}
                title="Plan Limit Reached"
              >
                <MonitorPlay size={15} /> Upgrade to Add Screen
              </button>
            ) : (
              <button 
                onClick={() => {
                  setShowPairModal(true);
                  setPairCode('');
                  setPairName('');
                }} 
                style={{ background: 'var(--brand-primary)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={15} /> Add New Screen
              </button>
            )}
          </div>
        </div>

        {/* View Mode Switcher Tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 280px', background: 'var(--background)', padding: '6px 14px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <Search size={16} style={{ color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search screen name, ID, or group..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--foreground)', outline: 'none', width: '100%', fontSize: '13px' }}
            />
            {searchQuery && (
              <X size={15} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setSearchQuery('')} />
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Status Filter Buttons */}
            <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
              <button 
                onClick={() => setStatusFilter('all')}
                style={{ padding: '6px 12px', fontSize: '12px', fontWeight: '600', border: 'none', background: statusFilter === 'all' ? 'rgba(37,99,235,0.15)' : 'transparent', color: statusFilter === 'all' ? 'var(--brand-primary)' : 'var(--text-muted)', cursor: 'pointer' }}
              >
                All ({screens.length})
              </button>
              <button 
                onClick={() => setStatusFilter('online')}
                style={{ padding: '6px 12px', fontSize: '12px', fontWeight: '600', border: 'none', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)', background: statusFilter === 'online' ? 'rgba(34,197,94,0.15)' : 'transparent', color: statusFilter === 'online' ? '#22c55e' : 'var(--text-muted)', cursor: 'pointer' }}
              >
                🟢 Online ({onlineCount})
              </button>
              <button 
                onClick={() => setStatusFilter('offline')}
                style={{ padding: '6px 12px', fontSize: '12px', fontWeight: '600', border: 'none', background: statusFilter === 'offline' ? 'rgba(255,255,255,0.1)' : 'transparent', color: statusFilter === 'offline' ? 'var(--foreground)' : 'var(--text-muted)', cursor: 'pointer' }}
              >
                ⚪ Offline ({offlineCount})
              </button>
            </div>

            {/* View Mode Tabs */}
            <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
              <button 
                onClick={() => { setViewMode('table'); setSelectedGroupId(null); }} 
                style={{ padding: '6px 12px', fontSize: '12px', background: viewMode === 'table' ? 'rgba(37,99,235,0.15)' : 'transparent', color: viewMode === 'table' ? 'var(--brand-primary)' : 'var(--text-muted)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}
              >
                <List size={14} /> {t('screens.table_view', 'Table View')}
              </button>
              <button 
                onClick={() => { setViewMode('group'); setSelectedGroupId(null); }} 
                style={{ padding: '6px 12px', fontSize: '12px', background: viewMode === 'group' ? 'rgba(37,99,235,0.15)' : 'transparent', color: viewMode === 'group' ? 'var(--brand-primary)' : 'var(--text-muted)', border: 'none', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}
              >
                <Users size={14} /> {t('screens.groups_view', 'Groups')} ({groups.length})
              </button>
              <button 
                onClick={() => { setViewMode('cards'); setSelectedGroupId(null); }} 
                style={{ padding: '6px 12px', fontSize: '12px', background: viewMode === 'cards' ? 'rgba(37,99,235,0.15)' : 'transparent', color: viewMode === 'cards' ? 'var(--brand-primary)' : 'var(--text-muted)', border: 'none', borderRight: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}
              >
                <LayoutGrid size={14} /> {t('screens.cards_view', 'Grid')}
              </button>
              <button 
                onClick={() => { setViewMode('schedule'); setSelectedGroupId(null); }} 
                style={{ padding: '6px 12px', fontSize: '12px', background: viewMode === 'schedule' ? 'rgba(37,99,235,0.15)' : 'transparent', color: viewMode === 'schedule' ? 'var(--brand-primary)' : 'var(--text-muted)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}
              >
                <CalendarRange size={14} /> {t('screens.schedule_view', 'Schedule Timeline')}
              </button>
            </div>
          </div>
        </div>

        {/* Helper Note for Assignments */}
        <div style={{ marginTop: '12px', padding: '10px 14px', background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
          <div style={{ padding: '4px', background: 'rgba(37,99,235,0.1)', borderRadius: '50%', display: 'flex', color: 'var(--brand-primary)' }}>
            <MonitorPlay size={14} />
          </div>
          <span><strong>Note:</strong> If a playlist is assigned directly to a screen, it will <strong>override</strong> any playlist assigned to the screen's group.</span>
        </div>
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedScreenIds.length > 0 && (
        <div className="glass-panel" style={{ padding: '14px 20px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', background: 'rgba(37,99,235,0.12)', border: '1px solid var(--brand-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: 'bold' }}>
            <CheckSquare size={18} style={{ color: 'var(--brand-primary)' }} />
            <span>{selectedScreenIds.length} Screens Selected</span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
            {/* Bulk Playlist Assign */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Playlist:</span>
              <select 
                onChange={(e) => e.target.value && handleBulkAssignPlaylist(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '12px', cursor: 'pointer' }}
              >
                <option value="">-- Bulk Assign Playlist --</option>
                {playlists.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Bulk Group Assign */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Group:</span>
              <select 
                onChange={(e) => e.target.value !== undefined && handleBulkAssignGroup(e.target.value)}
                style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '12px', cursor: 'pointer' }}
              >
                <option value="">-- Bulk Assign Group --</option>
                <option value="">-- Unassigned --</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            <button 
              onClick={handleOpenBulkDeleteModal}
              style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Trash2 size={14} /> Bulk Delete
            </button>
            <button 
              onClick={() => setSelectedScreenIds([])}
              style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {showCreateGroup && (
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input 
            type="text" 
            placeholder="Group Name (e.g. Terminal A Departure Screens)" 
            value={newGroupName}
            onChange={e => setNewGroupName(e.target.value)}
            style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border)', flex: 1, background: 'var(--background)', color: 'var(--foreground)', fontSize: '13px' }}
          />
          <button 
            onClick={handleCreateGroup}
            style={{ background: 'var(--brand-primary)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
          >
            Create Group
          </button>
          <button 
            onClick={() => setShowCreateGroup(false)}
            style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer', padding: '10px', fontSize: '13px' }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* ─── SCHEDULE TIMELINE VIEW ─── */}
      {viewMode === 'schedule' ? (
        <ScheduleCalendarTab />
      ) : viewMode === 'group' ? (
        selectedGroupId === null ? (
          /* Level 1: Groups Grid */
          renderGroupFolderGrid()
        ) : (
          /* Level 2: Inside Specific Group */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Breadcrumb Navigation Header */}
            <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderLeft: '5px solid var(--brand-primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button 
                  onClick={() => setSelectedGroupId(null)}
                  style={{ background: 'var(--card-bg)', color: 'var(--foreground)', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <ArrowLeft size={14} /> Back to Groups
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '16px', fontWeight: 'bold' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Groups</span>
                  <span style={{ color: 'var(--text-muted)' }}>/</span>
                  <FolderOpen size={18} style={{ color: 'var(--brand-primary)' }} />
                  <span>{selectedGroupId === 'unassigned' ? 'Unassigned Screens' : currentGroupObj?.name || 'Group Details'}</span>
                </div>
              </div>

              {selectedGroupId !== 'unassigned' && currentGroupObj && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase' }}>Broadcast Group Playlist:</label>
                  <select 
                    value={currentGroupObj.playlistId || ""}
                    onChange={(e) => handleAssignGroupPlaylist(currentGroupObj.id, e.target.value)}
                    style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', fontSize: '13px', cursor: 'pointer' }}
                  >
                    <option value="">-- No Group Playlist --</option>
                    {playlists.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Screens Inside This Group */}
            {renderScreensList()}
          </div>
        )
      ) : (
        /* Standard Flat Table / Grid View */
        screens.length === 0 ? (
          <div className="glass-panel" style={{ padding: '40px', minHeight: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
            <MonitorPlay size={56} style={{ color: 'var(--brand-primary)', marginBottom: '20px', opacity: 0.8 }} />
            <h3 style={{ fontSize: '22px', marginBottom: '8px' }}>No Screens Paired</h3>
            <p style={{ color: 'var(--text-muted)', maxWidth: '400px', marginBottom: '24px', lineHeight: '1.6', fontSize: '14px' }}>You haven't paired any screens yet. Connect your first Smart TV or Firestick to get started.</p>
          </div>
        ) : renderScreensList()
      )}

      {/* Add New Screen Modal Dialog */}
      {showPairModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 9999, animation: 'fadeIn 0.2s ease-out' }}>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px', boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: '440px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MonitorPlay size={20} color="var(--brand-primary)" /> Add New Screen
              </h3>
              <button onClick={() => setShowPairModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                Name your display to identify where this TV or monitor is located (e.g. <em>Lobby Entrance, Main Bar, Flight Gate A</em>).
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Screen Name / Label</label>
                <input 
                  type="text" 
                  value={pairName}
                  onChange={e => setPairName(e.target.value)}
                  placeholder="e.g. Lobby Entrance TV"
                  autoFocus
                  style={{ background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--foreground)', borderRadius: '10px', padding: '12px 16px', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' }}
                  onKeyDown={e => { if (e.key === 'Enter' && pairName.trim()) handleCreateScreen(); }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button onClick={() => setShowPairModal(false)} style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--muted)', color: 'var(--foreground)', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button 
                  onClick={handleCreateScreen}
                  disabled={!pairName.trim()}
                  style={{ padding: '10px 24px', borderRadius: '10px', background: pairName.trim() ? 'var(--brand-primary)' : 'var(--text-muted)', color: 'white', fontWeight: 'bold', fontSize: '13px', border: 'none', cursor: pairName.trim() ? 'pointer' : 'not-allowed', boxShadow: 'var(--shadow-sm)' }}
                >
                  Create Screen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Test Screen Modal Dialog */}
      {showTestScreenModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 9999, animation: 'fadeIn 0.2s ease-out' }}>
          <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px', boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: '440px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: 'var(--foreground)' }}>Select Screen to Test</h3>
              <button onClick={() => setShowTestScreenModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '380px', overflowY: 'auto' }} className="custom-scroll">
              {screens.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '16px 0' }}>No screens available to test.</p>
              ) : (
                screens.map(screen => (
                  <button
                    key={screen.id}
                    onClick={() => {
                      window.open(`/player/${screen.id}?testMode=true`, 'TestPlayer', 'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no');
                    }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderRadius: '10px', background: 'var(--background)', border: '1px solid var(--border)', color: 'var(--foreground)', fontWeight: '600', fontSize: '14px', cursor: 'pointer', width: '100%', boxSizing: 'border-box', transition: 'all 0.15s ease' }}
                    onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--brand-primary)')}
                    onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                  >
                    <span>{screen.name}</span>
                    <ExternalLink size={16} color="var(--brand-primary)" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Strict Bulk Delete Confirmation Modal Dialog */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black/70 dark:bg-black/85 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-red-500/40 rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-5 bg-red-500/10 border-b border-red-500/20 flex justify-between items-center">
              <h3 className="text-base font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                ⚠️ Strict Bulk Delete Confirmation
              </h3>
              <button onClick={() => setShowBulkDeleteModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            
            <div className="p-5 flex flex-col gap-4">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                You are about to unpair and delete <strong className="text-red-500">{selectedScreenIds.length} TV screens</strong>.
              </p>
              <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg text-[11px] text-red-500 font-semibold">
                🚨 Warning: Deleting paired screens disconnects physical Android TV players. Someone will have to manually walk up to each TV with a remote control to pair them again!
              </div>

              <div className="flex flex-col gap-1.5 mt-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  To confirm, type <span className="font-mono text-red-500 font-extrabold">DELETE</span> below:
                </label>
                <input 
                  type="text" 
                  value={bulkDeleteConfirmInput}
                  onChange={e => setBulkDeleteConfirmInput(e.target.value)}
                  placeholder="Type DELETE to enable button"
                  className="input-field border-red-500/40 focus:border-red-500 font-mono text-sm"
                  autoFocus
                />
              </div>

              <div className="flex gap-3 justify-end mt-3">
                <button onClick={() => setShowBulkDeleteModal(false)} className="btn-secondary">Cancel</button>
                <button 
                  onClick={handleExecuteBulkDelete}
                  disabled={bulkDeleteConfirmInput.trim().toUpperCase() !== 'DELETE'}
                  style={{ 
                    background: bulkDeleteConfirmInput.trim().toUpperCase() === 'DELETE' ? '#ef4444' : '#94a3b8', 
                    color: 'white', 
                    border: 'none', 
                    padding: '8px 16px', 
                    borderRadius: '8px', 
                    fontWeight: 'bold', 
                    fontSize: '12px',
                    cursor: bulkDeleteConfirmInput.trim().toUpperCase() === 'DELETE' ? 'pointer' : 'not-allowed'
                  }}
                >
                  Delete {selectedScreenIds.length} Screens
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {overrideScreen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ width: '480px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                Screen Override: {overrideScreen.name}
              </h3>
              <button onClick={() => setOverrideScreen(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
              Broadcast high-priority announcement or media directly to this screen, interrupting current playlist playback.
            </p>

            {overrideScreen.overrideType && (
              <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#ef4444' }}>
                  Active Override: {overrideScreen.overrideType.toUpperCase()}
                </span>
                <button
                  onClick={async () => {
                    await handleUpdateScreen(overrideScreen.id, { overrideType: null, overridePayload: null });
                    setOverrideScreen(null);
                  }}
                  style={{ background: '#ef4444', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Clear Override
                </button>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label className="form-label">Override Type</label>
              <select
                value={overrideType}
                onChange={e => setOverrideType(e.target.value)}
                className="input-field"
              >
                <option value="html">Custom HTML Announcement</option>
                <option value="image">Image Asset</option>
                <option value="video">Video Asset</option>
              </select>
            </div>

            {overrideType === 'html' ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="form-label">Title / Headline</label>
                  <input
                    type="text"
                    placeholder="e.g. Flight 402 Boarding Gate 3"
                    value={htmlTitle}
                    onChange={e => setHtmlTitle(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="form-label">Subtitle / Message</label>
                  <input
                    type="text"
                    placeholder="e.g. All Passengers Please Proceed Immediately"
                    value={htmlSubtitle}
                    onChange={e => setHtmlSubtitle(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">Background Color</label>
                    <input
                      type="color"
                      value={htmlBgColor}
                      onChange={e => setHtmlBgColor(e.target.value)}
                      style={{ width: '100%', height: '38px', borderRadius: '6px', border: '1px solid var(--border)', cursor: 'pointer' }}
                    />
                  </div>
                  <div>
                    <label className="form-label">Text Color</label>
                    <input
                      type="color"
                      value={htmlTextColor}
                      onChange={e => setHtmlTextColor(e.target.value)}
                      style={{ width: '100%', height: '38px', borderRadius: '6px', border: '1px solid var(--border)', cursor: 'pointer' }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label className="form-label">Select Media Asset</label>
                <select
                  value={overrideMediaId}
                  onChange={e => setOverrideMediaId(e.target.value)}
                  className="input-field"
                >
                  <option value="">-- Select Media Asset --</option>
                  {mediaAssets.filter(m => m.type === overrideType).map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button onClick={() => setOverrideScreen(null)} className="btn-secondary">Cancel</button>
              <button
                onClick={async () => {
                  let payload: any = {};
                  if (overrideType === 'html') {
                    payload = { title: htmlTitle, subtitle: htmlSubtitle, backgroundColor: htmlBgColor, textColor: htmlTextColor };
                  } else {
                    const selectedMedia = mediaAssets.find(m => m.id === overrideMediaId);
                    payload = { mediaId: overrideMediaId, mediaUrl: selectedMedia?.url };
                  }
                  await handleUpdateScreen(overrideScreen.id, {
                    overrideType,
                    overridePayload: JSON.stringify(payload)
                  });
                  setOverrideScreen(null);
                }}
                className="btn-primary"
              >
                Apply Override Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Snapshot Modal */}
      {snapshotScreen && (
        <aside className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <section className="glass-panel" style={{ width: '100%', maxWidth: '640px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--card-bg)' }}>
            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={20} style={{ color: 'var(--brand-primary)' }} />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Live Screen Snapshot: {snapshotScreen.name}</h3>
              </div>
              <button onClick={() => setSnapshotScreen(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
            </header>

            <main style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {snapshotScreen.lastScreenshotUrl ? (
                <figure style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)', background: '#000', aspectRatio: '16/9' }}>
                    <img 
                      src={snapshotScreen.lastScreenshotUrl} 
                      alt={`Live snapshot of ${snapshotScreen.name}`}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </div>
                  <figcaption style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <span>Captured: {snapshotScreen.lastScreenshotAt ? new Date(snapshotScreen.lastScreenshotAt).toLocaleString() : 'Recent'}</span>
                    <a href={snapshotScreen.lastScreenshotUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--brand-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ExternalLink size={12} /> View Fullscreen
                    </a>
                  </figcaption>
                </figure>
              ) : (
                <div style={{ padding: '32px', textAlign: 'center', background: 'rgba(0,0,0,0.05)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                  <Camera size={36} style={{ opacity: 0.4, marginBottom: '8px' }} />
                  <p style={{ margin: 0, fontSize: '13px' }}>No snapshot recorded yet for this display.</p>
                </div>
              )}

              {snapshotSuccessMessage && (
                <div style={{ padding: '8px 12px', borderRadius: '6px', background: 'rgba(34,197,94,0.1)', color: '#22c55e', fontSize: '12px', fontWeight: '600' }}>
                  {snapshotSuccessMessage}
                </div>
              )}
            </main>

            <footer style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Status: {isScreenOnline(snapshotScreen) ? '🟢 Online' : '⚪ Offline'}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setSnapshotScreen(null)} className="btn-secondary">Close</button>
                <button 
                  onClick={() => handleTriggerSnapshot(snapshotScreen.id)} 
                  disabled={isRequestingSnapshot || !isScreenOnline(snapshotScreen)}
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Camera size={15} />
                  {isRequestingSnapshot ? 'Requesting...' : 'Request Fresh Snapshot'}
                </button>
              </div>
            </footer>
          </section>
        </aside>
      )}

      {/* ─── Screen Settings & Actions Hub Pop-up Modal ─── */}
      {settingsModalScreen && (
        <aside 
          className="modal-overlay" 
          style={{ 
            position: 'fixed', 
            inset: 0, 
            background: 'rgba(0,0,0,0.7)', 
            backdropFilter: 'blur(4px)',
            zIndex: 9999, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '16px' 
          }}
          onClick={() => setSettingsModalScreen(null)}
        >
          <section 
            className="glass-panel" 
            style={{ 
              width: '100%', 
              maxWidth: '540px', 
              padding: '24px', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '16px', 
              background: 'var(--card-bg)',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-lg)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(44, 76, 124, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-primary)' }}>
                  <Settings size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: 'var(--foreground)' }}>
                    {settingsModalScreen.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <span>ID: {settingsModalScreen.id}</span>
                    <span>&bull;</span>
                    <span style={{ color: isScreenOnline(settingsModalScreen) ? '#22c55e' : 'var(--text-muted)', fontWeight: '600' }}>
                      {isScreenOnline(settingsModalScreen) ? '🟢 Online' : '⚪ Offline'}
                    </span>
                    {settingsModalScreen.location && (
                      <>
                        <span>&bull;</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                          <MapPin size={10} color="var(--brand-primary)" /> {settingsModalScreen.location}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setSettingsModalScreen(null)} 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '6px' }}
              >
                <X size={20} />
              </button>
            </header>

            {/* Actions Grid */}
            <main style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              
              {/* 1. Location & Operating Hours */}
              <button
                onClick={() => {
                  const s = settingsModalScreen;
                  setSettingsModalScreen(null);
                  handleOpenOpHoursModal(s);
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  background: 'var(--background)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  gap: '6px'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--brand-primary)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-primary)', fontWeight: '700', fontSize: '13px' }}>
                  <MapPin size={16} />
                  <span>Location & Hours</span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  {settingsModalScreen.location ? settingsModalScreen.location : 'Set city/weather location'} &bull; Sleep schedule
                </span>
              </button>

              {/* 2. Cast Override Alert */}
              <button
                onClick={() => {
                  const s = settingsModalScreen;
                  setSettingsModalScreen(null);
                  setOverrideScreen(s);
                  if (s.overrideType) {
                    setOverrideType(s.overrideType);
                    try {
                      const p = JSON.parse(s.overridePayload || '{}');
                      if (p.title) setHtmlTitle(p.title);
                      if (p.subtitle) setHtmlSubtitle(p.subtitle);
                      if (p.backgroundColor) setHtmlBgColor(p.backgroundColor);
                      if (p.textColor) setHtmlTextColor(p.textColor);
                      if (p.mediaId) setOverrideMediaId(p.mediaId);
                    } catch (e) {}
                  }
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '14px',
                  borderRadius: '12px',
                  border: settingsModalScreen.overrideType ? '1px solid #ef4444' : '1px solid var(--border)',
                  background: settingsModalScreen.overrideType ? 'rgba(239, 68, 68, 0.08)' : 'var(--background)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  gap: '6px'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#f59e0b'}
                onMouseLeave={e => e.currentTarget.style.borderColor = settingsModalScreen.overrideType ? '#ef4444' : 'var(--border)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: settingsModalScreen.overrideType ? '#ef4444' : '#d97706', fontWeight: '700', fontSize: '13px' }}>
                  <Radio size={16} />
                  <span>Cast Override</span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  {settingsModalScreen.overrideType ? 'Override active (Click to manage)' : 'Instant flash message, photo or video'}
                </span>
              </button>

              {/* 3. Live Snapshot */}
              <button
                onClick={() => {
                  const s = settingsModalScreen;
                  setSettingsModalScreen(null);
                  handleOpenSnapshotModal(s);
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  background: 'var(--background)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  gap: '6px'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#3b82f6'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0284c7', fontWeight: '700', fontSize: '13px' }}>
                  <Camera size={16} />
                  <span>Live Snapshot</span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  Capture real-time proof-of-display screenshot
                </span>
              </button>

              {/* 4. QR Remote & Print Badge */}
              <button
                onClick={() => {
                  const s = settingsModalScreen;
                  setSettingsModalScreen(null);
                  setQrModalScreen({ id: s.id, name: s.name });
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  background: 'var(--background)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  gap: '6px'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--brand-primary)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-primary)', fontWeight: '700', fontSize: '13px' }}>
                  <QrCode size={16} />
                  <span>QR Remote & Badge</span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  Printable TV QR badge & web controller link
                </span>
              </button>

              {/* 5. Visual Canvas Editor */}
              <button
                onClick={() => {
                  const s = settingsModalScreen;
                  setSettingsModalScreen(null);
                  setVisualEditorScreenId(s.id);
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  background: 'var(--background)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  gap: '6px'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#10b981'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontWeight: '700', fontSize: '13px' }}>
                  <MonitorPlay size={16} />
                  <span>Visual Editor</span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  Multi-zone visual drag & drop canvas editor
                </span>
              </button>

              {/* 6. Test TV Connection */}
              <button
                onClick={() => {
                  const s = settingsModalScreen;
                  handleTestConnection(s.id);
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid var(--border)',
                  background: 'var(--background)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  gap: '6px'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = '#8b5cf6'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8b5cf6', fontWeight: '700', fontSize: '13px' }}>
                  <Wifi size={16} />
                  <span>Test Connection</span>
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                  Send ping to test display connection
                </span>
              </button>

            </main>

            {/* Footer / Danger Zone */}
            <footer style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border)', marginTop: '4px' }}>
              <button
                onClick={() => {
                  const s = settingsModalScreen;
                  setSettingsModalScreen(null);
                  handleDeleteScreen(s.id);
                }}
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: '#ef4444',
                  fontSize: '12px',
                  fontWeight: '700',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Trash2 size={14} /> Delete Screen
              </button>

              <button
                onClick={() => setSettingsModalScreen(null)}
                className="btn-secondary"
                style={{ padding: '8px 16px', fontSize: '12px' }}
              >
                Close
              </button>
            </footer>
          </section>
        </aside>
      )}

      {/* Screen Settings (Location, Operating Hours & Sleep Schedule) Modal */}
      {opHoursScreen && (
        <aside className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <section className="glass-panel" style={{ width: '100%', maxWidth: '540px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--card-bg)' }}>
            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Settings size={20} style={{ color: 'var(--brand-primary)' }} />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Screen Settings: {opHoursScreen.name}</h3>
              </div>
              <button onClick={() => setOpHoursScreen(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
            </header>

            <main style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* 1. Location Settings */}
              <div style={{ padding: '14px', borderRadius: '10px', background: 'var(--background)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: 0 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700' }}>
                    <MapPin size={15} color="var(--brand-primary)" /> Physical / Weather Location
                  </span>
                  {opLocation && (
                    <button
                      type="button"
                      onClick={() => setOpLocation('')}
                      style={{ background: 'transparent', border: 'none', color: '#EF4444', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      Clear Location
                    </button>
                  )}
                </label>
                <LocationAutocomplete
                  value={opLocation}
                  onChange={val => setOpLocation(val)}
                  placeholder="e.g. San Pedro, Belize (Leave blank for no location)"
                  style={{ width: '100%' }}
                />
                <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>
                  Used for weather widgets, conditional playback rules, and display branding. Leave blank if you don't want any location assigned.
                </p>
              </div>

              {/* 2. Operating Hours & Sleep Schedule */}
              <div style={{ padding: '14px', borderRadius: '10px', background: 'var(--background)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={opHoursActive} 
                    onChange={e => setOpHoursActive(e.target.checked)} 
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <div>
                    <strong style={{ display: 'block', fontSize: '13px' }}>Enable Operating Hours / Sleep Schedule</strong>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Automatically dim or power down the display outside business hours</span>
                  </div>
                </label>

                {opHoursActive && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '6px' }}>
                    <div>
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                        <Clock size={13} /> Wake Time (Turn On)
                      </label>
                      <input 
                        type="time" 
                        value={opWakeTime} 
                        onChange={e => setOpWakeTime(e.target.value)} 
                        className="input-field" 
                      />
                    </div>
                    <div>
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                        <Moon size={13} /> Sleep Time (Turn Off)
                      </label>
                      <input 
                        type="time" 
                        value={opSleepTime} 
                        onChange={e => setOpSleepTime(e.target.value)} 
                        className="input-field" 
                      />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label className="form-label" style={{ fontSize: '12px' }}>Sleep Mode Appearance</label>
                      <select 
                        value={opSleepMode} 
                        onChange={e => setOpSleepMode(e.target.value)} 
                        className="input-field"
                      >
                        <option value="black">Total Black Screen (Maximum Power Saving & OLED Safety)</option>
                        <option value="clock">Dim Ambient Clock & Date</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

            </main>

            <footer style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
              <button onClick={() => setOpHoursScreen(null)} className="btn-secondary">Cancel</button>
              <button onClick={handleSaveOperatingHours} className="btn-primary">Save Screen Settings</button>
            </footer>
          </section>
        </aside>
      )}

      {/* Broadcast Alert Modal */}
      {showBroadcastModal && (
        <aside className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <section className="glass-panel" style={{ width: '100%', maxWidth: '560px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--card-bg)' }}>
            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bell size={20} style={{ color: '#f59e0b' }} />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Broadcast Emergency / Notice Alert</h3>
              </div>
              <button onClick={() => setShowBroadcastModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={18} /></button>
            </header>

            <main style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
                Display a prominent banner across screens to announce urgent notices, weather advisories, or company bulletins.
              </p>

              <div>
                <label className="form-label">Alert Headline / Title</label>
                <input 
                  type="text" 
                  placeholder="e.g. Severe Weather Advisory or Building Closes at 5 PM" 
                  value={broadcastTitle} 
                  onChange={e => setBroadcastTitle(e.target.value)} 
                  className="input-field" 
                />
              </div>

              <div>
                <label className="form-label">Message Details</label>
                <textarea 
                  placeholder="e.g. Please proceed to designated exits or check station agent for assistance."
                  value={broadcastMessage}
                  onChange={e => setBroadcastMessage(e.target.value)}
                  className="input-field"
                  rows={3}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Severity Level</label>
                  <select 
                    value={broadcastSeverity} 
                    onChange={e => setBroadcastSeverity(e.target.value as any)} 
                    className="input-field"
                  >
                    <option value="info">🔵 Information (Blue Banner)</option>
                    <option value="warning">🟡 Warning / Advisory (Amber Banner)</option>
                    <option value="urgent">🔴 Urgent / Emergency (Red Banner)</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Target Screens</label>
                  <select 
                    value={broadcastTargetType} 
                    onChange={e => {
                      setBroadcastTargetType(e.target.value as any);
                      setBroadcastTargetId('');
                    }} 
                    className="input-field"
                  >
                    <option value="all">All Organization Screens</option>
                    <option value="group">Specific Screen Group</option>
                  </select>
                </div>
              </div>

              {broadcastTargetType === 'group' && (
                <div>
                  <label className="form-label">Select Group</label>
                  <select 
                    value={broadcastTargetId} 
                    onChange={e => setBroadcastTargetId(e.target.value)} 
                    className="input-field"
                  >
                    <option value="">-- Choose Screen Group --</option>
                    {groups.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </main>

            <footer style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
              <button onClick={() => setShowBroadcastModal(false)} className="btn-secondary">Cancel</button>
              <button 
                onClick={handleBroadcastAlert} 
                disabled={isSendingBroadcast || !broadcastTitle.trim() || !broadcastMessage.trim()}
                className="btn-primary"
              >
                {isSendingBroadcast ? 'Broadcasting...' : 'Activate Broadcast'}
              </button>
            </footer>
          </section>
        </aside>
      )}
      
      <UpgradePlanModal 
        isOpen={showUpgradeModal} 
        onClose={() => setShowUpgradeModal(false)} 
        limitType="screens" 
        currentPlanName={stats?.planName}
        maxScreens={stats?.maxScreens}
        currentScreensCount={screens.length}
      />

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
