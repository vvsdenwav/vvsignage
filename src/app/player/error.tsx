'use client';

import { useEffect } from 'react';

export default function PlayerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Player Error]', error?.message || error);

    // Chunk load failures need a HARD reload (not component reset)
    // because the JS module is missing from memory entirely.
    // The SW will serve the cached version on reload.
    const isChunkError = error?.message?.includes('chunk') || 
                         error?.message?.includes('Loading chunk') ||
                         error?.message?.includes('Failed to load') ||
                         error?.message?.includes('module');

    if (isChunkError) {
      // Trigger SW to re-warm the cache, then reload
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'WARM_CACHE' });
      }
      // Hard reload after a short delay so SW can respond
      const timer = setTimeout(() => window.location.reload(), 2000);
      return () => clearTimeout(timer);
    }

    // For other errors, auto-retry after 10 seconds
    const timer = setTimeout(() => reset(), 10000);
    return () => clearTimeout(timer);
  }, [error, reset]);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', width: '100vw', background: '#000', color: '#fff',
      fontFamily: 'sans-serif', flexDirection: 'column', gap: '16px',
      padding: '32px', textAlign: 'center'
    }}>
      <h2 style={{ fontSize: '24px' }}>Display temporarily unavailable</h2>
      <p style={{ color: '#f87171', fontSize: '14px', maxWidth: '80vw', wordBreak: 'break-word' }}>
        {error?.message || 'Unknown error'}
      </p>
      <p style={{ color: '#999' }}>Auto-retrying in 10 seconds...</p>
    </div>
  );
}
