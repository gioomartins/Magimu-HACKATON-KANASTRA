'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'

export function Footer() {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const logoSrc = mounted && resolvedTheme === 'light'
    ? '/logo-antecipe-claro.svg'
    : '/logo-antecipe-escuro.svg'

  return (
    <footer aria-label="Rodapé do site" className="border-t border-stone-200/80 bg-stone-50 py-16 dark:border-emerald-500/15 dark:bg-[#071d15] transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          {/* Logo e Lema */}
          <div className="md:col-span-2">
            <div className="relative h-9 w-32 sm:h-10 sm:w-36">
              <Image
                src={logoSrc}
                alt="Logo Antecipe"
                fill
                sizes="150px"
                className="object-contain object-left"
              />
            </div>
            <p className="mt-4 text-xs leading-relaxed text-stone-600 dark:text-emerald-100/65 max-w-sm">
              Importar. Decidir. Explicar. Simular. A plataforma definitiva para antecipação de recebíveis e gestão de regras de crédito FIDC.
            </p>
            <div className="mt-6 inline-block rounded-lg bg-emerald-100/60 px-3 py-1.5 text-[11px] font-bold text-emerald-800 dark:bg-[#103b2c] dark:text-emerald-300">
              Projeto desenvolvido para o hackathon Kanastra
            </div>
          </div>

          {/* Navegação Rápida */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-900 dark:text-[#f8f6f1]">
              Plataforma
            </p>
            <ul className="mt-4 space-y-2.5 text-xs text-stone-600 dark:text-emerald-100/70">
              <li>
                <a href="#como-funciona" className="hover:text-emerald-700 dark:hover:text-emerald-300">
                  Como Funciona
                </a>
              </li>
              <li>
                <a href="#regras" className="hover:text-emerald-700 dark:hover:text-emerald-300">
                  Regras FIDC
                </a>
              </li>
              <li>
                <a href="#para-quem" className="hover:text-emerald-700 dark:hover:text-emerald-300">
                  Para Quem É
                </a>
              </li>
              <li>
                <a href="#perguntas" className="hover:text-emerald-700 dark:hover:text-emerald-300">
                  Perguntas Frequentes
                </a>
              </li>
              <li>
                <Link href="/plataforma" className="hover:text-emerald-700 dark:hover:text-emerald-300 font-bold">
                  Acessar Plataforma →
                </Link>
              </li>
            </ul>
          </div>

          {/* Compliance e Auditoria */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-900 dark:text-[#f8f6f1]">
              Conformidade
            </p>
            <ul className="mt-4 space-y-2.5 text-xs text-stone-600 dark:text-emerald-100/70">
              <li>Idempotência em Banco de Dados</li>
              <li>Pró-rata Die Comercial</li>
              <li>Auditoria Cadastral CNPJ</li>
              <li>API REST com Paginação de 20 em 20</li>
              <li>PostgreSQL 17 ACID</li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-stone-200/80 pt-8 text-[11px] text-stone-500 dark:border-emerald-500/15 dark:text-emerald-100/40 sm:flex-row">
          <span>© 2026 Antecipe FIDC. Todos os direitos reservados.</span>
          <span>Projeto desenvolvido para o hackathon Kanastra</span>
        </div>
      </div>
    </footer>
  )
}
