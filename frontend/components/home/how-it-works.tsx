'use client'

import { motion } from 'motion/react'
import { FileUp, Cpu, MessageSquareText, Calculator } from 'lucide-react'

const etapas = [
  {
    numero: '01',
    lema: 'Importar',
    titulo: 'Upload de Lote sem Travamento',
    descricao:
      'Envio sequencial e streaming de arquivos CSV contendo milhares de recebíveis. Deduplicação inteligente e idempotência em nível de banco.',
    icone: FileUp,
  },
  {
    numero: '02',
    lema: 'Decidir',
    titulo: 'Motor de Regras Flexível',
    descricao:
      'Avaliação instantânea de prazos, concentração por raiz de CNPJ, valores mínimos e situações cadastrais do sacado perante a Receita Federal.',
    icone: Cpu,
  },
  {
    numero: '03',
    lema: 'Explicar',
    titulo: 'Motivos Transparentes de Recusa',
    descricao:
      'Nenhuma nota fica sem explicação. O cedente visualiza exatamente qual critério não foi atendido, com orientações claras e sem jargões.',
    icone: MessageSquareText,
  },
  {
    numero: '04',
    lema: 'Simular',
    titulo: 'Precificação e Valor Líquido',
    descricao:
      'Cálculo automático de desconto simples comercial pró-rata die sobre as notas aprovadas, com valor líquido a receber em tempo real.',
    icone: Calculator,
  },
]

export function HowItWorks() {
  return (
    <section id="como-funciona" aria-labelledby="como-funciona-heading" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800 dark:text-emerald-400">
            Fluxo Completo de Operação
          </p>
          <h2
            id="como-funciona-heading"
            className="mt-2 text-3xl font-bold tracking-tight text-[#0b2c20] dark:text-[#f8f6f1] sm:text-4xl"
          >
            Como Funciona: O Lema em Ação
          </h2>
          <p className="mt-3 text-base text-stone-600 dark:text-emerald-100/70">
            Quatro etapas conectadas para transformar o recebimento de crédito em um processo simples, seguro e transparente.
          </p>
        </div>

        {/* Grade de 4 Etapas */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 relative">
          {etapas.map((etapa, idx) => {
            const Icon = etapa.icone
            return (
              <motion.article
                key={etapa.numero}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="relative flex flex-col justify-between rounded-2xl border border-stone-200/80 bg-white p-7 shadow-sm transition hover:shadow-md dark:border-emerald-500/15 dark:bg-[#103b2c] dark:hover:border-emerald-500/30"
              >
                <div>
                  {/* Topo do Card: Número e Ícone */}
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-extrabold tracking-tight text-emerald-600/30 dark:text-emerald-400/20">
                      {etapa.numero}
                    </span>
                    <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-[#0b2c20] dark:text-emerald-300">
                      <Icon size={20} />
                    </span>
                  </div>

                  {/* Lema em Destaque */}
                  <span className="mt-6 inline-block text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-800 dark:text-emerald-400">
                    {etapa.lema}
                  </span>

                  {/* Título e Descrição */}
                  <h3 className="mt-1 text-lg font-bold text-stone-900 dark:text-[#f8f6f1]">
                    {etapa.titulo}
                  </h3>
                  <p className="mt-3 text-xs leading-relaxed text-stone-600 dark:text-emerald-100/70">
                    {etapa.descricao}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-stone-100 dark:border-emerald-500/15 text-[10px] uppercase tracking-wider text-stone-400 dark:text-emerald-300/40 font-semibold">
                  Passo {idx + 1} de 4
                </div>
              </motion.article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
