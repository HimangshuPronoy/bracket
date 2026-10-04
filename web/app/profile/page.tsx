'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ entered: 0, golds: 0, totalWins: 0 });
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ display_name: '', handle: '', avatar_url: '' });

  const handleSaveProfile = async () => {
    if (!user) return;
    const { error } = await supabase.from('profiles').update({
      display_name: editForm.display_name,
      handle: editForm.handle,
      avatar_url: editForm.avatar_url
    }).eq('id', user.id);
    if (!error) {
      setProfile({ ...profile, ...editForm });
      setIsEditing(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    async function fetchData() {
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user!.id).single();
      if (profileData) setProfile(profileData);

      const { count: enteredCount } = await supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('user_id', user!.id);
      const { data: rankingsData } = await supabase.from('rankings').select('placement, wins').eq('user_id', user!.id);

      let golds = 0;
      let totalWins = 0;

      if (rankingsData) {
        rankingsData.forEach(r => {
          if (r.placement === 1) golds++;
          totalWins += (r.wins || 0);
        });
      }

      setStats({ entered: enteredCount || 0, golds, totalWins });
      setLoading(false);
    }

    fetchData();
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <main className="container fade-in" style={{ paddingTop: 120, textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto', width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <p className="text-secondary mt-4">Loading Profile...</p>
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin { to { transform: rotate(360deg); } }
        `}} />
      </main>
    );
  }

  if (!user) return null;

  const joinDate = profile?.created_at ? new Date(profile.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long' }) : 'Unknown';

  return (
    <main className="fade-in" style={{ paddingBottom: 80, minHeight: '100vh', background: 'var(--bg)' }}>
      
      {/* ── Premium Hero Header ── */}
      <div style={{ position: 'relative', height: 280, width: '100%', overflow: 'hidden' }}>
        {/* Dynamic Gradient Background */}
        <div style={{ 
          position: 'absolute', inset: 0, 
          background: 'linear-gradient(135deg, #3B75DF 0%, #7C6EFA 50%, #E83F6F 100%)',
          opacity: 0.85
        }} />
        {/* Glass Overlay */}
        <div style={{ position: 'absolute', inset: 0, backdropFilter: 'blur(20px)', background: 'linear-gradient(to bottom, transparent, var(--bg))' }} />
      </div>

      <div className="container" style={{ position: 'relative', marginTop: -120, zIndex: 10, maxWidth: 900 }}>
        
        {/* Main Profile Card (Glassmorphism) */}
        <div className="card" style={{ 
          padding: '40px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '40px', 
          marginBottom: '32px',
          background: 'rgba(255, 255, 255, 0.03)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
          borderRadius: 'var(--radius-xl)'
        }}>
          {isEditing ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h2 className="text-display" style={{ fontSize: 24, marginBottom: 8 }}>Edit Profile</h2>
              <div className="input-group">
                <label className="input-label">Display Name</label>
                <input 
                  className="input" 
                  value={editForm.display_name} 
                  onChange={e => setEditForm(p => ({ ...p, display_name: e.target.value }))} 
                />
              </div>
              <div className="input-group">
                <label className="input-label">Handle (username)</label>
                <input 
                  className="input" 
                  value={editForm.handle} 
                  onChange={e => setEditForm(p => ({ ...p, handle: e.target.value }))} 
                />
              </div>
              <div className="input-group">
                <label className="input-label">Avatar URL</label>
                <input 
                  className="input" 
                  value={editForm.avatar_url} 
                  onChange={e => setEditForm(p => ({ ...p, avatar_url: e.target.value }))} 
                />
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                <button onClick={handleSaveProfile} className="btn btn-primary">Save Changes</button>
                <button onClick={() => setIsEditing(false)} className="btn btn-ghost">Cancel</button>
              </div>
            </div>
          ) : (
            <>
              {/* Avatar with Glow */}
              <div style={{ position: 'relative' }}>
                <div style={{ 
                  position: 'absolute', inset: -4, background: 'linear-gradient(135deg, #3B75DF, #E83F6F)', borderRadius: '50%', filter: 'blur(12px)', opacity: 0.6 
                }} />
                <div style={{ 
                  position: 'relative', width: 140, height: 140, borderRadius: '50%', 
                  background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  fontSize: 56, overflow: 'hidden', border: '3px solid rgba(255,255,255,0.1)',
                  boxShadow: 'var(--shadow-lg)'
                }}>
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : '👤'}
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                  <h1 className="text-display" style={{ fontSize: 42, letterSpacing: '-0.02em', margin: 0, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                    {profile?.display_name || profile?.handle || 'Unknown Player'}
                  </h1>
                  {stats.golds > 0 && (
                    <span className="badge" style={{ background: 'linear-gradient(90deg, #FFD700, #FDB931)', color: '#000', fontWeight: 800, padding: '6px 12px', fontSize: 13, boxShadow: '0 4px 12px rgba(255, 215, 0, 0.3)' }}>
                      CHAMPION
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 24, fontWeight: 500 }}>
                  Joined {joinDate} {profile?.handle ? <span style={{ color: 'var(--text)', marginLeft: 8 }}>@{profile.handle}</span> : ''}
                </p>
                <div style={{ display: 'flex', gap: 16 }}>
                  <button onClick={() => { 
                    setEditForm({ display_name: profile?.display_name || '', handle: profile?.handle || '', avatar_url: profile?.avatar_url || '' });
                    setIsEditing(true); 
                  }} className="btn btn-secondary">
                    Edit Profile
                  </button>
                  <button onClick={() => { signOut(); router.push('/'); }} className="btn btn-ghost" style={{ color: 'var(--danger)' }}>
                    Log Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 32, alignItems: 'center', width: '100%' }}>
          
          {/* Career Stats Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%' }}>
            <h2 className="text-display" style={{ fontSize: 28, marginBottom: 8 }}>Career Stats</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
              {/* Stat Card 1 */}
              <div className="card-interactive" style={{ padding: 24, borderRadius: 'var(--radius-xl)', background: 'linear-gradient(to bottom right, var(--bg-surface), var(--bg))', border: '1px solid var(--border)' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(59, 117, 223, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, fontSize: 20 }}>
                  🎫
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Tournaments Entered</div>
                <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>{stats.entered}</div>
              </div>

              {/* Stat Card 2 */}
              <div className="card-interactive" style={{ padding: 24, borderRadius: 'var(--radius-xl)', background: 'linear-gradient(to bottom right, var(--bg-surface), var(--bg))', border: '1px solid var(--border)' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255, 215, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, fontSize: 20 }}>
                  🥇
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Gold Medals</div>
                <div style={{ fontSize: 36, fontWeight: 800, color: '#FFD700', fontFamily: 'var(--font-display)', textShadow: '0 0 20px rgba(255, 215, 0, 0.3)' }}>{stats.golds}</div>
              </div>

              {/* Stat Card 3 */}
              <div className="card-interactive" style={{ padding: 24, borderRadius: 'var(--radius-xl)', background: 'linear-gradient(to bottom right, var(--bg-surface), var(--bg))', border: '1px solid var(--border)' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(50, 215, 75, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, fontSize: 20 }}>
                  🔥
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Total Match Wins</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                  <div style={{ fontSize: 48, fontWeight: 800, color: 'var(--success)', fontFamily: 'var(--font-display)', textShadow: '0 0 24px rgba(50, 215, 75, 0.3)' }}>{stats.totalWins}</div>
                </div>
              </div>
            </div>

            <Link href="/rankings" className="btn btn-primary mt-6" style={{ alignSelf: 'flex-start', padding: '0 32px', height: 48, fontSize: 16 }}>
              View Global Rankings →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
