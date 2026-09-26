'use client';

import { stopImpersonating } from './actions';
import { useState } from 'react';

export default function StopImpersonatingButton() {
  const [loading, setLoading] = useState(false);

  const handleStop = async () => {
    setLoading(true);
    try {
      document.cookie = 'impersonate-org-id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      window.location.href = '/super-admin';
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleStop}
      disabled={loading}
      style={{ 
        background: 'white', 
        color: '#FF4500', 
        border: 'none', 
        padding: '6px 12px', 
        borderRadius: '4px', 
        fontWeight: 'bold', 
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.7 : 1
      }}
    >
      {loading ? 'Stopping...' : 'Stop Impersonating'}
    </button>
  );
}
