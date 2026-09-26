'use client';

import React, { useState } from 'react';
import { createOrganization } from '../actions';
import { useRouter } from 'next/navigation';

interface Plan {
  id: string;
  name: string;
  maxScreens: number;
  storageLimitMb: number;
  priceUsd: number;
}

export function NewOrgForm({ plans }: { plans: Plan[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      await createOrganization(formData);
      router.push('/super-admin');
    } catch (error) {
      console.error(error);
      alert('Failed to create organization');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
      <div>
        <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--foreground)', marginBottom: '8px', display: 'block' }}>
          Organization Name
        </label>
        <input required name="name" type="text" placeholder="e.g. Radisson Hotel" className="input-field" style={{ height: '44px' }} />
      </div>

      <div>
        <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--foreground)', marginBottom: '8px', display: 'block' }}>
          URL Slug
        </label>
        <input required name="slug" type="text" placeholder="e.g. radisson" className="input-field" style={{ height: '44px' }} />
      </div>

      <div>
        <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--foreground)', marginBottom: '8px', display: 'block' }}>
          Contact Email
        </label>
        <input required name="contactEmail" type="email" placeholder="admin@hotel.com" className="input-field" style={{ height: '44px' }} />
      </div>

      <div>
        <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--foreground)', marginBottom: '8px', display: 'block' }}>
          Subscription Tier / Plan
        </label>
        <select 
          name="planId" 
          defaultValue=""
          className="input-field" 
          style={{ height: '44px', cursor: 'pointer' }}
        >
          <option value="">No Plan (Unlimited / Custom)</option>
          {plans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name} — ${plan.priceUsd.toFixed(2)}/mo ({plan.maxScreens} screens, {plan.storageLimitMb}MB)
            </option>
          ))}
        </select>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', margin: '4px 0 0 0' }}>
          Assign the billing tier and resource limits for this organization.
        </p>
      </div>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', marginTop: '8px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--foreground)', marginBottom: '16px' }}>First Admin User</h3>
        <div>
          <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--foreground)', marginBottom: '8px', display: 'block' }}>Admin Username</label>
          <input required name="adminUsername" type="text" placeholder="admin_radisson" className="input-field" style={{ height: '44px' }} />
        </div>
        <div style={{ marginTop: '16px' }}>
          <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--foreground)', marginBottom: '8px', display: 'block' }}>Temporary Password</label>
          <input required name="adminPassword" type="password" className="input-field" style={{ height: '44px' }} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
        <button type="button" onClick={() => router.back()} className="btn-secondary" style={{ height: '40px', padding: '0 16px' }}>
          Cancel
        </button>
        <button type="submit" disabled={loading} className="btn-primary" style={{ height: '40px', padding: '0 20px', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Creating...' : 'Create Organization'}
        </button>
      </div>
    </form>
  );
}
