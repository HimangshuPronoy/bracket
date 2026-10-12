'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/AuthContext';
import { useI18n, SUPPORTED_LANGUAGES } from '@/lib/i18n';

export default function SettingsPage() {
  const { user } = useAuth();
  const { language, setLanguage, autoDetect, setAutoDetect, t } = useI18n();

  return (
    <main className="container fade-in" style={{ paddingTop: 40, paddingBottom: 80, maxWidth: 800 }}>
      <div className="page-hero" style={{ paddingBottom: 24 }}>
        <div className="section-tag">{t('settings.preferences')}</div>
        <h1 className="text-display">{t('settings.settings')}</h1>
        <p className="text-body text-secondary mt-3">
          {t('settings.settingsDesc')}
        </p>
      </div>

      <div className="flex-col gap-6">
        
        {/* Localization Section */}
        <section className="card" style={{ padding: 32 }}>
          <h2 className="text-title mb-2">{t('settings.localization')}</h2>
          <p className="text-body text-secondary mb-6">{t('settings.localizationDesc')}</p>
          
          <div className="divider" style={{ margin: '0 0 24px 0' }} />

          {/* Automatic Detection Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h3 className="text-headline">{t('settings.autoDetect')}</h3>
              <p className="text-sm text-secondary">{t('settings.autoDetectDesc')}</p>
            </div>
            <div 
              onClick={() => setAutoDetect(!autoDetect)}
              style={{ 
                width: 48, height: 28, borderRadius: 14, 
                background: autoDetect ? 'var(--accent)' : 'var(--border)', 
                position: 'relative', cursor: 'pointer', transition: 'background 0.2s'
              }}
            >
              <div style={{ 
                position: 'absolute', top: 2, bottom: 2, left: autoDetect ? 22 : 2, 
                width: 24, background: '#fff', borderRadius: '50%',
                transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
              }} />
            </div>
          </div>

          {/* Language Selector Grid */}
          <div>
            <h3 className="text-headline mb-4">{t('settings.displayLang')}</h3>
            <div className="grid-2">
              {SUPPORTED_LANGUAGES.map(lang => (
                <div 
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`event-checkbox ${language === lang.code ? 'selected' : ''}`}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 20 }}>{lang.flag}</span>
                    <span style={{ fontWeight: 600 }}>{lang.name}</span>
                  </div>
                  <div className="checkbox-mark">
                    {language === lang.code && '✓'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Account Settings */}
        <section className="card" style={{ padding: 32 }}>
          <h2 className="text-title mb-2">{t('settings.account')}</h2>
          <p className="text-body text-secondary mb-6">{t('settings.accountDesc')}</p>
          
          <div className="divider" style={{ margin: '0 0 24px 0' }} />
          
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                  {t('settings.signedInAs')}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                  {user.email}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <Link href="/profile" className="btn btn-secondary">
                  {t('settings.manageProfile')}
                </Link>
              </div>
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              <span style={{ fontSize: 32, opacity: 0.5, marginBottom: 12 }}>👤</span>
              <p className="text-secondary">{t('settings.accountEmpty')}</p>
              <Link href="/login" className="btn btn-secondary mt-4" style={{ display: 'inline-flex' }}>
                {t('settings.login')}
              </Link>
            </div>
          )}
        </section>

      </div>
    </main>
  );
}
