import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { ReactNode } from 'react';

export default function ManageBracketLayout({ children }: { children: ReactNode }) {
  return <ErrorBoundary context="organizer command center">{children}</ErrorBoundary>;
}
