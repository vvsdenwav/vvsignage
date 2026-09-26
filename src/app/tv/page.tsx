'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MonitorPlay, ShieldCheck, LogOut, Tv, UserSquare2, RefreshCw, Settings as SettingsIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { SettingsOverlay } from '@/components/SettingsOverlay';

export default function TvPortalPage() {
  const router = useRouter();

  const [step, setStep] = useState(0); // 0=init, 1=companyCode, 2=mode, 3=pair, 3.5=login, 4=ready
  const [tvAccountId, setTvAccountId] = useState<string | null>(null);
  const [tvUsername, setTvUsername] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [screenId, setScreenId] = useState<string | null>(null);
  const [screenName, setScreenName] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // Step 1 State
  const [companyCode, setCompanyCode] = useState('');
  const [companyCodeError, setCompanyCodeError] = useState('');
  const [orgData, setOrgData] = useState<any>(null);

  // Step 2 State (Login)
  const [tvName, setTvName] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  
  // Step 3 State (Screen Selection)
  const [availableScreens, setAvailableScreens] = useState<any[]>([]);
  
  const [showExitWarning, setShowExitWarning] = useState(false);
  const keySequenceRef = useRef<{ key: string; time: number }[]>([]);

  // Unified Back Button logic (for double-back to exit app)
  const backPressCountRef = useRef(0);
  const requestExit = useCallback(async () => {
    backPressCountRef.current += 1;
    if (backPressCountRef.current === 1) {
      setShowExitWarning(true);
      setTimeout(() => {
        backPressCountRef.current = 0;
        setShowExitWarning(false);
      }, 3000);
    } else {
      // Second press - Exit app entirely
      try {
        const { App } = await import('@capacitor/app');
        App.exitApp();
      } catch (e) {
        console.error('Failed to exit app', e);
      }
    }
  }, []);

  useEffect(() => {
    let backListener: any;
    const setupListeners = async () => {
      try {
        const { App } = await import('@capacitor/app');
        backListener = await App.addListener('backButton', () => {
          requestExit();
        });
      } catch (e) {
        // Not capacitor
      }
    };
    setupListeners();

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName;
      const isInputActive = activeTag === 'INPUT' || activeTag === 'TEXTAREA';

      // 1. Check for D-pad circle combo: Up -> Right -> Down -> Left (within 2s)
      const validComboKeys = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'];
      if (validComboKeys.includes(e.key)) {
        const now = Date.now();
        const seq = [...keySequenceRef.current, { key: e.key, time: now }]
          .filter(item => now - item.time < 2000);
        
        keySequenceRef.current = seq;

        if (seq.length >= 4) {
          const last4 = seq.slice(-4).map(i => i.key);
          if (
            last4[0] === 'ArrowUp' &&
            last4[1] === 'ArrowRight' &&
            last4[2] === 'ArrowDown' &&
            last4[3] === 'ArrowLeft'
          ) {
            e.preventDefault();
            setShowSettings(prev => !prev);
            keySequenceRef.current = [];
            return;
          }
        }
      }

      // Quick developer shortcut 'S'
      if ((e.key === 's' || e.key === 'S') && !isInputActive) {
        setShowSettings(prev => !prev);
        return;
      }

      if (isInputActive && (e.key === 'Backspace' || e.keyCode === 8)) return;

      if (e.key === 'Escape' || e.key === 'Backspace' || e.key === 'BrowserBack' || e.keyCode === 27 || e.keyCode === 10009) {
        if (showSettings) {
          e.preventDefault();
          setShowSettings(false);
          return;
        }

        e.preventDefault();
        
        // If we are deep in the wizard, go back a step instead of exiting
        if (step === 3) {
          setStep(2);
          backPressCountRef.current = 0;
          return;
        } else if (step === 2) {
          setStep(1);
          backPressCountRef.current = 0;
          return;
        }
        
        requestExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (backListener) backListener.remove();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [requestExit, step, showSettings]);

  // 1. Boot up and register (or restore from localStorage)
  useEffect(() => {
    const initDevice = async () => {
      let did = (typeof window !== 'undefined' && (window as any).AndroidBridge?.getDeviceId?.()) || null;
      if (did) {
        localStorage.setItem('vvsignage_device_id', did);
      } else {
        did = localStorage.getItem('vvsignage_device_id');
        if (!did) {
          try {
            const { Device } = await import('@capacitor/device');
            const info = await Device.getId();
            if (info && info.identifier) {
              did = info.identifier;
            }
          } catch(e) {}
          if (!did) {
            did = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
          }
          localStorage.setItem('vvsignage_device_id', did);
        }
      }
      setDeviceId(did);

      const accId = localStorage.getItem('vvsignage_tv_account');
      const savedUser = localStorage.getItem('vvsignage_tv_username');
      const savedOrgName = localStorage.getItem('vvsignage_org_name');
      const savedScreenId = localStorage.getItem('vvsignage_screen_id');
      const savedScreenName = localStorage.getItem('vvsignage_screen_name');
      const savedOrgId = localStorage.getItem('vvsignage_org_id');
      const savedOrgData = localStorage.getItem('vvsignage_org_data');

      if (savedUser) setTvUsername(savedUser);
      if (savedOrgName) setCompanyName(savedOrgName);
      if (savedScreenName) setScreenName(savedScreenName);

      if (savedScreenId) {
        // Auto-launch the player instantly whenever a screen is paired, regardless of network state!
        router.replace('/player');
        return;
      }

      if (accId) {
        setTvAccountId(accId);
        fetchScreens(accId);
        setStep(3);
        setIsInitializing(false);
        return;
      }

      if (savedOrgId && savedOrgData) {
        try {
          const parsed = JSON.parse(savedOrgData);
          setOrgData(parsed);
          if (parsed.name) setCompanyName(parsed.name);
        } catch(e) {}
        setStep(2);
      } else {
        setStep(1);
      }
      
      setIsInitializing(false);
    };

    initDevice();
  }, [router]);

  // Step 1 Logic
  const handleResolveCompanyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompanyCodeError('');
    if (!companyCode.trim()) return;

    try {
      const res = await fetch(`/api/apk/resolve?code=${encodeURIComponent(companyCode)}`);
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('vvsignage_org_id', data.data.id);
        localStorage.setItem('vvsignage_org_data', JSON.stringify(data.data));
        if (data.data.name) {
          localStorage.setItem('vvsignage_org_name', data.data.name);
          setCompanyName(data.data.name);
        }
        setOrgData(data.data);
        setStep(2);
      } else {
        setCompanyCodeError(data.error || 'Invalid Company Code');
      }
    } catch (e) {
      setCompanyCodeError('Network error');
    }
  };

  // Removed pairing flow

  // Step 2 Logic (TV Login)
  const handleTvAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('/api/tv-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: authUsername, password: authPassword, deviceId, tvName })
      });
      if (res.ok) {
        const data = await res.json();
        setTvAccountId(data.accountId);
        localStorage.setItem('vvsignage_tv_account', data.accountId);
        localStorage.setItem('vvsignage_tv_token', data.token);
        
        if (data.username) {
          localStorage.setItem('vvsignage_tv_username', data.username);
          setTvUsername(data.username);
        }
        if (data.organizationName) {
          localStorage.setItem('vvsignage_org_name', data.organizationName);
          setCompanyName(data.organizationName);
        }
        if (data.organizationId) {
          localStorage.setItem('vvsignage_org_id', data.organizationId);
        }

        setAvailableScreens(data.screens || []);
        setStep(3);
      } else {
        const data = await res.json();
        setAuthError(data.error || 'Authentication failed');
      }
    } catch (e) {
      setAuthError('Network error');
    }
  };

  const fetchScreens = async (accId: string) => {
    try {
      const token = localStorage.getItem('vvsignage_tv_token');
      const res = await fetch(`/api/tv-accounts/${accId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAvailableScreens(data.screens || []);
      }
    } catch (e) {
      console.error("Failed to fetch available screens", e);
    }
  };

  const launchScreen = async (selectedScreenId: string) => {
    if (!deviceId || !tvAccountId) return;
    
    const matched = availableScreens.find(s => s.id === selectedScreenId);
    if (matched?.name) {
      localStorage.setItem('vvsignage_screen_name', matched.name);
      setScreenName(matched.name);
    }

    // Tell the server this device is now tied to this screen
    try {
      const token = localStorage.getItem('vvsignage_tv_token');
      await fetch('/api/tv-ping', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ accountId: tvAccountId, deviceId, currentScreenId: selectedScreenId, action: 'SYNC_SCREEN', screenId: selectedScreenId })
      });
    } catch (e) {
      console.error(e);
    }

    localStorage.setItem('vvsignage_screen_id', selectedScreenId);
    router.push('/player');
  };

  const handleLogout = () => {
    localStorage.removeItem('vvsignage_tv_account');
    localStorage.removeItem('vvsignage_screen_id');
    localStorage.removeItem('vvsignage_screen_name');
    localStorage.removeItem('vvsignage_tv_username');
    localStorage.removeItem('vvsignage_tv_token');
    localStorage.removeItem('vvsignage_cached_config');
    setTvAccountId(null);
    setTvUsername(null);
    setScreenId(null);
    setScreenName(null);
    setAuthUsername('');
    setAuthPassword('');
    setStep(2); // Go back to TV login
  };
  
  const resetApp = () => {
    localStorage.clear();
    window.location.reload();
  };

  // Keep device active, update available screens, and listen for remote CMS commands (Only in Step 3)
  useEffect(() => {
    if (step !== 3 || !tvAccountId || !deviceId) return;
    
    const pingAndRefresh = async () => {
      try {
        fetchScreens(tvAccountId);
        
        const token = localStorage.getItem('vvsignage_tv_token');
        const res = await fetch('/api/tv-ping', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ accountId: tvAccountId, deviceId, currentScreenId: null })
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.command === 'FULL_LOGOUT') {
            resetApp();
          } else if (data.command === 'LOGOUT') {
            handleLogout();
          } else if (data.command === 'RELOAD') {
            window.location.reload();
          } else if (data.command === 'SYNC_SCREEN' && data.screenId) {
            launchScreen(data.screenId);
          }
        }
      } catch (e) {
        console.error("Ping failed", e);
      }
    };

    const interval = setInterval(pingAndRefresh, 3000);
    return () => clearInterval(interval);
  }, [step, tvAccountId, deviceId]);


  if (isInitializing) return null;

  // Compute theme from orgData if available
  const themeColor = orgData?.brandingColor || '#38bdf8';
  const logoUrl = orgData?.brandingLogoUrl || '/logo.png';

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      height: '100vh', width: '100vw', overflow: 'hidden', touchAction: 'none',
      background: 'linear-gradient(135deg, #0f172a 0%, #020617 100%)',
      color: '#f8fafc', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Subtle background glow effect using theme color */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '800px', height: '800px', background: `radial-gradient(circle, ${themeColor}15 0%, rgba(0,0,0,0) 70%)`, zIndex: 0, pointerEvents: 'none' }} />
      
      {/* Top right reset button for troubleshooting */}
      {(step === 1 || step === 2) && (
        <div style={{ position: 'absolute', top: '32px', right: '32px', zIndex: 10 }}>
          <button 
            onClick={resetApp}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'rgba(255,255,255,0.05)', color: 'white',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
              padding: '12px 24px', cursor: 'pointer', fontSize: '14px', fontWeight: '500',
              backdropFilter: 'blur(12px)'
            }}
          >
            Reset App
          </button>
        </div>
      )}

      {/* --- STEP 1: COMPANY CODE --- */}
      {step === 1 && (
        <div style={{
          position: 'relative', zIndex: 1, width: '440px', maxWidth: '90vw',
          background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          padding: '40px 36px', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'
        }}>
          <img src="/logo.png" alt="Logo" style={{ width: '240px', maxHeight: '120px', display: 'block', margin: '0 auto 24px auto', objectFit: 'contain', filter: 'drop-shadow(0px 4px 16px rgba(0,0,0,0.6))' }} />
          <h1 style={{ fontSize: '26px', marginBottom: '6px', fontWeight: '600', letterSpacing: '-0.5px', textAlign: 'center', width: '100%' }}>Welcome</h1>
          <p style={{ color: '#94a3b8', marginBottom: '24px', textAlign: 'center', fontSize: '14px', lineHeight: '1.4' }}>Enter your Company Code to get started.</p>
          
          {companyCodeError && (
            <div style={{ color: '#f87171', marginBottom: '20px', fontSize: '14px', fontWeight: '500', background: 'rgba(239, 68, 68, 0.1)', padding: '10px 14px', borderRadius: '12px', width: '100%', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              {companyCodeError}
            </div>
          )}
          
          <form onSubmit={handleResolveCompanyCode} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input 
              type="text" 
              autoFocus
              value={companyCode}
              onChange={e => setCompanyCode(e.target.value.toUpperCase())}
              style={{
                width: '100%', padding: '14px 18px', background: 'rgba(0,0,0,0.3)', border: '2px solid rgba(255,255,255,0.1)',
                borderRadius: '14px', color: 'white', fontSize: '18px', fontWeight: 'bold', letterSpacing: '1px', textAlign: 'center', outline: 'none'
              }}
              onFocus={e => { e.currentTarget.style.borderColor = '#38bdf8'; e.currentTarget.style.background = 'rgba(15,23,42,0.8)'; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(0,0,0,0.3)'; }}
            />
            <button 
              type="submit"
              disabled={!companyCode}
              style={{
                width: '100%', background: '#f8fafc', color: '#0f172a', padding: '14px', borderRadius: '14px',
                fontSize: '16px', fontWeight: '600', cursor: !companyCode ? 'not-allowed' : 'pointer', opacity: !companyCode ? 0.5 : 1, outline: 'none'
              }}
            >
              Continue
            </button>
          </form>
        </div>
      )}



      {/* --- STEP 2: TV LOGIN --- */}
      {step === 2 && (
        <div style={{
          position: 'relative', zIndex: 1, width: '440px', maxWidth: '90vw',
          background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          padding: '40px 36px', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'
        }}>
          <img src={logoUrl} alt="Logo" style={{ width: '240px', maxHeight: '120px', display: 'block', margin: '0 auto 24px auto', objectFit: 'contain' }} />
          <h1 style={{ fontSize: '26px', marginBottom: '6px', fontWeight: '600' }}>TV Account Sign In</h1>
          <p style={{ color: '#94a3b8', marginBottom: '24px', fontSize: '14px' }}>Sign in with your TV Account credentials.</p>
          
          {authError && <div style={{ color: '#f87171', marginBottom: '20px', background: 'rgba(239, 68, 68, 0.1)', padding: '10px 14px', borderRadius: '12px', width: '100%', border: '1px solid rgba(239, 68, 68, 0.2)' }}>{authError}</div>}
          
          <form onSubmit={handleTvAuth} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input type="text" placeholder="Username" value={authUsername} onChange={e => setAuthUsername(e.target.value)} style={{ width: '100%', padding: '14px 18px', background: 'rgba(0,0,0,0.3)', border: '2px solid rgba(255,255,255,0.1)', borderRadius: '14px', color: 'white', fontSize: '16px', outline: 'none' }} onFocus={e => { e.currentTarget.style.borderColor = themeColor; e.currentTarget.style.background = 'rgba(15,23,42,0.8)'; }} onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(0,0,0,0.3)'; }} />
            <input type="password" placeholder="Password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} style={{ width: '100%', padding: '14px 18px', background: 'rgba(0,0,0,0.3)', border: '2px solid rgba(255,255,255,0.1)', borderRadius: '14px', color: 'white', fontSize: '16px', outline: 'none' }} onFocus={e => { e.currentTarget.style.borderColor = themeColor; e.currentTarget.style.background = 'rgba(15,23,42,0.8)'; }} onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(0,0,0,0.3)'; }} />
            <button type="submit" disabled={!authUsername || !authPassword} style={{ width: '100%', background: '#f8fafc', color: '#0f172a', padding: '14px', borderRadius: '14px', fontSize: '16px', fontWeight: '600', cursor: (!authUsername || !authPassword) ? 'not-allowed' : 'pointer', opacity: (!authUsername || !authPassword) ? 0.5 : 1, outline: 'none' }}>Sign In</button>
          </form>
        </div>
      )}

      {/* --- STEP 3: DEVICE READY --- */}
      {step === 3 && (
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '1000px', padding: '0 32px' }}>
          <div style={{ position: 'absolute', top: '-100px', right: '0', zIndex: 10 }}>
            <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 24px', cursor: 'pointer', fontSize: '15px', fontWeight: '500' }}>
              <LogOut size={18} /> Log Out
            </button>
          </div>
          
          <ShieldCheck size={72} strokeWidth={1.5} style={{ color: themeColor, marginBottom: '24px' }} />
          <h1 style={{ fontSize: '36px', marginBottom: '12px', fontWeight: '600' }}>Device Ready</h1>
          <p style={{ fontSize: '18px', color: '#94a3b8', marginBottom: '48px' }}>Select the screen to assign to this TV and launch the player.</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', width: '100%' }}>
            {availableScreens.length === 0 ? (
              <div style={{ gridColumn: 'span 3', textAlign: 'center', color: '#94a3b8', padding: '48px', background: 'rgba(255,255,255,0.03)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                No screens assigned to this TV Account. Please assign screens in the CMS.
              </div>
            ) : (
              availableScreens.map(s => (
                <button
                  key={s.id}
                  onClick={() => launchScreen(s.id)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '24px', padding: '40px 32px', cursor: 'pointer', transition: 'all 0.3s ease',
                    color: 'white', backdropFilter: 'blur(16px)'
                  }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = themeColor; e.currentTarget.style.transform = 'translateY(-6px)'; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                  <MonitorPlay size={44} strokeWidth={1.5} style={{ color: themeColor, marginBottom: '20px' }} />
                  <span style={{ fontSize: '22px', fontWeight: '600', marginBottom: '8px' }}>{s.name || `Screen ${s.id.substring(0, 8)}`}</span>
                  <span style={{ fontSize: '14px', color: '#94a3b8' }}>Click to Launch</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Top Left Settings button for mouse/touch troubleshooting */}
      <div style={{ position: 'absolute', top: '32px', left: '32px', zIndex: 10 }}>
        <button 
          onClick={() => setShowSettings(true)}
          title="Display Diagnostics (Remote: ▲ ▶ ▼ ◀)"
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(255,255,255,0.05)', color: '#94a3b8',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
            padding: '12px 20px', cursor: 'pointer', fontSize: '13px', fontWeight: '500',
            backdropFilter: 'blur(12px)'
          }}
        >
          <SettingsIcon size={16} />
          <span>Settings</span>
        </button>
      </div>

      {/* Exit Warning Toast */}
      {showExitWarning && (
        <div style={{ position: 'fixed', bottom: '10%', left: '50%', transform: 'translateX(-50%)', background: 'rgba(15, 23, 42, 0.9)', color: 'white', padding: '16px 32px', borderRadius: '30px', fontSize: '16px', fontWeight: '500', zIndex: 99999, border: '1px solid rgba(255,255,255,0.1)' }}>
          Press Back again to exit
        </div>
      )}

      {/* Settings Diagnostic Overlay */}
      <SettingsOverlay
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        deviceId={deviceId}
        tvAccountId={tvAccountId}
        tvUsername={tvUsername}
        companyName={companyName}
        screenId={screenId}
        screenName={screenName}
        onLogout={handleLogout}
        onForceReload={() => window.location.reload()}
      />
    </div>
  );
}
