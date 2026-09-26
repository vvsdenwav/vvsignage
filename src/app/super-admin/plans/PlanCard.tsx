'use client';

import React, { useState } from 'react';
import { updatePlan, deletePlan } from '../actions';
import { HardDrive, MonitorPlay, Trash2, Edit2, X, Check, DollarSign } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  maxScreens: number;
  storageLimitMb: number;
  priceUsd: number;
  _count: {
    organizations: number;
  };
}

export function PlanCard({ plan }: { plan: Plan }) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState(plan.name);
  const [maxScreens, setMaxScreens] = useState(plan.maxScreens);
  const [storageLimitMb, setStorageLimitMb] = useState(plan.storageLimitMb);
  const [priceUsd, setPriceUsd] = useState(plan.priceUsd);

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('id', plan.id);
      formData.append('name', name);
      formData.append('maxScreens', String(maxScreens));
      formData.append('storageLimitMb', String(storageLimitMb));
      formData.append('priceUsd', String(priceUsd));
      await updatePlan(formData);
      setIsEditing(false);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to update plan');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (plan._count.organizations > 0) {
      alert('Cannot delete a plan currently in use by organizations.');
      return;
    }
    if (!confirm(`Are you sure you want to delete the plan "${plan.name}"?`)) {
      return;
    }
    setLoading(true);
    try {
      await deletePlan(plan.id);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to delete plan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="workspace-card" style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h3 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--foreground)', margin: 0 }}>{plan.name}</h3>
          <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '14px', color: 'var(--text-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MonitorPlay style={{ width: '16px', height: '16px' }} />
              {plan.maxScreens} screens
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HardDrive style={{ width: '16px', height: '16px' }} />
              {plan.storageLimitMb} MB
            </span>
            <span style={{ fontWeight: '600', color: '#2C6E49' }}>
              ${plan.priceUsd.toFixed(2)}/mo
            </span>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-muted)', textAlign: 'right' }}>
            <div style={{ fontWeight: '700', color: 'var(--foreground)', fontSize: '18px' }}>{plan._count.organizations}</div>
            Orgs Subscribed
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="btn-secondary"
              style={{ padding: '8px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', height: '36px' }}
              title="Edit Plan Tiers & Limits"
            >
              <Edit2 style={{ width: '14px', height: '14px' }} />
              Edit Tier
            </button>

            <button 
              type="button"
              onClick={handleDelete}
              disabled={plan._count.organizations > 0 || loading}
              style={{
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                background: 'transparent',
                cursor: plan._count.organizations > 0 || loading ? 'not-allowed' : 'pointer',
                opacity: plan._count.organizations > 0 || loading ? 0.4 : 1,
                color: '#9B2C2C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={plan._count.organizations > 0 ? 'Cannot delete plan in use' : 'Delete Plan'}
            >
              <Trash2 style={{ width: '18px', height: '18px' }} />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Plan Modal */}
      {isEditing && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setIsEditing(false)}
        >
          <div 
            className="workspace-card"
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '28px',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              background: 'var(--card-bg)',
              boxShadow: 'var(--shadow-lg)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--foreground)', margin: 0 }}>
                Edit Subscription Tier
              </h3>
              <button 
                type="button"
                onClick={() => setIsEditing(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--foreground)', marginBottom: '6px', display: 'block' }}>
                  Plan Name
                </label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  className="input-field" 
                  style={{ height: '40px' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--foreground)', marginBottom: '6px', display: 'block' }}>
                  Max Screens
                </label>
                <input 
                  type="number" 
                  value={maxScreens} 
                  onChange={(e) => setMaxScreens(parseInt(e.target.value, 10))} 
                  required 
                  min={1} 
                  className="input-field" 
                  style={{ height: '40px' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--foreground)', marginBottom: '6px', display: 'block' }}>
                  Storage Limit (MB)
                </label>
                <input 
                  type="number" 
                  value={storageLimitMb} 
                  onChange={(e) => setStorageLimitMb(parseInt(e.target.value, 10))} 
                  required 
                  min={100} 
                  className="input-field" 
                  style={{ height: '40px' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--foreground)', marginBottom: '6px', display: 'block' }}>
                  Price (USD / Month)
                </label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={priceUsd} 
                  onChange={(e) => setPriceUsd(parseFloat(e.target.value))} 
                  required 
                  min={0} 
                  className="input-field" 
                  style={{ height: '40px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <button 
                  type="button" 
                  onClick={() => setIsEditing(false)} 
                  className="btn-secondary"
                  style={{ height: '38px', padding: '0 16px' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="btn-primary"
                  style={{ height: '38px', padding: '0 20px', opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
