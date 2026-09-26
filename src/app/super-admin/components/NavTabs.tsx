'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function NavTabs() {
  const pathname = usePathname();

  // Hide top sub-navigation on edit, new-org, or deep sub-pages
  const isTopLevelTab = pathname === '/super-admin' || pathname === '/super-admin/plans';
  if (!isTopLevelTab) return null;

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto 24px auto', padding: '0 24px' }}>
      <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--border)' }}>
        <Link 
          href="/super-admin" 
          style={{
            paddingBottom: '12px',
            fontSize: '14px',
            fontWeight: '600',
            borderBottom: pathname === '/super-admin' ? '2px solid var(--brand-primary)' : '2px solid transparent',
            color: pathname === '/super-admin' ? 'var(--brand-primary)' : 'var(--text-muted)',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s ease'
          }}
        >
          Organizations
        </Link>
        <Link 
          href="/super-admin/plans" 
          style={{
            paddingBottom: '12px',
            fontSize: '14px',
            fontWeight: '600',
            borderBottom: pathname.includes('/super-admin/plans') ? '2px solid var(--brand-primary)' : '2px solid transparent',
            color: pathname.includes('/super-admin/plans') ? 'var(--brand-primary)' : 'var(--text-muted)',
            textDecoration: 'none',
            whiteSpace: 'nowrap',
            transition: 'all 0.2s ease'
          }}
        >
          Plans & Pricing
        </Link>
      </div>
    </div>
  );
}
