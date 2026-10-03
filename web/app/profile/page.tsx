import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Profile — Bracket',
};

export default function ProfilePage() {
  return (
    <main className="container fade-in" style={{ paddingTop: 40, paddingBottom: 80, maxWidth: 800 }}>
      
      {/* Profile Header */}
      <div className="card" style={{ padding: 40, display: 'flex', alignItems: 'center', gap: 32, marginBottom: 32 }}>
        <div style={{ width: 120, height: 120, borderRadius: '50%', background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>
          👤
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h1 className="text-display" style={{ fontSize: 36 }}>Player One</h1>
            <span className="badge badge-accent">PRO</span>
          </div>
          <p className="text-body text-secondary mb-4">
            Joined October 2026 • Tokyo, Japan
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link href="/settings" className="btn btn-secondary btn-sm">Edit Profile</Link>
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--destructive)' }}>Log Out</button>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Linked Accounts */}
        <section className="card" style={{ padding: 32 }}>
          <h2 className="text-title mb-4">Linked Accounts</h2>
          <div className="flex-col gap-4">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 24 }}>🎮</span>
                <span style={{ fontWeight: 600 }}>Steam</span>
              </div>
              <span className="text-sm text-secondary">Connected</span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 24 }}>🐦</span>
                <span style={{ fontWeight: 600 }}>Twitter</span>
              </div>
              <button className="btn btn-secondary btn-sm">Connect</button>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 24 }}>📺</span>
                <span style={{ fontWeight: 600 }}>Twitch</span>
              </div>
              <button className="btn btn-secondary btn-sm">Connect</button>
            </div>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="card" style={{ padding: 32 }}>
          <h2 className="text-title mb-4">Career Stats</h2>
          <div className="flex-col gap-4">
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
              <span className="text-secondary">Tournaments Entered</span>
              <span className="text-headline">14</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
              <span className="text-secondary">Gold Medals</span>
              <span className="text-headline" style={{ color: '#FFD700' }}>3</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
              <span className="text-secondary">Total Earnings</span>
              <span className="text-headline" style={{ color: 'var(--success)' }}>$1,250</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8 }}>
              <Link href="/rankings" style={{ color: '#3B75DF', fontWeight: 600, textDecoration: 'none' }}>
                View Full Rankings →
              </Link>
            </div>
          </div>
        </section>
      </div>

    </main>
  );
}
