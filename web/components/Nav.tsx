'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  const links = [
    { href: '/', label: 'Discover', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg> },
    { href: '/my-events', label: 'My Events', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> },
    { href: '/rankings', label: 'Rankings', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg> },
    { href: '/organizer', label: 'Organizer', icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg> },
  ];

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <>
      {/* Sidebar */}
      <nav className="sidebar">
        <Link href="/" className="sidebar-logo" title="Bracket" style={{ textDecoration: 'none', color: 'var(--accent)' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
        </Link>
        <div className="sidebar-nav">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              title={l.label}
              className={`sidebar-link ${pathname === l.href ? 'active' : ''}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {l.icon}
              </div>
              <span className="show-mobile" style={{ fontSize: 10, marginTop: 4, fontWeight: 500 }}>{l.label}</span>
            </Link>
          ))}
        </div>
        
        {/* Bottom utility icons */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <Link href="/settings" title="Settings" style={{ cursor: 'pointer', opacity: 0.5, textDecoration: 'none', color: 'var(--text)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          </Link>
          <span title="Help" style={{ cursor: 'pointer', opacity: 0.5, color: 'var(--text)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          </span>
        </div>
      </nav>

      {/* Topbar */}
      <div className="topbar">
        <div className="hide-mobile" /> {/* Spacer for centering on desktop */}
        <Link href="/" className="show-mobile" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
          Bracket
        </Link>
        <form action="/search" className="topbar-search">
          <span>🔍</span>
          <input type="text" name="q" placeholder="Search tournaments, games..." />
        </form>

        <div className="topbar-actions">
          {user && (
            <Link href="/create" style={{ textDecoration: 'none' }}>
              <button className="btn btn-primary btn-sm" style={{ height: 36, padding: '0 16px', border: 'none' }}>
                <span className="hide-mobile">+ Create Event</span>
                <span className="show-mobile">+</span>
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
                  className="btn btn-ghost btn-sm hide-mobile"
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
