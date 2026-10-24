'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  ArrowUpDown,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  FileUp,
  Filter,
  RefreshCw,
  Search,
  Upload,
  X,
} from 'lucide-react'
import { fetchRecebiveis, RecebivelItem, uploadCSV } from '@/lib/api'

function MetricCard({
  label,
  value,
  detail,
  tone = 'default',
}: {
  label: string
  value: string
  detail: string
  tone?: 'default' | 'positive' | 'negative'
}) {
  return (
    <article className="rounded-xl border border-stone-200/80 bg-[#f8f6f1] p-5 shadow-[0_8px_24px_rgba(14,42,31,0.06)]">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">{label}</p>
        <span className="flex size-7 items-center justify-center rounded-full bg-stone-200/70 text-stone-500">
          <ArrowUpRight size={14} />
        </span>
      </div>
      <p
        className={`text-2xl font-semibold tracking-tight ${
          tone === 'positive' ? 'text-emerald-700' : tone === 'negative' ? 'text-rose-600' : 'text-stone-800'
        }`}
      >
        {value}
      </p>
      <p className="mt-2 text-xs text-stone-500">{detail}</p>
    </article>
  )
}

export function TabelaCedente() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [items, setItems] = useState<RecebivelItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState<string | null>(null)

  // Filtros
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'APROVADO' | 'BARRADO'>('TODOS')
  const [filtroDoc, setFiltroDoc] = useState('')
  const [filtroSacado, setFiltroSacado] = useState('')
  const [filtroFundo, setFiltroFundo] = useState('')

  // Linhas expandidas (toggles de detalhes e explicação de recusa)
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({})

  const pageSize = 20

  const carregarDados = async () => {
    setLoading(true)
    try {
      const res = await fetchRecebiveis({
        page,
        status: statusFilter,
        nu_documento: filtroDoc,
      })
      setItems(res.results || [])
      setTotalCount(res.count || 0)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [page, statusFilter])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    carregarDados()
  }

  const toggleRow = (id: number) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadMsg('Enviando e validando lote de recebíveis...')
    try {
      const res = await uploadCSV(file)
      setUploadMsg(
        `Lote processado! ${res.lote.total_aprovados} aprovados, ${res.lote.total_barrados} recusados/duplicados.`
      )
      setPage(1)
      carregarDados()
    } catch (err: any) {
      setUploadMsg(`Erro no envio: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  // Filtragem local complementar para Sacado e Fundo
  const filteredList = useMemo(() => {
    return items.filter((item) => {
      const matchSacado = !filtroSacado || item.nome_sacado.toLowerCase().includes(filtroSacado.toLowerCase())
      const matchFundo = !filtroFundo || item.nome_fundo.toLowerCase().includes(filtroFundo.toLowerCase())
      return matchSacado && matchFundo
    })
  }, [items, filtroSacado, filtroFundo])

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  // Totais da página atual para simulação
  const totalLiquidoAprovado = useMemo(() => {
    return items
      .filter((i) => i.status === 'APROVADO')
      .reduce((acc, curr) => acc + (parseFloat(curr.valor_liquido || '0') || 0), 0)
  }, [items])

  return (
    <div className="space-y-6">
      {/* Upload de CSV com verificação de duplicidade */}
      <section className="rounded-2xl border border-emerald-200/15 bg-[#103b2c] p-5 sm:p-6 text-stone-100 shadow-md">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
              <FileUp size={22} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#f8f6f1]">Submeter Notas / Recebíveis</h2>
              <p className="mt-0.5 text-xs text-emerald-100/60">
                Formato CSV com separador ponto e vírgula (;) · Duplicatas serão barradas ou atualizadas conforme regras.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-2 rounded-lg bg-[#f8f6f1] px-4 py-2.5 text-xs font-bold text-[#0b2c20] transition hover:bg-white disabled:opacity-50"
            >
              <Upload size={15} /> {uploading ? 'Processando lote...' : 'Upload de Lote (CSV)'}
            </button>
            <input ref={inputRef} type="file" accept=".csv" onChange={handleFileUpload} className="sr-only" />
          </div>
        </div>

        {uploadMsg && (
          <div className="mt-3 rounded-lg border border-emerald-300/20 bg-emerald-950/60 p-3 text-xs text-emerald-200">
            {uploadMsg}
          </div>
        )}
      </section>

      {/* Cards de Métricas */}
      <div className="grid gap-3 md:grid-cols-3">
        <MetricCard label="Notas no Sistema" value={totalCount.toLocaleString('pt-BR')} detail="recebíveis catalogados" />
        <MetricCard
          label="Total Aprovado na Página"
          value={`R$ ${totalLiquidoAprovado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          detail="valor líquido pronto para antecipação"
          tone="positive"
        />
        <MetricCard
          label="Status Geral"
          value={items.filter((i) => i.status === 'BARRADO').length.toString()}
          detail="notas recusadas nesta página"
          tone="negative"
        />
      </div>

      {/* Área da Tabela de Recebíveis */}
      <section className="rounded-2xl bg-[#f8f6f1] p-5 text-stone-800 shadow-[0_20px_60px_rgba(0,0,0,0.14)] sm:p-7">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">Visão do Cedente</p>
            <h3 className="text-xl font-bold text-stone-800">Carteira de Notas Submetidas</h3>
          </div>

          {/* Filtros Rápidos */}
          <div className="flex flex-wrap items-center gap-2">
            {(['TODOS', 'APROVADO', 'BARRADO'] as const).map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st)
                  setPage(1)
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  statusFilter === st
                    ? 'bg-[#0b2c20] text-white'
                    : 'border border-stone-200 bg-white text-stone-600 hover:bg-stone-100'
                }`}
              >
                {st === 'TODOS' ? 'Todas' : st === 'APROVADO' ? 'Aprovadas' : 'Recusadas'}
              </button>
            ))}

            <button
              onClick={carregarDados}
              title="Recarregar dados"
              className="rounded-lg border border-stone-200 bg-white p-2 text-stone-600 hover:bg-stone-100"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Barra de Busca e Filtros de Coluna */}
        <form onSubmit={handleSearch} className="mb-6 grid gap-3 rounded-xl border border-stone-200 bg-stone-50/70 p-3 sm:grid-cols-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-3 text-stone-400" />
            <input
              type="text"
              placeholder="Filtrar por Nº Nota..."
              value={filtroDoc}
              onChange={(e) => setFiltroDoc(e.target.value)}
              className="w-full rounded-lg border border-stone-200 bg-white py-2 pl-8 pr-3 text-xs text-stone-700"
            />
          </div>

          <div>
            <input
              type="text"
              placeholder="Filtrar por Sacado..."
              value={filtroSacado}
              onChange={(e) => setFiltroSacado(e.target.value)}
              className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs text-stone-700"
            />
          </div>

          <div>
            <input
              type="text"
              placeholder="Filtrar por Fundo..."
              value={filtroFundo}
              onChange={(e) => setFiltroFundo(e.target.value)}
              className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs text-stone-700"
            />
          </div>
        </form>

        {/* Tabela de Notas */}
        <div className="overflow-x-auto">
          <div className="min-w-[850px]">
            {/* Header */}
            <div className="grid grid-cols-[1.2fr_1.8fr_1.8fr_1fr_1.1fr_1fr_0.8fr] border-b border-stone-200/80 px-4 pb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
              <span>Nota</span>
              <span>Fundo</span>
              <span>Sacado</span>
              <span>Vencimento</span>
              <span>Valor Nominal</span>
              <span>Status</span>
              <span className="text-right">Detalhes</span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-stone-500">Carregando notas...</div>
            ) : filteredList.length === 0 ? (
              <div className="py-12 text-center text-xs text-stone-500">Nenhum recebível encontrado com os filtros aplicados.</div>
            ) : (
              filteredList.map((item) => {
                const isOpen = !!expandedRows[item.id]
                const isAprovado = item.status === 'APROVADO'

                return (
                  <div key={item.id} className="border-b border-stone-200/60 transition hover:bg-stone-50/60">
                    <div className="grid grid-cols-[1.2fr_1.8fr_1.8fr_1fr_1.1fr_1fr_0.8fr] items-center px-4 py-3.5 text-xs text-stone-700">
                      <span className="font-bold text-stone-900">{item.nu_documento}</span>
                      <span className="truncate pr-2 font-medium" title={item.nome_fundo}>
                        {item.nome_fundo}
                      </span>
                      <span className="truncate pr-2" title={item.nome_sacado}>
                        {item.nome_sacado}
                      </span>
                      <span>{item.data_vencimento_original}</span>
                      <span className="font-semibold text-stone-900">
                        R$ {parseFloat(item.valor_nominal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            isAprovado ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {isAprovado ? <Check size={11} /> : <X size={11} />}
                          {isAprovado ? 'Aprovada' : 'Recusada'}
                        </span>
                      </span>

                      <div className="text-right">
                        <button
                          type="button"
                          onClick={() => toggleRow(item.id)}
                          className="inline-flex items-center gap-1 rounded-md border border-stone-200 px-2 py-1 text-[11px] font-semibold text-stone-600 hover:bg-stone-200/50"
                        >
                          {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          {isOpen ? 'Ocultar' : 'Ver'}
                        </button>
                      </div>
                    </div>

                    {/* Toggle Expansível: Detalhes e Explicação de Recusa */}
                    {isOpen && (
                      <div className="border-t border-stone-100 bg-stone-100/40 p-4">
                        <div className="grid gap-3 text-xs md:grid-cols-4">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-stone-500">Cedente:</span>
                            <p className="font-medium text-stone-800">{item.nome_cedente}</p>
                            <p className="text-[10px] text-stone-500">{item.doc_cedente}</p>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-stone-500">CNPJ Sacado:</span>
                            <p className="font-medium text-stone-800">{item.doc_sacado}</p>
                            <p className="text-[10px] text-stone-500">Tipo: {item.tipo_recebivel}</p>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-stone-500">Prazo / Aquisição:</span>
                            <p className="font-medium text-stone-800">
                              {item.prazo_dias ? `${item.prazo_dias} dias até vencer` : '-'}
                            </p>
                            <p className="text-[10px] text-stone-500">Comprado em: {item.data_aquisicao}</p>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-stone-500">Precificação Líquida:</span>
                            {isAprovado ? (
                              <p className="text-sm font-bold text-emerald-700">
                                R$ {parseFloat(item.valor_liquido || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                <span className="block text-[10px] font-normal text-stone-500">
                                  Desconto: R$ {parseFloat(item.desconto || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              </p>
                            ) : (
                              <p className="text-xs text-stone-400">Sem valor líquido (recusada)</p>
                            )}
                          </div>
                        </div>

                        {/* Bloco de Explicação Clara em caso de Recusa */}
                        {!isAprovado && (
                          <div className="mt-3 flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-rose-500" />
                            <div>
                              <span className="font-bold">Motivo da Recusa pelas Regras do Fundo:</span>
                              <p className="mt-0.5 leading-relaxed">
                                {item.motivo_recusa ||
                                  (item.barrado_por && item.barrado_por.length > 0
                                    ? `Violou as seguintes restrições: ${item.barrado_por.join(', ')}.`
                                    : 'Esta nota não atendeu aos critérios mínimos de elegibilidade do fundo.')}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Paginação de 20 em 20 */}
        <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-stone-200 pt-4 sm:flex-row">
          <p className="text-xs text-stone-500">
            Total de {totalCount.toLocaleString('pt-BR')} registros · Página {page} de {totalPages} (20 por página)
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-40"
            >
              <ChevronLeft size={14} /> Anterior
            </button>

            <span className="px-3 text-xs font-bold text-stone-800">{page}</span>

            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
              className="flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-40"
            >
              Próxima <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Simulação Final Sticky */}
        <div className="mt-8 flex flex-col justify-between gap-4 rounded-xl bg-[#0b2c20] p-5 text-[#f8f6f1] sm:flex-row sm:items-center">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300/80">Simulação de Liquidação Imediata</p>
            <p className="mt-0.5 text-xs text-emerald-100/60">Total líquido calculado com desconto proporcional ao vencimento</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-emerald-100/60">Total Líquido a Receber (Página Atual)</p>
            <p className="mt-0.5 text-2xl font-bold tracking-tight text-emerald-300">
              R$ {totalLiquidoAprovado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
