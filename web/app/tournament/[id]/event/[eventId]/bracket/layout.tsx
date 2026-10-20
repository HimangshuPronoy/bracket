import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { ReactNode } from 'react';

export default function BracketLayout({ children }: { children: ReactNode }) {
  return <ErrorBoundary context="bracket viewer">{children}</ErrorBoundary>;
}
