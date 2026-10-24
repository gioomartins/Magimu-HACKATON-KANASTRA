'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-stone-200/80 bg-white/70 px-2.5 text-xs font-bold text-stone-700 dark:border-emerald-500/20 dark:bg-[#103b2c] dark:text-emerald-100">
        <Globe size={13} className="text-emerald-500" />
        <span className="text-[11px]">PT</span>
      </div>
    )
  }

  // Normaliza idioma atual para 'pt' ou 'en'
  const currentLang = i18n.language && i18n.language.startsWith('en') ? 'en' : 'pt'

  const toggleLanguage = () => {
    const nextLang = currentLang === 'pt' ? 'en' : 'pt-BR'
    i18n.changeLanguage(nextLang)
    if (typeof window !== 'undefined') {
      localStorage.setItem('i18nextLng', nextLang)
    }
  }

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-stone-200/80 bg-white/80 px-2.5 text-xs font-bold text-stone-700 shadow-xs transition hover:bg-stone-100 hover:border-emerald-500/40 dark:border-emerald-500/25 dark:bg-[#103b2c] dark:text-emerald-100 dark:hover:bg-[#154635] dark:hover:border-emerald-400/40"
      title={currentLang === 'pt' ? 'Mudar idioma para English' : 'Change language to Português'}
      aria-label="Alternar Idioma / Switch Language"
    >
      <Globe size={13} className="text-emerald-600 dark:text-emerald-400" />
      <span className="flex items-center gap-1 font-mono text-[11px] font-extrabold uppercase tracking-wider">
        <span className={currentLang === 'pt' ? 'text-emerald-700 dark:text-emerald-300' : 'text-stone-400 dark:text-emerald-100/40'}>
          PT
        </span>
        <span className="text-stone-300 dark:text-emerald-600/60">/</span>
        <span className={currentLang === 'en' ? 'text-emerald-700 dark:text-emerald-300' : 'text-stone-400 dark:text-emerald-100/40'}>
          EN
        </span>
      </span>
    </button>
  )
}
