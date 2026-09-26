import React from 'react';
import { prisma } from '@/lib/prisma';
import { toggleOrgStatus, impersonateOrganization } from './actions';
import { redirect } from 'next/navigation';
import CopyCompanyCode from '@/components/CopyCompanyCode';
import Link from 'next/link';
import { Building2, DollarSign, HardDrive, MonitorPlay, Plus, Power, Settings2, Users } from 'lucide-react';
import DeleteOrgButton from './DeleteOrgButton';
import ImpersonateButton from './ImpersonateButton';
import { getEffectiveLimits } from '@/lib/tenant';

export default async function SuperAdminPage() {
  const orgs = await prisma.organization.findMany({
    include: {
      plan: true,
      _count: {
        select: { screens: true, users: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const offlineScreensCount = await prisma.screen.count({
    where: {
      OR: [
        { lastPing: { lt: fiveMinutesAgo } },
        { lastPing: null }
      ]
    }
  });

  // Calculate total MRR across all active organizations
  const totalMrrUsd = orgs.reduce((acc: number, org: any) => {
    if (org.status === 'SUSPENDED' || org.status === 'CANCELLED') return acc;
    const limits = getEffectiveLimits(org);
    return acc + limits.effectivePriceUsd;
  }, 0);
  const totalMrrBzd = totalMrrUsd * 2;

  return (
    <div className="space-y-10">
      
      {/* Header Section */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: 'var(--foreground)', letterSpacing: '-0.02em', margin: 0 }}>Organizations</h1>
          <p style={{ marginTop: '4px', fontSize: '14px', color: 'var(--text-muted)', margin: 0 }}>Manage tenants, billing plans, custom screen limits, and dynamic pricing.</p>
        </div>
        <Link 
          href="/super-admin/new-org" 
          className="btn-primary"
          style={{ height: '42px', padding: '0 20px', borderRadius: '8px' }}
        >
          <Plus style={{ width: '16px', height: '16px' }} />
          New Organization
        </Link>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="workspace-card" style={{ padding: '24px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '16px', minHeight: '100px' }}>
          <div style={{ padding: '12px', backgroundColor: 'var(--blue-50, #EEF3FA)', color: 'var(--brand-primary)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)', margin: 0 }}>Total Tenants</p>
            <h3 style={{ fontSize: '26px', fontWeight: '700', color: 'var(--foreground)', marginTop: '4px', margin: 0 }}>{orgs.length}</h3>
          </div>
        </div>
        
        <div className="workspace-card" style={{ padding: '24px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '16px', minHeight: '100px' }}>
          <div style={{ padding: '12px', backgroundColor: '#e6f4f1', color: '#527D78', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MonitorPlay style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)', margin: 0 }}>Active Screens</p>
            <h3 style={{ fontSize: '26px', fontWeight: '700', color: 'var(--foreground)', marginTop: '4px', margin: 0 }}>
              {orgs.reduce((acc: number, org: any) => acc + org._count.screens, 0)}
            </h3>
          </div>
        </div>

        <div className="workspace-card" style={{ padding: '24px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '16px', minHeight: '100px' }}>
          <div style={{ padding: '12px', backgroundColor: 'rgba(22, 163, 74, 0.1)', color: '#16a34a', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DollarSign style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)', margin: 0 }}>Estimated Monthly MRR</p>
            <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#166534', marginTop: '4px', margin: 0 }}>
              ${totalMrrUsd.toFixed(0)} <span style={{ fontSize: '12px', fontWeight: '600' }}>USD (${totalMrrBzd.toFixed(0)} BZD)</span>
            </h3>
          </div>
        </div>

        <div className="workspace-card" style={{ padding: '24px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '16px', minHeight: '100px' }}>
          <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Power style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)', margin: 0 }}>Offline Screens</p>
            <h3 style={{ fontSize: '26px', fontWeight: '700', color: 'var(--foreground)', marginTop: '4px', margin: 0 }}>
              {offlineScreensCount}
            </h3>
          </div>
        </div>

        <div className="workspace-card" style={{ padding: '24px', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '16px', minHeight: '100px' }}>
          <div style={{ padding: '12px', backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#eab308', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HardDrive style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <p style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-muted)', margin: 0 }}>Global Storage Used</p>
            <h3 style={{ fontSize: '26px', fontWeight: '700', color: 'var(--foreground)', marginTop: '4px', margin: 0 }}>
              {Math.round(orgs.reduce((acc: number, org: any) => acc + (org.storageUsedMb || 0), 0))} MB
            </h3>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="workspace-card" style={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid var(--border)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--secondary)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Organization</th>
                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Plan / Rate</th>
                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Screen Limit</th>
                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Storage</th>
                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((org: any) => {
                const limits = getEffectiveLimits(org);
                return (
                  <tr key={org.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.2s' }}>
                    <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '16px', color: 'var(--foreground)' }}>
                          {org.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--foreground)' }}>{org.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', marginTop: '2px' }}>
                            Company Code: <CopyCompanyCode code={org.companyCode || org.slug} />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ display: 'inline-flex', width: 'fit-content', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'var(--secondary)', fontSize: '12px', fontWeight: '600', color: 'var(--foreground)', border: '1px solid var(--border)' }}>
                          {org.plan?.name || 'Custom Plan'}
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: '#16a34a', marginTop: '2px' }}>
                          ${limits.effectivePriceUsd.toFixed(2)} USD <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>(${limits.effectivePriceBzd.toFixed(2)} BZD)</span>
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--foreground)' }}>
                        <MonitorPlay style={{ width: '14px', height: '14px', color: '#0284c7' }} />
                        <span style={{ fontWeight: '700' }}>{org._count.screens}</span>
                        <span style={{ color: 'var(--text-muted)' }}>/</span>
                        <span style={{ fontWeight: '600' }}>{limits.effectiveMaxScreens >= 999 ? '∞' : limits.effectiveMaxScreens} screens</span>
                        {limits.isCustomScreens && (
                          <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: '#e0f2fe', color: '#0369a1', fontWeight: '700' }}>
                            Override
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--foreground)' }}>
                        <HardDrive style={{ width: '14px', height: '14px', color: '#eab308' }} />
                        <span style={{ fontWeight: '700' }}>{Math.round(org.storageUsedMb)}</span>
                        <span style={{ color: 'var(--text-muted)' }}>/</span>
                        <span style={{ fontWeight: '600' }}>{limits.effectiveStorageLimitMb >= 50000 ? '∞' : `${limits.effectiveStorageLimitMb} MB`}</span>
                        {limits.isCustomStorage && (
                          <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: '#fef3c7', color: '#92400e', fontWeight: '700' }}>
                            Override
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                      <span style={{
                        display: 'inline-flex',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: org.status === 'ACTIVE' ? '#EBF5F0' : org.status === 'SUSPENDED' ? '#FCE8E8' : '#FEF3C7',
                        color: org.status === 'ACTIVE' ? '#2C6E49' : org.status === 'SUSPENDED' ? '#9B2C2C' : '#92400E',
                        border: `1px solid ${org.status === 'ACTIVE' ? '#A8D5BA' : org.status === 'SUSPENDED' ? '#F5B5B5' : '#FDE68A'}`
                      }}>
                        {org.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', whiteSpace: 'nowrap', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                        <Link 
                          href={`/super-admin/orgs/${org.id}/edit`}
                          style={{ padding: '8px', borderRadius: '8px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Edit Organization & Custom Limits"
                        >
                          <Settings2 style={{ width: '18px', height: '18px' }} />
                        </Link>
                        <form action={toggleOrgStatus.bind(null, org.id, org.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED')} style={{ display: 'inline' }}>
                          <button 
                            type="submit" 
                            style={{
                              padding: '8px',
                              borderRadius: '8px',
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              color: org.status === 'SUSPENDED' ? '#2C6E49' : '#9B2C2C',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title={org.status === 'SUSPENDED' ? 'Reactivate Tenant' : 'Suspend Tenant'}
                          >
                            <Power style={{ width: '18px', height: '18px' }} />
                          </button>
                        </form>
                        <ImpersonateButton orgId={org.id} />
                        <DeleteOrgButton orgId={org.id} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
