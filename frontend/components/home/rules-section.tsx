'use client'

import { useEffect, useState } from 'react'
import { motion, useInView } from 'motion/react'
import { useRef } from 'react'
import { Calendar, Users, DollarSign, Sliders, CheckCircle2 } from 'lucide-react'

function AnimatedCounter({ value, suffix = '', prefix = '' }: { value: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isInView) return
    let start = 0
    const duration = 1200 // ms
    const stepTime = 20
    const totalSteps = duration / stepTime
    const increment = value / totalSteps

    const timer = setInterval(() => {
      start += increment
      if (start >= value) {
        setCount(value)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, stepTime)

    return () => clearInterval(timer)
  }, [isInView, value])

  return (
    <span ref={ref} className="font-extrabold tracking-tight">
      {prefix}
      {count.toLocaleString('pt-BR')}
      {suffix}
    </span>
  )
}

export function RulesSection() {
  return (
    <section
      id="regras"
      aria-labelledby="regras-heading"
      className="py-20 sm:py-28 bg-stone-100/60 dark:bg-[#071d15]/50 transition-colors"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800 dark:text-emerald-400">
            Governança e Parâmetros
          </p>
          <h2
            id="regras-heading"
            className="mt-2 text-3xl font-bold tracking-tight text-[#0b2c20] dark:text-[#f8f6f1] sm:text-4xl"
          >
            Regras que o Fundo Aplica em Segundos
          </h2>
          <p className="mt-3 text-base text-stone-600 dark:text-emerald-100/70">
            Critérios parametrizáveis no arquivo de validação que eliminam a subjetividade e aceleram a aprovação de crédito.
          </p>
        </div>

        {/* Grade de 3 Cards com Contadores Animados */}
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {/* Card 1: Prazo Máximo */}
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl border border-stone-200/80 bg-white p-7 shadow-sm transition hover:shadow-md dark:border-emerald-500/15 dark:bg-[#103b2c]"
          >
            <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-[#0b2c20] dark:text-emerald-300">
              <Calendar size={22} />
            </div>

            <div className="mt-6">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-emerald-300/60">
                Prazo Máximo de Vencimento
              </p>
              <div className="mt-2 text-4xl text-[#0b2c20] dark:text-emerald-300">
                <AnimatedCounter value={180} suffix=" dias" />
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-stone-600 dark:text-emerald-100/70">
              Notas fiscais com vencimento original superior ao limite configurado pelo fundo são imediatamente barradas com cálculo exato de dias até a data-base.
            </p>

            <ul className="mt-6 space-y-2 border-t border-stone-100 pt-4 text-[11px] text-stone-500 dark:border-emerald-500/15 dark:text-emerald-100/60">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                <span>Base diária comparada com 24/10/2026</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                <span>Sem notas vencidas no lote</span>
              </li>
            </ul>
          </motion.article>

          {/* Card 2: Concentração por Sacado */}
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="rounded-2xl border border-stone-200/80 bg-white p-7 shadow-sm transition hover:shadow-md dark:border-emerald-500/15 dark:bg-[#103b2c]"
          >
            <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-[#0b2c20] dark:text-emerald-300">
              <Users size={22} />
            </div>

            <div className="mt-6">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-emerald-300/60">
                Concentração Máxima por Sacado
              </p>
              <div className="mt-2 text-4xl text-[#0b2c20] dark:text-emerald-300">
                <AnimatedCounter value={10} suffix="%" />
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-stone-600 dark:text-emerald-100/70">
              Agrupamento inteligente por raiz de CNPJ (primeiros 8 dígitos), somando matriz e filiais para evitar exposição desmedida a um mesmo pagador.
            </p>

            <ul className="mt-6 space-y-2 border-t border-stone-100 pt-4 text-[11px] text-stone-500 dark:border-emerald-500/15 dark:text-emerald-100/60">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                <span>Validação contra a carteira acumulada</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                <span>Situação cadastral Ativa na Receita</span>
              </li>
            </ul>
          </motion.article>

          {/* Card 3: Valor Mínimo por Nota */}
          <motion.article
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="rounded-2xl border border-stone-200/80 bg-white p-7 shadow-sm transition hover:shadow-md dark:border-emerald-500/15 dark:bg-[#103b2c]"
          >
            <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-[#0b2c20] dark:text-emerald-300">
              <DollarSign size={22} />
            </div>

            <div className="mt-6">
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500 dark:text-emerald-300/60">
                Valor Mínimo Aceito
              </p>
              <div className="mt-2 text-4xl text-[#0b2c20] dark:text-emerald-300">
                <AnimatedCounter value={200} prefix="R$ " suffix=",00" />
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-stone-600 dark:text-emerald-100/70">
              Garante que apenas recebíveis viáveis operacionalmente para o fundo sejam submetidos à precificação e liquidação financeira.
            </p>

            <ul className="mt-6 space-y-2 border-t border-stone-100 pt-4 text-[11px] text-stone-500 dark:border-emerald-500/15 dark:text-emerald-100/60">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                <span>Taxa mensal fixa de desconto simples</span>
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                <span>Duplicata e Duplicata de Serviço</span>
              </li>
            </ul>
          </motion.article>
        </div>
      </div>
    </section>
  )
}
