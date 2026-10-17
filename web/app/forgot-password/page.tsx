"use client";

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '../../lib/supabase';

function ForgotPasswordContent() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');

    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || (typeof window !== 'undefined' ? window.location.origin : '');
      const redirectTo = `${siteUrl}/reset-password`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });

      if (resetError) {
        setError(resetError.message);
      } else {
        setSubmitted(true);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container fade-in" style={{ paddingTop: 80, paddingBottom: 80, maxWidth: 480, margin: '0 auto' }}>
      
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔑</div>
        <h1 className="text-display">Reset Password</h1>
        <p className="text-body text-secondary mt-2">
          {submitted 
            ? "Check your email for the recovery link" 
            : "Enter your email address to receive password reset instructions."}
        </p>
      </div>

      <div className="card" style={{ padding: 32 }}>
        {error && (
          <div style={{ padding: 12, backgroundColor: 'rgba(255, 69, 58, 0.1)', color: '#FF453A', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
            {error}
          </div>
        )}

        {submitted ? (
          <div className="flex-col gap-4 text-center">
            <div style={{ 
              padding: 20, 
              backgroundColor: 'rgba(16, 185, 129, 0.1)', 
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: 8, 
              textAlign: 'left' 
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, color: '#10B981', fontWeight: 600 }}>
                <span style={{ fontSize: 18 }}>✓</span> Email Sent
              </div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                We sent a password reset link to <strong style={{ color: 'var(--text)' }}>{email}</strong>. 
                Please click the link in that email to choose a new password.
              </p>
              <p className="text-sm" style={{ color: 'var(--text-muted)', marginTop: 10, fontSize: 12 }}>
                Didn&apos;t receive it? Be sure to check your spam or junk folder, or try resending below.
              </p>
            </div>

            <button 
              type="button" 
              className="btn btn-secondary btn-lg" 
              style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
              onClick={() => {
                setSubmitted(false);
                setError('');
              }}
            >
              Resend to another email
            </button>

            <Link 
              href="/login" 
              className="btn btn-primary btn-lg" 
              style={{ width: '100%', justifyContent: 'center', textDecoration: 'none' }}
            >
              Return to Log In
            </Link>
          </div>
        ) : (
          <form className="flex-col gap-4" onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">Email Address</label>
              <input 
                type="email" 
                className="input" 
                placeholder="player@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-lg" 
              style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
              disabled={loading}
            >
              {loading ? 'Sending link...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <div className="divider" style={{ margin: '24px 0' }} />
        
        <p className="text-center text-sm text-secondary">
          Remember your password? <Link href="/login" style={{ color: '#3B75DF', fontWeight: 600, textDecoration: 'none' }}>Log in</Link>
        </p>
      </div>

    </main>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <main className="container fade-in" style={{ paddingTop: 80, paddingBottom: 80, maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <p className="text-secondary">Loading...</p>
      </main>
    }>
      <ForgotPasswordContent />
    </Suspense>
  );
}
