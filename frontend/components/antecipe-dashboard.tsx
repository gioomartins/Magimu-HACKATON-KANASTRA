'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Building2, LogOut, ShieldAlert, User, Wallet } from 'lucide-react'
import { TabelaCedente } from './tabela-cedente'
import { DashboardFundo } from './dashboard-fundo'
import { ThemeToggle } from './theme-toggle'
import { useAuth } from '@/lib/auth-context'

export function AntecipeDashboard() {
  const { user, logout } = useAuth()
  const [facetaAtiva, setFacetaAtiva] = useState<'cedente' | 'fundo'>('cedente')

  // Se o usuário estiver autenticado como GESTOR, acesso total;
  // Se for EMPRESA ou não autenticado, restrito a cedente.
  const isGestor = user?.role === 'GESTOR'

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
              Gestão de recebíveis, motor de regras dinâmico e precificação em tempo real.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Barra Nav de Transição entre as Duas Facetas (com restrição de UX para EMPRESA) */}
            <nav
              aria-label="Alternar facetas operacionais"
              className="inline-flex rounded-xl border border-emerald-800/20 bg-[#0b2c20] p-1.5 shadow-sm dark:border-emerald-200/20 dark:bg-[#103b2c]"
            >
              <button
                type="button"
                onClick={() => setFacetaAtiva('cedente')}
                className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold transition-all ${
                  facetaAtiva === 'cedente'
                    ? 'bg-[#f8f6f1] text-[#0b2c20] shadow'
                    : 'text-emerald-100/70 hover:text-white'
                }`}
              >
                <Wallet size={15} />
                <span>Faceta dos Cedentes</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (isGestor) setFacetaAtiva('fundo')
                }}
                disabled={!isGestor}
                title={!isGestor ? 'Acesso restrito a Gestores do Fundo' : 'Configuração de Regras do Fundo'}
                className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold transition-all ${
                  !isGestor
                    ? 'opacity-50 cursor-not-allowed text-emerald-100/40'
                    : facetaAtiva === 'fundo'
                    ? 'bg-[#f8f6f1] text-[#0b2c20] shadow'
                    : 'text-emerald-100/70 hover:text-white'
                }`}
              >
                <Building2 size={15} />
                <span>Faceta dos Fundos</span>
              </button>
            </nav>

            {/* Informações do Usuário Autenticado / Botão de Login */}
            {user ? (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-800/20 bg-white/80 px-3 py-2 text-xs shadow-sm dark:border-emerald-400/20 dark:bg-[#103b2c]">
                <span
                  className={`size-2 rounded-full ${
                    isGestor ? 'bg-amber-400' : 'bg-emerald-400'
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
                  onClick={logout}
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

        {/* Alerta explicativo caso o usuário seja Empresa e tente ver regras */}
        {user?.role === 'EMPRESA' && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-900 dark:text-amber-200">
            <ShieldAlert size={16} className="shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              Você está conectado como <strong>Empresa Cedente</strong>. Seu acesso está habilitado para submissão de CSV e consulta de notas. A configuração de regras e parâmetros do FIDC é de acesso restrito a <strong>Gestores do Fundo</strong>.
            </span>
          </div>
        )}

        {/* Conteúdo Dinâmico da Faceta Selecionada */}
        <div className="mt-4">
          {facetaAtiva === 'cedente' ? <TabelaCedente /> : <DashboardFundo />}
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
