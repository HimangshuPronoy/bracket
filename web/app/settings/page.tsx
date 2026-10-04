'use client';

import { useState, useEffect } from 'react';

const translations: Record<string, Record<string, string>> = {
  en: {
    preferences: 'Preferences',
    settings: 'Settings',
    settingsDesc: 'Manage your account preferences and localization settings.',
    localization: 'Localization',
    localizationDesc: 'Customize the language and region settings for your platform.',
    autoDetect: 'Automatic Detection',
    autoDetectDesc: 'Automatically detect language based on your IP location.',
    displayLang: 'Display Language',
    account: 'Account',
    accountDesc: 'Manage your profile and linked accounts.',
    accountEmpty: 'Please log in to manage your account details.',
    login: 'Log In',
  },
  nl: {
    preferences: 'Voorkeuren',
    settings: 'Instellingen',
    settingsDesc: 'Beheer uw accountvoorkeuren en lokalisatie-instellingen.',
    localization: 'Lokalisatie',
    localizationDesc: 'Pas de taal- en regio-instellingen voor uw platform aan.',
    autoDetect: 'Automatische detectie',
    autoDetectDesc: 'Detecteer automatisch de taal op basis van uw IP-locatie.',
    displayLang: 'Weergavetaal',
    account: 'Account',
    accountDesc: 'Beheer uw profiel en gekoppelde accounts.',
    accountEmpty: 'Log in om uw accountgegevens te beheren.',
    login: 'Inloggen',
  },
  de: {
    preferences: 'Präferenzen',
    settings: 'Einstellungen',
    settingsDesc: 'Verwalten Sie Ihre Kontopräferenzen und Lokalisierungseinstellungen.',
    localization: 'Lokalisierung',
    localizationDesc: 'Passen Sie die Sprach- und Regionseinstellungen für Ihre Plattform an.',
    autoDetect: 'Automatische Erkennung',
    autoDetectDesc: 'Sprache automatisch anhand Ihrer IP-Adresse erkennen.',
    displayLang: 'Anzeigesprache',
    account: 'Konto',
    accountDesc: 'Verwalten Sie Ihr Profil und verknüpfte Konten.',
    accountEmpty: 'Bitte melden Sie sich an, um Ihre Kontodetails zu verwalten.',
    login: 'Anmelden',
  },
  es: {
    preferences: 'Preferencias',
    settings: 'Configuración',
    settingsDesc: 'Administre sus preferencias de cuenta y configuración de localización.',
    localization: 'Localización',
    localizationDesc: 'Personalice la configuración de idioma y región para su plataforma.',
    autoDetect: 'Detección automática',
    autoDetectDesc: 'Detectar idioma automáticamente según su ubicación IP.',
    displayLang: 'Idioma de visualización',
    account: 'Cuenta',
    accountDesc: 'Administre su perfil y cuentas vinculadas.',
    accountEmpty: 'Inicie sesión para administrar los detalles de su cuenta.',
    login: 'Iniciar sesión',
  },
};

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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedLang = localStorage.getItem('bracket_lang');
      if (storedLang) setSelectedLang(storedLang);
      const storedAuto = localStorage.getItem('bracket_autodetect');
      if (storedAuto !== null) setAutoDetect(storedAuto === 'true');
    }
  }, []);

  const t = translations[selectedLang] || translations.en;

  return (
    <main className="container fade-in" style={{ paddingTop: 40, paddingBottom: 80, maxWidth: 800 }}>
      <div className="page-hero" style={{ paddingBottom: 24 }}>
        <div className="section-tag">{t.preferences}</div>
        <h1 className="text-display">{t.settings}</h1>
        <p className="text-body text-secondary mt-3">
          {t.settingsDesc}
        </p>
      </div>

      <div className="flex-col gap-6">
        
        <section className="card" style={{ padding: 32 }}>
          <h2 className="text-title mb-2">{t.localization}</h2>
          <p className="text-body text-secondary mb-6">{t.localizationDesc}</p>
          
          <div className="divider" style={{ margin: '0 0 24px 0' }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h3 className="text-headline">{t.autoDetect}</h3>
              <p className="text-sm text-secondary">{t.autoDetectDesc}</p>
            </div>
            <div 
              onClick={() => {
                const newVal = !autoDetect;
                setAutoDetect(newVal);
                if (typeof window !== 'undefined') localStorage.setItem('bracket_autodetect', String(newVal));
              }}
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

          <div style={{ opacity: autoDetect ? 0.5 : 1, transition: 'opacity 0.2s', pointerEvents: autoDetect ? 'none' : 'auto' }}>
            <h3 className="text-headline mb-4">{t.displayLang}</h3>
            <div className="grid-2">
              {languages.map(lang => (
                <div 
                  key={lang.code}
                  onClick={() => {
                    setSelectedLang(lang.code);
                    if (typeof window !== 'undefined') localStorage.setItem('bracket_lang', lang.code);
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
          <h2 className="text-title mb-2">{t.account}</h2>
          <p className="text-body text-secondary mb-6">{t.accountDesc}</p>
          
          <div className="divider" style={{ margin: '0 0 24px 0' }} />
          
          <div className="empty-state" style={{ padding: '24px 0' }}>
            <span style={{ fontSize: 32, opacity: 0.5, marginBottom: 12 }}>👤</span>
            <p className="text-secondary">{t.accountEmpty}</p>
            <button className="btn btn-secondary mt-4">{t.login}</button>
          </div>
        </section>

      </div>
    </main>
  );
}
