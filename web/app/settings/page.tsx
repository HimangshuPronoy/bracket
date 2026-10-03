'use client';

import { useState } from 'react';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇧🇷' },
];

export default function SettingsPage() {
  const [selectedLang, setSelectedLang] = useState('en');
  const [autoDetect, setAutoDetect] = useState(true);

  return (
    <main className="container fade-in" style={{ paddingTop: 40, paddingBottom: 80, maxWidth: 800 }}>
      <div className="page-hero" style={{ paddingBottom: 24 }}>
        <div className="section-tag">Preferences</div>
        <h1 className="text-display">Settings</h1>
        <p className="text-body text-secondary mt-3">
          Manage your account preferences and localization settings.
        </p>
      </div>

      <div className="flex-col gap-6">
        
        <section className="card" style={{ padding: 32 }}>
          <h2 className="text-title mb-2">Localization</h2>
          <p className="text-body text-secondary mb-6">Customize the language and region settings for your platform.</p>
          
          <div className="divider" style={{ margin: '0 0 24px 0' }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h3 className="text-headline">Automatic Detection</h3>
              <p className="text-sm text-secondary">Automatically detect language based on your IP location.</p>
            </div>
            <div 
              onClick={() => setAutoDetect(!autoDetect)}
              style={{ 
                width: 48, height: 28, borderRadius: 14, 
                background: autoDetect ? '#32D74B' : 'var(--border)', 
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

          <div className={autoDetect ? 'opacity-50' : ''} style={{ transition: 'opacity 0.2s', pointerEvents: autoDetect ? 'none' : 'auto' }}>
            <h3 className="text-headline mb-4">Display Language</h3>
            <div className="grid-2">
              {languages.map(lang => (
                <div 
                  key={lang.code}
                  onClick={() => {
                    setSelectedLang(lang.code);
                    if (typeof window !== 'undefined') localStorage.setItem('bracket_lang', lang.code);
                    window.location.reload();
                  }}
                  className={`event-checkbox ${selectedLang === lang.code ? 'selected' : ''}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 20 }}>{lang.flag}</span>
                    <span style={{ fontWeight: 600 }}>{lang.name}</span>
                  </div>
                  <div className="checkbox-mark">
                    {selectedLang === lang.code && '✓'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Account Settings Placeholder */}
        <section className="card" style={{ padding: 32 }}>
          <h2 className="text-title mb-2">Account</h2>
          <p className="text-body text-secondary mb-6">Manage your profile and linked accounts.</p>
          
          <div className="divider" style={{ margin: '0 0 24px 0' }} />
          
          <div className="empty-state" style={{ padding: '24px 0' }}>
            <span style={{ fontSize: 32, opacity: 0.5, marginBottom: 12 }}>👤</span>
            <p className="text-secondary">Please log in to manage your account details.</p>
            <button className="btn btn-secondary mt-4">Log In</button>
          </div>
        </section>

      </div>
    </main>
  );
}
