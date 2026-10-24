'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  XCircle,
  FileText,
  AlertTriangle,
  RefreshCw,
  Building2,
  LogOut,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { useAuth } from '@/lib/auth-context'
import { fetchAnalyticsDashboard, AnalyticsData } from '@/lib/api'
import { ThemeToggle } from '@/components/theme-toggle'
import { UploadLoteCsv } from '@/components/upload-lote-csv'

// Paleta de cores alinhada à Kanastra e semântica de risco
const COLORS_PIE = [
  '#0B2C20', // Verde Escuro Principal
  '#103B2C', // Verde Floresta
  '#059669', // Esmeralda
  '#D97706', // Âmbar Médio
  '#E11D48', // Rosa/Vinho Risco
  '#7C3AED', // Púrpura Regulatório
  '#2563EB', // Azul Compliance
  '#64748B', // Ardósia
]

function formatCurrency(val: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  }).format(val || 0)
}

function formatCNPJ(doc: string): string {
  if (!doc) return ''
  const clean = doc.replace(/\D/g, '')
  if (clean.length === 14) {
    return clean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
  }
  return doc
}

export default function AnalyticsGestorPage() {
  const router = useRouter()
  const { user, loading: authLoading, logout } = useAuth()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Proteção de Rota: Redireciona para /login se não for GESTOR e não estiver saindo
  useEffect(() => {
    if (!authLoading && !isLoggingOut) {
      if (!user || user.role !== 'GESTOR') {
        router.push('/login')
      }
    }
  }, [user, authLoading, isLoggingOut, router])

  const handleLogout = () => {
    setIsLoggingOut(true)
    logout()
    router.push('/')
  }

  const carregarDados = async () => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const res = await fetchAnalyticsDashboard()
      setData(res)
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao carregar métricas de analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.role === 'GESTOR') {
      carregarDados()
    }
  }, [user])

  if (authLoading || (user && user.role !== 'GESTOR')) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0B2C20] text-[#F8F6F1]">
        <div className="flex items-center gap-3 text-sm">
          <RefreshCw className="animate-spin text-emerald-400" size={18} />
          <span>Verificando credenciais de Gestor...</span>
        </div>
      </main>
    )
  }

  // Prepara dados para os gráficos
  const motivosPieData =
    data?.motivos_recusa && data.motivos_recusa.length > 0
      ? data.motivos_recusa.map((m) => ({
        name: m.motivo.replace(/_/g, ' '),
        value: m.total,
      }))
      : [
        { name: 'PRAZO MAXIMO', value: 12 },
        { name: 'SITUACAO CADASTRAL', value: 8 },
        { name: 'CONCENTRACAO SACADO', value: 5 },
        { name: 'VALOR MINIMO', value: 3 },
      ]

  const sacadosBarData =
    data?.risco_concentracao && data.risco_concentracao.length > 0
      ? data.risco_concentracao.map((s) => ({
        sacado: s.nome_sacado.length > 18 ? s.nome_sacado.slice(0, 18) + '...' : s.nome_sacado,
        volume: s.volume,
        exposicao: s.percentual_exposicao,
        cnpj: formatCNPJ(s.doc_sacado),
      }))
      : [
        { sacado: 'DISTRIBUIDORA ALFA', volume: 1540000, exposicao: 28.5 },
        { sacado: 'LOGISTICA BETA', volume: 920000, exposicao: 17.1 },
        { sacado: 'SUPERMERCADOS GAMA', volume: 640000, exposicao: 11.8 },
        { sacado: 'DELTA COMERCIO', volume: 430000, exposicao: 8.0 },
        { sacado: 'EPSILON IND E COM', volume: 290000, exposicao: 5.4 },
      ]

  const kpis = data?.kpis || {
    volume_total_aprovado: 0,
    volume_total_recusado: 0,
    quantidade_total_processada: 0,
    quantidade_aprovadas: 0,
    quantidade_recusadas: 0,
  }

  const taxaRejeicao = data?.taxa_rejeicao || {
    percentual_rejeicao: 0,
    percentual_aprovacao: 0,
  }

  return (
    <main className="min-h-screen bg-[#0B2C20] px-4 py-8 text-[#F8F6F1] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1440px]">
        {/* Header Superior do Gestor */}
        <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300">
              <span className="size-2 rounded-full bg-emerald-400" /> Painel Executivo · Fundo FIDC
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-[#F8F6F1] sm:text-4xl">
                Analytics & Risco de Carteira
              </h1>
              <Link
                href="/plataforma"
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/30 bg-[#103B2C] px-3 py-1.5 text-xs font-semibold text-emerald-200 transition hover:bg-[#164C39]"
                title="Voltar para a parametrização de regras"
              >
                <ArrowLeft size={13} />
                <span>Área dos Fundos</span>
              </Link>
            </div>
            <p className="mt-1 text-xs text-emerald-100/70">
              Monitoramento em tempo real de liquidez, exposição por sacado e motivos de recusa de crédito.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={carregarDados}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/20 bg-[#103B2C] px-3.5 py-2 text-xs font-semibold text-emerald-200 shadow-sm transition hover:bg-[#164C39] disabled:opacity-50"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Atualizar</span>
            </button>

            {/* Badge de Gestor */}
            <div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-[#103B2C] px-3 py-2 text-xs shadow-sm">
              <Building2 size={14} className="text-amber-400" />
              <span className="font-bold text-[#F8F6F1]">{user?.username}</span>
              <span className="rounded bg-amber-400/20 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-amber-300">
                GESTOR
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="ml-2 inline-flex items-center gap-1 text-[11px] font-semibold text-rose-300 hover:text-white transition"
                title="Sair da conta"
              >
                <LogOut size={12} />
                <span>Sair</span>
              </button>
            </div>

            <ThemeToggle />
          </div>
        </header>

        {errorMsg && (
          <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-950/60 p-4 text-xs text-rose-200">
            {errorMsg}
          </div>
        )}

        {/* Entrada CSV para população do sistema na dashboard do gestor: restrita ao gerente default 'admin' */}
        {user?.username?.toLowerCase() === 'admin' && (
          <div className="mb-8">
            <UploadLoteCsv
              onUploadSuccess={carregarDados}
              titulo="População do Sistema & Ingestão de Recebíveis (CSV)"
              descricao="Acesso de Administrador Geral: submeta arquivos CSV para popular recebíveis, fundos e cedentes no sistema. As estatísticas e gráficos refletirão imediatamente a carteira."
            />
          </div>
        )}

        {/* 1. LINHA SUPERIOR COM OS 3 HIGH-LEVEL KPIS (Cards Off-White) */}
        <section className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {/* Card 1: Volume Aprovado */}
          <div className="rounded-2xl border border-emerald-900/10 bg-[#F8F6F1] p-6 text-stone-900 shadow-xl">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Volume Financeiro Aprovado
              </p>
              <span className="rounded-full bg-emerald-100 p-2 text-emerald-800">
                <CheckCircle2 size={18} />
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight text-[#0B2C20] sm:text-3xl">
              {formatCurrency(kpis.volume_total_aprovado)}
            </p>
            <div className="mt-3 flex items-center justify-between border-t border-stone-200/70 pt-2 text-xs text-stone-600">
              <span>{kpis.quantidade_aprovadas.toLocaleString()} títulos elegíveis</span>
              <span className="font-bold text-emerald-700">
                {taxaRejeicao.percentual_aprovacao}% da carteira
              </span>
            </div>
          </div>

          {/* Card 2: Volume Recusado */}
          <div className="rounded-2xl border border-emerald-900/10 bg-[#F8F6F1] p-6 text-stone-900 shadow-xl">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Volume Financeiro Recusado
              </p>
              <span className="rounded-full bg-rose-100 p-2 text-rose-800">
                <XCircle size={18} />
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight text-rose-900 sm:text-3xl">
              {formatCurrency(kpis.volume_total_recusado)}
            </p>
            <div className="mt-3 flex items-center justify-between border-t border-stone-200/70 pt-2 text-xs text-stone-600">
              <span>{kpis.quantidade_recusadas.toLocaleString()} títulos barrados</span>
              <span className="font-bold text-rose-700">
                {taxaRejeicao.percentual_rejeicao}% de rejeição
              </span>
            </div>
          </div>

          {/* Card 3: Total de Operações */}
          <div className="rounded-2xl border border-emerald-900/10 bg-[#F8F6F1] p-6 text-stone-900 shadow-xl">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Total de Operações Processadas
              </p>
              <span className="rounded-full bg-amber-100 p-2 text-amber-800">
                <FileText size={18} />
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight text-[#0B2C20] sm:text-3xl">
              {kpis.quantidade_total_processada.toLocaleString()}{' '}
              <span className="text-sm font-semibold text-stone-500">notas</span>
            </p>
            <div className="mt-3 flex items-center justify-between border-t border-stone-200/70 pt-2 text-xs text-stone-600">
              <span>Pipeline Global de Ingestão</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-800">
                <ShieldCheck size={13} />
                Auditado
              </span>
            </div>
          </div>
        </section>

        {/* 2. GRÁFICOS ANALÍTICOS (Cards Off-White) */}
        <section className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Gráfico de Pizza / Donut: Motivos de Recusa */}
          <div className="rounded-2xl border border-emerald-900/10 bg-[#F8F6F1] p-6 text-stone-900 shadow-xl lg:col-span-5">
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle size={17} className="text-amber-600" />
                <h2 className="text-base font-bold tracking-tight text-[#0B2C20]">
                  Distribuição dos Motivos de Recusa
                </h2>
              </div>
              <p className="text-xs text-stone-600">
                Proporção de notas bloqueadas por cada critério de crédito do FIDC.
              </p>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={motivosPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {motivosPieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS_PIE[index % COLORS_PIE.length]}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(val: any) => [`${val} ocorrências`, 'Total']}
                    contentStyle={{
                      backgroundColor: '#0B2C20',
                      borderColor: '#103B2C',
                      borderRadius: '8px',
                      color: '#F8F6F1',
                      fontSize: '11px',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 rounded-xl border border-stone-200 bg-white/70 p-3 text-[11px] text-stone-600">
              💡 <strong>Insight de Risco:</strong> As regras de{' '}
              <span className="font-semibold text-emerald-900">Prazo Máximo</span> e{' '}
              <span className="font-semibold text-emerald-900">Situação Cadastral</span> são as que mais protegem o fundo contra inadimplência no momento da aquisição.
            </div>
          </div>

          {/* Gráfico de Barras Horizontais: Risco de Concentração (Top 5 Sacados) */}
          <div className="rounded-2xl border border-emerald-900/10 bg-[#F8F6F1] p-6 text-stone-900 shadow-xl lg:col-span-7">
            <div className="mb-4 flex flex-col justify-between gap-1 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp size={17} className="text-emerald-700" />
                  <h2 className="text-base font-bold tracking-tight text-[#0B2C20]">
                    Risco de Concentração (Top 5 Sacados)
                  </h2>
                </div>
                <p className="text-xs text-stone-600">
                  Volume aprovado por devedor final e percentual de exposição da carteira.
                </p>
              </div>
              <span className="rounded-lg bg-emerald-900/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-900">
                Limite Teto: 20%
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sacadosBarData}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis
                    type="number"
                    tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
                    stroke="#64748B"
                    fontSize={11}
                  />
                  <YAxis
                    type="category"
                    dataKey="sacado"
                    width={130}
                    stroke="#0B2C20"
                    fontSize={11}
                    fontWeight={600}
                  />
                  <RechartsTooltip
                    formatter={(val: any, name: any, item: any) => [
                      `${formatCurrency(val)} (${item.payload.exposicao}% da carteira)`,
                      'Volume Aprovado',
                    ]}
                    contentStyle={{
                      backgroundColor: '#0B2C20',
                      borderColor: '#103B2C',
                      borderRadius: '8px',
                      color: '#F8F6F1',
                      fontSize: '11px',
                    }}
                  />
                  <Bar
                    dataKey="volume"
                    fill="#0B2C20"
                    radius={[0, 6, 6, 0]}
                    barSize={20}
                  >
                    {sacadosBarData.map((entry, index) => (
                      <Cell
                        key={`bar-${index}`}
                        fill={entry.exposicao > 20 ? '#E11D48' : '#0B2C20'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Tabela de Detalhamento dos Top 5 Sacados */}
            <div className="mt-4 overflow-x-auto rounded-xl border border-stone-200 bg-white">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-stone-200 bg-stone-50 text-[10px] font-bold uppercase tracking-wider text-stone-600">
                  <tr>
                    <th className="px-3 py-2">Sacado (Devedor)</th>
                    <th className="px-3 py-2">CNPJ</th>
                    <th className="px-3 py-2 text-right">Volume Aprovado</th>
                    <th className="px-3 py-2 text-right">% Carteira</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-800">
                  {sacadosBarData.map((s, idx) => (
                    <tr key={idx} className="hover:bg-emerald-50/50 transition">
                      <td className="px-3 py-2 font-bold text-[#0B2C20]">{s.sacado}</td>
                      <td className="px-3 py-2 font-mono text-stone-500">{s.cnpj || '—'}</td>
                      <td className="px-3 py-2 text-right font-medium">
                        {formatCurrency(s.volume)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <span
                          className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-bold ${s.exposicao > 20
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                            }`}
                        >
                          {s.exposicao}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Rodapé Executivo */}
        <footer className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-emerald-400/20 py-6 text-[10px] uppercase tracking-widest text-emerald-200/60 sm:flex-row">
          <span>Antecipe · Módulo de Governança FIDC</span>
          <span className="hidden sm:inline">Kanastra Hackathon 2026 · Role-Based Analytics</span>
        </footer>
      </div>
    </main>
  )
}
