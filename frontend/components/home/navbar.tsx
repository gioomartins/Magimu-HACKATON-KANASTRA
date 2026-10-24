'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { Menu, X, ArrowRight } from 'lucide-react'
import { ThemeToggle } from '../theme-toggle'
import { useAuth } from '@/lib/auth-context'

export function Navbar() {
  const { user } = useAuth()
  const [menuAberto, setMenuAberto] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const onScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Trava rolagem do body quando menu mobile está aberto e escuta tecla Esc
  useEffect(() => {
    if (menuAberto) {
      document.body.style.overflow = 'hidden'
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setMenuAberto(false)
      }
      window.addEventListener('keydown', onKeyDown)
      return () => {
        document.body.style.overflow = ''
        window.removeEventListener('keydown', onKeyDown)
      }
    } else {
      document.body.style.overflow = ''
    }
  }, [menuAberto])

  const fecharMenu = () => setMenuAberto(false)

  // No tema escuro sobre verde institucional: logo escuro (letras claras)
  // No tema claro sobre fundo claro: logo claro (letras escuras)
  const logoSrc = mounted && resolvedTheme === 'light'
    ? '/logo-antecipe-claro.svg'
    : '/logo-antecipe-escuro.svg'

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-200 ${
        scrolled
          ? 'border-b border-stone-200/80 bg-[#f8f6f1]/90 backdrop-blur-md dark:border-emerald-500/15 dark:bg-[#0b2c20]/90 shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 rounded-lg"
          aria-label="Antecipe - Página inicial"
        >
          <div className="relative h-9 w-32 sm:h-10 sm:w-36">
            <Image
              src={logoSrc}
              alt="Logo Antecipe"
              fill
              priority
              sizes="150px"
              className="object-contain object-left"
            />
          </div>
        </Link>

        {/* Links Desktop */}
        <nav aria-label="Navegação principal" className="hidden md:flex items-center gap-8">
          <a
            href="#como-funciona"
            className="text-xs font-semibold uppercase tracking-wider text-stone-600 transition hover:text-[#0b2c20] dark:text-emerald-100/70 dark:hover:text-emerald-300"
          >
            Como Funciona
          </a>
          <a
            href="#regras"
            className="text-xs font-semibold uppercase tracking-wider text-stone-600 transition hover:text-[#0b2c20] dark:text-emerald-100/70 dark:hover:text-emerald-300"
          >
            Regras FIDC
          </a>
          <a
            href="#para-quem"
            className="text-xs font-semibold uppercase tracking-wider text-stone-600 transition hover:text-[#0b2c20] dark:text-emerald-100/70 dark:hover:text-emerald-300"
          >
            Para Quem É
          </a>
          <a
            href="#perguntas"
            className="text-xs font-semibold uppercase tracking-wider text-stone-600 transition hover:text-[#0b2c20] dark:text-emerald-100/70 dark:hover:text-emerald-300"
          >
            Perguntas
          </a>
        </nav>

        {/* Ações Desktop */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          {user ? (
            <Link
              href="/plataforma"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-emerald-800/20 bg-emerald-950/20 px-3.5 py-1.5 text-xs font-semibold text-stone-800 dark:border-emerald-300/20 dark:text-emerald-200"
            >
              <span className="size-2 rounded-full bg-emerald-400" />
              <span>{user.username}</span>
              <span className="rounded bg-emerald-500/20 px-1 py-0.2 text-[9px] font-bold uppercase">{user.role}</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-stone-300/80 bg-white px-4 text-xs font-bold uppercase tracking-wider text-stone-700 hover:bg-stone-50 dark:border-emerald-500/20 dark:bg-[#103b2c] dark:text-emerald-200 dark:hover:bg-[#154635] transition"
            >
              Entrar
            </Link>
          )}

          <Link
            href={user ? "/plataforma" : "/login"}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0b2c20] px-5 text-xs font-bold uppercase tracking-wider text-[#f8f6f1] shadow-sm transition-all hover:bg-[#103b2c] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 dark:bg-[#f8f6f1] dark:text-[#0b2c20] dark:hover:bg-white"
          >
            <span>Abrir plataforma</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Botão Mobile Hambúrguer */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMenuAberto(!menuAberto)}
            aria-expanded={menuAberto}
            aria-controls="mobile-drawer"
            aria-label={menuAberto ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
            className="flex h-11 min-h-[44px] w-11 min-w-[44px] items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-800 transition hover:bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-emerald-500/20 dark:bg-[#103b2c] dark:text-emerald-200"
          >
            {menuAberto ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Drawer Mobile com Foco Preso e Backdrop */}
      {menuAberto && (
        <div
          id="mobile-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Menu móvel"
          className="fixed inset-0 top-20 z-50 flex flex-col bg-[#f8f6f1] p-6 shadow-2xl dark:bg-[#0b2c20] md:hidden animate-in fade-in slide-in-from-top-4 duration-200"
        >
          <nav aria-label="Navegação móvel" className="flex flex-col gap-4">
            <a
              href="#como-funciona"
              onClick={fecharMenu}
              className="flex h-12 min-h-[44px] items-center rounded-lg border-b border-stone-200/60 text-sm font-semibold uppercase tracking-wider text-stone-800 dark:border-emerald-500/15 dark:text-[#f8f6f1]"
            >
              Como Funciona
            </a>
            <a
              href="#regras"
              onClick={fecharMenu}
              className="flex h-12 min-h-[44px] items-center rounded-lg border-b border-stone-200/60 text-sm font-semibold uppercase tracking-wider text-stone-800 dark:border-emerald-500/15 dark:text-[#f8f6f1]"
            >
              Regras FIDC
            </a>
            <a
              href="#para-quem"
              onClick={fecharMenu}
              className="flex h-12 min-h-[44px] items-center rounded-lg border-b border-stone-200/60 text-sm font-semibold uppercase tracking-wider text-stone-800 dark:border-emerald-500/15 dark:text-[#f8f6f1]"
            >
              Para Quem É
            </a>
            <a
              href="#perguntas"
              onClick={fecharMenu}
              className="flex h-12 min-h-[44px] items-center rounded-lg border-b border-stone-200/60 text-sm font-semibold uppercase tracking-wider text-stone-800 dark:border-emerald-500/15 dark:text-[#f8f6f1]"
            >
              Perguntas Frequentes
            </a>
          </nav>

          <div className="mt-8 pt-4">
            <Link
              href={user ? "/plataforma" : "/login"}
              onClick={fecharMenu}
              className="flex h-12 min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#0b2c20] text-xs font-bold uppercase tracking-wider text-[#f8f6f1] shadow-md dark:bg-emerald-400 dark:text-[#0b2c20]"
            >
              <span>Abrir plataforma</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
