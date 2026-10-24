'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { Check, X, ArrowRight, ShieldCheck, ChevronDown, Sparkles } from 'lucide-react'

export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28 lg:pt-44 lg:pb-32"
    >
      {/* Background Decorative Accents */}
      <div
        className="pointer-events-none absolute -top-40 right-0 -z-10 size-96 rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-400/5"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 -z-10 size-80 rounded-full bg-emerald-700/10 blur-3xl dark:bg-emerald-600/5"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Lado Esquerdo: Mensagem e CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="lg:col-span-7 flex flex-col items-start"
          >
            {/* Badge de Reconhecimento */}
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-800/20 bg-emerald-900/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-800 dark:border-emerald-300/20 dark:bg-[#103b2c] dark:text-emerald-300">
              <Sparkles size={12} className="text-emerald-500 dark:text-emerald-400" />
              <span>Plataforma Hackathon Kanastra 2026</span>
            </div>

            {/* H1 Principal (Único da Página) */}
            <h1
              id="hero-heading"
              className="mt-6 text-4xl font-bold tracking-tight text-[#0b2c20] dark:text-[#f8f6f1] sm:text-5xl lg:text-6xl text-balance"
              style={{ fontSize: 'clamp(2.25rem, 5vw, 3.75rem)' }}
            >
              Antecipe seus recebíveis com decisões claras<span className="text-emerald-500 dark:text-emerald-400">.</span>
            </h1>

            {/* Subtítulo */}
            <p className="mt-6 text-lg leading-relaxed text-stone-600 dark:text-emerald-100/75 max-w-2xl text-pretty">
              Envie o CSV com milhares de notas fiscais e veja, em segundos, o que o fundo aprova, o que recusa e por quê. Sem surpresas, com motor dinâmico e simulação líquida instantânea.
            </p>

            {/* Botões de Ação */}
            <div className="mt-8 flex flex-wrap items-center gap-4 w-full sm:w-auto">
              <Link
                href="/plataforma"
                className="inline-flex h-12 min-h-[48px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#0b2c20] px-6 text-xs font-bold uppercase tracking-wider text-[#f8f6f1] shadow-lg transition-all hover:bg-[#103b2c] hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:bg-[#f8f6f1] dark:text-[#0b2c20] dark:hover:bg-white"
              >
                <span>Começar agora</span>
                <ArrowRight size={16} />
              </Link>

              <a
                href="#como-funciona"
                className="inline-flex h-12 min-h-[48px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-6 text-xs font-bold uppercase tracking-wider text-stone-700 transition hover:bg-stone-50 hover:text-stone-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-emerald-500/20 dark:bg-[#103b2c] dark:text-emerald-100 dark:hover:bg-[#164c39]"
              >
                <span>Ver como funciona</span>
                <ChevronDown size={16} />
              </a>
            </div>

            {/* Indicador de Confiança */}
            <div className="mt-10 flex items-center gap-4 text-xs text-stone-500 dark:text-emerald-100/50">
              <div className="flex items-center gap-1.5 font-medium">
                <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400" />
                <span>Idempotência em nível de banco de dados</span>
              </div>
              <span className="text-stone-300 dark:text-emerald-500/30">·</span>
              <span>100k notas processadas em stream</span>
            </div>
          </motion.div>

          {/* Lado Direito: Pré-visualização Estilizada do Resultado */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            className="lg:col-span-5"
          >
            <div className="relative rounded-2xl border border-stone-200/80 bg-white p-6 shadow-2xl dark:border-emerald-500/20 dark:bg-[#103b2c] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
              {/* Cabeçalho do Card */}
              <div className="flex items-center justify-between border-b border-stone-100 pb-4 dark:border-emerald-500/15">
                <div>
                  <span className="inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Demonstração da Plataforma
                  </span>
                  <p className="mt-1 text-xs font-semibold text-stone-800 dark:text-[#f8f6f1]">
                    Auditoria de Recebíveis em Tempo Real
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400 dark:text-emerald-200/50">
                    Exemplo
                  </span>
                </div>
              </div>

              {/* Lista com Linha Aprovada e Linha Recusada */}
              <div className="mt-4 space-y-3.5">
                {/* Linha Aprovada */}
                <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/50 p-3.5 transition dark:border-emerald-500/20 dark:bg-emerald-950/30">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                        <Check size={10} /> Aprovada
                      </span>
                      <span className="font-bold text-stone-900 dark:text-[#f8f6f1]">NF-10492</span>
                    </div>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                      R$ 12.500,00
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-stone-500 dark:text-emerald-100/60">
                    <span>Sacado: Atacado São Paulo S/A</span>
                    <span>Líquido: R$ 12.266,67</span>
                  </div>
                </div>

                {/* Linha Recusada com Sub-linha Rosa de Explicação */}
                <div className="rounded-xl border border-rose-200/70 bg-rose-50/30 p-3.5 transition dark:border-rose-500/20 dark:bg-rose-950/20">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950/80 dark:text-rose-300">
                        <X size={10} /> Recusada
                      </span>
                      <span className="font-bold text-stone-900 dark:text-[#f8f6f1]">NF-10493</span>
                    </div>
                    <span className="font-semibold text-stone-700 dark:text-stone-300">
                      R$ 45.000,00
                    </span>
                  </div>

                  {/* Sub-linha de Explicação Transparente Conforme Especificação */}
                  <div className="mt-2.5 rounded-lg border border-rose-200/60 bg-rose-50 px-3 py-2 text-[11px] leading-relaxed font-medium text-rose-800 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
                    <p>
                      <strong>Motivo da recusa:</strong> Prazo acima do limite: vence em 90 dias; o limite configurado do fundo é 60 dias.
                    </p>
                  </div>
                </div>
              </div>

              {/* Simulação Instantânea do Exemplo */}
              <div className="mt-4 flex items-center justify-between rounded-xl bg-[#0b2c20] px-4 py-3 text-[#f8f6f1] dark:bg-[#071d15]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                  Total Líquido Estimado
                </span>
                <span className="text-base font-bold text-emerald-300">
                  R$ 12.266,67
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
