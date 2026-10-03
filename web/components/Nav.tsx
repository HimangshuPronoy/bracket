'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  const links = [
    { href: '/', label: 'Discover', icon: '⚡' },
    { href: '/my-events', label: 'My Events', icon: '📅' },
    { href: '/rankings', label: 'Rankings', icon: '🏆' },
    { href: '/organizer', label: 'Organizer', icon: '📊' },
  ];

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <>
      {/* Sidebar */}
      <nav className="sidebar">
        <Link href="/" className="sidebar-logo">
          ⚡ Bracket
        </Link>
        <div className="sidebar-nav">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={`sidebar-link ${pathname === l.href ? 'active' : ''}`}
            >
              <span>{l.icon}</span> {l.label}
            </Link>
          ))}
        </div>
        
        {/* Bottom utility icons */}
        <div style={{ marginTop: 'auto', display: 'flex', gap: 12, padding: '0 8px' }}>
          <Link href="/settings" style={{ fontSize: 20, cursor: 'pointer', opacity: 0.5, textDecoration: 'none' }}>⚙️</Link>
          <span style={{ fontSize: 20, cursor: 'pointer', opacity: 0.5 }}>❓</span>
        </div>
      </nav>

      {/* Topbar */}
      <div className="topbar">
        <form action="/search" className="topbar-search">
          <span>🔍</span>
          <input type="text" name="q" placeholder="Search tournaments, games..." />
        </form>

        <div className="topbar-actions">
          {user && (
            <Link href="/create" style={{ textDecoration: 'none' }}>
              <button className="btn btn-secondary btn-sm" style={{ height: 36, padding: '0 16px', background: 'var(--text)', color: 'var(--bg)', border: 'none' }}>
                + Create Event
              </button>
            </Link>
          )}
          <div style={{ width: 1, height: 16, background: 'var(--border)' }} />
          {!loading && (
            user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Link href="/profile" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'var(--accent)', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700
                  }}>
                    {(user.email?.[0] ?? '?').toUpperCase()}
                  </div>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="btn btn-ghost btn-sm"
                  style={{ height: 36, padding: '0 12px', opacity: 0.7 }}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                <Link href="/login" style={{ textDecoration: 'none' }}>
                  <button className="btn btn-ghost btn-sm" style={{ height: 36, padding: '0 12px' }}>
                    Log In
                  </button>
                </Link>
                <Link href="/signup" style={{ textDecoration: 'none' }}>
                  <button className="btn btn-secondary btn-sm" style={{ height: 36, padding: '0 16px' }}>
                    Sign Up
                  </button>
                </Link>
              </>
            )
          )}
        </div>
      </div>
    </>
  );
}
