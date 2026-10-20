'use client';

import React from 'react';
import Link from 'next/link';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

interface Props {
  children: React.ReactNode;
  /** Optional label shown in the error card, e.g. "bracket" or "organizer workspace" */
  context?: string;
}

/**
 * Bug #9 fix: React error boundary so that a corrupted stage_data blob,
 * a null-access in match rendering, or any other unexpected JS error shows
 * a friendly fallback UI instead of crashing the whole page.
 */
export class ErrorBoundary extends React.Component<Props, ErrorBoundaryState> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main style={{ paddingTop: 80, paddingBottom: 80, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>
            Something went wrong
            {this.props.context ? ` in the ${this.props.context}` : ''}
          </h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 480, margin: '0 auto 24px', lineHeight: 1.6 }}>
            An unexpected error occurred while rendering this page. This is likely caused by
            corrupted bracket data or a network issue. Try refreshing the page.
          </p>
          {this.state.error && (
            <details
              style={{
                display: 'inline-block',
                textAlign: 'left',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 16px',
                marginBottom: 24,
                maxWidth: 560,
                width: '100%',
              }}
            >
              <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Error details</summary>
              <pre style={{ fontSize: 12, marginTop: 8, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {this.state.error.message}
              </pre>
            </details>
          )}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              className="btn btn-primary"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
            >
              Reload Page
            </button>
            <Link href="/" className="btn btn-secondary">
              ← Back to Home
            </Link>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
