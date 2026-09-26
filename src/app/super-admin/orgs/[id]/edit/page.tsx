import React from 'react';
import { prisma } from '@/lib/prisma';
import { updateOrgSettings, resetOrgAdminPassword, deleteOrganization } from '../../../actions';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import CopyCompanyCode from '@/components/CopyCompanyCode';
import EditOrgForm from './EditOrgForm';

export default async function EditOrganizationPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  
  const org = await prisma.organization.findUnique({
    where: { id },
    include: { 
      plan: true,
      _count: {
        select: { screens: true }
      }
    }
  });

  if (!org) {
    redirect('/super-admin');
  }

  const adminUser = await prisma.user.findFirst({
    where: { organizationId: org.id, role: 'ADMIN' },
    select: { username: true }
  });

  const allPlans = await prisma.plan.findMany({
    orderBy: { priceUsd: 'asc' }
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '680px', margin: '0 auto' }}>
      <div>
        <Link 
          href="/super-admin"
          className="btn-secondary"
          style={{ width: 'fit-content', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none', fontSize: '13px' }}
        >
          <ArrowLeft style={{ width: '16px', height: '16px' }} />
          Back to Organizations
        </Link>
      </div>

      <div className="workspace-card" style={{ padding: '32px', borderRadius: '16px', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--foreground)', margin: 0 }}>Plan & Limit Settings</h2>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '6px', display: 'flex', alignItems: 'center' }}>
              {org.name} | Company Code: <CopyCompanyCode code={org.companyCode || org.slug} />
            </div>
          </div>
        </div>
        
        <EditOrgForm org={org} allPlans={allPlans} />
      </div>

      <div className="workspace-card" style={{ padding: '32px', borderRadius: '16px', border: '1px solid rgba(220, 38, 38, 0.3)', backgroundColor: 'rgba(254, 242, 242, 0.4)' }}>
        <div style={{ marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#dc2626', margin: 0 }}>Credential Management</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>View username or force reset the primary admin password for this organization.</p>
        </div>

        <div style={{ marginBottom: '20px', padding: '12px 16px', borderRadius: '8px', backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Admin Login Username</span>
          <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--foreground)', fontFamily: 'monospace', marginTop: '2px', display: 'block' }}>
            {adminUser?.username || 'No ADMIN account found'}
          </span>
        </div>
        
        <form action={async (formData) => {
          'use server';
          const newPassword = formData.get('newPassword') as string;
          await resetOrgAdminPassword(org.id, newPassword);
          redirect('/super-admin');
        }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div>
            <label className="form-label" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--foreground)', marginBottom: '8px', display: 'block' }}>New Admin Password</label>
            <input 
              name="newPassword" 
              type="password"
              required
              minLength={6}
              placeholder="Enter a new secure password"
              className="input-field"
              style={{ height: '44px' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              type="submit" 
              style={{ height: '40px', padding: '0 16px', borderRadius: '8px', border: '1px solid rgba(220, 38, 38, 0.3)', backgroundColor: '#fef2f2', color: '#dc2626', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}
            >
              Reset Password
            </button>
          </div>
        </form>
      </div>

      <div className="workspace-card" style={{ padding: '32px', borderRadius: '16px', border: '1px solid rgba(220, 38, 38, 0.3)', backgroundColor: 'rgba(254, 242, 242, 0.4)' }}>
        <div style={{ marginBottom: '20px', borderBottom: '1px solid rgba(220, 38, 38, 0.2)', paddingBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#dc2626', margin: 0 }}>Danger Zone</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>Permanently delete this organization and all associated data.</p>
        </div>
        
        <form action={async () => {
          'use server';
          await deleteOrganization(org.id);
          redirect('/super-admin');
        }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <button 
              type="submit" 
              style={{ height: '40px', padding: '0 16px', borderRadius: '8px', border: '1px solid rgba(220, 38, 38, 0.8)', backgroundColor: '#dc2626', color: '#ffffff', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}
            >
              Delete Organization
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
