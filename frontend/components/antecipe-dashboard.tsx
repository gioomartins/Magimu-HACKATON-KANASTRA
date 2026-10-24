'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BarChart3, Building2, LogOut, RefreshCw, Sparkles, User, Wallet } from 'lucide-react'
import { TabelaCedente } from './tabela-cedente'
import { DashboardFundo } from './dashboard-fundo'
import { UploadLoteCsv } from './upload-lote-csv'
import { ThemeToggle } from './theme-toggle'
import { useAuth } from '@/lib/auth-context'
import { useTranslation } from 'react-i18next'
import { DEMO_CEDENTE_USER, DEMO_FUNDO_USER } from '@/lib/demo-data'

export function AntecipeDashboard() {
  const router = useRouter()
  const { t } = useTranslation()
  const { user, isDemo, isLoading, loginDemo, logout } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Se o usuário não estiver autenticado e não estiver em processo de logout, redireciona para login
  useEffect(() => {
    if (!isLoading && !user && !isLoggingOut) {
      router.push('/login')
    }
  }, [user, isLoading, isLoggingOut, router])

  const handleLogout = () => {
    setIsLoggingOut(true)
    logout()
    router.push('/')
  }

  if (isLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8f6f1] text-[#0b2c20] dark:bg-[#0b2c20] dark:text-[#f8f6f1]">
        <div className="flex items-center gap-3 text-sm">
          <RefreshCw className="animate-spin text-emerald-500" size={18} />
          <span>{isLoggingOut ? t('common.loggingOut') : t('common.checkingAuth')}</span>
        </div>
      </main>
    )
  }

  // Separação estrita de facetas:
  // - Usuário GESTOR acessa exclusivamente a Área dos Fundos.
  // - Usuário EMPRESA acessa exclusivamente a Área dos Cedentes.
  const isGestor = user.role === 'GESTOR'

  return (
    <main id="conteudo-principal" className="min-h-screen bg-[#f8f6f1] text-stone-900 transition-colors duration-200 dark:bg-[#0b2c20] dark:text-stone-100">
      {/* Banner de Demonstração em Memória */}
      {(isDemo || user.username.startsWith('demo_')) && (
        <div className="bg-emerald-700 px-4 py-2 text-center text-xs font-semibold text-emerald-50 shadow-sm">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <Sparkles size={14} className="text-emerald-200" />
              <span>{t('nav.demoBanner')}</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-emerald-200">{t('nav.togglePreview')}</span>
              <button
                type="button"
                onClick={() => loginDemo(DEMO_CEDENTE_USER)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-bold uppercase transition ${
                  !isGestor ? 'bg-white text-emerald-900 shadow-xs' : 'bg-emerald-800/80 text-emerald-200 hover:bg-emerald-800'
                }`}
              >
                {t('common.appName') === 'Antecipe' && isGestor ? 'Cedente' : 'Cedente'}
              </button>
              <button
                type="button"
                onClick={() => loginDemo(DEMO_FUNDO_USER)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-bold uppercase transition ${
                  isGestor ? 'bg-white text-emerald-900 shadow-xs' : 'bg-emerald-800/80 text-emerald-200 hover:bg-emerald-800'
                }`}
              >
                Fundo
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-8 lg:px-12 lg:py-8">
        {/* Barra Superior / Header */}
        <header className="mb-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-800 dark:text-emerald-300/80">
              <span className="size-2 rounded-full bg-emerald-500 dark:bg-emerald-400" /> {t('nav.platformKanastra')}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-[#0b2c20] dark:text-[#f8f6f1] sm:text-4xl">
                Antecipe<span className="text-emerald-500 dark:text-emerald-400">.</span>
              </h1>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-800/20 bg-emerald-900/10 px-3 py-1 text-xs font-semibold text-emerald-900 transition hover:bg-emerald-900/20 dark:border-emerald-300/20 dark:bg-[#103b2c] dark:text-emerald-200 dark:hover:bg-[#164c39]"
                title={t('common.backToHome')}
              >
                <ArrowLeft size={13} />
                <span>{t('common.home')}</span>
              </Link>
            </div>
            <p className="mt-1 text-xs text-stone-600 dark:text-emerald-100/65">
              {isGestor ? t('dashboard.fundoSubtitle') : t('dashboard.cedenteSubtitle')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Indicador Exclusivo da Faceta Ativa (Sem botão de alternância) */}
            {isGestor ? (
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-xl border border-amber-600/30 bg-amber-500/15 px-3.5 py-2 text-xs font-bold text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200">
                  <Building2 size={15} className="text-amber-600 dark:text-amber-400" />
                  <span>{t('nav.fundsArea')}</span>
                </div>

                {/* Aba / Atalho para Analytics & Risco */}
                <Link
                  href="/gestao/analytics"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-800/30 bg-[#0B2C20] px-3.5 py-2 text-xs font-bold text-[#F8F6F1] shadow-sm transition hover:bg-[#103B2C] dark:border-emerald-300/30 dark:bg-[#103B2C] dark:hover:bg-[#164C39]"
                  title="Acessar painel de Analytics & Risco"
                >
                  <BarChart3 size={15} className="text-emerald-400" />
                  <span>{t('common.analytics')}</span>
                </Link>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-800/20 bg-emerald-900/10 px-3.5 py-2 text-xs font-bold text-emerald-900 dark:border-emerald-300/20 dark:bg-[#103b2c] dark:text-emerald-200">
                <Wallet size={15} className="text-emerald-600 dark:text-emerald-400" />
                <span>{t('nav.cedentsArea')}</span>
              </div>
            )}

            {/* Informações do Usuário Autenticado / Botão de Login */}
            {user ? (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-800/20 bg-white/80 px-3 py-2 text-xs shadow-sm dark:border-emerald-400/20 dark:bg-[#103b2c]">
                <span
                  className={`size-2 rounded-full ${isGestor ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                />
                <span className="font-bold text-stone-800 dark:text-emerald-100">
                  {user.username}
                </span>
                <span className="rounded bg-emerald-950/15 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-emerald-800 dark:bg-emerald-400/20 dark:text-emerald-300">
                  {user.role}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="ml-1 inline-flex items-center gap-1 text-[11px] font-semibold text-stone-500 hover:text-rose-600 dark:text-emerald-200/60 dark:hover:text-rose-300 transition"
                  title={t('common.logout')}
                >
                  <LogOut size={12} />
                  <span>{t('common.logout')}</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-emerald-800/20 bg-white px-4 text-xs font-bold text-stone-800 shadow-sm hover:bg-stone-50 dark:border-emerald-300/20 dark:bg-[#103b2c] dark:text-emerald-100 dark:hover:bg-[#154635] transition"
              >
                <User size={14} />
                <span>{t('common.login')}</span>
              </Link>
            )}

            {/* Alternador de Tema Claro / Escuro */}
            <ThemeToggle />
          </div>
        </header>

        {/* Entrada CSV para população do sistema na dashboard: restrita exclusivamente ao gerente default 'admin' */}
        {user?.username?.toLowerCase() === 'admin' && (
          <div className="mt-4">
            <UploadLoteCsv
              titulo="População do Sistema & Submissão em Lote (CSV)"
              descricao="Acesso de Administrador Geral: importe lotes CSV com milhares de notas. Cada cedente e fundo novo terá sua conta criada automaticamente (senha padrão 123456)."
            />
          </div>
        )}

        {/* Conteúdo Dinâmico Baseado Estritamente no Perfil de Acesso */}
        <div className="mt-6">
          {isGestor ? <DashboardFundo /> : <TabelaCedente />}
        </div>

        {/* Rodapé Institucional */}
        <footer className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-stone-300/40 py-6 text-[10px] uppercase tracking-widest text-stone-500 dark:border-emerald-200/10 dark:text-emerald-100/40 sm:flex-row">
          <span>Antecipe · Hackathon Kanastra 2026</span>
          <span className="hidden sm:inline">Arquitetura de Idempotência e Compliance Financeiro</span>
        </footer>
      </div>
    </main>
  )
}
