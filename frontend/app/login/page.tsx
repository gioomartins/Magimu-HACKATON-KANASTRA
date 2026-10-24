'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Lock, User, AlertCircle, ShieldCheck } from 'lucide-react'
import { loginApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { LanguageSwitcher } from '@/components/language-switcher'
import { useTranslation } from 'react-i18next'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const { t } = useTranslation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setLoading(true)

    try {
      const data = await loginApi(username, password)
      login(data.token, { username: data.username, role: data.role })
      router.push('/plataforma')
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao realizar login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0B2C20] px-4 py-12 text-[#f8f6f1]">
      {/* Botão de Retorno e Language Switcher */}
      <div className="w-full max-w-md mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 hover:text-white transition"
        >
          <ArrowLeft size={14} />
          <span>{t('common.backToHome')}</span>
        </Link>
        <LanguageSwitcher />
      </div>

      {/* Card de Login Off-White */}
      <div className="w-full max-w-md rounded-2xl bg-[#F8F6F1] p-8 text-stone-900 shadow-2xl sm:p-10">
        <div className="text-center">
          <div className="relative mx-auto h-9 w-32 mb-6">
            <Image
              src="/logo-antecipe-claro.svg"
              alt="Logo Antecipe"
              fill
              priority
              className="object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0B2C20]">
            {t('login.title')}
          </h1>
          <p className="mt-1 text-xs text-stone-600">
            {t('login.subtitle')}
          </p>
        </div>

        {errorMsg && (
          <div className="mt-6 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
            <AlertCircle size={16} className="shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-[11px] font-bold uppercase tracking-wider text-stone-600"
            >
              {t('login.usernameLabel')}
            </label>
            <div className="relative mt-1.5">
              <User size={15} className="absolute left-3.5 top-3.5 text-stone-400" />
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('login.usernamePlaceholder')}
                className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pl-10 pr-4 text-xs font-medium text-stone-800 placeholder-stone-400 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-[11px] font-bold uppercase tracking-wider text-stone-600"
            >
              {t('login.passwordLabel')}
            </label>
            <div className="relative mt-1.5">
              <Lock size={15} className="absolute left-3.5 top-3.5 text-stone-400" />
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('login.passwordPlaceholder')}
                className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pl-10 pr-4 text-xs font-medium text-stone-800 placeholder-stone-400 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex h-12 min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#0B2C20] text-xs font-bold uppercase tracking-wider text-[#F8F6F1] shadow-md transition hover:bg-[#103B2C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50"
          >
            <span>{loading ? t('login.submitting') : t('login.submitButton')}</span>
            <ArrowRight size={15} />
          </button>
        </form>

        <div className="mt-6 border-t border-stone-200 pt-5 text-center text-xs text-stone-600">
          {t('login.noAccount')}{' '}
          <Link
            href="/register"
            className="font-bold text-[#0B2C20] hover:text-emerald-700 transition"
          >
            {t('login.registerLink')}
          </Link>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-2 text-xs text-emerald-200/60">
        <ShieldCheck size={14} className="text-emerald-400" />
        <span>Autenticação segura via JSON Web Token (JWT)</span>
      </div>
    </main>
  )
}
