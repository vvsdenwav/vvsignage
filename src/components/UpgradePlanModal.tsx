'use client';

import React, { useState } from 'react';
import { X, ArrowUpCircle, CheckCircle2, Send, Phone, MessageSquare, Plus, Sparkles } from 'lucide-react';

interface UpgradePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  limitType?: 'screens' | 'storage' | 'users' | 'features';
  currentPlanName?: string;
  maxScreens?: number;
  currentScreensCount?: number;
}

export default function UpgradePlanModal({
  isOpen,
  onClose,
  limitType = 'screens',
  currentPlanName,
  maxScreens,
  currentScreensCount
}: UpgradePlanModalProps) {
  const [requestedCount, setRequestedCount] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/upgrade-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestedType: limitType,
          requestedCount: Number(requestedCount) || 1,
          notes: notes.trim(),
          contactPhone: contactPhone.trim()
        })
      });

      if (res.ok) {
        setIsSubmitted(true);
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Failed to submit request. Please try again.');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Network error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setIsSubmitted(false);
    setErrorMsg(null);
    setNotes('');
    setRequestedCount(1);
    onClose();
  };

  return (
    <aside 
      className="modal-overlay" 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '16px'
      }}
    >
      <section 
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: 'var(--card-bg)',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)'
        }}
      >
        {/* Header */}
        <header 
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div 
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'rgba(2, 132, 199, 0.12)',
                color: 'var(--brand-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 'bold', color: 'var(--foreground)' }}>
                {limitType === 'screens' ? 'Plan Screen Limit Reached' : 'Upgrade Account Plan'}
              </h3>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
                Current plan: <strong style={{ color: 'var(--foreground)' }}>{currentPlanName || 'Standard Tier'}</strong> {maxScreens ? `(${maxScreens} screen max)` : ''}
              </p>
            </div>
          </div>
          <button 
            onClick={handleResetAndClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={18} />
          </button>
        </header>

        {/* Content */}
        <main style={{ padding: '24px' }}>
          {isSubmitted ? (
            <div style={{ textAlign: 'center', padding: '16px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
              <div 
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <CheckCircle2 size={32} />
              </div>
              <h4 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: 'var(--foreground)' }}>
                Upgrade Request Submitted!
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, maxWidth: '380px', lineHeight: 1.5 }}>
                Your request to add <strong>+{requestedCount} screen{requestedCount > 1 ? 's' : ''}</strong> has been sent to Super Admin. We will activate your additional displays and confirm with you shortly.
              </p>
              <button 
                onClick={handleResetAndClose}
                className="btn-primary"
                style={{ marginTop: '12px', padding: '10px 28px' }}
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div 
                style={{
                  padding: '12px 14px',
                  background: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  borderRadius: '10px',
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-start'
                }}
              >
                <div style={{ color: '#d97706', marginTop: '1px' }}>
                  <ArrowUpCircle size={18} />
                </div>
                <div style={{ fontSize: '13px', color: 'var(--foreground)', lineHeight: 1.4 }}>
                  You have active displays utilizing all <strong>{maxScreens || currentScreensCount || 1} of your allowed screen slot{maxScreens === 1 ? '' : 's'}</strong>. Request additional screens below without needing to recreate your organization.
                </div>
              </div>

              {errorMsg && (
                <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '13px', fontWeight: '600' }}>
                  {errorMsg}
                </div>
              )}

              {/* Number of additional screens */}
              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '13px' }}>
                  How many additional screens do you need?
                </label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  {[1, 2, 3, 5].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setRequestedCount(num)}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: `1px solid ${requestedCount === num ? 'var(--brand-primary)' : 'var(--border)'}`,
                        background: requestedCount === num ? 'rgba(2, 132, 199, 0.12)' : 'var(--background)',
                        color: requestedCount === num ? 'var(--brand-primary)' : 'var(--foreground)',
                        fontWeight: '700',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}
                    >
                      +{num} Screen{num > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Or enter exact count:</span>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={requestedCount}
                    onChange={e => setRequestedCount(Math.max(1, parseInt(e.target.value) || 1))}
                    style={{
                      width: '80px',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      background: 'var(--background)',
                      color: 'var(--foreground)',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      textAlign: 'center'
                    }}
                  />
                </div>
              </div>

              {/* Contact phone / WhatsApp */}
              <div>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '13px' }}>
                  <Phone size={14} /> Contact WhatsApp / Phone Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. +501 610-1234 (for instant WhatsApp confirmation)"
                  value={contactPhone}
                  onChange={e => setContactPhone(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px' }}
                />
              </div>

              {/* Note / Message */}
              <div>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '13px' }}>
                  <MessageSquare size={14} /> Notes / Specific Requirements (Optional)
                </label>
                <textarea
                  placeholder="e.g. Setting up a new TV display at the front entrance next Monday."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="input-field"
                  rows={2}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px' }}
                />
              </div>

              <footer style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="btn-secondary"
                  style={{ padding: '10px 18px', borderRadius: '8px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                  style={{
                    padding: '10px 22px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Send size={15} />
                  {isSubmitting ? 'Sending...' : 'Submit Upgrade Request'}
                </button>
              </footer>
            </form>
          )}
        </main>
      </section>
    </aside>
  );
}
