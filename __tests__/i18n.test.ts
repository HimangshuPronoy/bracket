import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';

// Test web i18n
import { SUPPORTED_LANGUAGES, translations } from '../web/lib/i18n';

describe('Web i18n System', () => {
  it('has 10 supported languages', () => {
    assert.equal(SUPPORTED_LANGUAGES.length, 10);
  });

  const expectedSections = [
    'nav',
    'home',
    'tournament',
    'myEvents',
    'rankings',
    'organizer',
    'settings',
    'search',
    'profile',
    'create',
    'common'
  ];

  SUPPORTED_LANGUAGES.forEach(lang => {
    it(`verifies dictionary completeness for language: ${lang.code} (${lang.name})`, () => {
      const dict = translations[lang.code];
      assert.ok(dict, `Missing translation dictionary for ${lang.code}`);

      expectedSections.forEach(section => {
        assert.ok(dict[section], `Missing section "${section}" in language "${lang.code}"`);
        const keys = Object.keys(dict[section]);
        assert.ok(keys.length > 0, `Section "${section}" in "${lang.code}" is empty`);

        // Verify values are non-empty strings
        keys.forEach(k => {
          assert.equal(typeof dict[section][k], 'string', `Key ${section}.${k} is not a string`);
          assert.ok(dict[section][k].trim().length > 0, `Key ${section}.${k} is empty`);
        });
      });
    });
  });

  it('contains consistent keys across all languages matching English structure', () => {
    const enDict = translations.en;
    SUPPORTED_LANGUAGES.forEach(lang => {
      const dict = translations[lang.code];
      expectedSections.forEach(section => {
        const enKeys = Object.keys(enDict[section]).sort();
        const langKeys = Object.keys(dict[section]).sort();
        assert.deepEqual(
          langKeys,
          enKeys,
          `Keys in "${section}" for "${lang.code}" do not match English reference`
        );
      });
    });
  });
});

describe('Mobile i18n System', () => {
  const filePath = path.join(__dirname, '../src/lib/i18n.ts');
  const code = fs.readFileSync(filePath, 'utf8');
  const match = code.match(/const resources = ({[\s\S]*?});\n\n\/\/ Auto-detect/);
  assert.ok(match, 'Failed to extract resources from src/lib/i18n.ts');
  const extractFn = new Function('return ' + match[1]);
  const resources = extractFn();

  const expectedMobileLanguages = [
    'en', 'de', 'nl', 'es', 'ru', 'fr', 'ko', 'ja', 'it', 'pt-PT', 'pt-BR'
  ];

  it('has 11 supported mobile languages', () => {
    assert.deepEqual(Object.keys(resources).sort(), expectedMobileLanguages.sort());
  });

  const enTranslation = resources.en.translation;
  const sections = Object.keys(enTranslation);

  expectedMobileLanguages.forEach(lang => {
    it(`verifies mobile dictionary completeness for language: ${lang}`, () => {
      const langTrans = resources[lang]?.translation;
      assert.ok(langTrans, `Missing translation for mobile language ${lang}`);

      sections.forEach(sec => {
        assert.ok(langTrans[sec], `Missing section "${sec}" in mobile language "${lang}"`);
        const enSubKeys = Object.keys(enTranslation[sec]).sort();
        const langSubKeys = Object.keys(langTrans[sec]).sort();
        assert.deepEqual(
          langSubKeys,
          enSubKeys,
          `Subkeys in "${sec}" for "${lang}" do not match English reference`
        );

        enSubKeys.forEach(k => {
          const val = langTrans[sec][k];
          assert.equal(typeof val, 'string', `Value for ${sec}.${k} in "${lang}" is not string`);
          assert.ok(val.trim().length > 0, `Value for ${sec}.${k} in "${lang}" is empty`);
        });
      });
    });
  });
});

