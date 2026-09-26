import React from 'react';
import { prisma } from '@/lib/prisma';
import { createPlan } from '../actions';
import { Plus } from 'lucide-react';
import { PlanCard } from './PlanCard';

export default async function PlansPage() {
  const plans = await prisma.plan.findMany({
    include: {
      _count: {
        select: { organizations: true }
      }
    },
    orderBy: { priceUsd: 'asc' }
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--foreground)', letterSpacing: '-0.02em', margin: 0 }}>Plans & Pricing</h1>
        <p style={{ marginTop: '4px', fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>Manage subscription tiers, limits, and pricing.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
        <div>
          <div className="workspace-card" style={{ padding: '24px', borderRadius: '14px', border: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--foreground)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Plus style={{ width: '20px', height: '20px', color: 'var(--brand-primary)' }} />
              Create New Plan
            </h2>
            <form action={createPlan} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label">Plan Name</label>
                <input name="name" type="text" required placeholder="e.g. Pro Tier" className="input-field" />
              </div>
              <div>
                <label className="form-label">Max Screens</label>
                <input name="maxScreens" type="number" required placeholder="e.g. 50" className="input-field" />
              </div>
              <div>
                <label className="form-label">Storage Limit (MB)</label>
                <input name="storageLimitMb" type="number" required placeholder="e.g. 5000" className="input-field" />
              </div>
              <div>
                <label className="form-label">Price (USD)</label>
                <input name="priceUsd" type="number" step="0.01" required placeholder="e.g. 99.99" className="input-field" />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                Create Plan
              </button>
            </form>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {plans.map((plan: any) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
          
          {plans.length === 0 && (
            <div className="workspace-card" style={{ padding: '48px', textAlign: 'center', borderRadius: '14px', border: '1px dashed var(--border)' }}>
              <p style={{ color: 'var(--text-muted)', margin: 0 }}>No plans created yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
