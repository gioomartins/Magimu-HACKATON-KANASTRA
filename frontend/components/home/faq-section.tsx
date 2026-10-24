'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { FAQ_ITEMS } from '@/lib/faq-data'

export function FaqSection() {

  const [aberto, setAberto] = useState<number | null>(0)

  const toggleItem = (idx: number) => {
    setAberto((prev) => (prev === idx ? null : idx))
  }

  return (
    <section
      id="perguntas"
      aria-labelledby="faq-heading"
      className="py-20 sm:py-28 bg-stone-100/50 dark:bg-[#071d15]/50 transition-colors"
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800 dark:text-emerald-400">
            Tire Suas Dúvidas
          </p>
          <h2
            id="faq-heading"
            className="mt-2 text-3xl font-bold tracking-tight text-[#0b2c20] dark:text-[#f8f6f1] sm:text-4xl"
          >
            Perguntas Frequentes
          </h2>
          <p className="mt-3 text-base text-stone-600 dark:text-emerald-100/70">
            Tudo o que você precisa saber sobre o motor de regras, critérios de análise e prazos da plataforma Antecipe.
          </p>
        </div>

        {/* Accordion Acessível com WAI-ARIA */}
        <div className="mt-14 space-y-3.5">
          {FAQ_ITEMS.map((item, idx) => {
            const isExpanded = aberto === idx
            const btnId = `faq-btn-${idx}`
            const panelId = `faq-panel-${idx}`

            return (
              <div
                key={idx}
                className="overflow-hidden rounded-xl border border-stone-200/80 bg-white transition dark:border-emerald-500/15 dark:bg-[#103b2c]"
              >
                <button
                  type="button"
                  id={btnId}
                  aria-expanded={isExpanded}
                  aria-controls={panelId}
                  onClick={() => toggleItem(idx)}
                  className="flex min-h-[52px] w-full items-center justify-between p-5 text-left text-sm font-bold text-stone-900 transition hover:bg-stone-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-[#f8f6f1] dark:hover:bg-[#154635]"
                >
                  <span className="pr-4">{item.pergunta}</span>
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-stone-400 transition-transform duration-200 dark:text-emerald-300 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      id={panelId}
                      role="region"
                      aria-labelledby={btnId}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                      <div className="border-t border-stone-100 p-5 text-xs leading-relaxed text-stone-600 dark:border-emerald-500/15 dark:text-emerald-100/75">
                        {item.resposta}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
