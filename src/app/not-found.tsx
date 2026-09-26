import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', backgroundColor: '#0f172a', color: '#f8fafc' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>404 - Page Not Found</h2>
      <p style={{ color: '#94a3b8', marginTop: '8px' }}>The requested resource or endpoint does not exist.</p>
      <Link href="/" style={{ color: '#38bdf8', marginTop: '16px', fontWeight: '600' }}>Return to Workspace</Link>
    </div>
  );
}
