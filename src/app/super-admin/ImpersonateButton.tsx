'use client';

import { Users } from 'lucide-react';
import { impersonateOrganization } from './actions';
import { useState } from 'react';

export default function ImpersonateButton({ orgId }: { orgId: string }) {
  const [loading, setLoading] = useState(false);

  const handleImpersonate = async () => {
    setLoading(true);
    try {
      // Set the cookie directly in the browser to avoid Next.js Server Action Set-Cookie race conditions
      document.cookie = `impersonate-org-id=${orgId}; path=/; max-age=86400`;
      window.location.href = '/';
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleImpersonate}
      disabled={loading}
      style={{
        padding: '8px',
        borderRadius: '8px',
        border: 'none',
        background: 'transparent',
        cursor: loading ? 'not-allowed' : 'pointer',
        color: 'var(--blue-600, #2563eb)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: loading ? 0.5 : 1
      }}
      title="Impersonate Tenant"
    >
      <Users style={{ width: '18px', height: '18px' }} />
    </button>
  );
}
