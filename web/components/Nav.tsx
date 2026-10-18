'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { useI18n } from '@/lib/i18n';
import { useState } from 'react';

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const { t } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const links = [
    { href: '/', label: t('nav.discover') },
    { href: '/my-events', label: t('nav.myEvents') },
    { href: '/rankings', label: t('nav.rankings') },
    { href: '/organizer', label: t('nav.organizer') },
  ];

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <>
      {/* ── 1. Top Announcement Bar (WHOOP Inspired) ── */}
      <div className="announcement-bar">
        <span className="announcement-badge">Circuit 2026</span>
        <span className="hide-mobile">Over $50,000 in competitive prizes this season across fighting & shooter titles.</span>
        <Link href="/search" className="announcement-link">
          Explore Circuit →
        </Link>
      </div>

      {/* ── 2. Unified Edge-to-Edge Top Navigation Header (Vercel & Hostinger Inspired) ── */}
      <header className="nav-header">
        <div className="nav-inner">
          {/* Left: Brand Identity */}
          <Link href="/" className="brand-logo" title="Bracket">
            <span className="brand-name-text">Bracket</span>
          </Link>

          {/* Center: Desktop Navigation Links */}
          <nav className="nav-links-center hide-mobile">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-menu-link ${isActive ? 'active' : ''}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right: Search + High-Contrast CTA + User Profile */}
          <div className="nav-actions-right">
            {/* Search Pill Input */}
            <form action="/search" className="nav-search-pill hide-mobile">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input type="text" name="q" placeholder={t('nav.searchPlaceholder') || 'Search tournaments...'} />
              <span className="nav-shortcut-badge">⌘K</span>
            </form>

            {/* Host Tournament Solid Pill Button */}
            <Link href="/create" className="hide-mobile" style={{ textDecoration: 'none' }}>
              <button className="btn btn-primary btn-sm">
                <span>{t('nav.createEvent') || 'Create Event'}</span>
              </button>
            </Link>

            {/* Auth Buttons / User Avatar */}
            {!loading && (
              user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Link href="/profile" title={user.email ?? ''}>
                    <div style={{
                      width: 34, 
                      height: 34, 
                      borderRadius: '50%',
                      background: '#0F172A',
                      color: '#FFFFFF',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      fontSize: 13, 
                      fontWeight: 700,
                      border: '1px solid #E2E8F0',
                    }}>
                      {(user.email?.[0] ?? 'P').toUpperCase()}
                    </div>
                  </Link>

                  <button
                    onClick={handleSignOut}
                    className="btn btn-ghost btn-sm hide-mobile"
                    style={{ fontSize: 13, padding: '0 10px' }}
                  >
                    {t('nav.signOut')}
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="hide-mobile">
                  <Link href="/login" style={{ textDecoration: 'none' }}>
                    <button className="btn btn-ghost btn-sm">
                      {t('nav.logIn')}
                    </button>
                  </Link>
                  <Link href="/signup" style={{ textDecoration: 'none' }}>
                    <button className="btn btn-secondary btn-sm">
                      {t('nav.signUp')}
                    </button>
                  </Link>
                </div>
              )
            )}

            {/* Mobile Quick Search Icon */}
            <Link 
              href="/search" 
              className="show-mobile btn btn-ghost" 
              style={{ padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              aria-label="Search"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text)' }}>
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </Link>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="show-mobile btn btn-ghost"
              style={{ padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              aria-label="Toggle navigation menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {mobileMenuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </>
                ) : (
                  <>
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu (Clean Solid White) */}
        {mobileMenuOpen && (
          <div className="mobile-menu-drawer">
            <form action="/search" style={{ marginBottom: 4 }}>
              <div className="nav-search-pill" style={{ width: '100%' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-muted)' }}>
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input type="text" name="q" placeholder={t('nav.searchPlaceholder') || 'Search tournaments...'} />
              </div>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: pathname === link.href ? '#0F172A' : '#475569',
                    padding: '12px 0',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <Link href="/create" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none', marginTop: 4 }}>
              <button className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                + {t('nav.createEvent') || 'Host Tournament'}
              </button>
            </Link>

            {user ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                <Link href="/profile" onClick={() => setMobileMenuOpen(false)} style={{ textDecoration: 'none' }}>
                  <button className="btn btn-secondary" style={{ width: '100%', padding: '12px' }}>
                    👤 {user.email}
                  </button>
                </Link>
                <button
                  onClick={() => { setMobileMenuOpen(false); handleSignOut(); }}
                  className="btn btn-ghost"
                  style={{ width: '100%', color: 'var(--danger)', padding: '12px' }}
                >
                  {t('nav.signOut')}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} style={{ flex: 1, textDecoration: 'none' }}>
                  <button className="btn btn-secondary" style={{ width: '100%', padding: '12px' }}>
                    {t('nav.logIn')}
                  </button>
                </Link>
                <Link href="/signup" onClick={() => setMobileMenuOpen(false)} style={{ flex: 1, textDecoration: 'none' }}>
                  <button className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                    {t('nav.signUp')}
                  </button>
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* ── 3. Native-App Mobile Bottom Navigation Bar ── */}
      <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
        <Link 
          href="/" 
          className={`mobile-bottom-tab ${pathname === '/' ? 'active' : ''}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
          <span>Discover</span>
        </Link>

        <Link 
          href="/my-events" 
          className={`mobile-bottom-tab ${pathname === '/my-events' ? 'active' : ''}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <span>Events</span>
        </Link>

        <Link 
          href="/create" 
          className={`mobile-bottom-tab ${pathname === '/create' ? 'active' : ''}`}
        >
          <div className="mobile-bottom-fab">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </div>
          <span>Host</span>
        </Link>

        <Link 
          href="/rankings" 
          className={`mobile-bottom-tab ${pathname.startsWith('/rankings') ? 'active' : ''}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
          <span>Rankings</span>
        </Link>

        <Link 
          href={user ? "/profile" : "/login"} 
          className={`mobile-bottom-tab ${pathname === '/profile' || pathname === '/login' ? 'active' : ''}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span>{user ? 'Profile' : 'Sign In'}</span>
        </Link>
      </nav>
    </>
  );
}
