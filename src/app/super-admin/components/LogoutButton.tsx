'use client';

import React from 'react';
import { signOut } from 'next-auth/react';
import { LogOut, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export function SuperAdminUserNav() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <Link
        href="/"
        className="btn-secondary"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          fontSize: '12px',
          textDecoration: 'none',
          height: '32px'
        }}
        title="Return to Main CMS Dashboard"
      >
        <ArrowLeft size={14} />
        Main CMS
      </Link>

      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          fontSize: '12px',
          fontWeight: '600',
          borderRadius: '8px',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          background: 'rgba(239, 68, 68, 0.08)',
          color: '#ef4444',
          cursor: 'pointer',
          height: '32px',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.18)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)')}
        title="Sign Out of Super Admin"
      >
        <LogOut size={14} />
        Sign Out
      </button>
    </div>
  );
}
