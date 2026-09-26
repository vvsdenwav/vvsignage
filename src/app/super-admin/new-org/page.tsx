import React from 'react';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { NewOrgForm } from './NewOrgForm';

export default async function NewOrganizationPage() {
  const plans = await prisma.plan.findMany({
    orderBy: { priceUsd: 'asc' }
  });

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
        <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--foreground)', marginBottom: '24px', margin: 0 }}>Create New Organization</h2>
        <NewOrgForm plans={plans} />
      </div>
    </div>
  );
}

