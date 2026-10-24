'use client'

import { useState } from 'react'
import { Building2, Layers, ShieldCheck, Wallet } from 'lucide-react'
import { TabelaCedente } from './tabela-cedente'
import { DashboardFundo } from './dashboard-fundo'

export function AntecipeDashboard() {
  const [facetaAtiva, setFacetaAtiva] = useState<'cedente' | 'fundo'>('cedente')

  return (
    <main className="min-h-screen bg-[#0b2c20] text-stone-100">
      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-8 lg:px-12 lg:py-8">
        {/* Barra Superior / Header */}
        <header className="mb-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/80">
              <span className="size-2 rounded-full bg-emerald-400" /> Plataforma Antecipe · Kanastra
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[#f8f6f1] sm:text-4xl">
              Antecipe<span className="text-emerald-400">.</span>
            </h1>
            <p className="mt-1 text-xs text-emerald-100/65">
              Gestão de recebíveis, motor de regras dinâmico e precificação em tempo real.
            </p>
          </div>

          {/* Barra Nav de Transição entre as Duas Facetas */}
          <nav className="inline-flex rounded-xl border border-emerald-200/20 bg-[#103b2c] p-1.5 shadow-sm">
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
        </header>

        {/* Conteúdo Dinâmico da Faceta Selecionada */}
        <div className="mt-4">
          {facetaAtiva === 'cedente' ? <TabelaCedente /> : <DashboardFundo />}
        </div>

        {/* Rodapé Institucional */}
        <footer className="mt-12 flex items-center justify-between border-t border-emerald-200/10 py-6 text-[10px] uppercase tracking-widest text-emerald-100/40">
          <span>Antecipe · Hackathon Kanastra 2026</span>
          <span className="hidden sm:inline">Arquitetura de Idempotência e Compliance Financeiro</span>
        </footer>
      </div>
    </main>
  )
}
