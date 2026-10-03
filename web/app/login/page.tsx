"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Already logged in → go home
  useEffect(() => {
    if (user) router.replace('/');
  }, [user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoading(true);
    setError('');

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      router.push('/');
      router.refresh();
    }
  };

  return (
    <main className="container fade-in" style={{ paddingTop: 80, paddingBottom: 80, maxWidth: 480, margin: '0 auto' }}>
      
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
        <h1 className="text-display">Welcome Back</h1>
        <p className="text-body text-secondary mt-2">
          Log in to manage your tournaments and rankings.
        </p>
      </div>

      <div className="card" style={{ padding: 32 }}>
        {error && (
          <div style={{ padding: 12, backgroundColor: 'rgba(255, 69, 58, 0.1)', color: '#FF453A', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
            {error}
          </div>
        )}
        <form className="flex-col gap-4" onSubmit={handleLogin}>
          
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input 
              type="email" 
              className="input" 
              placeholder="player@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <input 
              type="password" 
              className="input" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: -8, marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="checkbox" style={{ width: 16, height: 16, accentColor: '#3B75DF' }} />
              <span className="text-sm text-secondary">Remember me</span>
            </div>
            <Link href="#" className="text-sm" style={{ color: '#3B75DF', textDecoration: 'none' }}>
              Forgot password?
            </Link>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-lg" 
            style={{ width: '100%', justifyContent: 'center' }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
          
        </form>

        <div className="divider" style={{ margin: '24px 0' }} />
        
        <p className="text-center text-sm text-secondary">
          Don&apos;t have an account? <Link href="/signup" style={{ color: '#3B75DF', fontWeight: 600, textDecoration: 'none' }}>Sign up</Link>
        </p>
      </div>

    </main>
  );
}
