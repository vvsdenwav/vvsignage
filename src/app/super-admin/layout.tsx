import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { isSuperAdmin } from '@/lib/tenant';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

import { NavTabs } from './components/NavTabs';
import { SuperAdminUserNav } from './components/LogoutButton';
import UpgradeRequestsNotification from './components/UpgradeRequestsNotification';

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || !isSuperAdmin(session)) {
    redirect('/');
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--background)', color: 'var(--foreground)', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif' }}>
      {/* Navbar */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, backgroundColor: 'var(--card-bg)', borderBottom: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '64px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ShieldCheck style={{ width: '24px', height: '24px', color: 'var(--brand-primary)' }} />
              <span style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '-0.02em', color: 'var(--foreground)' }}>
                VVSignage<span style={{ fontWeight: '300', color: 'var(--text-muted)', marginLeft: '8px' }}>| Super Admin</span>
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <UpgradeRequestsNotification />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--foreground)' }}>
                  {session.user?.name || 'Admin'}
                </span>
              </div>
              <SuperAdminUserNav />
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '32px 0' }} className="dashboard-content">
        <NavTabs />
        <main>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
