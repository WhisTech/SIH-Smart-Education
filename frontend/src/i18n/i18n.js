import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from './locales/en/translation.json';
import hiTranslation from './locales/hi/translation.json';
import mrTranslation from './locales/mr/translation.json';

const resources = {
  en: { translation: enTranslation },
  hi: { translation: hiTranslation },
  mr: { translation: mrTranslation }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'hi', 'mr'],
    debug: false,
    interpolation: {
      escapeValue: false // React already escapes XSS
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'], // persist in localStorage
      checkWhitelist: true
    }
  });

export default i18n;
