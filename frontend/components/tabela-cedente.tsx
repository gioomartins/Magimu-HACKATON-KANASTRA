'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsLeft,
  ChevronsRight,
  FileUp,
  Filter,
  RefreshCw,
  RotateCcw,
  Search,
  Upload,
  X,
} from 'lucide-react'
import { fetchRecebiveis, RecebivelItem, uploadCSV } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { DEMO_RECEBIVEIS } from '@/lib/demo-data'

type SortColumn =
  | 'nu_documento'
  | 'nome_fundo'
  | 'nome_sacado'
  | 'data_vencimento_original'
  | 'valor_nominal'
  | 'status'

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

export function TabelaCedente({
  tipo = 'cedente',
  titulo,
  subtitulo,
}: {
  tipo?: 'cedente' | 'fundo'
  titulo?: string
  subtitulo?: string
}) {
  const { user, isDemo } = useAuth()
  const inputRef = useRef<HTMLInputElement>(null)
  const [items, setItems] = useState<RecebivelItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)
  const [toastIgnorados, setToastIgnorados] = useState<{ total: number; mensagem: string } | null>(null)

  // Filtros
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'APROVADO' | 'BARRADO'>('TODOS')
  const [filtroDoc, setFiltroDoc] = useState('')
  const [filtroSacado, setFiltroSacado] = useState('')
  const [filtroFundo, setFiltroFundo] = useState('')

  // Auto-dismiss do pop-up vermelho de canto de tela após 6 segundos
  useEffect(() => {
    if (toastIgnorados) {
      const timer = setTimeout(() => {
        setToastIgnorados(null)
      }, 6000)
      return () => clearTimeout(timer)
    }
  }, [toastIgnorados])

  // Ordenação
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null)

  // Linhas expandidas (toggles de detalhes e explicação de recusa)
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({})

  const pageSize = 20

  const carregarDados = async () => {
    setLoading(true)
    if (isDemo || user?.username?.startsWith('demo_')) {
      let filtered = [...DEMO_RECEBIVEIS]
      if (statusFilter !== 'TODOS') {
        filtered = filtered.filter((i) => i.status === statusFilter)
      }
      if (filtroDoc) {
        filtered = filtered.filter((i) =>
          i.nu_documento.toLowerCase().includes(filtroDoc.toLowerCase())
        )
      }
      setItems(filtered)
      setTotalCount(filtered.length)
      setLoading(false)
      return
    }

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

  const handleToggleSort = (col: SortColumn) => {
    if (sortColumn !== col) {
      setSortColumn(col)
      setSortDirection('asc')
    } else {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    }
  }

  const handleResetSort = () => {
    setSortColumn(null)
    setSortDirection(null)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadMsg(null)
    setToastIgnorados(null)
    try {
      const res = await uploadCSV(file)
      const aprovados = res.lote?.total_aprovados ?? 0
      const barrados = res.lote?.total_barrados ?? 0
      const ignorados = res.total_ignorados ?? 0

      setUploadMsg({
        tipo: 'ok',
        texto: `Lote processado com sucesso! ${aprovados} aprovados, ${barrados} recusados/duplicados.`,
      })

      // Se houver registros ignorados por não coincidirem com o CNPJ cadastrado, dispara o pop-up vermelho
      if (ignorados > 0) {
        const papelStr = tipo === 'fundo' ? 'fundo' : 'cedente'
        setToastIgnorados({
          total: ignorados,
          mensagem: `${ignorados} recebíveis foram ignorados por pertencerem a outros CNPJs e não coincidirem com seu CNPJ de ${papelStr} cadastrado.`,
        })
      }

      setPage(1)
      await carregarDados()
    } catch (err: any) {
      setUploadMsg({
        tipo: 'erro',
        texto: `Erro no envio: ${err.message || 'Falha ao processar arquivo'}`,
      })
    } finally {
      setUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  // Filtragem local complementar para Sacado e Fundo + Ordenação customizada
  const sortedAndFilteredList = useMemo(() => {
    const list = items.filter((item) => {
      const matchSacado = !filtroSacado || item.nome_sacado.toLowerCase().includes(filtroSacado.toLowerCase())
      const matchFundo = !filtroFundo || item.nome_fundo.toLowerCase().includes(filtroFundo.toLowerCase())
      return matchSacado && matchFundo
    })

    if (!sortColumn || !sortDirection) {
      return list
    }

    const parseDateValue = (str: string) => {
      if (!str) return 0
      if (str.includes('/')) {
        const [d, m, y] = str.split('/')
        return new Date(Number(y), Number(m) - 1, Number(d)).getTime()
      }
      return new Date(str).getTime()
    }

    return [...list].sort((a, b) => {
      let comparison = 0

      switch (sortColumn) {
        case 'valor_nominal': {
          const valA = parseFloat(a.valor_nominal) || 0
          const valB = parseFloat(b.valor_nominal) || 0
          comparison = valA - valB
          break
        }
        case 'data_vencimento_original': {
          const dateA = parseDateValue(a.data_vencimento_original)
          const dateB = parseDateValue(b.data_vencimento_original)
          comparison = dateA - dateB
          break
        }
        case 'status': {
          // No primeiro clique (asc), aprovados vêm primeiro
          const rankA = a.status === 'APROVADO' ? 0 : 1
          const rankB = b.status === 'APROVADO' ? 0 : 1
          comparison = rankA - rankB
          break
        }
        case 'nu_documento': {
          comparison = a.nu_documento.localeCompare(b.nu_documento, undefined, { numeric: true })
          break
        }
        case 'nome_fundo': {
          comparison = a.nome_fundo.localeCompare(b.nome_fundo, undefined, { sensitivity: 'base' })
          break
        }
        case 'nome_sacado': {
          comparison = a.nome_sacado.localeCompare(b.nome_sacado, undefined, { sensitivity: 'base' })
          break
        }
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [items, filtroSacado, filtroFundo, sortColumn, sortDirection])

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  // Totais da página atual para simulação
  const totalLiquidoAprovado = useMemo(() => {
    return items
      .filter((i) => i.status === 'APROVADO')
      .reduce((acc, curr) => acc + (parseFloat(curr.valor_liquido || '0') || 0), 0)
  }, [items])

  const headerTitle =
    titulo ||
    (tipo === 'fundo'
      ? user?.nome
        ? `Carteira de Recebíveis · ${user.nome}`
        : 'Carteira de Recebíveis do Fundo'
      : user?.nome
      ? `Carteira de Notas · ${user.nome}`
      : 'Carteira de Notas Submetidas')

  const headerSubtitle =
    subtitulo ||
    (tipo === 'fundo'
      ? user?.cnpj
        ? `Fundo Gestor · CNPJ: ${user.cnpj}`
        : 'Visão do Gestor FIDC'
      : user?.cnpj
      ? `Cedente · CNPJ: ${user.cnpj}`
      : 'Visão do Cedente')

  return (
    <div className="space-y-6">
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
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">{headerSubtitle}</p>
            <h3 className="text-xl font-bold text-stone-800">{headerTitle}</h3>
          </div>

          {/* Filtros Rápidos & Ações no Canto Superior Direito */}
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

            {/* Botão de Envio de CSV interno da Área do Cedente ou Fundo */}
            {user && (
              <>
                <input
                  type="file"
                  ref={inputRef}
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={uploading}
                  title={`Submeter lote CSV de recebíveis do seu ${tipo === 'fundo' ? 'fundo' : 'cedente'}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#0b2c20] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#124231] disabled:opacity-50 transition"
                >
                  <Upload size={13} className={uploading ? 'animate-bounce' : ''} />
                  <span>{uploading ? 'Enviando...' : 'Enviar CSV'}</span>
                </button>
              </>
            )}

            {/* Botão de Reverter Ordem no canto superior direito da tabela */}
            <button
              type="button"
              onClick={handleResetSort}
              disabled={!sortColumn && !sortDirection}
              title="Reverter ordenação para ordem original"
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                sortColumn
                  ? 'border-emerald-700/30 bg-emerald-900/10 text-emerald-900 hover:bg-emerald-900/20 shadow-sm'
                  : 'border-stone-200 bg-stone-100 text-stone-400 cursor-not-allowed opacity-60'
              }`}
            >
              <RotateCcw size={13} className={sortColumn ? 'text-emerald-700' : 'text-stone-400'} />
              <span>Reverter ordem</span>
            </button>
          </div>
        </div>

        {/* Mensagem de Feedback de Upload Interno */}
        {uploadMsg && (
          <div
            className={`mb-4 flex items-center justify-between gap-2 rounded-xl p-3 text-xs font-medium border ${
              uploadMsg.tipo === 'ok'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-rose-200 bg-rose-50 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {uploadMsg.tipo === 'ok' ? (
                <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
              ) : (
                <AlertCircle size={16} className="text-rose-600 shrink-0" />
              )}
              <span>{uploadMsg.texto}</span>
            </div>
            <button
              type="button"
              onClick={() => setUploadMsg(null)}
              className="text-stone-400 hover:text-stone-600"
            >
              <X size={14} />
            </button>
          </div>
        )}

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
            {/* Header com botões de Toggle de Ordenação */}
            <div className="grid grid-cols-[1.2fr_1.8fr_1.8fr_1.1fr_1.2fr_1fr_0.8fr] border-b border-stone-200/80 px-4 pb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">
              <div className="flex items-center gap-1.5">
                <span>Nota</span>
                <button
                  type="button"
                  onClick={() => handleToggleSort('nu_documento')}
                  className={`rounded p-1 transition hover:bg-stone-200/70 ${
                    sortColumn === 'nu_documento' ? 'text-[#0b2c20] bg-stone-200/80 font-extrabold' : 'text-stone-400'
                  }`}
                  title="Ordenar por Nota"
                >
                  {sortColumn === 'nu_documento' ? (
                    sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                  ) : (
                    <ArrowUpDown size={12} />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <span>Fundo</span>
                <button
                  type="button"
                  onClick={() => handleToggleSort('nome_fundo')}
                  className={`rounded p-1 transition hover:bg-stone-200/70 ${
                    sortColumn === 'nome_fundo' ? 'text-[#0b2c20] bg-stone-200/80 font-extrabold' : 'text-stone-400'
                  }`}
                  title="Ordenar por Fundo"
                >
                  {sortColumn === 'nome_fundo' ? (
                    sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                  ) : (
                    <ArrowUpDown size={12} />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <span>Sacado</span>
                <button
                  type="button"
                  onClick={() => handleToggleSort('nome_sacado')}
                  className={`rounded p-1 transition hover:bg-stone-200/70 ${
                    sortColumn === 'nome_sacado' ? 'text-[#0b2c20] bg-stone-200/80 font-extrabold' : 'text-stone-400'
                  }`}
                  title="Ordenar por Sacado"
                >
                  {sortColumn === 'nome_sacado' ? (
                    sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                  ) : (
                    <ArrowUpDown size={12} />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <span>Vencimento</span>
                <button
                  type="button"
                  onClick={() => handleToggleSort('data_vencimento_original')}
                  className={`rounded p-1 transition hover:bg-stone-200/70 ${
                    sortColumn === 'data_vencimento_original' ? 'text-[#0b2c20] bg-stone-200/80 font-extrabold' : 'text-stone-400'
                  }`}
                  title="Ordenar por Vencimento"
                >
                  {sortColumn === 'data_vencimento_original' ? (
                    sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                  ) : (
                    <ArrowUpDown size={12} />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <span>Valor Nominal</span>
                <button
                  type="button"
                  onClick={() => handleToggleSort('valor_nominal')}
                  className={`rounded p-1 transition hover:bg-stone-200/70 ${
                    sortColumn === 'valor_nominal' ? 'text-[#0b2c20] bg-stone-200/80 font-extrabold' : 'text-stone-400'
                  }`}
                  title="Ordenar por Valor Nominal"
                >
                  {sortColumn === 'valor_nominal' ? (
                    sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                  ) : (
                    <ArrowUpDown size={12} />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <span>Status</span>
                <button
                  type="button"
                  onClick={() => handleToggleSort('status')}
                  className={`rounded p-1 transition hover:bg-stone-200/70 ${
                    sortColumn === 'status' ? 'text-[#0b2c20] bg-stone-200/80 font-extrabold' : 'text-stone-400'
                  }`}
                  title="Ordenar por Status (Aprovados primeiro / Recusadas primeiro)"
                >
                  {sortColumn === 'status' ? (
                    sortDirection === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                  ) : (
                    <ArrowUpDown size={12} />
                  )}
                </button>
              </div>

              <span className="text-right">Detalhes</span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-stone-500">Carregando notas...</div>
            ) : sortedAndFilteredList.length === 0 ? (
              <div className="py-12 text-center text-xs text-stone-500">Nenhum recebível encontrado com os filtros aplicados.</div>
            ) : (
              sortedAndFilteredList.map((item) => {
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

        {/* Paginação Inteligente */}
        <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-stone-200 pt-4 sm:flex-row">
          <p className="text-xs text-stone-500">
            Total de {totalCount.toLocaleString('pt-BR')} registros · Página {page} de {totalPages} (20 por página)
          </p>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* Primeira Página */}
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage(1)}
              title="Primeira Página"
              className="flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40 transition"
            >
              <ChevronsLeft size={14} />
              <span className="hidden md:inline">Primeira</span>
            </button>

            {/* Página Anterior */}
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              title="Página Anterior"
              className="flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40 transition"
            >
              <ChevronLeft size={14} />
              <span className="hidden md:inline">Anterior</span>
            </button>

            {/* Números das Páginas: Antecessora, Atual, Sucessora */}
            <div className="flex items-center gap-1 px-1">
              {/* Página Antecessora (link/botão clicável) */}
              {page > 1 && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setPage(page - 1)}
                  title={`Ir para a página ${page - 1}`}
                  className="min-w-[32px] rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition"
                >
                  {page - 1}
                </button>
              )}

              {/* Página Atual (destaque ativo) */}
              <span
                aria-current="page"
                className="min-w-[32px] rounded-md bg-[#0b2c20] px-2.5 py-1.5 text-center text-xs font-bold text-white shadow-sm"
              >
                {page}
              </span>

              {/* Página Sucessora (link/botão clicável) */}
              {page < totalPages && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setPage(page + 1)}
                  title={`Ir para a página ${page + 1}`}
                  className="min-w-[32px] rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-100 hover:text-stone-900 transition"
                >
                  {page + 1}
                </button>
              )}
            </div>

            {/* Próxima Página */}
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              title="Próxima Página"
              className="flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40 transition"
            >
              <span className="hidden md:inline">Próxima</span>
              <ChevronRight size={14} />
            </button>

            {/* Última Página */}
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage(totalPages)}
              title="Última Página"
              className="flex items-center gap-1 rounded-md border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-40 transition"
            >
              <span className="hidden md:inline">Última</span>
              <ChevronsRight size={14} />
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

      {/* Pop-up de canto de tela (Toast Vermelho) com auto-dismiss para registros ignorados por CNPJ diferente */}
      {toastIgnorados && (
        <aside
          role="alert"
          aria-live="assertive"
          className="fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl border border-rose-500/30 bg-rose-950/95 p-4 text-white shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-5 duration-300"
        >
          <div className="flex items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-rose-600/30 text-rose-300">
              <AlertTriangle size={18} />
            </div>
            <div className="flex-1 pr-1">
              <p className="text-xs font-bold uppercase tracking-wider text-rose-300">
                Registros Ignorados no Upload
              </p>
              <p className="mt-1 text-xs leading-relaxed text-rose-100">
                {toastIgnorados.mensagem}
              </p>
              <p className="mt-1.5 text-[10px] text-rose-300/70">
                Esta notificação desaparecerá automaticamente em alguns segundos.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setToastIgnorados(null)}
              className="rounded-lg p-1 text-rose-300 hover:bg-rose-900/60 hover:text-white transition"
              aria-label="Fechar aviso"
            >
              <X size={15} />
            </button>
          </div>
        </aside>
      )}
    </div>
  )
}
