import React, { useState, useEffect } from 'react';
import { Monitor, Plus, Trash2, ShieldCheck, TabletSmartphone, ChevronLeft, X, Wifi, Tv, Lock, Edit3, Eye, EyeOff, HardDriveDownload, LogOut, Camera, ExternalLink, MapPin, DownloadCloud, HardDrive, Cpu, CheckCircle2, AlertCircle, RefreshCw, Sliders, Activity } from 'lucide-react';
import { TvAccountTabletBuilder } from './TvAccountTabletBuilder';
import { LocationAutocomplete } from './LocationAutocomplete';

export default function TvAccountsTab({ mediaAssets = [] }: { mediaAssets?: any[] }) {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [screens, setScreens] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [viewingTabletBuilder, setViewingTabletBuilder] = useState(false);
  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);
  const [editingDeviceName, setEditingDeviceName] = useState("");
  const [selectedScreens, setSelectedScreens] = useState<string[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'accounts' | 'devices'>('accounts');

  // Target TV APK Version & OTA Push State
  const [targetVersion, setTargetVersion] = useState('1.0.0');
  const [editingTargetVersion, setEditingTargetVersion] = useState(false);
  const [tempVersion, setTempVersion] = useState('1.0.0');
  const [pushingDeviceIds, setPushingDeviceIds] = useState<Record<string, boolean>>({});
  const [pushingAll, setPushingAll] = useState(false);
  const [otaSuccessMsg, setOtaSuccessMsg] = useState('');

  // Live Snapshot Modal State
  const [selectedSnapshotDevice, setSelectedSnapshotDevice] = useState<any>(null);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [snapshotMsg, setSnapshotMsg] = useState('');

  const fetchScreens = async () => {
    try {
      const res = await fetch('/api/screens');
      if (res.ok) {
        setScreens(await res.json());
      }
    } catch (e) {
      console.error('Failed to fetch screens:', e);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/tv-accounts');
      if (res.ok) {
        setAccounts(await res.json());
      }
    } catch (e) {
      console.error('Failed to fetch TV accounts:', e);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchScreens();

    // Fetch target TV APK version from settings
    fetch('/api/settings')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.latest_tv_apk_version) {
          setTargetVersion(data.latest_tv_apk_version);
          setTempVersion(data.latest_tv_apk_version);
        }
      })
      .catch(() => {});

    // Auto-refresh every 8 seconds to keep live Online/Offline device status accurate
    const interval = setInterval(() => {
      fetchAccounts();
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const handleSaveTargetVersion = async () => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'latest_tv_apk_version', value: tempVersion })
      });
      if (res.ok) {
        setTargetVersion(tempVersion);
        setEditingTargetVersion(false);
        setOtaSuccessMsg(`Target TV App Version updated to v${tempVersion}`);
        setTimeout(() => setOtaSuccessMsg(''), 4000);
      }
    } catch (e) {
      console.error('Failed to save target APK version', e);
    }
  };

  const handlePushUpdate = async (deviceId: string, deviceName?: string) => {
    if (!confirm(`Push OTA Update to "${deviceName || 'this TV'}"?\n\nThe TV will automatically download and install the latest APK from /api/downloads/tv-app.apk.`)) return;
    setPushingDeviceIds(prev => ({ ...prev, [deviceId]: true }));
    try {
      const res = await fetch('/api/tv-ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, action: 'PUSH_UPDATE' })
      });
      if (res.ok) {
        setOtaSuccessMsg(`OTA Update command successfully queued for "${deviceName || 'TV'}"!`);
        setTimeout(() => setOtaSuccessMsg(''), 5000);
      }
    } catch (e) {
      console.error('OTA push error:', e);
    } finally {
      setPushingDeviceIds(prev => ({ ...prev, [deviceId]: false }));
    }
  };

  const handlePushUpdateAll = async (outdatedDevices: any[]) => {
    if (outdatedDevices.length === 0) return;
    if (!confirm(`Push OTA Update to ALL ${outdatedDevices.length} outdated TV(s)?\n\nAll selected TVs will download and install the latest APK.`)) return;
    setPushingAll(true);
    try {
      const res = await fetch('/api/tv-ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'PUSH_UPDATE_ALL',
          deviceIds: outdatedDevices.map(d => d.id)
        })
      });
      if (res.ok) {
        setOtaSuccessMsg(`OTA Update push queued for all ${outdatedDevices.length} outdated TVs!`);
        setTimeout(() => setOtaSuccessMsg(''), 5000);
      }
    } catch (e) {
      console.error('Bulk OTA push error:', e);
    } finally {
      setPushingAll(false);
    }
  };

  const formatLastSeen = (dateStr?: string | Date | null) => {
    if (!dateStr) return 'Never connected';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    if (diffMs < 0) return 'Just now';
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  const handleCreate = async () => {
    if (!username || !password) return;
    setError('');
    try {
      const res = await fetch('/api/tv-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, screenIds: selectedScreens })
      });
      if (res.ok) {
        setShowAddModal(false);
        setUsername('');
        setPassword('');
        setSelectedScreens([]);
        fetchAccounts();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create TV account');
      }
    } catch (e) {
      setError('An unexpected error occurred while creating the account.');
    }
  };

  const updateAccountScreens = async (accountId: string, newScreenIds: string[]) => {
    try {
      const res = await fetch(`/api/tv-accounts/${accountId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ screenIds: newScreenIds })
      });
      if (res.ok) {
        fetchAccounts();
      }
    } catch (e) {
      console.error('Failed to update screens:', e);
    }
  };

  const handleUpdateCredentials = async () => {
    setError('');
    if (!selectedAccountId) return;
    
    // Only send fields that have been filled out
    const updates: any = {};
    if (editUsername) updates.username = editUsername;
    if (editPassword) updates.password = editPassword;
    
    if (Object.keys(updates).length === 0) {
      setShowEditModal(false);
      return;
    }

    try {
      const res = await fetch(`/api/tv-accounts/${selectedAccountId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        setShowEditModal(false);
        setEditUsername('');
        setEditPassword('');
        fetchAccounts();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update credentials');
      }
    } catch (e) {
      setError('An unexpected error occurred.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this TV Account? Any TV connected with these credentials will be logged out on next update.')) return;
    try {
      const res = await fetch(`/api/tv-accounts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (selectedAccountId === id) setSelectedAccountId(null);
        fetchAccounts();
      }
    } catch (e) {
      console.error('Failed to delete account:', e);
    }
  };

  const requestDeviceSnapshot = async (deviceId: string) => {
    try {
      setSnapshotLoading(true);
      setSnapshotMsg('Snapshot command sent! Waiting for TV response...');
      const res = await fetch(`/api/tv-devices/${deviceId}/snapshot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REQUEST_SNAPSHOT' })
      });
      if (res.ok) {
        let attempts = 0;
        const checkInterval = setInterval(async () => {
          attempts++;
          const checkRes = await fetch(`/api/tv-devices/${deviceId}/snapshot`);
          if (checkRes.ok) {
            const checkData = await checkRes.json();
            if (checkData.device?.lastScreenshotUrl) {
              setSelectedSnapshotDevice(checkData.device);
              setSnapshotMsg('Snapshot updated successfully!');
              setSnapshotLoading(false);
              clearInterval(checkInterval);
              fetchAccounts();
              return;
            }
          }
          if (attempts >= 10) {
            clearInterval(checkInterval);
            setSnapshotLoading(false);
            setSnapshotMsg('TV has not responded yet. Ensure the TV is running and connected.');
          }
        }, 2000);
      } else {
        setSnapshotLoading(false);
        setSnapshotMsg('Failed to queue snapshot request.');
      }
    } catch (e) {
      setSnapshotLoading(false);
      setSnapshotMsg('Error sending snapshot request.');
    }
  };

  const handleRemoteLogout = async (deviceId: string, deviceName?: string) => {
    if (!confirm(`Send Screen Logout signal to "${deviceName || 'this TV'}"?\n\nThis will unpair the screen and log out of the TV account, but keep the company code saved on the TV.`)) return;
    try {
      const res = await fetch(`/api/tv-ping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, action: 'SCREEN_LOGOUT' })
      });
      if (res.ok) {
        fetchAccounts();
      }
    } catch (e) {
      console.error('Remote logout error:', e);
    }
  };

  const handleDeleteDevice = async (deviceId: string, deviceName?: string) => {
    if (!confirm(`Are you sure you want to delete TV "${deviceName || 'Unnamed TV'}"?\n\nThis will permanently delete the device from the CMS and remotely log it out of BOTH the company code and TV account.`)) return;
    try {
      const res = await fetch(`/api/tv-devices/${deviceId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAccounts();
      } else {
        alert('Failed to delete TV device.');
      }
    } catch (e) {
      console.error('Failed to delete TV device:', e);
    }
  };

  const handleSyncScreen = async (deviceId: string, screenId: string) => {
    try {
      const res = await fetch(`/api/tv-devices/${deviceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ screenId: screenId || null })
      });
      if (res.ok) {
        fetchAccounts();
      }
    } catch (e) {
      console.error('Screen mapping error:', e);
    }
  };

  const handleForceSync = async (deviceId: string) => {
    try {
      const res = await fetch(`/api/tv-ping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, action: 'FORCE_SYNC' })
      });
      if (res.ok) {
        alert('Force sync command sent successfully to TV device.');
      }
    } catch (e) {
      console.error('Force sync error:', e);
    }
  };

  const handleRenameDevice = async (deviceId: string, name: string) => {
    try {
      const res = await fetch(`/api/tv-devices/${deviceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        fetchAccounts();
      }
    } catch (e) {
      console.error('Device rename error:', e);
    }
  };

  const handleUpdateDeviceSettings = async (deviceId: string, data: any) => {
    try {
      const res = await fetch(`/api/tv-devices/${deviceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        fetchAccounts();
      }
    } catch (e) {
      console.error('Device settings update error:', e);
    }
  };

  // Calculate quick stats & Fleet Health
  const totalActiveDevices = accounts.reduce((sum, acc) => sum + (acc.activeDevicesCount || 0), 0);
  const totalConnectedDevices = accounts.reduce((sum, acc) => sum + (acc.devices?.length || 0), 0);
  const allDevices = accounts.flatMap(a => (a.devices || []).map((d: any) => ({ ...d, accountUsername: a.username })));
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const onlineDevicesCount = allDevices.filter(d => d.lastPingAt && new Date(d.lastPingAt) > fiveMinutesAgo).length;
  const outdatedDevices = allDevices.filter(d => (d.appVersion || '1.0.0') !== targetVersion);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', color: 'var(--foreground)' }}>

      {viewingTabletBuilder && selectedAccountId ? (
        <TvAccountTabletBuilder 
          tvAccount={accounts.find(a => a.id === selectedAccountId)}
          mediaAssets={mediaAssets}
          onBack={() => setViewingTabletBuilder(false)}
        />
      ) : (
        <>
          {/* Header section with summary stats */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--brand-accent)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={26} />
              </div>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--foreground)', margin: 0 }}>TV Accounts & Tablet Controls</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '4px 0 0 0' }}>
                  Manage TV player security credentials and build custom interactive tablet interfaces.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '16px', padding: '6px 16px', background: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '12px' }}>
                <div><strong>{accounts.length}</strong> <span style={{ color: 'var(--text-muted)' }}>Accounts</span></div>
                <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '16px' }}>
                  <strong style={{ color: totalActiveDevices > 0 ? '#10B981' : 'var(--foreground)' }}>{totalActiveDevices}</strong> <span style={{ color: 'var(--text-muted)' }}>Active Online</span>
                </div>
                <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '16px' }}>
                  <strong>{totalConnectedDevices}</strong> <span style={{ color: 'var(--text-muted)' }}>Total Paired</span>
                </div>
              </div>

              {selectedAccountId ? (
                <button
                  onClick={() => setSelectedAccountId(null)}
                  className="btn-secondary"
                  style={{ fontSize: '13px', padding: '8px 14px', height: 'auto' }}
                >
                  <ChevronLeft size={16} /> All Accounts
                </button>
              ) : (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '8px 14px', height: 'auto' }}
                >
                  <Plus size={15} /> Add TV Account
                </button>
              )}
            </div>
          </div>

          {/* Sub Navigation */}
          {!selectedAccountId && (
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
              <button 
                onClick={() => setActiveSubTab('accounts')}
                style={{ 
                  background: activeSubTab === 'accounts' ? 'var(--card-bg)' : 'transparent',
                  border: '1px solid',
                  borderColor: activeSubTab === 'accounts' ? 'var(--border)' : 'transparent',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: activeSubTab === 'accounts' ? 'var(--foreground)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                TV Accounts
              </button>
              <button 
                onClick={() => setActiveSubTab('devices')}
                style={{ 
                  background: activeSubTab === 'devices' ? 'var(--card-bg)' : 'transparent',
                  border: '1px solid',
                  borderColor: activeSubTab === 'devices' ? 'var(--border)' : 'transparent',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: activeSubTab === 'devices' ? 'var(--foreground)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                All Devices
              </button>
            </div>
          )}

          {/* Accounts Grid or Detailed Account View */}
          {!selectedAccountId ? (
            activeSubTab === 'accounts' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
              {accounts.length === 0 && (
                <div className="glass-panel" style={{ gridColumn: '1 / -1', padding: '64px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                  <ShieldCheck size={48} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
                  <p style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '15px', margin: 0 }}>No TV accounts created yet.</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>Create your first TV account to authenticate player screens and configure tablet UI controls.</p>
                  <button onClick={() => setShowAddModal(true)} className="btn-primary" style={{ marginTop: '8px' }}>
                    <Plus size={16} /> Create TV Account
                  </button>
                </div>
              )}
              {accounts.map(acc => (
                <div
                  key={acc.id}
                  onClick={() => setSelectedAccountId(acc.id)}
                  className="glass-panel"
                  style={{
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '16px',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                    minHeight: '140px'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = 'var(--shadow-md)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = 'var(--shadow-sm)')}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'var(--brand-accent)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Tv size={20} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--foreground)', margin: 0 }}>{acc.username}</h3>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <Lock size={10} /> Protected Credentials
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(acc.id); }}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '6px', borderRadius: '6px', transition: 'all 0.2s' }}
                      title="Delete TV Account"
                      onMouseEnter={e => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--border)', fontSize: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', color: (acc.activeDevicesCount || 0) > 0 ? '#10B981' : 'var(--text-muted)' }}>
                      <Wifi size={14} />
                      {acc.activeDevicesCount || 0} Online • {acc.devices?.length || 0} Connected
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAccountId(acc.id);
                        setViewingTabletBuilder(true);
                      }}
                      style={{
                        background: '#4F46E5',
                        color: '#FFFFFF',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(79, 70, 229, 0.2)'
                      }}
                    >
                      <TabletSmartphone size={14} /> Configure Tablet UI
                    </button>
                  </div>
                </div>
              ))}
            </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Fleet Health & OTA Overview Banner */}
                {allDevices.length > 0 && (
                  <div className="glass-panel" style={{ padding: '16px 20px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.12)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Activity size={18} />
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Fleet Size</div>
                          <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--foreground)' }}>{allDevices.length} TVs ({onlineDevicesCount} Online)</div>
                        </div>
                      </div>

                      <div style={{ width: '1px', height: '28px', background: 'var(--border)' }} />

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: outdatedDevices.length > 0 ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)', color: outdatedDevices.length > 0 ? '#F59E0B' : '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <DownloadCloud size={18} />
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>OTA Status</div>
                          <div style={{ fontSize: '14px', fontWeight: '700', color: outdatedDevices.length > 0 ? '#F59E0B' : '#10B981' }}>
                            {outdatedDevices.length > 0 ? `${outdatedDevices.length} Update${outdatedDevices.length > 1 ? 's' : ''} Pending` : 'All TVs Up-to-Date'}
                          </div>
                        </div>
                      </div>

                      <div style={{ width: '1px', height: '28px', background: 'var(--border)' }} />

                      {/* Target APK Version Selector */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '700' }}>Target APK Version</div>
                          {editingTargetVersion ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                              <input 
                                type="text"
                                value={tempVersion}
                                onChange={(e) => setTempVersion(e.target.value)}
                                placeholder="e.g. 1.1.0"
                                className="input-field"
                                style={{ fontSize: '12px', padding: '2px 6px', width: '80px', height: '24px' }}
                              />
                              <button onClick={handleSaveTargetVersion} className="btn-primary" style={{ padding: '2px 8px', fontSize: '11px', height: '24px' }}>Save</button>
                              <button onClick={() => setEditingTargetVersion(false)} className="btn-secondary" style={{ padding: '2px 8px', fontSize: '11px', height: '24px' }}>Cancel</button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '700', color: 'var(--foreground)' }}>
                              <span>v{targetVersion}</span>
                              <button 
                                onClick={() => { setTempVersion(targetVersion); setEditingTargetVersion(true); }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand-primary)', padding: '2px' }}
                                title="Change target TV version"
                              >
                                <Edit3 size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bulk Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {outdatedDevices.length > 0 && (
                        <button
                          onClick={() => handlePushUpdateAll(outdatedDevices)}
                          disabled={pushingAll}
                          style={{
                            background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                            color: '#FFFFFF',
                            border: 'none',
                            padding: '8px 14px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            cursor: pushingAll ? 'not-allowed' : 'pointer',
                            boxShadow: '0 2px 6px rgba(245, 158, 11, 0.3)'
                          }}
                        >
                          <DownloadCloud size={14} className={pushingAll ? 'spin' : ''} />
                          <span>{pushingAll ? 'Pushing Updates...' : `Push Update to All Outdated (${outdatedDevices.length})`}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Success Notification Banner */}
                {otaSuccessMsg && (
                  <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10B981', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} />
                    <span>{otaSuccessMsg}</span>
                  </div>
                )}

                {allDevices.length === 0 ? (
                  <div className="glass-panel" style={{ padding: '64px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                    <Monitor size={48} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
                    <p style={{ color: 'var(--text-muted)', fontWeight: '600', fontSize: '15px', margin: 0 }}>No TV devices connected yet.</p>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: 'var(--card-bg)', borderRadius: '12px', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                    <thead>
                      <tr style={{ background: 'rgba(0,0,0,0.04)', borderBottom: '1px solid var(--border)', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                        <th style={{ padding: '14px 16px' }}>Status</th>
                        <th style={{ padding: '14px 16px' }}>TV Name & Hardware</th>
                        <th style={{ padding: '14px 16px' }}>Screen Attached</th>
                        <th style={{ padding: '14px 16px' }}>Fleet Health (MDM)</th>
                        <th style={{ padding: '14px 16px' }}>App Version & OTA</th>
                        <th style={{ padding: '14px 16px', minWidth: '160px' }}>Weather Location</th>
                        <th style={{ padding: '14px 16px', textAlign: 'center' }}>Auto-Boot</th>
                        <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allDevices.map(device => {
                        const assignedScreen = screens.find(s => s.id === device.screenId);
                        const isOnline = device.lastPingAt && (new Date().getTime() - new Date(device.lastPingAt).getTime() < 5 * 60 * 1000);
                        const currentVer = device.appVersion || '1.0.0';
                        const isOutdated = currentVer !== targetVersion;
                        const isPushing = pushingDeviceIds[device.id] || false;

                        // Wi-Fi signal display
                        const wifiSignal = device.wifiSignalStrength;
                        const wifiColor = wifiSignal === undefined || wifiSignal === null ? 'var(--text-muted)' : wifiSignal > 65 ? '#10B981' : wifiSignal > 35 ? '#F59E0B' : '#EF4444';

                        // Storage display
                        const freeStorage = device.freeStorageMb;
                        const isLowStorage = freeStorage !== undefined && freeStorage !== null && freeStorage < 500;

                        return (
                          <tr key={device.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700', color: isOnline ? '#10B981' : 'var(--text-muted)' }}>
                                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isOnline ? '#10B981' : 'var(--text-muted)', display: 'inline-block' }} />
                                  {isOnline ? 'Online' : 'Offline'}
                                </div>
                                {!isOnline && (
                                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                    Last seen: {formatLastSeen(device.lastPingAt)}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <Monitor size={14} style={{ color: 'var(--text-muted)' }} />
                                <span>{device.name || 'Unnamed TV Player'}</span>
                                {device.offlineReady ? (
                                  <span 
                                    title="TV available offline"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      background: 'rgba(16, 185, 129, 0.1)',
                                      color: '#10B981',
                                      border: '1px solid rgba(16, 185, 129, 0.25)',
                                      padding: '2px 6px',
                                      borderRadius: '6px',
                                      fontSize: '10px',
                                      fontWeight: '700'
                                    }}
                                  >
                                    <HardDriveDownload size={11} strokeWidth={2.5} />
                                    <span>Offline Ready</span>
                                  </span>
                                ) : (
                                  <span 
                                    title="Online sync mode"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      background: 'rgba(121, 112, 99, 0.08)',
                                      color: 'var(--text-muted)',
                                      border: '1px solid var(--border)',
                                      padding: '2px 6px',
                                      borderRadius: '6px',
                                      fontSize: '10px',
                                      fontWeight: '600'
                                    }}
                                  >
                                    <HardDriveDownload size={11} strokeWidth={2.5} style={{ opacity: 0.5 }} />
                                    <span>Online</span>
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>ID: <strong style={{ color: 'var(--foreground)' }}>{device.id.substring(0, 10)}...</strong></span>
                                {device.ipAddress && (
                                  <span style={{ background: 'var(--border)', padding: '1px 5px', borderRadius: '4px', fontSize: '10px' }}>
                                    IP: {device.ipAddress}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td style={{ padding: '14px 16px' }}>
                              {assignedScreen ? (
                                <div>
                                  <div style={{ fontSize: '13px', color: 'var(--brand-primary)', fontWeight: '600' }}>{assignedScreen.name}</div>
                                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Acct: {device.accountUsername}</div>
                                </div>
                              ) : (
                                <div>
                                  <div style={{ fontSize: '12px', color: '#D97706', fontWeight: '500' }}>Unassigned</div>
                                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Acct: {device.accountUsername}</div>
                                </div>
                              )}
                            </td>
                            {/* Fleet Health (MDM Telemetry) */}
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: wifiColor }}>
                                  <Wifi size={13} />
                                  <span style={{ fontWeight: '600' }}>
                                    {wifiSignal !== undefined && wifiSignal !== null ? `${wifiSignal}% Signal` : 'Wi-Fi: Active'}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isLowStorage ? '#EF4444' : 'var(--text-muted)' }}>
                                  <HardDrive size={13} />
                                  <span>
                                    {freeStorage !== undefined && freeStorage !== null 
                                      ? `${freeStorage > 1024 ? (freeStorage / 1024).toFixed(1) + ' GB' : freeStorage + ' MB'} free`
                                      : 'Storage: Healthy'}
                                  </span>
                                </div>
                                {device.cpuUsage !== undefined && device.cpuUsage !== null && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                                    <Cpu size={13} />
                                    <span>CPU: {Math.round(device.cpuUsage)}%</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            {/* App Version & OTA Update Status */}
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span style={{
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    background: isOutdated ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                                    color: isOutdated ? '#F59E0B' : '#10B981',
                                    border: `1px solid ${isOutdated ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
                                  }}>
                                    v{currentVer} {isOutdated ? '(Outdated)' : '(Latest)'}
                                  </span>
                                </div>
                                {isOutdated && (
                                  <button
                                    onClick={() => handlePushUpdate(device.id, device.name)}
                                    disabled={isPushing}
                                    style={{
                                      fontSize: '11px',
                                      padding: '3px 8px',
                                      height: 'auto',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      background: 'rgba(245, 158, 11, 0.15)',
                                      color: '#D97706',
                                      border: '1px solid rgba(245, 158, 11, 0.4)',
                                      borderRadius: '6px',
                                      cursor: isPushing ? 'not-allowed' : 'pointer',
                                      fontWeight: '700',
                                      width: 'fit-content'
                                    }}
                                    title="Push OTA update to this TV"
                                  >
                                    <DownloadCloud size={12} className={isPushing ? 'spin' : ''} />
                                    <span>{isPushing ? 'Pushing...' : `Push v${targetVersion}`}</span>
                                  </button>
                                )}
                              </div>
                            </td>
                            <td style={{ padding: '14px 16px', minWidth: '160px' }}>
                              <LocationAutocomplete
                                value={device.location || ''}
                                onChange={(newLoc) => handleUpdateDeviceSettings(device.id, { location: newLoc })}
                                placeholder="e.g. San Pedro, Belize"
                                className="input-field"
                                style={{ fontSize: '12px' }}
                              />
                            </td>
                            <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                              <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                                <input 
                                  type="checkbox" 
                                  checked={device.autoStart !== false}
                                  onChange={(e) => handleUpdateDeviceSettings(device.id, { autoStart: e.target.checked })}
                                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--brand-primary)' }}
                                />
                              </label>
                            </td>
                            <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                <button
                                  onClick={() => {
                                    setSelectedSnapshotDevice({
                                      id: device.id,
                                      name: device.name,
                                      screenId: device.screenId,
                                      assignedScreenName: assignedScreen?.name || 'Unassigned',
                                      lastScreenshotUrl: device.lastScreenshotUrl || assignedScreen?.lastScreenshotUrl || null,
                                      lastScreenshotAt: device.lastScreenshotAt || assignedScreen?.lastScreenshotAt || null,
                                      lastPingAt: device.lastPingAt,
                                      accountUsername: device.accountUsername
                                    });
                                    setSnapshotMsg('');
                                  }}
                                  style={{
                                    fontSize: '11px',
                                    padding: '5px 8px',
                                    height: 'auto',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    background: 'rgba(59, 130, 246, 0.1)',
                                    color: 'var(--brand-primary)',
                                    border: '1px solid rgba(59, 130, 246, 0.25)',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                  }}
                                  title="View Live Screen Snapshot (Proof-of-Display) from this TV"
                                >
                                  <Camera size={12} />
                                  <span>Snapshot</span>
                                </button>
                                <button
                                  onClick={() => handleRemoteLogout(device.id, device.name)}
                                  className="btn-secondary"
                                  style={{ fontSize: '11px', padding: '5px 8px', height: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}
                                  title="Screen Logout (Logs out screen & TV account, preserves company code)"
                                >
                                  <LogOut size={12} />
                                  <span>Logout</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteDevice(device.id, device.name)}
                                  style={{
                                    fontSize: '11px',
                                    padding: '5px 8px',
                                    height: 'auto',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    color: '#EF4444',
                                    border: '1px solid rgba(239, 68, 68, 0.25)',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: '700'
                                  }}
                                  title="Delete TV (Permanently deletes TV and wipes company code + TV account)"
                                >
                                  <Trash2 size={12} />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )
          ) : (
            /* Selected Account Detailed Settings Pane */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <button
                  onClick={() => setSelectedAccountId(null)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px', padding: 0 }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--foreground)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  <ChevronLeft size={16} /> Back to Accounts Overview
                </button>
              </div>

              {(() => {
                const acc = accounts.find(a => a.id === selectedAccountId);
                if (!acc) return null;
                return (
                  <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Account Header Action Bar */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '52px', height: '52px', borderRadius: '12px', background: 'var(--brand-accent)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <ShieldCheck size={28} />
                        </div>
                        <div>
                          <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--foreground)', margin: 0 }}>{acc.username}</h2>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Authenticated Account • Encrypted Password Saved
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          onClick={() => {
                            setEditUsername(acc.username);
                            setEditPassword('');
                            setError('');
                            setShowEditModal(true);
                          }}
                          className="btn-secondary"
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '8px 14px', height: 'auto' }}
                        >
                          <Edit3 size={15} /> Edit Credentials
                        </button>
                        <button
                          onClick={() => setViewingTabletBuilder(true)}
                          className="btn-primary"
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '8px 14px', height: 'auto', background: '#4F46E5' }}
                        >
                          <TabletSmartphone size={15} /> Configure Tablet UI
                        </button>
                        <button
                          onClick={() => { handleDelete(acc.id); setSelectedAccountId(null); }}
                          className="btn-secondary"
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '8px 14px', height: 'auto', color: '#EF4444', borderColor: 'rgba(239,68,68,0.3)' }}
                        >
                          <Trash2 size={15} /> Delete Account
                        </button>
                      </div>
                    </div>

                    {/* Allowed Screens Permissions Grid */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h3 style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', margin: 0 }}>
                          Authorized Display Screens
                        </h3>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Check screens to authorize this TV account</span>
                      </div>

                      <div style={{ background: 'var(--background)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
                        {screens.length === 0 ? (
                          <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', gridColumn: '1 / -1', padding: '12px', textAlign: 'center' }}>
                            No screens created in system. Create a screen first under Screens.
                          </div>
                        ) : (
                          screens.map(s => {
                            const isAllowed = acc.screens?.some((as: any) => as.id === s.id);
                            return (
                              <label
                                key={s.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  padding: '10px 12px',
                                  borderRadius: '8px',
                                  border: `1px solid ${isAllowed ? 'var(--brand-primary)' : 'var(--border)'}`,
                                  cursor: 'pointer',
                                  userSelect: 'none',
                                  background: isAllowed ? 'rgba(44,76,124,0.08)' : 'var(--card-bg)',
                                  color: isAllowed ? 'var(--brand-primary)' : 'var(--foreground)',
                                  fontWeight: isAllowed ? '600' : '400',
                                  fontSize: '13px',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={isAllowed}
                                  onChange={e => {
                                    const currentAllowed = acc.screens?.map((as: any) => as.id) || [];
                                    const newAllowed = e.target.checked
                                      ? [...currentAllowed, s.id]
                                      : currentAllowed.filter((id: string) => id !== s.id);
                                    updateAccountScreens(acc.id, newAllowed);
                                  }}
                                  style={{ accentColor: 'var(--brand-primary)', width: '16px', height: '16px' }}
                                />
                                <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{s.name}</span>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>

                    {/* Active TV Connected Devices */}
                    <div>
                      <h3 style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
                        Connected Devices & Active Players
                      </h3>

                      {(!acc.devices || acc.devices.length === 0) ? (
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '32px', textAlign: 'center', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '12px' }}>
                          No TV players are currently authenticated using this account's credentials.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          {acc.devices.map((device: any) => {
                            const assignedScreen = screens.find(s => s.id === device.screenId);
                            const isOnline = device.lastPingAt && (new Date().getTime() - new Date(device.lastPingAt).getTime() < 5 * 60 * 1000);
                            return (
                              <div key={device.id} style={{ background: 'var(--background)', border: '1px solid var(--border)', padding: '20px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                                  <div>
                                    {editingDeviceId === device.id ? (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <input
                                          type="text"
                                          value={editingDeviceName}
                                          onChange={e => setEditingDeviceName(e.target.value)}
                                          onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                              handleRenameDevice(device.id, editingDeviceName);
                                              setEditingDeviceId(null);
                                            }
                                          }}
                                          className="input-field"
                                          style={{ padding: '4px 8px', height: '32px', fontSize: '13px', width: '200px' }}
                                          autoFocus
                                        />
                                        <button onClick={() => { handleRenameDevice(device.id, editingDeviceName); setEditingDeviceId(null); }} className="btn-primary" style={{ height: '32px', padding: '0 12px', fontSize: '12px' }}>Save</button>
                                      </div>
                                    ) : (
                                      <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--foreground)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Monitor size={16} style={{ color: 'var(--brand-primary)' }} />
                                        {device.name || 'Unnamed TV Player'}
                                        <button 
                                          onClick={() => { setEditingDeviceId(device.id); setEditingDeviceName(device.name || ''); }} 
                                          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}
                                          title="Rename Device"
                                        >
                                          <Edit3 size={13} />
                                        </button>
                                        {device.offlineReady ? (
                                          <span 
                                            title="tv available offline"
                                            style={{
                                              display: 'inline-flex',
                                              alignItems: 'center',
                                              gap: '4px',
                                              fontSize: '11px',
                                              fontWeight: '700',
                                              padding: '2px 7px',
                                              borderRadius: '6px',
                                              background: 'rgba(16, 185, 129, 0.1)',
                                              color: '#10B981',
                                              border: '1px solid rgba(16, 185, 129, 0.25)',
                                              cursor: 'help'
                                            }}
                                          >
                                            <HardDriveDownload size={12} strokeWidth={2.5} />
                                            <span>Offline Ready</span>
                                          </span>
                                        ) : null}
                                        <span style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '4px',
                                          fontSize: '11px',
                                          fontWeight: '700',
                                          padding: '2px 8px',
                                          borderRadius: '6px',
                                          background: isOnline ? 'rgba(16, 185, 129, 0.1)' : 'rgba(121, 112, 99, 0.1)',
                                          color: isOnline ? '#10B981' : 'var(--text-muted)'
                                        }}>
                                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isOnline ? '#10B981' : 'var(--text-muted)' }} />
                                          {isOnline ? 'Online' : `Offline (${formatLastSeen(device.lastPingAt)})`}
                                        </span>
                                      </h4>
                                    )}
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <span style={{ opacity: 0.7 }}>Hardware ID:</span> <span style={{ color: 'var(--foreground)', fontWeight: '600' }}>{device.id}</span>
                                    </div>
                                  </div>

                                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <button
                                      onClick={() => handleForceSync(device.id)}
                                      className="btn-primary"
                                      style={{ fontSize: '12px', padding: '6px 12px', height: 'auto' }}
                                    >
                                      Force Sync
                                    </button>
                                    <button
                                      onClick={() => handleRemoteLogout(device.id, device.name)}
                                      className="btn-secondary"
                                      style={{ fontSize: '12px', padding: '6px 12px', height: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}
                                      title="Logs out screen & TV account, preserves company code"
                                    >
                                      <LogOut size={12} /> Screen Logout
                                    </button>
                                    <button
                                      onClick={() => handleDeleteDevice(device.id, device.name)}
                                      style={{
                                        fontSize: '12px',
                                        padding: '6px 12px',
                                        height: 'auto',
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        color: '#EF4444',
                                        border: '1px solid rgba(239,68,68,0.3)',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        fontWeight: '700'
                                      }}
                                      title="Deletes TV device and remotely wipes company code & account"
                                    >
                                      <Trash2 size={13} /> Delete TV
                                    </button>
                                  </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', padding: '16px', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '10px' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Assigned Display Screen</label>
                                    <select
                                      value={device.screenId || ''}
                                      onChange={e => handleSyncScreen(device.id, e.target.value)}
                                      className="input-field"
                                      style={{ fontSize: '13px' }}
                                    >
                                      <option value="">-- Unassigned Player --</option>
                                      {screens.map(s => (
                                        <option key={s.id} value={s.id}>{s.name || `Screen ${s.id.slice(0, 8)}`}</option>
                                      ))}
                                    </select>
                                  </div>

                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <MapPin size={12} style={{ color: 'var(--brand-primary)' }} /> Weather Location
                                    </label>
                                    <LocationAutocomplete
                                      value={device.location || ''}
                                      onChange={(newLoc) => handleUpdateDeviceSettings(device.id, { location: newLoc })}
                                      placeholder="e.g. San Pedro, Belize"
                                      className="input-field"
                                      style={{ fontSize: '13px' }}
                                    />
                                  </div>

                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Device Settings</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', height: '100%' }}>
                                      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--foreground)' }}>Auto-Boot App</span>
                                      <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '22px' }}>
                                        <input 
                                          type="checkbox" 
                                          style={{ opacity: 0, width: 0, height: 0 }}
                                          checked={device.autoStart !== false}
                                          onChange={(e) => handleUpdateDeviceSettings(device.id, { autoStart: e.target.checked })}
                                        />
                                        <span style={{
                                          position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                          backgroundColor: device.autoStart !== false ? '#10B981' : 'var(--border)',
                                          transition: '.2s', borderRadius: '22px'
                                        }}>
                                          <span style={{
                                            position: 'absolute', content: '""', height: '16px', width: '16px',
                                            left: '3px', bottom: '3px', backgroundColor: 'white',
                                            transition: '.2s', borderRadius: '50%',
                                            transform: device.autoStart !== false ? 'translateX(18px)' : 'translateX(0)'
                                          }}/>
                                        </span>
                                      </label>
                                    </div>
                                  </div>

                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'center' }}>
                                    <label style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>Broadcast Status</label>
                                    {assignedScreen ? (
                                      <div style={{ fontSize: '13px', color: 'var(--foreground)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <div>Screen: <span style={{ fontWeight: '700', color: 'var(--brand-primary)' }}>{assignedScreen.name}</span></div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Playlist: <span style={{ fontWeight: '600' }}>{assignedScreen.playlist?.name || 'None'}</span></div>
                                      </div>
                                    ) : (
                                      <div style={{ fontSize: '12px', color: '#D97706', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#D97706', display: 'inline-block' }} />
                                        Unassigned - Waiting for Screen Mapping
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Add Account Modal */}
          {showAddModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 50, backdropFilter: 'blur(4px)' }}>
              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px', boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: '460px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--foreground)', margin: 0 }}>Add New TV Account</h3>
                  <button
                    onClick={() => { setShowAddModal(false); setError(''); }}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', borderRadius: '6px' }}
                  >
                    <X size={20} />
                  </button>
                </div>
                
                {error && (
                  <div style={{ margin: '16px 24px 0 24px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', fontSize: '13px', color: '#EF4444', fontWeight: '600' }}>
                    {error}
                  </div>
                )}
                
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label">Account Username</label>
                    <input 
                      type="text" 
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      placeholder="e.g. LobbyTVs"
                      className="input-field"
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label">Access Password</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type={showPassword ? 'text' : 'password'} 
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Enter secure password"
                        className="input-field"
                        style={{ paddingRight: '40px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label">Screen Authorizations</label>
                    <div style={{ background: 'var(--background)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }} className="custom-scroll">
                      {screens.length === 0 ? (
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No screens created yet.</div>
                      ) : (
                        screens.map(s => (
                          <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--foreground)' }}>
                            <input 
                              type="checkbox" 
                              checked={selectedScreens.includes(s.id)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedScreens([...selectedScreens, s.id]);
                                else setSelectedScreens(selectedScreens.filter(id => id !== s.id));
                              }}
                              style={{ width: '16px', height: '16px', accentColor: 'var(--brand-primary)', cursor: 'pointer' }}
                            />
                            <span>{s.name}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                    <button onClick={() => { setShowAddModal(false); setError(''); }} className="btn-secondary">Cancel</button>
                    <button onClick={handleCreate} disabled={!username || !password} className="btn-primary" style={{ opacity: (!username || !password) ? 0.5 : 1 }}>
                      Create Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Edit Credentials Modal */}
          {showEditModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 50, backdropFilter: 'blur(4px)' }}>
              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px', boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: '400px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--foreground)', margin: 0 }}>Edit Credentials</h3>
                  <button
                    onClick={() => { setShowEditModal(false); setError(''); }}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', borderRadius: '6px' }}
                  >
                    <X size={20} />
                  </button>
                </div>
                
                {error && (
                  <div style={{ margin: '16px 24px 0 24px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', fontSize: '13px', color: '#EF4444', fontWeight: '600' }}>
                    {error}
                  </div>
                )}
                
                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label">Update Username (Optional)</label>
                    <input 
                      type="text" 
                      value={editUsername}
                      onChange={e => setEditUsername(e.target.value)}
                      placeholder="Leave unchanged to keep current"
                      className="input-field"
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label className="form-label">New Password (Optional)</label>
                    <div style={{ position: 'relative' }}>
                      <input 
                        type={showEditPassword ? 'text' : 'password'} 
                        value={editPassword}
                        onChange={e => setEditPassword(e.target.value)}
                        placeholder="Leave blank to keep current"
                        className="input-field"
                        style={{ paddingRight: '40px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowEditPassword(!showEditPassword)}
                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
                      >
                        {showEditPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Must be at least 6 characters if changing.</span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                    <button onClick={() => { setShowEditModal(false); setError(''); }} className="btn-secondary">Cancel</button>
                    <button onClick={handleUpdateCredentials} className="btn-primary">
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Live TV Screen Snapshot Modal */}
          {selectedSnapshotDevice && (
            <div 
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 60, backdropFilter: 'blur(4px)' }}
              onClick={(e) => { if (e.target === e.currentTarget) setSelectedSnapshotDevice(null); }}
            >
              <div 
                className="glass-panel" 
                style={{ width: '100%', maxWidth: '720px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '16px', boxShadow: 'var(--shadow-lg)' }}
              >
                <header style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ padding: '8px', background: 'rgba(59, 130, 246, 0.15)', borderRadius: '8px', color: 'var(--brand-primary)' }}>
                      <Camera size={20} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
                        {selectedSnapshotDevice.name || 'TV Device'} — Live Snapshot
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', fontSize: '12px', color: 'var(--text-muted)' }}>
                        <span>Hardware ID: <strong style={{ color: 'var(--foreground)' }}>{selectedSnapshotDevice.id}</strong></span>
                        <span>•</span>
                        <span>Screen: <strong style={{ color: 'var(--brand-primary)' }}>{selectedSnapshotDevice.assignedScreenName || 'Unassigned'}</strong></span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedSnapshotDevice(null)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', borderRadius: '6px' }}
                  >
                    <X size={20} />
                  </button>
                </header>

                <main style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
                  {snapshotMsg && (
                    <div style={{ padding: '10px 16px', background: snapshotMsg.includes('success') ? 'rgba(34, 197, 94, 0.1)' : 'rgba(59, 130, 246, 0.1)', border: `1px solid ${snapshotMsg.includes('success') ? 'rgba(34, 197, 94, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`, borderRadius: '8px', fontSize: '13px', color: snapshotMsg.includes('success') ? '#22c55e' : 'var(--brand-primary)', fontWeight: '600' }}>
                      {snapshotMsg}
                    </div>
                  )}

                  <figure style={{ margin: 0, width: '100%', aspectRatio: '16/9', background: '#020617', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    {selectedSnapshotDevice.lastScreenshotUrl ? (
                      <img 
                        src={selectedSnapshotDevice.lastScreenshotUrl} 
                        alt="Live TV screen snapshot"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                        <Camera size={48} style={{ opacity: 0.3, marginBottom: '8px' }} />
                        <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>No snapshot recorded for this TV yet.</p>
                        <span style={{ fontSize: '12px', opacity: 0.7 }}>Click &ldquo;Request Fresh Snapshot&rdquo; below to capture what is playing.</span>
                      </div>
                    )}
                  </figure>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
                    <span>
                      {selectedSnapshotDevice.lastScreenshotAt ? (
                        <>Captured: {new Date(selectedSnapshotDevice.lastScreenshotAt).toLocaleDateString()} {new Date(selectedSnapshotDevice.lastScreenshotAt).toLocaleTimeString()}</>
                      ) : (
                        'Status: Standby'
                      )}
                    </span>
                    {selectedSnapshotDevice.lastScreenshotUrl && (
                      <a 
                        href={selectedSnapshotDevice.lastScreenshotUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        style={{ color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontWeight: '600' }}
                      >
                        <ExternalLink size={14} /> View Fullscreen
                      </a>
                    )}
                  </div>
                </main>

                <footer style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button 
                    onClick={() => setSelectedSnapshotDevice(null)}
                    className="btn-secondary"
                  >
                    Close
                  </button>
                  <button 
                    onClick={() => requestDeviceSnapshot(selectedSnapshotDevice.id)}
                    disabled={snapshotLoading}
                    className="btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: snapshotLoading ? 0.7 : 1 }}
                  >
                    <Camera size={16} />
                    <span>{snapshotLoading ? 'Capturing Live TV...' : 'Request Fresh Snapshot'}</span>
                  </button>
                </footer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
