'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Building2, Layers, ShieldCheck, Wallet } from 'lucide-react'
import { TabelaCedente } from './tabela-cedente'
import { DashboardFundo } from './dashboard-fundo'
import { ThemeToggle } from './theme-toggle'

export function AntecipeDashboard() {
  const [facetaAtiva, setFacetaAtiva] = useState<'cedente' | 'fundo'>('cedente')

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

          <div className="flex items-center gap-3">
            {/* Barra Nav de Transição entre as Duas Facetas */}
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
                onClick={() => setFacetaAtiva('fundo')}
                className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold transition-all ${
                  facetaAtiva === 'fundo'
                    ? 'bg-[#f8f6f1] text-[#0b2c20] shadow'
                    : 'text-emerald-100/70 hover:text-white'
                }`}
              >
                <Building2 size={15} />
                <span>Faceta dos Fundos</span>
              </button>
            </nav>

            {/* Alternador de Tema Claro / Escuro */}
            <ThemeToggle />
          </div>
        </header>

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
