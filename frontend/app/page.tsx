import { Navbar } from '@/components/home/navbar'
import { Hero } from '@/components/home/hero'
import { VideoSection } from '@/components/home/video-section'
import { HowItWorks } from '@/components/home/how-it-works'
import { RulesSection } from '@/components/home/rules-section'
import { TargetAudience } from '@/components/home/target-audience'
import { FaqSection } from '@/components/home/faq-section'
import { FAQ_ITEMS } from '@/lib/faq-data'
import { CtaSection } from '@/components/home/cta-section'

import { Footer } from '@/components/home/footer'

export default function HomePage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://antecipe.kanastra.com.br'

  const jsonLdFaq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_ITEMS.map((item) => ({
      '@type': 'Question',
      name: item.pergunta,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.resposta,
      },
    })),
  }

  const jsonLdVideo = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: 'Animação da Identidade Antecipe FIDC',
    description: 'Apresentação visual da marca e lema da plataforma Antecipe para o hackathon Kanastra.',
    thumbnailUrl: `${siteUrl}/animacao-logo-antecipe-poster.jpg`,
    uploadDate: '2026-10-24T12:00:00-03:00',
    contentUrl: `${siteUrl}/animacao-logo-antecipe.mp4`,
    embedUrl: `${siteUrl}/animacao-logo-antecipe.mp4`,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdVideo) }}
      />

      <div className="flex min-h-screen flex-col bg-[#f8f6f1] text-stone-900 selection:bg-emerald-500 selection:text-white dark:bg-[#0b2c20] dark:text-stone-100 transition-colors duration-200">
        <Navbar />
        <main id="conteudo-principal" className="flex-1">
          <Hero />
          <VideoSection />
          <HowItWorks />
          <RulesSection />
          <TargetAudience />
          <FaqSection />
          <CtaSection />
        </main>
        <Footer />
      </div>
    </>
  )
}
