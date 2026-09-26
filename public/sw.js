// VVSignage Service Worker - NoviSign-style offline support
// Bumping version forces SW update and re-caching of all chunks
const CACHE_NAME = 'vvsignage-v9';
const NEXT_STATIC_CACHE = 'vvsignage-static-v9';

// ─────────────────────────────────────────────────────────────
// INSTALL: Skip waiting so new SW takes over immediately
// ─────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Cache the page shells
      try { await cache.add('/player'); } catch(e) {}
      try { await cache.add('/tv'); } catch(e) {}
    }).catch(() => {})
  );
});

// ─────────────────────────────────────────────────────────────
// ACTIVATE: Claim clients + delete old caches + pre-warm chunks
// ─────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    await self.clients.claim();

    // Delete old caches
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map((name) => {
        if (name !== CACHE_NAME && name !== NEXT_STATIC_CACHE) {
          return caches.delete(name);
        }
      })
    );

    // === CRITICAL: Pre-warm ALL Next.js JS chunks ===
    // Fetch the player page HTML, extract every <script src="/_next/..."> and cache them all.
    // This is how we guarantee offline playback works.
    await warmCacheFromPage('/player');
    await warmCacheFromPage('/tv');
  })());
});

async function warmCacheFromPage(pagePath) {
  try {
    const res = await fetch(pagePath, { cache: 'no-cache' });
    if (!res.ok) return;
    const html = await res.text();

    // Cache the page itself
    const pageCache = await caches.open(CACHE_NAME);
    await pageCache.put(pagePath, new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    }));

    // Extract all /_next/static script and CSS URLs
    const scriptUrls = [];
    const scriptRegex = /["'](\/(_next\/static\/[^"']+\.(js|css)))['"]/g;
    let match;
    while ((match = scriptRegex.exec(html)) !== null) {
      scriptUrls.push(match[1]);
    }

    // Also extract inline __NEXT_DATA__ to get buildId
    const buildIdMatch = html.match(/"buildId":"([^"]+)"/);
    const buildId = buildIdMatch ? buildIdMatch[1] : null;

    if (buildId) {
      // Add the build manifest which lists all dynamic chunks
      scriptUrls.push(`/_next/static/${buildId}/_buildManifest.js`);
      scriptUrls.push(`/_next/static/${buildId}/_ssgManifest.js`);
    }

    const staticCache = await caches.open(NEXT_STATIC_CACHE);

    // Fetch and cache all scripts in parallel (silently ignore failures)
    await Promise.allSettled(
      scriptUrls.map(async (url) => {
        try {
          const existing = await staticCache.match(url);
          if (existing) return; // Already cached
          const r = await fetch(url, { cache: 'no-cache' });
          if (r.ok) await staticCache.put(url, r);
        } catch(e) { /* ignore */ }
      })
    );

    // If we got the build manifest, parse it and cache any referenced chunks
    if (buildId) {
      try {
        const manifestRes = await staticCache.match(`/_next/static/${buildId}/_buildManifest.js`);
        if (manifestRes) {
          const manifestText = await manifestRes.text();
          const chunkMatches = manifestText.matchAll(/"([^"]+\.js)"/g);
          const extraUrls = [];
          for (const m of chunkMatches) {
            const chunkUrl = m[1].startsWith('/') ? m[1] : `/_next/static/chunks/${m[1]}`;
            extraUrls.push(chunkUrl);
          }
          await Promise.allSettled(
            extraUrls.map(async (url) => {
              try {
                const existing = await staticCache.match(url);
                if (existing) return;
                const r = await fetch(url, { cache: 'no-cache' });
                if (r.ok) await staticCache.put(url, r);
              } catch(e) {}
            })
          );
        }
      } catch(e) {}
    }
  } catch(e) {
    // Page fetch failed (probably offline during SW install) - silently ignore
  }
}

// ─────────────────────────────────────────────────────────────
// FETCH: Route requests to correct cache strategy
// ─────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // ── A. Next.js static chunks → Cache-First (they're content-hashed, never stale)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(NEXT_STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;

        // Not in cache yet → fetch from network and cache it
        try {
          const networkRes = await fetch(request);
          if (networkRes.ok) {
            cache.put(request, networkRes.clone());
          }
          return networkRes;
        } catch(e) {
          // Offline and not in cache — return empty JS module to prevent crash
          if (url.pathname.endsWith('.js')) {
            return new Response('/* offline-placeholder */(()=>{})();', {
              status: 200,
              headers: { 'Content-Type': 'application/javascript' }
            });
          }
          if (url.pathname.endsWith('.css')) {
            return new Response('/* offline-css */', {
              status: 200,
              headers: { 'Content-Type': 'text/css' }
            });
          }
          return new Response('', { status: 503 });
        }
      })
    );
    return;
  }

  // ── B. API calls → Network-Only (with silent fallback for config)
  if (url.pathname.startsWith('/api/')) {
    // Analytics and sync: skip entirely offline, don't cache
    if (url.pathname.includes('/sync') || url.pathname.includes('/analytics') || url.pathname.includes('/proof-of-play')) {
      event.respondWith(
        fetch(request).catch(() => new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } }))
      );
      return;
    }

    // Config endpoint: Network-first with cache fallback
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          }
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } });
        })
    );
    return;
  }

  // ── C. Page navigations (/player, /tv, /) → Stale-While-Revalidate
  if (request.mode === 'navigate' || url.pathname === '/player' || url.pathname === '/tv') {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);

        // Update in background if we have a cached version
        const networkFetch = fetch(request)
          .then((res) => {
            if (res.ok) cache.put(request, res.clone());
            return res;
          })
          .catch(() => null);

        return cached || await networkFetch || new Response('<html><body>Offline</body></html>', {
          status: 200, headers: { 'Content-Type': 'text/html' }
        });
      })
    );
    return;
  }

  // ── D. Media files (images, videos) → Cache-First
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request, { ignoreVary: true });
      if (cached) {
        // If it's a range request (video/audio buffering), we must return 206 Partial Content
        if (request.headers.has('range')) {
          try {
            const rangeHeader = request.headers.get('range');
            const blob = await cached.blob();
            const total = blob.size;
            const parts = rangeHeader.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : total - 1;
            const chunksize = (end - start) + 1;
            const slicedBlob = blob.slice(start, end + 1);

            return new Response(slicedBlob, {
              status: 206,
              statusText: 'Partial Content',
              headers: {
                'Content-Range': `bytes ${start}-${end}/${total}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize.toString(),
                'Content-Type': cached.headers.get('Content-Type') || 'video/mp4'
              }
            });
          } catch (e) {
            console.error('Failed to slice blob for range request', e);
            return cached; // Fallback to 200 OK
          }
        }
        return cached;
      }

      try {
        const res = await fetch(request);
        if (res.ok && res.status === 200) {
          cache.put(request, res.clone());
        }
        return res;
      } catch(e) {
        return new Response('', { status: 503 });
      }
    })
  );
});

// Listen for messages from the page to manually trigger chunk caching
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'WARM_CACHE') {
    warmCacheFromPage('/player');
    warmCacheFromPage('/tv');
  }
  
  if (event.data && event.data.type === 'EVICT_OLD_MEDIA') {
    const activeUrls = event.data.activeUrls || [];
    event.waitUntil(
      caches.open(CACHE_NAME).then(async (cache) => {
        const requests = await cache.keys();
        for (const req of requests) {
          const url = new URL(req.url);
          // Don't evict core assets
          const isNextStatic = url.pathname.startsWith('/_next/') || url.pathname === '/player' || url.pathname === '/tv';
          const isApi = url.pathname.startsWith('/api/');
          const isStaticAsset = ['/logo.png', '/vsignagelogo.png', '/favicon.ico', '/manifest.json'].includes(url.pathname) || url.pathname.endsWith('.svg');
          
          if (!isNextStatic && !isApi && !isStaticAsset) {
            // Check if the full URL or just the pathname is in the active list
            if (!activeUrls.includes(req.url) && !activeUrls.includes(url.pathname)) {
              await cache.delete(req);
            }
          }
        }
      })
    );
  }
});
