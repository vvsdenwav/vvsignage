import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, ShieldCheck, FileVideo, ListVideo, Filter, RefreshCw, MessageSquare, AlertCircle } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface ApprovalsTabProps {
  onCountChange?: () => void;
}

export function ApprovalsTab({ onCountChange }: ApprovalsTabProps = {}) {
  const { t } = useI18n();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'all'>('PENDING_REVIEW');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchApprovals();
  }, [statusFilter]);

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const url = `/api/approvals${statusFilter !== 'all' ? `?status=${statusFilter}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        setRequests(await res.json());
      }
    } catch (e) {
      console.error('Failed to fetch approvals:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id: string, action: 'approve' | 'reject') => {
    setProcessingId(id);
    try {
      const res = await fetch(`/api/approvals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note: reviewNote })
      });
      if (res.ok) {
        setReviewNote('');
        setSelectedRequest(null);
        await fetchApprovals();
        onCountChange?.();
      } else {
        alert('Failed to process approval.');
      }
    } catch (e) {
      console.error('Approval review error:', e);
      alert('Error updating approval status.');
    } finally {
      setProcessingId(null);
    }
  };

  const pendingCount = requests.filter(r => r.status === 'PENDING_REVIEW').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Banner */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <ShieldCheck size={24} color="var(--brand-primary)" />
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0 }}>{t('approvals.title', 'Content Approval Pipeline')}</h2>
            {pendingCount > 0 && (
              <span style={{ background: '#ef4444', color: 'white', fontSize: '12px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '12px' }}>
                {pendingCount} {t('approvals.pending_filter', 'Pending')}
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-muted)', margin: '6px 0 0 0', fontSize: '14px' }}>
            {t('approvals.sub', 'Review and authorize media uploads and playlist publications before they broadcast to physical displays.')}
          </p>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', background: 'var(--background)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border)' }}>
          {[
            { id: 'PENDING_REVIEW', key: 'approvals.pending_filter', label: 'Pending Review' },
            { id: 'APPROVED', key: 'approvals.approved_filter', label: 'Approved' },
            { id: 'REJECTED', key: 'approvals.rejected_filter', label: 'Rejected' },
            { id: 'all', key: 'approvals.all_filter', label: 'All Requests' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                background: statusFilter === tab.id ? 'var(--brand-primary)' : 'transparent',
                color: statusFilter === tab.id ? 'white' : 'var(--text-muted)',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              {t(tab.key, tab.label)}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Feed */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <RefreshCw size={24} className="animate-spin" />
            <span>Loading approval requests...</span>
          </div>
        ) : requests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={40} color="#10b981" style={{ margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 6px 0', color: 'var(--foreground)' }}>All Clear!</h3>
            <p style={{ margin: 0, fontSize: '14px' }}>There are no items currently in the {statusFilter === 'all' ? '' : statusFilter.toLowerCase().replace('_', ' ')} queue.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {requests.map(req => {
              const isPending = req.status === 'PENDING_REVIEW';
              const isApproved = req.status === 'APPROVED';
              const isRejected = req.status === 'REJECTED';

              return (
                <div
                  key={req.id}
                  style={{
                    padding: '18px 20px',
                    background: 'var(--background)',
                    border: `1px solid ${isPending ? 'rgba(59, 130, 246, 0.3)' : 'var(--border)'}`,
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '20px',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: '280px' }}>
                    {/* Thumbnail */}
                    <div style={{ width: '64px', height: '64px', borderRadius: '10px', overflow: 'hidden', background: 'var(--card-bg)', flexShrink: 0, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {req.thumbnailUrl ? (
                        <img src={req.thumbnailUrl} alt={req.targetName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : req.type === 'playlist' ? (
                        <ListVideo size={28} color="var(--brand-primary)" />
                      ) : (
                        <FileVideo size={28} color="var(--brand-primary)" />
                      )}
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '16px', color: 'var(--foreground)' }}>
                          {req.targetName}
                        </span>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: req.type === 'playlist' ? 'rgba(138, 146, 255, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                          color: req.type === 'playlist' ? 'var(--brand-primary)' : '#38bdf8',
                          textTransform: 'uppercase'
                        }}>
                          {req.type}
                        </span>

                        <span style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          background: isPending ? 'rgba(234, 179, 8, 0.15)' : isApproved ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: isPending ? '#eab308' : isApproved ? '#10b981' : '#ef4444'
                        }}>
                          {req.status.replace('_', ' ')}
                        </span>
                      </div>

                      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Submitted by <strong style={{ color: 'var(--foreground)' }}>{req.submitterName}</strong> on {new Date(req.createdAt).toLocaleString()}
                      </div>

                      {req.reviewedBy && (
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Reviewed by {req.reviewerName} on {new Date(req.reviewedAt).toLocaleString()}
                          {req.reviewNote && <span style={{ fontStyle: 'italic', marginLeft: '6px' }}>— "{req.reviewNote}"</span>}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {isPending && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        onClick={() => handleReview(req.id, 'approve')}
                        disabled={processingId === req.id}
                        style={{
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          padding: '8px 18px',
                          borderRadius: '8px',
                          fontWeight: 'bold',
                          fontSize: '13px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)'
                        }}
                      >
                        <CheckCircle2 size={16} /> {t('btn.approve', 'Approve')}
                      </button>

                      <button
                        onClick={() => {
                          const note = prompt(t('approvals.decision_notes', 'Optional rejection reason / notes for submitter:'));
                          if (note !== null) {
                            setReviewNote(note);
                            handleReview(req.id, 'reject');
                          }
                        }}
                        disabled={processingId === req.id}
                        style={{
                          background: 'rgba(239, 68, 68, 0.12)',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          fontWeight: 'bold',
                          fontSize: '13px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <XCircle size={16} /> {t('btn.reject', 'Reject')}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
