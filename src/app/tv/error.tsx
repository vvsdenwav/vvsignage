'use client';

import { useEffect } from 'react';

export default function TvError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[TV Error]', error);
    const timer = setTimeout(() => reset(), 10000);
    return () => clearTimeout(timer);
  }, [error, reset]);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', width: '100vw', background: '#000', color: '#fff',
      fontFamily: 'sans-serif', flexDirection: 'column', gap: '16px'
    }}>
      <h2 style={{ fontSize: '24px' }}>TV Display Error</h2>
      <p style={{ color: '#999' }}>Auto-retrying in 10 seconds...</p>
    </div>
  );
}
