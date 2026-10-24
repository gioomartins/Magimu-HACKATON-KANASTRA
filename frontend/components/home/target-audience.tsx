'use client'

import { motion } from 'motion/react'
import { Building, Store, Check, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const publicos = [
  {
    tipo: 'Para Pequenas Empresas Cedentes',
    subtitulo: 'Antecipe seu fluxo de caixa sem atritos e sem surpresas',
    icone: Store,
    destaque: 'Liquidez Previsível',
    beneficios: [
      {
        titulo: 'Clareza imediata nas recusas',
        descricao: 'Saiba o motivo exato se uma nota não for aceita, sem depender de atendimento manual.',
      },
      {
        titulo: 'Simulação transparente em tempo real',
        descricao: 'Visualize o valor líquido exato descontado antes de confirmar a operação.',
      },
      {
        titulo: 'Submissão de lotes inteiros via CSV',
        descricao: 'Importe dezenas de notas de uma única vez em poucos cliques, sem digitação manual.',
      },
    ],
    ctaTexto: 'Acessar como Cedente',
  },
  {
    tipo: 'Para Gestores e Operadores de FIDC',
    subtitulo: 'Governança rigorosa de crédito com motor de validação auditável',
    icone: Building,
    destaque: 'Compliance Automatizado',
    beneficios: [
      {
        titulo: 'Motor de regras 100% dinâmico',
        descricao: 'Ajuste prazos, tetos e concentrações diretamente na plataforma sem necessidade de deploy.',
      },
      {
        titulo: 'Garantia absoluta de idempotência',
        descricao: 'Notas aprovadas nunca são duplicadas no banco, mesmo em submissões simultâneas de lotes.',
      },
      {
        titulo: 'Reprecificação em tempo real',
        descricao: 'Reavalie milhares de recebíveis instantaneamente ao alterar parâmetros de precificação do fundo.',
      },
    ],
    ctaTexto: 'Acessar como Fundo',
  },
]

export function TargetAudience() {
  return (
    <section id="para-quem" aria-labelledby="para-quem-heading" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800 dark:text-emerald-400">
            Público-Alvo
          </p>
          <h2
            id="para-quem-heading"
            className="mt-2 text-3xl font-bold tracking-tight text-[#0b2c20] dark:text-[#f8f6f1] sm:text-4xl"
          >
            Projetado para os Dois Lados da Operação
          </h2>
          <p className="mt-3 text-base text-stone-600 dark:text-emerald-100/70">
            A solução que atende com a mesma excelência a empresa que busca capital de giro e o comitê que administra os riscos do fundo.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          {publicos.map((pub, idx) => {
            const Icon = pub.icone
            return (
              <motion.article
                key={pub.tipo}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.15 }}
                className="flex flex-col justify-between rounded-2xl border border-stone-200/80 bg-white p-8 shadow-sm transition hover:shadow-md dark:border-emerald-500/15 dark:bg-[#103b2c]"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="flex size-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-[#0b2c20] dark:text-emerald-300">
                      <Icon size={24} />
                    </span>
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {pub.destaque}
                    </span>
                  </div>

                  <h3 className="mt-6 text-xl font-bold text-stone-900 dark:text-[#f8f6f1]">
                    {pub.tipo}
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-stone-600 dark:text-emerald-100/70">
                    {pub.subtitulo}
                  </p>

                  <ul className="mt-8 space-y-4">
                    {pub.beneficios.map((b, bIdx) => (
                      <li key={bIdx} className="flex items-start gap-3">
                        <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                          <Check size={12} />
                        </span>
                        <div>
                          <p className="text-xs font-bold text-stone-900 dark:text-[#f8f6f1]">
                            {b.titulo}
                          </p>
                          <p className="mt-0.5 text-[11px] leading-relaxed text-stone-500 dark:text-emerald-100/60">
                            {b.descricao}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-6 border-t border-stone-100 dark:border-emerald-500/15">
                  <Link
                    href="/plataforma"
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0b2c20] text-xs font-bold uppercase tracking-wider text-[#f8f6f1] transition hover:bg-[#154635] dark:bg-[#f8f6f1] dark:text-[#0b2c20] dark:hover:bg-white"
                  >
                    <span>{pub.ctaTexto}</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </motion.article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
