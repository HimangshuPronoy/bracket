'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n';

export default function ProfilePage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { t } = useI18n();
  const router = useRouter();

  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ entered: 0, golds: 0, totalWins: 0 });
  const [loading, setLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ display_name: '', handle: '', avatar_url: '' });
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaveLoading(true);
    setSaveError('');
    try {
      const { data, error } = await supabase.from('profiles').upsert({
        id: user.id,
        display_name: editForm.display_name.trim() || null,
        handle: editForm.handle.trim() || null,
        avatar_url: editForm.avatar_url.trim() || null,
        updated_at: new Date().toISOString(),
      }).select().single();

      if (error) throw error;
      setProfile(data);
      setIsEditing(false);
    } catch (err: any) {
      setSaveError(err.message || 'Failed to update profile.');
    } finally {
      setSaveLoading(false);
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
      if (profileData) {
        setProfile(profileData);
        setEditForm({
          display_name: profileData.display_name || '',
          handle: profileData.handle || '',
          avatar_url: profileData.avatar_url || '',
        });
      }

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
      
      {/* ── Premium Hero Header (Clean Light Off-White) ── */}
      <div style={{ position: 'relative', height: 200, width: '100%', overflow: 'hidden', background: '#F8FAFC', borderBottom: '1px solid var(--border)' }} />

      <div className="container" style={{ position: 'relative', marginTop: -90, zIndex: 10, maxWidth: 900 }}>
        
        {/* Main Profile Card (Crisp Solid White) */}
        <div className="card" style={{ 
          padding: '40px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '40px', 
          marginBottom: '32px',
          background: '#FFFFFF',
          border: '1px solid var(--border)',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.08)',
          borderRadius: 'var(--radius-xl)'
        }}>
          {isEditing ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h2 className="text-display" style={{ fontSize: 24, marginBottom: 8 }}>{t('profile.title')}</h2>
              {saveError && (
                <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(255, 69, 58, 0.1)', color: 'var(--danger)', fontSize: 14 }}>
                  {saveError}
                </div>
              )}
              <div className="input-group">
                <label className="input-label">{t('profile.displayName')}</label>
                <input 
                  className="input" 
                  value={editForm.display_name} 
                  onChange={e => setEditForm(p => ({ ...p, display_name: e.target.value }))} 
                />
              </div>
              <div className="input-group">
                <label className="input-label">{t('profile.handle')}</label>
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
                <button onClick={handleSaveProfile} className="btn btn-primary" disabled={saveLoading}>
                  {saveLoading ? t('common.loading') : t('profile.save')}
                </button>
                <button onClick={() => setIsEditing(false)} className="btn btn-ghost" disabled={saveLoading}>{t('common.cancel')}</button>
              </div>
            </div>
          ) : (
            <>
              {/* Avatar */}
              <div style={{ position: 'relative' }}>
                <div style={{ 
                  position: 'relative', width: 140, height: 140, borderRadius: '50%', 
                  background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  fontSize: 56, overflow: 'hidden', border: '3px solid var(--border)',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : '👤'}
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                  <h1 className="text-display" style={{ fontSize: 38, letterSpacing: '-0.02em', margin: 0, color: 'var(--text)' }}>
                    {profile?.display_name || profile?.handle || 'Unknown Player'}
                  </h1>
                  {stats.golds > 0 && (
                    <span className="badge" style={{ background: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A', fontWeight: 700, padding: '4px 10px', fontSize: 12 }}>
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
                    {t('common.edit')}
                  </button>
                  <button onClick={() => { signOut(); router.push('/'); }} className="btn btn-ghost" style={{ color: 'var(--danger)' }}>
                    {t('nav.signOut')}
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
              <div className="card-interactive" style={{ padding: 24, borderRadius: 'var(--radius-xl)', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(59, 117, 223, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, fontSize: 20 }}>
                  🎫
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Tournaments Entered</div>
                <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--text)' }}>{stats.entered}</div>
              </div>

              {/* Stat Card 2 */}
              <div className="card-interactive" style={{ padding: 24, borderRadius: 'var(--radius-xl)', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255, 215, 0, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, fontSize: 20 }}>
                  🥇
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Gold Medals</div>
                <div style={{ fontSize: 36, fontWeight: 700, color: '#F59E0B' }}>{stats.golds}</div>
              </div>

              {/* Stat Card 3 */}
              <div className="card-interactive" style={{ padding: 24, borderRadius: 'var(--radius-xl)', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, fontSize: 20 }}>
                  🔥
                </div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Total Match Wins</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                  <div style={{ fontSize: 48, fontWeight: 700, color: 'var(--success)' }}>{stats.totalWins}</div>
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
