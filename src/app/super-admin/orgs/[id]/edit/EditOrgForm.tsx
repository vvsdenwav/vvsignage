'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateOrgSettings } from '../../../actions';
import { MonitorPlay, HardDrive, DollarSign, Check, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface Plan {
  id: string;
  name: string;
  maxScreens: number;
  storageLimitMb: number;
  priceUsd: number;
}

interface EditOrgFormProps {
  org: {
    id: string;
    name: string;
    planId: string | null;
    customMaxScreens: number | null;
    customStorageLimitMb: number | null;
    customPriceUsd: number | null;
    pricePerExtraScreenUsd: number | null;
    apkServerUrl: string | null;
    storageUsedMb: number;
    _count: {
      screens: number;
    };
  };
  allPlans: Plan[];
}

export default function EditOrgForm({ org, allPlans }: EditOrgFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form states
  const [selectedPlanId, setSelectedPlanId] = useState<string>(org.planId || '');
  const selectedPlan = allPlans.find(p => p.id === selectedPlanId);

  // Screen override states
  const [isCustomScreens, setIsCustomScreens] = useState<boolean>(org.customMaxScreens !== null);
  const [customScreens, setCustomScreens] = useState<number>(
    org.customMaxScreens ?? (selectedPlan?.maxScreens || 1)
  );

  // Storage override states
  const [isCustomStorage, setIsCustomStorage] = useState<boolean>(org.customStorageLimitMb !== null);
  const [customStorage, setCustomStorage] = useState<number>(
    org.customStorageLimitMb ?? (selectedPlan?.storageLimitMb || 2000)
  );

  // Pricing override states
  const [pricePerExtraScreen, setPricePerExtraScreen] = useState<number>(
    org.pricePerExtraScreenUsd ?? (selectedPlan && selectedPlan.maxScreens > 0 ? selectedPlan.priceUsd / selectedPlan.maxScreens : 15)
  );
  const [isCustomPrice, setIsCustomPrice] = useState<boolean>(org.customPriceUsd !== null);
  const [customPrice, setCustomPrice] = useState<number>(org.customPriceUsd ?? 0);

  // APK Server URL
  const [apkServerUrl, setApkServerUrl] = useState<string>(org.apkServerUrl || '');

  // Handle plan change
  const handlePlanChange = (newPlanId: string) => {
    setSelectedPlanId(newPlanId);
    const plan = allPlans.find(p => p.id === newPlanId);
    if (plan) {
      if (!isCustomScreens) {
        setCustomScreens(plan.maxScreens);
      }
      if (!isCustomStorage) {
        setCustomStorage(plan.storageLimitMb);
      }
      if (org.pricePerExtraScreenUsd === null && plan.maxScreens > 0) {
        setPricePerExtraScreen(Math.round((plan.priceUsd / plan.maxScreens) * 100) / 100);
      }
    }
  };

  // Dynamic Price Calculations
  const basePrice = selectedPlan ? selectedPlan.priceUsd : 0;
  const baseScreens = selectedPlan ? selectedPlan.maxScreens : 1;
  const effectiveScreens = isCustomScreens ? customScreens : (selectedPlan?.maxScreens || 1);
  const effectiveStorage = isCustomStorage ? customStorage : (selectedPlan?.storageLimitMb || 2000);

  const extraScreensCount = Math.max(0, effectiveScreens - baseScreens);
  const extraScreensCost = extraScreensCount * (pricePerExtraScreen || 0);
  const calculatedTotalUsd = basePrice + extraScreensCost;

  const finalPriceUsd = isCustomPrice ? customPrice : calculatedTotalUsd;
  const finalPriceBzd = finalPriceUsd * 2;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await updateOrgSettings(
        org.id,
        selectedPlanId || '',
        apkServerUrl.trim() || null,
        isCustomScreens ? Number(customScreens) : null,
        isCustomStorage ? Number(customStorage) : null,
        isCustomPrice ? Number(customPrice) : null,
        Number(pricePerExtraScreen) || null
      );
      router.push('/super-admin');
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 1. Base Subscription Tier */}
      <div>
        <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--foreground)', marginBottom: '8px', display: 'block' }}>
          Base Subscription Tier
        </label>
        <select 
          value={selectedPlanId} 
          onChange={(e) => handlePlanChange(e.target.value)}
          className="input-field"
          style={{ height: '44px', cursor: 'pointer', width: '100%', borderRadius: '8px', border: '1px solid var(--border)', padding: '0 12px', background: 'var(--card-bg)', color: 'var(--foreground)' }}
        >
          <option value="">No Base Plan (Fully Custom Limits)</option>
          {allPlans.map((plan) => (
            <option key={plan.id} value={plan.id}>
              {plan.name} — ${plan.priceUsd} USD/mo (${plan.priceUsd * 2} BZD) [{plan.maxScreens} Screen(s), {plan.storageLimitMb} MB]
            </option>
          ))}
        </select>
        {selectedPlan && (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
            Base allowance: <strong>{selectedPlan.maxScreens} screen(s)</strong> and <strong>{selectedPlan.storageLimitMb} MB</strong> storage at <strong>${selectedPlan.priceUsd} USD / ${selectedPlan.priceUsd * 2} BZD</strong>/mo.
          </p>
        )}
      </div>

      {/* 2. Screen Capacity & Dynamic Per-Screen Calculation */}
      <div style={{ padding: '20px', borderRadius: '12px', background: 'var(--secondary, #f8fafc)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MonitorPlay style={{ width: '18px', height: '18px', color: '#0284c7' }} />
            <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--foreground)' }}>Max Screens Capacity</span>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', color: 'var(--foreground)' }}>
            <input 
              type="checkbox" 
              checked={isCustomScreens} 
              onChange={(e) => {
                setIsCustomScreens(e.target.checked);
                if (!e.target.checked && selectedPlan) {
                  setCustomScreens(selectedPlan.maxScreens);
                }
              }}
              style={{ cursor: 'pointer' }}
            />
            <span>Override Plan Limit</span>
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'center' }}>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Allowed Total Screens
            </label>
            <input 
              type="number"
              min={org._count.screens || 1}
              max={999}
              disabled={!isCustomScreens && Boolean(selectedPlan)}
              value={effectiveScreens}
              onChange={(e) => setCustomScreens(Math.max(1, parseInt(e.target.value) || 1))}
              className="input-field"
              style={{ height: '40px', width: '100%', borderRadius: '8px', padding: '0 12px', border: '1px solid var(--border)', background: (!isCustomScreens && Boolean(selectedPlan)) ? 'rgba(0,0,0,0.04)' : 'var(--card-bg)', color: 'var(--foreground)' }}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              Currently active: <strong>{org._count.screens}</strong> screen(s)
            </span>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
              Rate per Extra Screen (USD)
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '10px', top: '10px', fontSize: '13px', color: 'var(--text-muted)' }}>$</span>
              <input 
                type="number"
                step="0.5"
                min="0"
                value={pricePerExtraScreen}
                onChange={(e) => setPricePerExtraScreen(parseFloat(e.target.value) || 0)}
                className="input-field"
                style={{ height: '40px', width: '100%', borderRadius: '8px', paddingLeft: '24px', border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--foreground)' }}
              />
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              = ${(pricePerExtraScreen * 2).toFixed(2)} BZD / extra screen
            </span>
          </div>
        </div>

        {extraScreensCount > 0 && (
          <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '8px', background: '#e0f2fe', color: '#0369a1', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>
              <strong>+{extraScreensCount} Extra Screen(s)</strong> beyond base plan ({baseScreens}) @ ${pricePerExtraScreen}/ea:
            </span>
            <span style={{ fontWeight: '700' }}>+${extraScreensCost.toFixed(2)} USD (+${(extraScreensCost * 2).toFixed(2)} BZD)</span>
          </div>
        )}
      </div>

      {/* 3. Storage Allocation */}
      <div style={{ padding: '20px', borderRadius: '12px', background: 'var(--secondary, #f8fafc)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HardDrive style={{ width: '18px', height: '18px', color: '#eab308' }} />
            <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--foreground)' }}>Media Storage Allowance</span>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', color: 'var(--foreground)' }}>
            <input 
              type="checkbox" 
              checked={isCustomStorage} 
              onChange={(e) => {
                setIsCustomStorage(e.target.checked);
                if (!e.target.checked && selectedPlan) {
                  setCustomStorage(selectedPlan.storageLimitMb);
                }
              }}
              style={{ cursor: 'pointer' }}
            />
            <span>Custom Storage Limit</span>
          </label>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input 
                type="number"
                step="500"
                min="500"
                disabled={!isCustomStorage && Boolean(selectedPlan)}
                value={effectiveStorage}
                onChange={(e) => setCustomStorage(parseInt(e.target.value) || 1000)}
                className="input-field"
                style={{ height: '40px', width: '100%', borderRadius: '8px', padding: '0 12px', border: '1px solid var(--border)', background: (!isCustomStorage && Boolean(selectedPlan)) ? 'rgba(0,0,0,0.04)' : 'var(--card-bg)', color: 'var(--foreground)' }}
              />
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>MB</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              Currently used: <strong>{Math.round(org.storageUsedMb)} MB</strong> ({(effectiveStorage / 1024).toFixed(1)} GB total)
            </span>
          </div>

          {isCustomStorage && (
            <div style={{ display: 'flex', gap: '6px' }}>
              <button type="button" onClick={() => setCustomStorage(c => c + 1000)} style={{ padding: '6px 10px', fontSize: '11px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)', cursor: 'pointer' }}>+1GB</button>
              <button type="button" onClick={() => setCustomStorage(c => c + 5000)} style={{ padding: '6px 10px', fontSize: '11px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)', cursor: 'pointer' }}>+5GB</button>
              <button type="button" onClick={() => setCustomStorage(c => c + 10000)} style={{ padding: '6px 10px', fontSize: '11px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--card-bg)', cursor: 'pointer' }}>+10GB</button>
            </div>
          )}
        </div>
      </div>

      {/* 4. Live Dynamic Billing Summary Card */}
      <div style={{ padding: '20px', borderRadius: '12px', background: '#f0fdf4', border: '1.5px solid #86efac' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign style={{ width: '18px', height: '18px', color: '#16a34a' }} />
            <span style={{ fontSize: '14px', fontWeight: '700', color: '#166534' }}>Monthly Billing Calculation</span>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer', color: '#166534' }}>
            <input 
              type="checkbox" 
              checked={isCustomPrice} 
              onChange={(e) => {
                setIsCustomPrice(e.target.checked);
                if (e.target.checked && customPrice === 0) {
                  setCustomPrice(calculatedTotalUsd);
                }
              }}
              style={{ cursor: 'pointer' }}
            />
            <span>Manual Flat Override</span>
          </label>
        </div>

        {isCustomPrice ? (
          <div>
            <label style={{ fontSize: '12px', color: '#166534', display: 'block', marginBottom: '4px' }}>
              Fixed Negotiated Monthly Price (USD)
            </label>
            <div style={{ position: 'relative', maxWidth: '240px' }}>
              <span style={{ position: 'absolute', left: '10px', top: '10px', fontSize: '13px', color: '#166534' }}>$</span>
              <input 
                type="number"
                step="1"
                min="0"
                value={customPrice}
                onChange={(e) => setCustomPrice(parseFloat(e.target.value) || 0)}
                className="input-field"
                style={{ height: '40px', width: '100%', borderRadius: '8px', paddingLeft: '24px', border: '1px solid #86efac', background: '#ffffff', color: '#166534', fontWeight: '700' }}
              />
            </div>
            <p style={{ fontSize: '12px', color: '#166534', marginTop: '6px' }}>
              Custom price set to: <strong>${customPrice} USD</strong> = <strong>${customPrice * 2} BZD / month</strong>.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#166534', marginBottom: '4px' }}>
                Base Plan ({selectedPlan?.name || 'None'}): <strong>${basePrice.toFixed(2)} USD</strong>
              </div>
              {extraScreensCount > 0 && (
                <div style={{ fontSize: '12px', color: '#166534', marginBottom: '4px' }}>
                  Extra Screens ({extraScreensCount} × ${pricePerExtraScreen}): <strong>+${extraScreensCost.toFixed(2)} USD</strong>
                </div>
              )}
              <div style={{ fontSize: '11px', color: '#15803d', marginTop: '4px' }}>
                Calculated automatically based on <strong>{effectiveScreens} screen(s)</strong>.
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#166534', lineHeight: 1 }}>
                ${finalPriceUsd.toFixed(2)} <span style={{ fontSize: '13px', fontWeight: '600' }}>USD/mo</span>
              </div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#15803d', marginTop: '4px' }}>
                ${finalPriceBzd.toFixed(2)} BZD / month
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Custom APK Server URL */}
      <div>
        <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--foreground)', marginBottom: '4px', display: 'block' }}>Custom APK Server URL</label>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 0, marginBottom: '8px' }}>Optional. Where this organization's Android TVs should look for auto-provisioning APKs.</p>
        <input 
          type="url"
          value={apkServerUrl}
          onChange={(e) => setApkServerUrl(e.target.value)}
          placeholder="https://my-bucket.s3.amazonaws.com"
          className="input-field"
          style={{ height: '44px', width: '100%', borderRadius: '8px', border: '1px solid var(--border)', padding: '0 12px', background: 'var(--card-bg)', color: 'var(--foreground)' }}
        />
      </div>

      {/* Action Buttons */}
      <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <Link 
          href="/super-admin"
          className="btn-secondary"
          style={{ height: '40px', padding: '0 16px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', borderRadius: '8px', border: '1px solid var(--border)' }}
        >
          Cancel
        </Link>
        <button 
          type="submit" 
          disabled={isPending}
          className="btn-primary"
          style={{ height: '40px', padding: '0 20px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          {isPending ? <RefreshCw className="animate-spin" style={{ width: '16px', height: '16px' }} /> : <Check style={{ width: '16px', height: '16px' }} />}
          <span>{isPending ? 'Saving...' : 'Save Settings & Billing'}</span>
        </button>
      </div>

    </form>
  );
}
