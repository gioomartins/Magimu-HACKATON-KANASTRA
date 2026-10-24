'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BarChart3, Building2, LogOut, RefreshCw, User, Wallet } from 'lucide-react'
import { TabelaCedente } from './tabela-cedente'
import { DashboardFundo } from './dashboard-fundo'
import { UploadLoteCsv } from './upload-lote-csv'
import { ThemeToggle } from './theme-toggle'
import { useAuth } from '@/lib/auth-context'

export function AntecipeDashboard() {
  const router = useRouter()
  const { user, isLoading, logout } = useAuth()
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
          <span>{isLoggingOut ? 'Saindo da conta...' : 'Verificando autenticação...'}</span>
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
      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-8 lg:px-12 lg:py-8">
        {/* Barra Superior / Header */}
        <header className="mb-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-800 dark:text-emerald-300/80">
              <span className="size-2 rounded-full bg-emerald-500 dark:bg-emerald-400" /> Plataforma Antecipe · Kanastra
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-[#0b2c20] dark:text-[#f8f6f1] sm:text-4xl">
                Antecipe<span className="text-emerald-500 dark:text-emerald-400">.</span>
              </h1>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-800/20 bg-emerald-900/10 px-3 py-1 text-xs font-semibold text-emerald-900 transition hover:bg-emerald-900/20 dark:border-emerald-300/20 dark:bg-[#103b2c] dark:text-emerald-200 dark:hover:bg-[#164c39]"
                title="Voltar para a página inicial"
              >
                <ArrowLeft size={13} />
                <span>Página Inicial</span>
              </Link>
            </div>
            <p className="mt-1 text-xs text-stone-600 dark:text-emerald-100/65">
              {isGestor
                ? 'Governança de Fundo: Parametrização em tempo real e regras de crédito FIDC.'
                : 'Gestão de Recebíveis: Antecipação de faturas com transparência de recusas e simulação.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Indicador Exclusivo da Faceta Ativa (Sem botão de alternância) */}
            {isGestor ? (
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-xl border border-amber-600/30 bg-amber-500/15 px-3.5 py-2 text-xs font-bold text-amber-900 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200">
                  <Building2 size={15} className="text-amber-600 dark:text-amber-400" />
                  <span>Área dos Fundos</span>
                </div>

                {/* Aba / Atalho para Analytics & Risco */}
                <Link
                  href="/gestao/analytics"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-800/30 bg-[#0B2C20] px-3.5 py-2 text-xs font-bold text-[#F8F6F1] shadow-sm transition hover:bg-[#103B2C] dark:border-emerald-300/30 dark:bg-[#103B2C] dark:hover:bg-[#164C39]"
                  title="Acessar painel de Analytics & Risco"
                >
                  <BarChart3 size={15} className="text-emerald-400" />
                  <span>Analytics & Risco</span>
                </Link>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-800/20 bg-emerald-900/10 px-3.5 py-2 text-xs font-bold text-emerald-900 dark:border-emerald-300/20 dark:bg-[#103b2c] dark:text-emerald-200">
                <Wallet size={15} className="text-emerald-600 dark:text-emerald-400" />
                <span>Área dos Cedentes</span>
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
                  title="Sair da conta"
                >
                  <LogOut size={12} />
                  <span>Sair</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-emerald-800/20 bg-white px-4 text-xs font-bold text-stone-800 shadow-sm hover:bg-stone-50 dark:border-emerald-300/20 dark:bg-[#103b2c] dark:text-emerald-100 dark:hover:bg-[#154635] transition"
              >
                <User size={14} />
                <span>Entrar</span>
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
