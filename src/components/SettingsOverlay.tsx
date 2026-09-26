'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Tv, 
  Building2, 
  MonitorPlay, 
  UserSquare2, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Trash2, 
  LogOut, 
  X, 
  Cpu, 
  Info,
  MapPin,
  Check
} from 'lucide-react';
import { LocationAutocomplete } from './LocationAutocomplete';

export interface SettingsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  deviceId: string | null;
  hardwareId?: string | null;
  tvAccountId?: string | null;
  tvUsername?: string | null;
  companyName?: string | null;
  screenId?: string | null;
  screenName?: string | null;
  location?: string | null;
  serverUrl?: string;
  appVersion?: string;
  isOnline?: boolean;
  onUpdateLocation?: (location: string) => void;
  onForceReload?: () => void;
  onClearCache?: () => void;
  onLogout?: () => void;
}

export function SettingsOverlay({
  isOpen,
  onClose,
  deviceId,
  hardwareId,
  tvAccountId,
  tvUsername,
  companyName,
  screenId,
  screenName,
  location = '',
  serverUrl = typeof window !== 'undefined' ? window.location.origin : '',
  appVersion,
  isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true,
  onUpdateLocation,
  onForceReload,
  onClearCache,
  onLogout,
}: SettingsOverlayProps) {
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isEditingLoc, setIsEditingLoc] = useState(false);
  const [localLoc, setLocalLoc] = useState(location || '');

  useEffect(() => {
    if (location) {
      setLocalLoc(location);
    }
  }, [location]);
  const autoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);

  // Reset auto-dismiss timer on user interaction
  const resetInactivityTimer = useCallback(() => {
    if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    autoCloseTimerRef.current = setTimeout(() => {
      onClose();
    }, 60000); // 60 seconds
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) {
      if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
      return;
    }

    resetInactivityTimer();

    // Auto-focus first action button when opened
    setTimeout(() => {
      buttonsRef.current[0]?.focus();
    }, 100);

    const handleKeyDown = (e: KeyboardEvent) => {
      resetInactivityTimer();

      if (e.key === 'Escape' || e.key === 'Backspace' || e.keyCode === 27 || e.keyCode === 10009) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('pointerdown', resetInactivityTimer);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('pointerdown', resetInactivityTimer);
      if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    };
  }, [isOpen, onClose, resetInactivityTimer]);

  if (!isOpen) return null;

  const handleCopy = (text: string | null | undefined, fieldKey: string) => {
    if (!text) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
        setCopiedField(fieldKey);
        setTimeout(() => setCopiedField(null), 2500);
      }
    } catch (e) {
      // Ignore clipboard failure in restricted webviews
    }
  };

  const handleActionReload = () => {
    setFeedbackMessage('Reloading player configuration...');
    setTimeout(() => {
      if (onForceReload) {
        onForceReload();
      } else {
        window.location.reload();
      }
    }, 400);
  };

  const handleActionClearCache = async () => {
    setFeedbackMessage('Clearing offline cache storage...');
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      localStorage.removeItem('offline_screen_config');
      localStorage.removeItem('vvsignage_cached_config');
    } catch (e) {
      console.error('Cache clear error', e);
    }
    
    if (onClearCache) {
      onClearCache();
    }

    setTimeout(() => {
      setFeedbackMessage('Cache cleared successfully!');
      setTimeout(() => setFeedbackMessage(null), 3000);
    }, 600);
  };

  const handleActionLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  const resolvedAppVersion = appVersion || (typeof window !== 'undefined' && (window as any).AndroidBridge?.getAppVersion?.()) || '1.0';

  return (
    <aside 
      role="dialog" 
      aria-modal="true" 
      aria-label="Device & Signage Settings"
      style={{
        '--settings-bg': 'rgba(15, 23, 42, 0.96)',
        '--settings-surface': '#1e293b',
        '--settings-surface-hover': '#334155',
        '--settings-border': 'rgba(255, 255, 255, 0.12)',
        '--settings-text-primary': '#f8fafc',
        '--settings-text-secondary': '#94a3b8',
        '--settings-text-muted': '#64748b',
        '--settings-accent': '#38bdf8',
        '--settings-accent-hover': '#0284c7',
        '--settings-danger': '#ef4444',
        '--settings-danger-hover': '#dc2626',
        '--settings-success': '#22c55e',
        '--settings-focus-ring': '#38bdf8',
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: 'var(--settings-text-primary)',
        padding: '24px',
      } as React.CSSProperties}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '880px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--settings-bg)',
          borderRadius: '24px',
          border: '1px solid var(--settings-border)',
          boxShadow: '0 24px 64px -12px rgba(0, 0, 0, 0.7)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <header 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '24px 32px',
            borderBottom: '1px solid var(--settings-border)',
            backgroundColor: 'rgba(30, 41, 59, 0.5)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div 
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '16px',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                color: 'var(--settings-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Tv size={28} strokeWidth={2} />
            </div>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: '700', margin: 0, letterSpacing: '-0.02em' }}>
                Display Diagnostics & Settings
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--settings-text-secondary)', margin: '4px 0 0 0' }}>
                Hardware ID, TV Account & Screen Association
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '9999px',
                fontSize: '13px',
                fontWeight: '600',
                backgroundColor: isOnline ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: isOnline ? 'var(--settings-success)' : 'var(--settings-danger)',
                border: `1px solid ${isOnline ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              }}
            >
              {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
              {isOnline ? 'Online' : 'Offline'}
            </div>

            <button
              onClick={onClose}
              title="Close Settings (Esc)"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                border: '1px solid var(--settings-border)',
                backgroundColor: 'var(--settings-surface)',
                color: 'var(--settings-text-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </header>

        {/* Notification Toast */}
        {feedbackMessage && (
          <div 
            style={{
              padding: '12px 24px',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              color: 'var(--settings-accent)',
              borderBottom: '1px solid rgba(56, 189, 248, 0.3)',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Info size={18} />
            {feedbackMessage}
          </div>
        )}

        {/* Content Body */}
        <main 
          style={{
            padding: '24px 32px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          {/* Diagnostic Key Values Grid */}
          <section aria-label="Device Identifiers">
            <h3 
              style={{
                fontSize: '12px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--settings-text-muted)',
                marginBottom: '12px',
              }}
            >
              Device Identifiers & Pairing
            </h3>

            <div 
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '16px',
              }}
            >
              {/* TV Device ID */}
              <div 
                onClick={() => handleCopy(deviceId, 'deviceId')}
                style={{
                  backgroundColor: 'var(--settings-surface)',
                  padding: '16px',
                  borderRadius: '16px',
                  border: '1px solid var(--settings-border)',
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--settings-accent)', marginBottom: '6px' }}>
                  <Cpu size={16} />
                  <span style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>TV Device ID</span>
                </div>
                <div style={{ fontSize: '16px', fontWeight: '700', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {hardwareId || deviceId || 'Generating...'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--settings-text-secondary)', marginTop: '4px' }}>
                  {copiedField === 'deviceId' ? 'Copied to clipboard!' : 'Hardware-backed identifier'}
                </div>
              </div>

              {/* Company / Org */}
              <div 
                style={{
                  backgroundColor: 'var(--settings-surface)',
                  padding: '16px',
                  borderRadius: '16px',
                  border: '1px solid var(--settings-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', marginBottom: '6px' }}>
                  <Building2 size={16} />
                  <span style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Company / Tenant</span>
                </div>
                <div style={{ fontSize: '16px', fontWeight: '700' }}>
                  {companyName || 'Tropic Air Signage'}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--settings-text-secondary)', marginTop: '4px' }}>
                  Tenant organization
                </div>
              </div>

              {/* TV Account */}
              <div 
                style={{
                  backgroundColor: 'var(--settings-surface)',
                  padding: '16px',
                  borderRadius: '16px',
                  border: '1px solid var(--settings-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a855f7', marginBottom: '6px' }}>
                  <UserSquare2 size={16} />
                  <span style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>TV Account</span>
                </div>
                <div style={{ fontSize: '16px', fontWeight: '700' }}>
                  {tvUsername || (tvAccountId ? `ID: ${tvAccountId.substring(0, 8)}...` : 'Not Signed In')}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--settings-text-secondary)', marginTop: '4px' }}>
                  {tvAccountId ? `Account ID: ${tvAccountId}` : 'Requires TV login'}
                </div>
              </div>

              {/* Active Screen */}
              <div 
                style={{
                  backgroundColor: 'var(--settings-surface)',
                  padding: '16px',
                  borderRadius: '16px',
                  border: '1px solid var(--settings-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--settings-success)', marginBottom: '6px' }}>
                  <MonitorPlay size={16} />
                  <span style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Assigned Screen</span>
                </div>
                <div style={{ fontSize: '16px', fontWeight: '700' }}>
                  {screenName || (screenId ? `Screen ${screenId.substring(0, 8)}` : 'Unassigned')}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--settings-text-secondary)', marginTop: '4px' }}>
                  {screenId ? `Screen ID: ${screenId}` : 'Select screen in TV Portal'}
                </div>
              </div>

              {/* Weather Location for conditional playback */}
              <div 
                style={{
                  backgroundColor: 'var(--settings-surface)',
                  padding: '16px',
                  borderRadius: '16px',
                  border: '1px solid var(--settings-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0ea5e9' }}>
                    <MapPin size={16} />
                    <span style={{ fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Weather Location</span>
                  </div>
                  <button
                    onClick={() => {
                      if (isEditingLoc && onUpdateLocation) {
                        onUpdateLocation(localLoc);
                        setFeedbackMessage(`Location set to ${localLoc}`);
                      }
                      setIsEditingLoc(!isEditingLoc);
                    }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--brand-primary)',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '2px 6px'
                    }}
                  >
                    {isEditingLoc ? 'Save' : 'Edit'}
                  </button>
                </div>
                {isEditingLoc ? (
                  <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                    <LocationAutocomplete 
                      value={localLoc}
                      onChange={val => setLocalLoc(val)}
                      placeholder="e.g. San Pedro, Belize"
                      style={{
                        flex: 1,
                        background: 'rgba(0,0,0,0.3)',
                        borderRadius: '6px',
                        color: 'white',
                      }}
                    />
                    <button
                      onClick={() => {
                        if (onUpdateLocation) {
                          onUpdateLocation(localLoc);
                          setFeedbackMessage(`Location updated to ${localLoc}`);
                        }
                        setIsEditingLoc(false);
                      }}
                      style={{
                        background: 'var(--brand-primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '4px 10px',
                        cursor: 'pointer'
                      }}
                    >
                      <Check size={14} />
                    </button>
                  </div>
                ) : (
                  <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--foreground)' }}>
                    {localLoc}
                  </div>
                )}
                <div style={{ fontSize: '11px', color: 'var(--settings-text-secondary)', marginTop: '4px' }}>
                  Used for local weather-conditional slides
                </div>
              </div>
            </div>
          </section>

          {/* System & Connection Details */}
          <section aria-label="System Information">
            <h3 
              style={{
                fontSize: '12px',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--settings-text-muted)',
                marginBottom: '12px',
              }}
            >
              System & Connection
            </h3>

            <div 
              style={{
                backgroundColor: 'rgba(30, 41, 59, 0.4)',
                borderRadius: '16px',
                border: '1px solid var(--settings-border)',
                padding: '16px 24px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                fontSize: '13px',
              }}
            >
              <div>
                <span style={{ color: 'var(--settings-text-muted)', display: 'block', marginBottom: '2px' }}>Server URL</span>
                <span style={{ fontWeight: '600', wordBreak: 'break-all' }}>{serverUrl}</span>
              </div>
              <div>
                <span style={{ color: 'var(--settings-text-muted)', display: 'block', marginBottom: '2px' }}>App Version</span>
                <span style={{ fontWeight: '600' }}>v{resolvedAppVersion}</span>
              </div>
              <div>
                <span style={{ color: 'var(--settings-text-muted)', display: 'block', marginBottom: '2px' }}>Platform</span>
                <span style={{ fontWeight: '600' }}>
                  {(typeof window !== 'undefined' && (window as any).AndroidBridge) ? 'Android TV / Firestick APK' : 'Web Player'}
                </span>
              </div>
              <div>
                <span style={{ color: 'var(--settings-text-muted)', display: 'block', marginBottom: '2px' }}>Remote Shortcut</span>
                <span style={{ fontWeight: '600', color: 'var(--settings-accent)' }}>▲ ▶ ▼ ◀ (Circle)</span>
              </div>
            </div>
          </section>
        </main>

        {/* Action Controls Footer */}
        <footer 
          style={{
            padding: '20px 32px',
            borderTop: '1px solid var(--settings-border)',
            backgroundColor: 'rgba(30, 41, 59, 0.5)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--settings-text-secondary)', fontSize: '13px' }}>
            <span>Tip: Press <strong>Back</strong> or <strong>▲ ▶ ▼ ◀</strong> to exit</span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
            {/* Force Reload Button */}
            <button
              ref={el => { buttonsRef.current[0] = el; }}
              onClick={handleActionReload}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                borderRadius: '12px',
                border: '1px solid var(--settings-border)',
                backgroundColor: 'var(--settings-surface)',
                color: 'var(--settings-text-primary)',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--settings-focus-ring)'; e.currentTarget.style.boxShadow = '0 0 0 2px var(--settings-focus-ring)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--settings-border)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <RefreshCw size={16} />
              Force Reload
            </button>

            {/* Clear Cache Button */}
            <button
              ref={el => { buttonsRef.current[1] = el; }}
              onClick={handleActionClearCache}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                borderRadius: '12px',
                border: '1px solid var(--settings-border)',
                backgroundColor: 'var(--settings-surface)',
                color: 'var(--settings-text-primary)',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--settings-focus-ring)'; e.currentTarget.style.boxShadow = '0 0 0 2px var(--settings-focus-ring)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--settings-border)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <Trash2 size={16} />
              Clear Cache
            </button>

            {/* Logout TV Button */}
            {onLogout && (
              <button
                ref={el => { buttonsRef.current[2] = el; }}
                onClick={handleActionLogout}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  borderRadius: '12px',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  backgroundColor: 'rgba(239, 68, 68, 0.15)',
                  color: '#f87171',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--settings-danger)'; e.currentTarget.style.boxShadow = '0 0 0 2px var(--settings-danger)'; }}
                onBlur={e => { e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <LogOut size={16} />
                Sign Out TV
              </button>
            )}
          </div>
        </footer>
      </div>
    </aside>
  );
}
