import type { Metadata } from 'next';
import './globals.css';
import Nav from '@/components/Nav';
import { AuthProvider } from '@/lib/AuthContext';
import { I18nProvider } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'Bracket — Tournament Platform',
  description: 'Find, register, and compete in esports tournaments. Track brackets and results in real time.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <I18nProvider>
            <Nav />
            <div className="page-wrapper">{children}</div>
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

