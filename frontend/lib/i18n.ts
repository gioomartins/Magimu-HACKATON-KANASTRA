'use client'

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import ptCommon from '@/locales/pt/common.json'
import enCommon from '@/locales/en/common.json'

const resources = {
  'pt-BR': {
    translation: ptCommon,
  },
  pt: {
    translation: ptCommon,
  },
  en: {
    translation: enCommon,
  },
}

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: 'pt-BR',
      lng: typeof window !== 'undefined' ? localStorage.getItem('i18nextLng') || 'pt-BR' : 'pt-BR',
      debug: false,
      interpolation: {
        escapeValue: false, // React already escapes values
      },
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
        lookupLocalStorage: 'i18nextLng',
      },
    })
}

export default i18n
