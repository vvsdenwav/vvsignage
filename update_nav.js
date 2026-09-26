const fs = require('fs');

let pageContent = fs.readFileSync('src/app/page.tsx', 'utf8');

const navOld = `        <nav style={{ display: 'flex', gap: '32px', height: '100%' }}>
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'media', label: 'Media Library' },
            { id: 'widgets', label: 'Creatives' },
            { id: 'playlists', label: 'Playlists' },
            { id: 'screens', label: 'Screens' },
            { id: 'tv_accounts', label: 'TV Accounts', icon: ShieldCheck },
            { id: 'users', label: 'Users', icon: Users },
          ].map(tab => (
            <button`;

const navNew = `        <nav style={{ display: 'flex', gap: '32px', height: '100%' }}>
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'media', label: 'Media Library', mod: 'media' },
            { id: 'widgets', label: 'Creatives', mod: 'widgets' },
            { id: 'playlists', label: 'Playlists', mod: 'playlists' },
            { id: 'screens', label: 'Screens', mod: 'screens' },
            { id: 'tv_accounts', label: 'TV Accounts', icon: ShieldCheck, mod: 'tv-accounts' },
            { id: 'users', label: 'Users', icon: Users, mod: 'users' },
          ].filter(tab => {
            if ((session?.user as any)?.role === 'ADMIN') return true;
            if (!tab.mod) return true; // Dashboard always visible
            try {
              const perms = JSON.parse((session?.user as any)?.permissions || '[]');
              return perms.includes(tab.mod);
            } catch (e) { return false; }
          }).map(tab => (
            <button`;

pageContent = pageContent.replace(navOld, navNew);
fs.writeFileSync('src/app/page.tsx', pageContent, 'utf8');
console.log('Nav replaced successfully.');
