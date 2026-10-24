'use client'

import { useRef, useState, useEffect } from 'react'
import { RotateCcw, Play } from 'lucide-react'

export function VideoSection() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [hasPlayed, setHasPlayed] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    // Detecta prefers-reduced-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }
    mediaQuery.addEventListener('change', handleChange)

    // Se preferir movimento reduzido, não toca automaticamente
    if (mediaQuery.matches) return () => mediaQuery.removeEventListener('change', handleChange)

    const videoEl = videoRef.current
    if (!videoEl) return () => mediaQuery.removeEventListener('change', handleChange)

    // IntersectionObserver: Toca UMA VEZ ao entrar na viewport
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasPlayed) {
            videoEl
              .play()
              .then(() => {
                setIsPlaying(true)
                setHasPlayed(true)
              })
              .catch(() => {
                // Autoplay bloqueado pelo navegador
              })
          }
        })
      },
      { threshold: 0.5 }
    )

    observer.observe(videoEl)

    return () => {
      observer.disconnect()
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [hasPlayed])

  const handleReplay = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {})
    }
  }

  return (
    <section
      aria-labelledby="video-brand-heading"
      className="py-16 sm:py-24 bg-stone-100/50 dark:bg-[#071d15]/60 transition-colors"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800 dark:text-emerald-400">
            Identidade & Tecnologia
          </p>
          <h2
            id="video-brand-heading"
            className="mt-2 text-2xl font-bold tracking-tight text-[#0b2c20] dark:text-[#f8f6f1] sm:text-3xl"
          >
            Construído para dar segurança e velocidade ao mercado de crédito
          </h2>
          <p className="mt-3 text-sm text-stone-600 dark:text-emerald-100/65 max-w-xl mx-auto">
            Uma plataforma de antecipação pensada para aproximar quem cede o crédito de quem o financia, com transparência total de ponta a ponta.
          </p>
        </div>

        {/* Card do Vídeo - Fundo Verde Nos Dois Temas Conforme Requisito */}
        <div className="mt-10 overflow-hidden rounded-2xl border border-emerald-800/30 bg-[#0b2c20] p-4 sm:p-6 shadow-2xl relative">
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-[#0b2c20] flex items-center justify-center">
            <video
              ref={videoRef}
              src="/animacao-logo-antecipe.mp4"
              poster="/animacao-logo-antecipe-poster.jpg"
              preload="metadata"
              muted
              playsInline
              aria-label="Animação visual da marca e logotipo Antecipe FIDC"
              onEnded={() => setIsPlaying(false)}
              className="h-full w-full object-contain"
            />

            {/* Botão Flutuante de Reproduzir Novamente */}
            <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
              <button
                type="button"
                onClick={handleReplay}
                aria-label="Reproduzir novamente a animação da marca"
                className="flex items-center gap-1.5 rounded-lg bg-emerald-950/80 px-3 py-2 text-xs font-semibold text-emerald-200 backdrop-blur-md transition hover:bg-emerald-900 hover:text-white border border-emerald-400/20 shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                <RotateCcw size={13} />
                <span>{isPlaying ? 'Reiniciar' : 'Reproduzir novamente'}</span>
              </button>
            </div>
          </div>

          {/* Legenda Acessível */}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-emerald-100/60 border-t border-emerald-900/40 pt-3">
            <span>Animação oficial da identidade Antecipe · 4,5 segundos</span>
            <span className="text-[11px] text-emerald-300/80 mt-1 sm:mt-0">
              {prefersReducedMotion ? 'Movimento reduzido ativado no sistema' : 'Execução sob demanda'}
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
