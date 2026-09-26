"use client";

import { useState, useEffect } from "react";
import { Tablet, XCircle, LogOut, MonitorPlay, Sparkles } from "lucide-react";

export default function TabletPage() {
  const [tvAccountId, setTvAccountId] = useState<string | null>(null);
  const [tabletButtons, setTabletButtons] = useState<any[]>([]);
  const [showExitToast, setShowExitToast] = useState(false);
  
  // Login State
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const accId = localStorage.getItem('vvsignage_tv_account');
    if (accId) {
      setTvAccountId(accId);
    }
    setIsInitializing(false);
  }, []);

  useEffect(() => {
    if (tvAccountId) {
      fetchTabletButtons(tvAccountId);
    }
  }, [tvAccountId]);

  // Back Button Interception
  useEffect(() => {
    let lastBackPress = 0;
    
    // Push an initial dummy state to trap the first hardware back press
    window.history.pushState({ root: true }, '', window.location.href);

    const handlePopState = (e: PopStateEvent) => {
      // Double-back to exit logic
      const now = Date.now();
      if (now - lastBackPress < 2000) {
        // Let the app natively exit
        return;
      } else {
        lastBackPress = now;
        setShowExitToast(true);
        setTimeout(() => setShowExitToast(false), 2000);
        window.history.pushState({ root: true }, '', window.location.href);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const fetchTabletButtons = async (accountId: string) => {
    try {
      const token = localStorage.getItem('vvsignage_tv_token');
      const res = await fetch(`/api/tablet-buttons?tvAccountId=${accountId}`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setTabletButtons(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const overrideScreen = async (button: any) => {
    if (!tvAccountId) return;
    try {
      const token = localStorage.getItem('vvsignage_tv_token');
      const res = await fetch(`/api/tv-accounts/${tvAccountId}/override`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ 
          type: button.actionType, 
          payload: {
            url: button.mediaUrl || button.media?.url,
            title: button.htmlTitle,
            subtitle: button.htmlSubtitle,
            bgColor: button.htmlBgColor,
            color: button.htmlTextColor,
            duration: button.duration || 0,
            nonce: Date.now() // Force unique payload so tapping the button multiple times always re-triggers
          }
        })
      });
      if (!res.ok) {
        alert("Failed to send override signal.");
      }
    } catch (e) {
      alert("Failed to send override signal.");
    }
  };

  const clearOverride = async () => {
    if (!tvAccountId) return;
    try {
      const token = localStorage.getItem('vvsignage_tv_token');
      const res = await fetch(`/api/tv-accounts/${tvAccountId}/override`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ type: null, payload: null })
      });
      if (!res.ok) {
        alert("Failed to clear override signal.");
      }
    } catch (e) {
      alert("Failed to clear override signal.");
    }
  };

  const handleTvAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const deviceId = localStorage.getItem('vvsignage_device_id') || 'tablet-' + Math.random().toString(36).substring(7);
      localStorage.setItem('vvsignage_device_id', deviceId);

      const res = await fetch('/api/tv-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: authUsername, password: authPassword, deviceId, tvName: 'Tablet Controller' })
      });
      if (res.ok) {
        const data = await res.json();
        setTvAccountId(data.accountId);
        localStorage.setItem('vvsignage_tv_account', data.accountId);
        localStorage.setItem('vvsignage_tv_token', data.token);
      } else {
        const data = await res.json();
        setAuthError(data.error || 'Authentication failed. Please check credentials.');
      }
    } catch (e) {
      setAuthError('Network error. Please try again.');
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('vvsignage_tv_account');
    localStorage.removeItem('vvsignage_tv_token');
    setTvAccountId(null);
    setAuthUsername('');
    setAuthPassword('');
    setTabletButtons([]);
  };

  if (isInitializing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100vw', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
        <p style={{ fontWeight: '600' }}>Loading tablet controller...</p>
      </div>
    );
  }

  // Show Login Screen if no TvAccount is present
  if (!tvAccountId) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', width: '100vw', backgroundColor: 'var(--background)', color: 'var(--foreground)', padding: '24px' }}>
        <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '40px 32px', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: 'var(--shadow-lg)' }}>
          <img src="/logo.png" alt="Logo" style={{ width: '220px', maxHeight: '100px', marginBottom: '24px', objectFit: 'contain' }} />
          <h1 style={{ fontSize: '24px', marginBottom: '6px', fontWeight: '800', textAlign: 'center', color: 'var(--foreground)' }}>Tablet Controller</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '28px', textAlign: 'center', fontSize: '14px' }}>Sign in with your TV Account credentials.</p>
          
          {authError && (
            <div style={{ color: '#EF4444', marginBottom: '20px', fontSize: '13px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '10px 16px', borderRadius: '8px', width: '100%', textAlign: 'center', fontWeight: '600' }}>
              {authError}
            </div>
          )}
          
          <form onSubmit={handleTvAuth} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="form-label">Username</label>
              <input 
                type="text" 
                placeholder="Enter TV account username" 
                value={authUsername}
                onChange={e => setAuthUsername(e.target.value)}
                className="input-field"
                style={{ height: '46px', fontSize: '15px' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="form-label">Password</label>
              <input 
                type="password" 
                placeholder="Enter TV account password" 
                value={authPassword}
                onChange={e => setAuthPassword(e.target.value)}
                className="input-field"
                style={{ height: '46px', fontSize: '15px' }}
              />
            </div>
            <button 
              type="submit"
              disabled={!authUsername || !authPassword}
              className="btn-primary"
              style={{ width: '100%', height: '48px', fontSize: '16px', fontWeight: '700', marginTop: '8px', opacity: (!authUsername || !authPassword) ? 0.5 : 1 }}
            >
              Sign In to Tablet
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Header */}
      <header style={{ padding: '16px 28px', borderBottom: '1px solid var(--border)', background: 'var(--card-bg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--brand-accent)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Tablet size={22} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--foreground)' }}>Tablet Touch Controller</h1>
            <span style={{ fontSize: '12px', color: '#10B981', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} /> Live System Connected
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={handleLogout}
            title="Sign Out"
            className="btn-secondary"
            style={{ fontSize: '13px', padding: '8px 14px', height: 'auto', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Main Content - Boarding / Trigger Controls */}
        <div style={{ flex: 1, padding: '28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          <div className="glass-panel" style={{ padding: '20px 24px', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
            <div style={{ flex: '1 1 300px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: 'var(--foreground)' }}>Live Touch Triggers</h2>
              <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: '13px' }}>Tap any button below to broadcast immediate screen overrides to connected TVs.</p>
            </div>
            <button
              onClick={clearOverride}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', border: '1px solid rgba(239, 68, 68, 0.3)',
                background: 'rgba(239, 68, 68, 0.08)', color: '#EF4444', fontSize: '14px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s'
              }}
            >
              <XCircle size={18} /> Clear Screen Override
            </button>
          </div>

          {tabletButtons.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <MonitorPlay size={48} style={{ opacity: 0.4, marginBottom: '8px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: 'var(--foreground)' }}>No tablet buttons configured yet.</h3>
              <p style={{ fontSize: '14px', margin: 0, maxWidth: '400px' }}>Use the CMS Dashboard &rarr; TV Accounts section to design custom touchscreen action buttons.</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '20px'
            }}>
              {tabletButtons.map(btn => (
                <button
                  key={btn.id}
                  onClick={() => overrideScreen(btn)}
                  style={{
                    background: btn.color || 'var(--brand-primary)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '16px',
                    padding: '28px 20px',
                    fontSize: '18px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-md)',
                    transition: 'transform 0.1s ease, box-shadow 0.1s ease',
                    minHeight: '130px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    textAlign: 'center',
                    lineHeight: 1.3
                  }}
                  onPointerDown={(e) => (e.currentTarget.style.transform = 'scale(0.96)')}
                  onPointerUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  onPointerLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <Sparkles size={28} />
                  {btn.label}
                </button>
              ))}
            </div>
          )}

        </div>
      </div>

      {showExitToast && (
        <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: 'var(--foreground)', color: 'var(--background)', padding: '12px 24px', borderRadius: '24px', fontSize: '13px', fontWeight: '600', zIndex: 9999, boxShadow: 'var(--shadow-lg)' }}>
          Press back again to exit application
        </div>
      )}
    </div>
  );
}
