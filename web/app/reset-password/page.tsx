"use client";

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

function ResetPasswordContent() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkRecoverySession = async () => {
      // 1. Check for error in hash (e.g. #error=access_denied&error_description=...)
      if (typeof window !== 'undefined' && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const errorDesc = hashParams.get('error_description') || hashParams.get('error');
        if (errorDesc) {
          if (mounted) {
            setError(decodeURIComponent(errorDesc.replace(/\+/g, ' ')));
            setIsVerifying(false);
          }
          return;
        }
      }

      // 2. Check for PKCE code in query params
      if (typeof window !== 'undefined' && window.location.search) {
        const queryParams = new URLSearchParams(window.location.search);
        const code = queryParams.get('code');
        const queryError = queryParams.get('error_description') || queryParams.get('error');
        if (queryError) {
          if (mounted) {
            setError(decodeURIComponent(queryError.replace(/\+/g, ' ')));
            setIsVerifying(false);
          }
          return;
        }
        if (code) {
          try {
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            if (exchangeError) {
              if (mounted) {
                setError(exchangeError.message);
                setIsVerifying(false);
              }
              return;
            } else {
              if (mounted) {
                setHasValidSession(true);
                setIsVerifying(false);
              }
              return;
            }
          } catch (e: unknown) {
            console.error('Error exchanging code:', e);
          }
        }
      }

      // 3. Check for access_token in hash
      if (typeof window !== 'undefined' && window.location.hash.includes('access_token=')) {
        if (mounted) {
          setHasValidSession(true);
        }
      }

      // 4. Check active session
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) {
        if (session || (typeof window !== 'undefined' && window.location.hash.includes('access_token='))) {
          setHasValidSession(true);
        }
        setIsVerifying(false);
      }
    };

    // Listen for auth state change
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (session && (event === 'SIGNED_IN' || event === 'USER_UPDATED'))) {
        if (mounted) {
          setHasValidSession(true);
          setIsVerifying(false);
        }
      }
    });

    checkRecoverySession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 2500);
    }
  };

  return (
    <main className="container fade-in" style={{ paddingTop: 80, paddingBottom: 80, maxWidth: 480, margin: '0 auto' }}>
      
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h1 className="text-display">Create New Password</h1>
        <p className="text-body text-secondary mt-2">
          Enter your new password below to regain access to your account.
        </p>
      </div>

      <div className="card" style={{ padding: 32 }}>
        {error && (
          <div style={{ padding: 12, backgroundColor: 'rgba(255, 69, 58, 0.1)', color: '#FF453A', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
            {error}
          </div>
        )}

        {isVerifying ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <p className="text-body text-secondary">Verifying reset link...</p>
          </div>
        ) : success ? (
          <div className="flex-col gap-4 text-center">
            <div style={{ 
              padding: 20, 
              backgroundColor: 'rgba(16, 185, 129, 0.1)', 
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: 8, 
              textAlign: 'left' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, color: '#10B981', fontWeight: 600 }}>
                <span style={{ fontSize: 18 }}>✓</span> Password Updated
              </div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Your password has been reset successfully! Redirecting you to Bracket...
              </p>
            </div>

            <Link 
              href="/" 
              className="btn btn-primary btn-lg mt-2" 
              style={{ width: '100%', justifyContent: 'center', textDecoration: 'none' }}
            >
              Continue to Bracket
            </Link>
          </div>
        ) : !hasValidSession && !error ? (
          <div className="flex-col gap-4 text-center">
            <p className="text-body text-secondary" style={{ marginBottom: 12 }}>
              This reset link may be invalid, expired, or has already been used.
            </p>
            <Link 
              href="/forgot-password" 
              className="btn btn-primary btn-lg" 
              style={{ width: '100%', justifyContent: 'center', textDecoration: 'none' }}
            >
              Request a New Reset Link
            </Link>
          </div>
        ) : (
          <form className="flex-col gap-4" onSubmit={handleUpdatePassword}>
            <div className="input-group">
              <label className="input-label">New Password</label>
              <input 
                type="password" 
                className="input" 
                placeholder="At least 6 characters" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="input-group">
              <label className="input-label">Confirm New Password</label>
              <input 
                type="password" 
                className="input" 
                placeholder="Repeat new password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-lg mt-2" 
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={loading}
            >
              {loading ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        )}

        <div className="divider" style={{ margin: '24px 0' }} />
        
        <p className="text-center text-sm text-secondary">
          <Link href="/login" style={{ color: '#3B75DF', fontWeight: 600, textDecoration: 'none' }}>
            ← Back to Log In
          </Link>
        </p>
      </div>

    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <main className="container fade-in" style={{ paddingTop: 80, paddingBottom: 80, maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <p className="text-secondary">Loading...</p>
      </main>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
