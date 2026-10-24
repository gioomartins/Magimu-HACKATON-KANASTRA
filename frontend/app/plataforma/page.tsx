import type { Metadata } from 'next'
import { AntecipeDashboard } from '@/components/antecipe-dashboard'

export const metadata: Metadata = {
  title: 'Plataforma Antecipe | Análise de Recebíveis e Gestão de Regras FIDC',
  description:
    'Área operacional para cedentes e gestores de FIDC: submissão de lotes, validação de notas fiscais, motivos de recusa e precificação em tempo real.',
  alternates: {
    canonical: '/plataforma',
  },
}

export default function PlataformaPage() {
  return <AntecipeDashboard />
}
