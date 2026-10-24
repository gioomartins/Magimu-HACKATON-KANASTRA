'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

export function CtaSection() {
  return (
    <section aria-labelledby="cta-heading" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-[#0b2c20] px-6 py-16 text-center text-[#f8f6f1] shadow-2xl sm:px-12 sm:py-20 lg:px-16">
          {/* Luzes decorativas de fundo */}
          <div
            className="pointer-events-none absolute -top-24 -left-24 size-80 rounded-full bg-emerald-500/20 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-24 -right-24 size-80 rounded-full bg-emerald-400/15 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative mx-auto max-w-3xl">
            <span className="inline-block rounded-full border border-emerald-400/30 bg-emerald-950/60 px-4 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-300">
              Pronto para Operar
            </span>

            <h2
              id="cta-heading"
              className="mt-6 text-3xl font-bold tracking-tight text-[#f8f6f1] sm:text-4xl lg:text-5xl"
            >
              Envie seu primeiro lote de recebíveis agora mesmo
            </h2>

            <p className="mt-4 text-base text-emerald-100/75">
              Experimente a velocidade da validação automática e a tranquilidade de entender cada centavo antecipado.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/plataforma"
                className="inline-flex h-12 min-h-[48px] w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#f8f6f1] px-8 text-xs font-bold uppercase tracking-wider text-[#0b2c20] shadow-lg transition hover:bg-white hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
              >
                <span>Abrir plataforma</span>
                <ArrowRight size={16} />
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-emerald-200/60">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>Sem necessidade de cadastro prévio</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>Auditoria de CNPJ em tempo real</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-400" />
                <span>Cálculo seguro pró-rata die</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
