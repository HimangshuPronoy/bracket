"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';

export default function SignUpPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Already logged in → go home
  useEffect(() => {
    if (user) router.replace('/');
  }, [user, router]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError('');

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: username,
        }
      }
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else {
      // Account created — go to home (Supabase auto-logs in after signup)
      router.push('/');
      router.refresh();
    }
  };

  return (
    <main className="container fade-in" style={{ paddingTop: 80, paddingBottom: 80, maxWidth: 480, margin: '0 auto' }}>
      
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
        <h1 className="text-display">Create Account</h1>
        <p className="text-body text-secondary mt-2">
          Join Bracket to compete in and organize tournaments.
        </p>
      </div>

      <div className="card" style={{ padding: 32 }}>
        {error && (
          <div style={{ padding: 12, backgroundColor: 'rgba(255, 69, 58, 0.1)', color: '#FF453A', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
            {error}
          </div>
        )}
        <form className="flex-col gap-4" onSubmit={handleSignUp}>
          
          <div className="input-group">
            <label className="input-label">Username / Gamertag</label>
            <input 
              type="text" 
              className="input" 
              placeholder="e.g. Daigo" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

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
              placeholder="Create a strong password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Confirm Password</label>
            <input 
              type="password" 
              className="input" 
              placeholder="Repeat password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-lg mt-4" 
            style={{ width: '100%', justifyContent: 'center' }}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
          
        </form>

        <div className="divider" style={{ margin: '24px 0' }} />
        
        <p className="text-center text-sm text-secondary">
          Already have an account? <Link href="/login" style={{ color: '#3B75DF', fontWeight: 600, textDecoration: 'none' }}>Log in</Link>
        </p>
      </div>

    </main>
  );
}
