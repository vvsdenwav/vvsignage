'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bell, Sparkles, Check, X, Phone, Mail, ArrowRight, Clock, MonitorPlay, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UpgradeRequestsNotificationProps {
  initialRequests?: any[];
}

export default function UpgradeRequestsNotification({ initialRequests = [] }: UpgradeRequestsNotificationProps) {
  const [requests, setRequests] = useState<any[]>(initialRequests);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'PENDING' | 'ALL'>('PENDING');
  const modalRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch / refresh requests
  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/upgrade-requests');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setRequests(data);
      }
    } catch (e) {
      console.error('Failed to fetch upgrade requests', e);
    }
  };

  useEffect(() => {
    if (requests.length === 0) {
      fetchRequests();
    }
    const interval = setInterval(fetchRequests, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleUpdateStatus = async (id: string, newStatus: 'FULFILLED' | 'DISMISSED') => {
    try {
      const res = await fetch('/api/upgrade-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });

      if (res.ok) {
        setRequests(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
        router.refresh();
      }
    } catch (e) {
      console.error('Failed to update upgrade request status', e);
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'PENDING');
  const displayedRequests = filter === 'PENDING' ? pendingRequests : requests;

  return (
    <div style={{ position: 'relative' }}>
      {/* Top Header Notification Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Plan upgrade and screen requests"
        title={pendingRequests.length > 0 ? `${pendingRequests.length} Pending Screen/Plan Requests` : "Plan Upgrade Requests"}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          border: pendingRequests.length > 0 ? '1px solid rgba(2, 132, 199, 0.4)' : '1px solid var(--border)',
          background: pendingRequests.length > 0 ? 'rgba(2, 132, 199, 0.1)' : 'var(--secondary)',
          color: pendingRequests.length > 0 ? 'var(--brand-primary)' : 'var(--text-muted)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        <Bell size={18} />
        
        {/* Pulsing Badge */}
        {pendingRequests.length > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '18px',
              height: '18px',
              padding: '0 4px',
              borderRadius: '9px',
              background: '#ef4444',
              color: 'white',
              fontSize: '11px',
              fontWeight: '700',
              border: '2px solid var(--card-bg)',
              boxShadow: '0 2px 5px rgba(239, 68, 68, 0.4)',
              animation: 'pulse 2s infinite'
            }}
          >
            {pendingRequests.length}
          </span>
        )}
      </button>

      {/* Floating Modal / Popover Dropdown */}
      {isOpen && (
        <div
          ref={modalRef}
          style={{
            position: 'absolute',
            top: '48px',
            right: 0,
            width: '460px',
            maxWidth: '90vw',
            maxHeight: '80vh',
            backgroundColor: 'var(--card-bg)',
            borderRadius: '14px',
            border: '1px solid var(--border)',
            boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.3)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'fadeIn 0.15s ease-out'
          }}
        >
          {/* Popover Header */}
          <div
            style={{
              padding: '16px 20px',
              background: 'var(--secondary)',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '7px',
                  background: 'var(--brand-primary)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Sparkles size={15} />
              </div>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: '700', margin: 0, color: 'var(--foreground)' }}>
                  Upgrade & Screen Requests
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {pendingRequests.length} pending tenant requests
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', gap: '4px', background: 'var(--card-bg)', padding: '2px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                <button
                  onClick={() => setFilter('PENDING')}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: 'none',
                    background: filter === 'PENDING' ? 'var(--brand-primary)' : 'transparent',
                    color: filter === 'PENDING' ? 'white' : 'var(--text-muted)',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Pending ({pendingRequests.length})
                </button>
                <button
                  onClick={() => setFilter('ALL')}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: 'none',
                    background: filter === 'ALL' ? 'var(--brand-primary)' : 'transparent',
                    color: filter === 'ALL' ? 'white' : 'var(--text-muted)',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  All ({requests.length})
                </button>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Requests Content Scroll Area */}
          <div style={{ overflowY: 'auto', flex: 1, maxHeight: 'calc(80vh - 70px)' }}>
            {displayedRequests.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
                  <Check size={20} />
                </div>
                <strong style={{ display: 'block', color: 'var(--foreground)', marginBottom: '4px' }}>All caught up!</strong>
                No pending upgrade requests.
              </div>
            ) : (
              displayedRequests.map((req: any) => (
                <div
                  key={req.id}
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--border)',
                    backgroundColor: req.status === 'PENDING' ? 'transparent' : 'rgba(0, 0, 0, 0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  {/* Top line: Org & Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <strong style={{ fontSize: '14px', color: 'var(--foreground)' }}>
                        {req.organization?.name || 'Unknown Organization'}
                      </strong>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Plan: <span style={{ fontWeight: '600', color: 'var(--foreground)' }}>{req.organization?.plan?.name || 'Custom'}</span> ({req.organization?._count?.screens || 0} screens)
                      </div>
                    </div>

                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontSize: '10px',
                        fontWeight: '700',
                        background: req.status === 'PENDING' ? '#fef3c7' : req.status === 'FULFILLED' ? '#dcfce7' : 'var(--secondary)',
                        color: req.status === 'PENDING' ? '#92400e' : req.status === 'FULFILLED' ? '#166534' : 'var(--text-muted)',
                        border: `1px solid ${req.status === 'PENDING' ? '#fde68a' : req.status === 'FULFILLED' ? '#bbf7d0' : 'var(--border)'}`
                      }}
                    >
                      {req.status}
                    </span>
                  </div>

                  {/* Requested items callout */}
                  <div
                    style={{
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'rgba(2, 132, 199, 0.08)',
                      border: '1px solid rgba(2, 132, 199, 0.2)',
                      fontSize: '12px',
                      color: 'var(--foreground)'
                    }}
                  >
                    Requested: <strong style={{ color: '#0284c7' }}>+{req.requestedCount} {req.requestedType}</strong>
                    {req.notes && (
                      <div style={{ marginTop: '4px', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                        &ldquo;{req.notes}&rdquo;
                      </div>
                    )}
                  </div>

                  {/* Metadata & Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginTop: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Clock size={11} /> {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                      {req.contactPhone && (
                        <a
                          href={`https://wa.me/${req.contactPhone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#16a34a', textDecoration: 'none', fontWeight: '600' }}
                        >
                          <Phone size={11} /> WhatsApp
                        </a>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Link
                        href={`/super-admin/orgs/${req.organizationId}/edit`}
                        onClick={() => setIsOpen(false)}
                        className="btn-primary"
                        style={{
                          padding: '5px 10px',
                          fontSize: '11px',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          textDecoration: 'none'
                        }}
                      >
                        Fulfill & Price <ArrowRight size={12} />
                      </Link>

                      {req.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(req.id, 'FULFILLED')}
                            title="Mark as Done"
                            style={{
                              padding: '5px 8px',
                              borderRadius: '6px',
                              border: '1px solid #16a34a',
                              background: 'rgba(22, 163, 74, 0.1)',
                              color: '#16a34a',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              fontSize: '11px',
                              fontWeight: '600'
                            }}
                          >
                            <Check size={13} />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(req.id, 'DISMISSED')}
                            title="Dismiss"
                            style={{
                              padding: '5px 8px',
                              borderRadius: '6px',
                              border: '1px solid var(--border)',
                              background: 'transparent',
                              color: 'var(--text-muted)',
                              cursor: 'pointer'
                            }}
                          >
                            <X size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
