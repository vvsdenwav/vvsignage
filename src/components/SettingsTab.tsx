import React, { useState, useEffect } from 'react';
import { Save, Settings, Monitor, Globe, Shield, X, AlertCircle, Mail, Plus, Edit2, Trash2, Check, Power, Wifi, Clock, Server, CheckCircle2, Languages } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export function SettingsTab() {
  const { language, setLanguage, t } = useI18n();
  const [defaultUnit, setDefaultUnit] = useState('f');
  const [defaultTimezone, setDefaultTimezone] = useState('America/New_York');
  const [allowedDomains, setAllowedDomains] = useState<string[]>([]);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [offlineDelayMinutes, setOfflineDelayMinutes] = useState('3');
  const [throttlingEnabled, setThrottlingEnabled] = useState(true);
  const [downloadJitterMinutes, setDownloadJitterMinutes] = useState('15');
  const [emailList, setEmailList] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [teamsWebhookUrl, setTeamsWebhookUrl] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [brandingColor, setBrandingColor] = useState('#2563eb');
  const [brandingLogoUrl, setBrandingLogoUrl] = useState('');
  const [companyCode, setCompanyCode] = useState<string | null>(null);
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [testEmailToast, setTestEmailToast] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const dashboardRes = await fetch('/api/dashboard');
        if (dashboardRes.ok) {
          const dashboardData = await dashboardRes.json();
          if (dashboardData.brandingColor) setBrandingColor(dashboardData.brandingColor);
          if (dashboardData.brandingLogoUrl) setBrandingLogoUrl(dashboardData.brandingLogoUrl);
          if (dashboardData.companyCode) setCompanyCode(dashboardData.companyCode);
        }

        const res = await fetch('/api/settings');
        if (res.ok) {
          const data = await res.json();
          if (data.defaultUnit) setDefaultUnit(data.defaultUnit);
          if (data.defaultTimezone) setDefaultTimezone(data.defaultTimezone);
          if (data.alertsEnabled !== undefined) {
            setAlertsEnabled(data.alertsEnabled === 'true' || data.alertsEnabled === true);
          }
          if (data.offlineDelayMinutes) {
            setOfflineDelayMinutes(data.offlineDelayMinutes);
          }
          if (data.networkThrottlingEnabled !== undefined) {
            setThrottlingEnabled(data.networkThrottlingEnabled === 'true' || data.networkThrottlingEnabled === true);
          }
          if (data.downloadJitterMinutes) {
            setDownloadJitterMinutes(data.downloadJitterMinutes);
          }
          if (data.alertEmailRecipient) {
            const parsed = data.alertEmailRecipient.split(',').map((e: string) => e.trim()).filter(Boolean);
            setEmailList(parsed.slice(0, 10));
          }
          if (data.teamsWebhookUrl) setTeamsWebhookUrl(data.teamsWebhookUrl);
          if (data.allowedWebDomains) {
            setAllowedDomains(JSON.parse(data.allowedWebDomains));
          }
        }
      } catch (e) {
        console.error("Failed to fetch system settings", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const saveSettings = async (overrides?: { domains?: string[]; emails?: string[]; enabled?: boolean; delayMinutes?: string; throttlingEnabled?: boolean }) => {
    setIsSaving(true);
    try {
      const domainsToSave = overrides?.domains ?? allowedDomains;
      const emailsToSave = overrides?.emails ?? emailList;
      const enabledToSave = overrides?.enabled ?? alertsEnabled;
      const delayMinutesToSave = overrides?.delayMinutes ?? offlineDelayMinutes;
      const throttlingToSave = overrides?.throttlingEnabled ?? throttlingEnabled;
      const recipientStr = emailsToSave.join(', ');

      const headers = { 'Content-Type': 'application/json' };
      const res = await Promise.all([
        fetch('/api/organizations/branding', { method: 'POST', headers, body: JSON.stringify({ brandingColor, brandingLogoUrl }) }),
        fetch('/api/settings', { method: 'POST', headers, body: JSON.stringify({ key: 'defaultUnit', value: defaultUnit }) }),
        fetch('/api/settings', { method: 'POST', headers, body: JSON.stringify({ key: 'defaultTimezone', value: defaultTimezone }) }),
        fetch('/api/settings', { method: 'POST', headers, body: JSON.stringify({ key: 'alertsEnabled', value: String(enabledToSave) }) }),
        fetch('/api/settings', { method: 'POST', headers, body: JSON.stringify({ key: 'offlineDelayMinutes', value: String(delayMinutesToSave) }) }),
        fetch('/api/settings', { method: 'POST', headers, body: JSON.stringify({ key: 'networkThrottlingEnabled', value: String(throttlingToSave) }) }),
        fetch('/api/settings', { method: 'POST', headers, body: JSON.stringify({ key: 'downloadJitterMinutes', value: String(downloadJitterMinutes) }) }),
        fetch('/api/settings', { method: 'POST', headers, body: JSON.stringify({ key: 'alertEmailRecipient', value: recipientStr }) }),
        fetch('/api/settings', { method: 'POST', headers, body: JSON.stringify({ key: 'teamsWebhookUrl', value: teamsWebhookUrl }) }),
        fetch('/api/settings', { method: 'POST', headers, body: JSON.stringify({ key: 'allowedWebDomains', value: JSON.stringify(domainsToSave) }) })
      ]);
      for (const r of res) {
        if (!r.ok) {
          const errText = await r.text();
          throw new Error(`API Error ${r.status}: ${errText}`);
        }
      }
      setShowSaveToast(true);
      setTimeout(() => setShowSaveToast(false), 3000);
    } catch (e: any) {
      console.error('Error saving settings.', e);
      alert(`Failed to save settings: ${e.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (emailList.length === 0) {
      alert('Please add and save at least one email address first before sending a test alert.');
      return;
    }
    setIsSendingTestEmail(true);
    setTestEmailToast(null);
    try {
      const res = await fetch('/api/settings/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails: emailList })
      });
      const data = await res.json();
      if (res.ok) {
        setTestEmailToast(`✅ Test alert email sent to: ${emailList.join(', ')}`);
        setTimeout(() => setTestEmailToast(null), 6000);
      } else {
        alert(data.error || 'Failed to send test email');
      }
    } catch (e: any) {
      alert(`Test email error: ${e.message}`);
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  const handleSave = async () => {
    await saveSettings();
  };

  const handleToggleAlerts = async (enabled: boolean) => {
    setAlertsEnabled(enabled);
    await saveSettings({ enabled });
  };

  const handleAddEmail = async () => {
    if (!newEmail.trim()) return;
    const clean = newEmail.trim().toLowerCase();
    if (emailList.length >= 5) {
      alert('You can add up to 5 notification email addresses.');
      return;
    }
    if (emailList.includes(clean)) {
      alert('This email address is already added.');
      return;
    }
    const updated = [...emailList, clean];
    setEmailList(updated);
    setNewEmail('');
    await saveSettings({ emails: updated });
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditingValue(emailList[index]);
  };

  const handleSaveEdit = async (index: number) => {
    if (!editingValue.trim()) return;
    const clean = editingValue.trim().toLowerCase();
    const updated = [...emailList];
    updated[index] = clean;
    setEmailList(updated);
    setEditingIndex(null);
    setEditingValue('');
    await saveSettings({ emails: updated });
  };

  const handleRemoveEmail = async (index: number) => {
    const updated = emailList.filter((_, i) => i !== index);
    setEmailList(updated);
    await saveSettings({ emails: updated });
  };

  const handleAddDomain = async () => {
    if (!newDomain.trim()) return;
    const clean = newDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
    if (!allowedDomains.includes(clean)) {
      const newDomains = [...allowedDomains, clean];
      setAllowedDomains(newDomains);
      setNewDomain('');
      await saveSettings({ domains: newDomains });
    } else {
      setNewDomain('');
    }
  };

  const handleRemoveDomain = async (index: number) => {
    const newDomains = allowedDomains.filter((_, i) => i !== index);
    setAllowedDomains(newDomains);
    await saveSettings({ domains: newDomains });
  };

  if (isLoading) {
    return <div style={{ padding: '32px', color: 'var(--text-muted)', fontWeight: '600' }}>Loading system preferences...</div>;
  }

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px', paddingBottom: '100px' }}>
      
      {/* Header section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '4px' }}>
        <div style={{ width: 48, height: 48, borderRadius: '12px', background: 'var(--brand-accent)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Settings size={26} />
        </div>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: 'var(--foreground)' }}>{t('settings.title', 'System Settings')}</h2>
          <p style={{ color: 'var(--text-muted)', margin: '2px 0 0 0', fontSize: '14px' }}>
            {t('settings.language_desc', 'Manage offline TV alerts, Wi-Fi performance controls, website permissions, and defaults.')}
          </p>
        </div>
      </div>

      {/* ─── SECTION 0: Organization Profile & Branding ─── */}
      <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <Globe size={20} color="var(--brand-primary)" />
            {t('settings.branding', 'Organization Profile & Branding')}
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            View your organization credentials and customize the look and feel of your dashboard.
          </p>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              Company Code
              <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--brand-primary)', background: 'var(--accent)', padding: '2px 6px', borderRadius: '4px' }}>Used for TV pairing</span>
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="text"
                className="input-field"
                value={companyCode || 'Loading...'}
                readOnly
                style={{ flex: 1, fontFamily: 'monospace', fontWeight: 'bold', letterSpacing: '2px', background: 'var(--muted)', cursor: 'default' }}
              />
              <button
                type="button"
                onClick={() => {
                  if (companyCode) {
                    navigator.clipboard.writeText(companyCode);
                    alert('Company code copied to clipboard!');
                  }
                }}
                className="btn-secondary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', height: 'auto', padding: '0 20px' }}
              >
                Copy Code
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Brand Color (Hex code)</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="color"
                value={brandingColor || '#2563eb'}
                onChange={e => setBrandingColor(e.target.value)}
                style={{ width: '40px', height: '40px', padding: 0, border: 'none', borderRadius: '8px', cursor: 'pointer' }}
              />
              <input 
                type="text"
                className="input-field"
                placeholder="#2563eb"
                value={brandingColor}
                onChange={e => setBrandingColor(e.target.value)}
                style={{ flex: 1 }}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Logo URL</label>
            <input 
              type="text"
              className="input-field"
              placeholder="https://example.com/logo.png"
              value={brandingLogoUrl}
              onChange={e => setBrandingLogoUrl(e.target.value)}
            />
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              A horizontal logo with a transparent background works best.
            </p>
          </div>
        </div>
      </div>

      {/* ─── SECTION 1: Offline Screen Email Alerts ─── */}
      <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
              <Mail size={20} color="#EF4444" />
              Offline Screen Email Alerts
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Automatically send an email notification when any TV screen goes offline or loses connection.
            </p>
          </div>

          {/* Alert Toggle Switch */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: alertsEnabled ? '#10B981' : 'var(--text-muted)' }}>
              {alertsEnabled ? 'Alerts Active' : 'Alerts Disabled'}
            </span>
            <button
              type="button"
              onClick={() => handleToggleAlerts(!alertsEnabled)}
              style={{
                width: '52px',
                height: '28px',
                borderRadius: '14px',
                background: alertsEnabled ? '#10B981' : 'var(--border)',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.2s',
                padding: '2px'
              }}
              title={alertsEnabled ? 'Click to disable email alerts' : 'Click to enable email alerts'}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  position: 'absolute',
                  top: '2px',
                  left: alertsEnabled ? '26px' : '2px',
                  transition: 'left 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <Power size={13} color={alertsEnabled ? '#10B981' : '#64748B'} />
              </div>
            </button>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />

        {/* Delay Threshold Configuration */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={15} color="var(--brand-primary)" /> Alert Delay Threshold
          </label>
          <select
            value={offlineDelayMinutes}
            onChange={e => {
              setOfflineDelayMinutes(e.target.value);
              saveSettings({ delayMinutes: e.target.value });
            }}
            className="input-field"
            style={{ maxWidth: '380px' }}
          >
            <option value="1">After 1 minute without heartbeat (Immediate)</option>
            <option value="2">After 2 minutes without heartbeat</option>
            <option value="3">After 3 minutes without heartbeat (Recommended)</option>
            <option value="5">After 5 minutes without heartbeat</option>
            <option value="10">After 10 minutes without heartbeat</option>
          </select>
          <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>
            An email alert will be automatically dispatched if a display screen fails to ping for longer than this duration.
          </p>
        </div>

        {/* Email Recipient List */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label className="form-label" style={{ margin: 0 }}>Notification Email Recipients</label>
            <span style={{ fontSize: '12px', color: emailList.length >= 10 ? '#EF4444' : 'var(--text-muted)', fontWeight: '600' }}>
              {emailList.length} / 10 Emails Added
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="email"
              className="input-field"
              placeholder={emailList.length >= 10 ? "Maximum 10 email addresses reached" : "Enter recipient email (e.g. manager@tropicair.com)"}
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); handleAddEmail(); } }}
              disabled={emailList.length >= 10}
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="btn-primary"
              onClick={handleAddEmail}
              disabled={emailList.length >= 10 || !newEmail.trim()}
              style={{ padding: '0 18px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
            >
              <Plus size={16} /> Add Address
            </button>
          </div>

          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {emailList.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--background)', borderRadius: '8px', border: '1px dashed var(--border)', fontSize: '13px' }}>
                No notification emails added yet. Enter an email address above to receive offline alerts.
              </div>
            ) : (
              emailList.map((email, idx) => (
                <div key={idx} style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                  padding: '10px 14px', background: 'var(--background)', 
                  border: '1px solid var(--border)', borderRadius: '8px' 
                }}>
                  {editingIndex === idx ? (
                    <div style={{ display: 'flex', gap: '8px', flex: 1, marginRight: '12px' }}>
                      <input 
                        type="email"
                        className="input-field"
                        value={editingValue}
                        onChange={e => setEditingValue(e.target.value)}
                        onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); handleSaveEdit(idx); } }}
                        style={{ fontSize: '13px', padding: '4px 10px' }}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(idx)}
                        style={{ background: '#10B981', color: 'white', border: 'none', borderRadius: '6px', padding: '0 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        title="Save Address"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingIndex(null)}
                        style={{ background: 'var(--border)', color: 'var(--foreground)', border: 'none', borderRadius: '6px', padding: '0 10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                        title="Cancel"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--foreground)' }}>{email}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button 
                          type="button"
                          onClick={() => handleStartEdit(idx)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--brand-primary)', cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
                          title="Edit Email Address"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button 
                          type="button"
                          onClick={() => handleRemoveEmail(idx)}
                          style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
                          title="Remove Email Address"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Test Email Delivery Trigger */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', background: 'var(--background)', border: '1px solid var(--border)', padding: '14px 18px', borderRadius: '10px', marginTop: '6px' }}>
          <div>
            <strong style={{ fontSize: '13px', display: 'block', color: 'var(--foreground)' }}>Test Email Delivery</strong>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Send an immediate test alert to verify your recipient email inbox</span>
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={handleSendTestEmail}
            disabled={isSendingTestEmail || emailList.length === 0}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', padding: '8px 16px', cursor: (isSendingTestEmail || emailList.length === 0) ? 'not-allowed' : 'pointer' }}
          >
            {isSendingTestEmail ? (
              <>
                <Clock size={14} className="animate-spin" /> Sending Test Email...
              </>
            ) : (
              <>
                <Mail size={14} color="var(--brand-primary)" /> Send Test Alert Email
              </>
            )}
          </button>
        </div>

        {testEmailToast && (
          <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#059669', fontSize: '12px', fontWeight: '600' }}>
            {testEmailToast}
          </div>
        )}
      </div>

      {/* ─── SECTION 2: Wi-Fi Performance & Media Download Controls ─── */}
      <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
              <Wifi size={20} color="var(--brand-primary)" />
              Smart Wi-Fi & Media Download Speed Controls
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Prevent Wi-Fi network slowdowns when updating playlists across multiple station displays.
            </p>
          </div>

          {/* Toggle Switch */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: throttlingEnabled ? 'var(--brand-primary)' : 'var(--text-muted)' }}>
              {throttlingEnabled ? 'Wi-Fi Protection ON' : 'Wi-Fi Protection OFF'}
            </span>
            <button
              type="button"
              onClick={() => {
                const updated = !throttlingEnabled;
                setThrottlingEnabled(updated);
                saveSettings({ throttlingEnabled: updated });
              }}
              style={{
                width: '52px',
                height: '28px',
                borderRadius: '14px',
                background: throttlingEnabled ? 'var(--brand-primary)' : 'var(--border)',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                transition: 'background 0.2s',
                padding: '2px'
              }}
              title={throttlingEnabled ? 'Click to turn off Wi-Fi protection' : 'Click to turn on Wi-Fi protection'}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  position: 'absolute',
                  top: '2px',
                  left: throttlingEnabled ? '26px' : '2px',
                  transition: 'left 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <Power size={13} color={throttlingEnabled ? 'var(--brand-primary)' : '#64748B'} />
              </div>
            </button>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '13px' }}>Download Spread Window (Minutes)</label>
            <input 
              type="number"
              min="1"
              max="60"
              className="input-field"
              placeholder="15"
              value={downloadJitterMinutes}
              onChange={e => setDownloadJitterMinutes(e.target.value)}
              disabled={!throttlingEnabled}
              style={{ maxWidth: '200px' }}
            />
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
              When new videos or images are published, screens will spread their downloads randomly over this time window (e.g. 15 minutes) instead of downloading all at once.
            </p>
          </div>

          <div style={{ padding: '14px 16px', background: 'rgba(44, 76, 124, 0.06)', border: '1px solid rgba(44, 76, 124, 0.2)', borderRadius: '10px', color: 'var(--brand-primary)', fontSize: '13px', lineHeight: '1.4' }}>
            <strong style={{ display: 'block', fontSize: '13px', marginBottom: '2px' }}>💡 Why this matters:</strong>
            Ensures check-in desk computers and passenger Wi-Fi stay fast when publishing large video updates to station displays.
          </div>
        </div>
      </div>

      {/* ─── SECTION 3: Allowed Websites & Web Contents ─── */}
      <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <Shield size={20} color="#10B981" />
            Allowed Websites & Web Content
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            For safety, specify which external website addresses are allowed to be displayed inside Web slides or Web widgets.
          </p>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
            <Globe size={16} /> Add Permitted Website Domain
          </label>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text"
              className="input-field"
              placeholder="e.g. flightradar24.com or weather.gov"
              value={newDomain}
              onChange={e => setNewDomain(e.target.value)}
              onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); handleAddDomain(); } }}
              style={{ flex: 1 }}
            />
            <button 
              type="button" 
              className="btn-primary" 
              onClick={handleAddDomain}
              disabled={!newDomain.trim()}
              style={{ padding: '0 20px' }}
            >
              Allow Website
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
            {allowedDomains.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--background)', borderRadius: '10px', border: '1px dashed var(--border)', fontSize: '13px' }}>
                No custom website domains added yet. External web content will be restricted until allowed above.
              </div>
            ) : (
              allowedDomains.map((domain, idx) => (
                <div key={idx} style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                  padding: '10px 14px', background: 'var(--background)', 
                  border: '1px solid var(--border)', borderRadius: '8px' 
                }}>
                  <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--foreground)' }}>{domain}</span>
                  <button 
                    type="button"
                    onClick={() => handleRemoveDomain(idx)}
                    style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
                    title="Remove Allowed Website"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ─── SECTION 4: Time & Weather Defaults ─── */}
      <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <Clock size={20} color="var(--brand-primary)" />
            Time & Weather Defaults
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Set standard default timezone and temperature units for new widgets and screen schedules.
          </p>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="form-group">
            <label className="form-label">Temperature Unit</label>
            <select 
              className="input-field"
              value={defaultUnit}
              onChange={e => setDefaultUnit(e.target.value)}
            >
              <option value="f">Fahrenheit (°F)</option>
              <option value="c">Celsius (°C)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Languages size={14} color="var(--brand-primary)" /> {t('settings.language', 'CMS Display Language')}
            </label>
            <select 
              className="input-field"
              value={language}
              onChange={e => setLanguage(e.target.value as any)}
            >
              <option value="en">English (US)</option>
              <option value="es">Español (América Latina / Belize)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Local Timezone</label>
            <select 
              className="input-field"
              value={defaultTimezone}
              onChange={e => setDefaultTimezone(e.target.value)}
            >
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="Europe/London">London (GMT)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ─── SECTION 5: TV & Tablet Application Downloads ─── */}
      <div className="glass-panel" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--foreground)', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <Monitor size={20} color="var(--brand-primary)" />
            TV Player & Tablet App Downloads
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
            Download the app installer files (.apk) to install onto your Smart TVs, Firesticks, and Gate Agent Tablets.
          </p>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: 0 }} />
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* TV Player App Card */}
          <div style={{ padding: '20px', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '14px', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--brand-accent)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Monitor size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--foreground)' }}>TV Screen Player App</h4>
                  <span style={{ fontSize: '11px', color: 'var(--brand-primary)', fontWeight: '700' }}>For Smart TVs & Firesticks</span>
                </div>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>
                Install on Amazon Firesticks, Android TVs, and terminal display hardware. Runs automatically on startup.
              </p>
            </div>
            <a 
              href="/tv-app.apk" 
              download="TropicAir_Signage_TV_Player.apk" 
              className="btn-primary"
              style={{ textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 16px', fontSize: '13px' }}
            >
              <Monitor size={16} /> Download TV Player App (.apk)
            </a>
          </div>

          {/* Tablet Controller App Card */}
          <div style={{ padding: '20px', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '14px', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--brand-accent)', color: 'var(--brand-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Settings size={20} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--foreground)' }}>Gate Tablet Touch App</h4>
                  <span style={{ fontSize: '11px', color: 'var(--brand-secondary)', fontWeight: '700' }}>For Gate & Check-In Staff</span>
                </div>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4', margin: 0 }}>
                Install on gate agent tablets so staff can trigger screen overrides and flight boarding messages.
              </p>
            </div>
            <a 
              href="/tablet-app.apk" 
              download="TropicAir_Tablet_Controller.apk" 
              style={{ background: 'var(--brand-secondary)', color: 'white', border: 'none', textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px 16px', fontSize: '13px', borderRadius: '8px', fontWeight: '700' }}
            >
              <Settings size={16} /> Download Gate Tablet App (.apk)
            </a>
          </div>
        </div>
      </div>

      {/* Floating Save Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', bottom: '24px', zIndex: 10, background: 'var(--card-bg)', border: '1px solid var(--border)', padding: '16px 24px', borderRadius: '14px', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {showSaveToast ? (
            <span style={{ fontSize: '13px', color: '#10B981', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={18} /> {t('settings.saved', 'Settings saved successfully!')}
            </span>
          ) : (
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              {t('settings.save', 'Click save to apply your updated settings.')}
            </span>
          )}
        </div>

        <button className="btn-primary" onClick={handleSave} disabled={isSaving} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Save size={18} />
          {isSaving ? 'Saving Preferences...' : t('settings.save', 'Save All Settings')}
        </button>
      </div>

    </div>
  );
}
