'use client';

import { useEffect } from 'react';

export default function TabletError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Tablet Error]', error);
    const timer = setTimeout(() => reset(), 10000);
    return () => clearTimeout(timer);
  }, [error, reset]);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', width: '100vw', background: '#000', color: '#fff',
      fontFamily: 'sans-serif', flexDirection: 'column', gap: '16px'
    }}>
      <h2 style={{ fontSize: '24px' }}>Tablet Display Error</h2>
      <p style={{ color: '#999' }}>Auto-retrying in 10 seconds...</p>
    </div>
  );
}
