'use client'

import { useMemo, useRef, useState } from 'react'
import { AlertTriangle, ArrowUpDown, ArrowUpRight, Check, ChevronDown, ChevronLeft, ChevronRight, FileUp, SlidersHorizontal, Upload, X } from 'lucide-react'

type Receivable = { id: string; payer: string; due: string; value: string; status: 'Aprovada' | 'Recusada' }

const receivables: Receivable[] = [
  { id: 'NF 0142', payer: 'Loja Aurora', due: '30 dias', value: 'R$ 10.000,00', status: 'Aprovada' },
  { id: 'NF 0148', payer: 'Comercial Norte', due: '45 dias', value: 'R$ 8.750,00', status: 'Aprovada' },
  { id: 'NF 0152', payer: 'Grupo Horizonte', due: '30 dias', value: 'R$ 12.500,00', status: 'Aprovada' },
  { id: 'NF 0157', payer: 'Mercado Sol', due: '90 dias', value: 'R$ 4.500,00', status: 'Recusada' },
  { id: 'NF 0161', payer: 'Padaria Central', due: '60 dias', value: 'R$ 6.200,00', status: 'Aprovada' },
  { id: 'NF 0168', payer: 'Rede Ponto', due: '45 dias', value: 'R$ 7.840,00', status: 'Aprovada' },
  { id: 'NF 0174', payer: 'Atacado Vale', due: '90 dias', value: 'R$ 5.300,00', status: 'Recusada' },
  { id: 'NF 0181', payer: 'Casa Verde', due: '30 dias', value: 'R$ 11.200,00', status: 'Aprovada' },
  { id: 'NF 0188', payer: 'Distribuidora Sul', due: '60 dias', value: 'R$ 9.100,00', status: 'Aprovada' },
  { id: 'NF 0193', payer: 'Mercantil Brasil', due: '45 dias', value: 'R$ 6.450,00', status: 'Aprovada' },
  { id: 'NF 0201', payer: 'Supermercado Leste', due: '90 dias', value: 'R$ 3.900,00', status: 'Recusada' },
  { id: 'NF 0208', payer: 'Oficina Central', due: '30 dias', value: 'R$ 4.780,00', status: 'Aprovada' },
]

function MetricCard({ label, value, detail, tone = 'default' }: { label: string; value: string; detail: string; tone?: 'default' | 'positive' | 'negative' }) {
  return (
    <article className="rounded-xl border border-stone-200/80 bg-[#f8f6f1] p-5 shadow-[0_8px_24px_rgba(14,42,31,0.06)]">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">{label}</p>
        <span className="flex size-7 items-center justify-center rounded-full bg-stone-200/70 text-stone-500"><ArrowUpRight size={14} /></span>
      </div>
      <p className={`text-2xl font-semibold tracking-tight ${tone === 'positive' ? 'text-emerald-700' : tone === 'negative' ? 'text-rose-600' : 'text-stone-800'}`}>{value}</p>
      <p className="mt-2 text-xs text-stone-500">{detail}</p>
    </article>
  )
}

export function AntecipeDashboard() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')
  const [progress, setProgress] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [showExplanation, setShowExplanation] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'Todos' | Receivable['status']>('Todos')
  const [dueFilter, setDueFilter] = useState('Todos')
  const [sortKey, setSortKey] = useState<keyof Receivable>('id')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(1)
  const pageSize = 5

  const filteredReceivables = useMemo(() => {
    const filtered = receivables.filter((item) => (statusFilter === 'Todos' || item.status === statusFilter) && (dueFilter === 'Todos' || item.due === dueFilter))
    return [...filtered].sort((a, b) => {
      const comparison = a[sortKey].localeCompare(b[sortKey], 'pt-BR', { numeric: true })
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [dueFilter, sortDirection, sortKey, statusFilter])

  const pageCount = Math.max(1, Math.ceil(filteredReceivables.length / pageSize))
  const visibleReceivables = filteredReceivables.slice((page - 1) * pageSize, page * pageSize)
  const updateFilter = (setter: (value: string) => void, value: string) => { setter(value); setPage(1) }
  const toggleSort = (key: keyof Receivable) => { setSortDirection(sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc'); setSortKey(key) }

  const processFile = (file?: File) => {
    if (!file || !file.name.toLowerCase().endsWith('.csv')) return
    setFileName(file.name)
    setProgress(0)
    let current = 0
    const timer = window.setInterval(() => {
      current += 20
      setProgress(Math.min(current, 100))
      if (current >= 100) window.clearInterval(timer)
    }, 120)
  }

  return (
    <main className="min-h-screen bg-[#0b2c20] text-stone-100">
      <div className="mx-auto max-w-[1440px] px-5 py-6 sm:px-8 lg:px-12 lg:py-9">
        <header className="mb-10 flex items-start justify-between gap-6">
          <div>
            <div className="mb-6 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-emerald-300/80"><span className="size-2 rounded-full bg-emerald-400" /> Operação de crédito</div>
            <h1 className="text-4xl font-semibold tracking-[-0.04em] text-[#f8f6f1] sm:text-5xl">Antecipe<span className="text-emerald-400">.</span></h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-emerald-100/65">Importe o lote de recebíveis, analise as regras do fundo e tome decisões com clareza.</p>
          </div>
          <div className="hidden rounded-full border border-emerald-300/20 px-4 py-2 text-xs text-emerald-100/70 sm:block">Última atualização · agora</div>
        </header>

        <section className="mb-7 rounded-2xl border border-emerald-200/15 bg-[#103b2c] p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4"><div className="flex size-11 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300"><FileUp size={21} /></div><div><h2 className="text-sm font-semibold text-[#f8f6f1]">Upload de lote de notas</h2><p className="mt-1 text-xs text-emerald-100/55">CSV · até 50 MB · milhares de notas por lote</p></div></div>
            <button type="button" onClick={() => inputRef.current?.click()} className="flex items-center justify-center gap-2 rounded-lg bg-[#f8f6f1] px-4 py-3 text-xs font-bold text-[#0b2c20] transition hover:bg-white"><Upload size={15} /> Fazer upload do CSV</button>
            <input ref={inputRef} type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => processFile(e.target.files?.[0])} />
          </div>
          <div onDragOver={(e) => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={(e) => { e.preventDefault(); setDragging(false); processFile(e.dataTransfer.files[0]) }} className={`mt-5 flex min-h-16 items-center justify-center rounded-lg border border-dashed px-4 transition ${dragging ? 'border-emerald-300 bg-emerald-400/10' : 'border-emerald-100/20'}`}><p className="text-xs text-emerald-100/55">{fileName ? <span className="text-emerald-200">{fileName} · {progress === 100 ? 'processado com sucesso' : 'processando...'}</span> : 'Ou arraste seu arquivo aqui'}</p></div>
          {fileName && <div className="mt-4"><div className="mb-2 flex justify-between text-[10px] font-bold uppercase tracking-widest text-emerald-100/50"><span>Analisando regras do fundo</span><span>{progress}%</span></div><div className="h-1 overflow-hidden rounded-full bg-emerald-950"><div className="h-full rounded-full bg-emerald-400 transition-all duration-300" style={{ width: `${progress}%` }} /></div></div>}
        </section>

        <section className="rounded-2xl bg-[#f8f6f1] p-4 text-stone-800 shadow-[0_20px_60px_rgba(0,0,0,0.14)] sm:p-6 lg:p-8">
          <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">Visão executiva</p><h2 className="text-xl font-semibold tracking-tight text-stone-800">Resultado do lote <span className="text-stone-400">/ hoje, 14:32</span></h2></div><div className="flex items-center gap-2 text-xs text-stone-500"><span className="size-2 rounded-full bg-emerald-500" /> Regras atualizadas</div></div>
          <div className="grid gap-3 md:grid-cols-3"><MetricCard label="Total de notas" value="100.000" detail="recebíveis lidos no lote" /><MetricCard label="Valor aprovado (líquido)" value="R$ 850.000,00" detail="85% do valor total" tone="positive" /><MetricCard label="Valor recusado" value="R$ 150.000,00" detail="15% do valor total" tone="negative" /></div>

          <div className="mt-10"><div className="mb-4 flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">Detalhamento</p><h3 className="mt-1 text-lg font-semibold">Recebíveis analisados</h3></div><button type="button" className="text-xs font-semibold text-emerald-700 underline-offset-4 hover:underline">Exportar resultado</button></div>
            <div className="flex flex-col gap-5 lg:flex-row">
              <aside className="w-full shrink-0 rounded-xl border border-stone-200 bg-stone-50 p-4 lg:w-48"><div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-600"><SlidersHorizontal size={14} /> Filtros</div><label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-stone-500" htmlFor="status-filter">Status</label><select id="status-filter" value={statusFilter} onChange={(e) => updateFilter(setStatusFilter, e.target.value)} className="mb-4 w-full rounded-lg border border-stone-200 bg-white px-2.5 py-2 text-xs text-stone-700"><option>Todos</option><option>Aprovada</option><option>Recusada</option></select><label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-stone-500" htmlFor="due-filter">Vencimento</label><select id="due-filter" value={dueFilter} onChange={(e) => updateFilter(setDueFilter, e.target.value)} className="w-full rounded-lg border border-stone-200 bg-white px-2.5 py-2 text-xs text-stone-700"><option>Todos</option><option>30 dias</option><option>45 dias</option><option>60 dias</option><option>90 dias</option></select></aside>
              <div className="min-w-0 flex-1 overflow-x-auto"><div className="min-w-[680px]"><div className="grid grid-cols-[1fr_1.5fr_1fr_1.2fr_1fr] border-b border-stone-200/80 px-4 pb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">{(['id', 'payer', 'due', 'value', 'status'] as const).map((key) => <button key={key} type="button" onClick={() => toggleSort(key)} className="flex items-center gap-1 text-left hover:text-emerald-700">{key === 'id' ? 'Nota' : key === 'payer' ? 'Sacado' : key === 'due' ? 'Vencimento' : key === 'value' ? 'Valor' : 'Status'}<ArrowUpDown size={12} /></button>)}</div>{visibleReceivables.map((item) => <div key={item.id}><div className="grid grid-cols-[1fr_1.5fr_1fr_1.2fr_1fr] items-center border-b border-stone-200/60 px-4 py-4 text-sm"><span className="font-semibold text-stone-800">{item.id}</span><span className="font-medium">{item.payer}</span><span className="text-stone-600">{item.due}</span><span className="font-medium">{item.value}</span><span><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.status === 'Aprovada' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'}`}>{item.status === 'Aprovada' ? <Check size={12} /> : <X size={12} />}{item.status}</span></span></div>{item.status === 'Recusada' && showExplanation && <div className="flex items-start gap-3 border-b border-rose-100 bg-rose-50 px-4 py-4 text-xs leading-5 text-rose-800"><AlertTriangle size={16} className="mt-0.5 shrink-0 text-rose-500" /><div><span className="font-bold">Por que foi recusada?</span><p>Prazo acima do limite: vence em 90 dias; o limite configurado do fundo é 60 dias.</p></div><button type="button" aria-label="Fechar explicação" onClick={() => setShowExplanation(false)} className="ml-auto rounded p-1 text-rose-400 hover:bg-rose-100"><X size={14} /></button></div>}</div>)}</div><div className="mt-4 flex items-center justify-between border-t border-stone-200 pt-4"><p className="text-xs text-stone-500">{filteredReceivables.length} resultados · página {page} de {pageCount}</p><div className="flex items-center gap-1"><button type="button" aria-label="Página anterior" disabled={page === 1} onClick={() => setPage((current) => current - 1)} className="rounded-md border border-stone-200 p-2 text-stone-600 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={14} /></button>{Array.from({ length: pageCount }, (_, index) => index + 1).map((number) => <button key={number} type="button" onClick={() => setPage(number)} className={`size-8 rounded-md text-xs font-semibold ${page === number ? 'bg-[#0b2c20] text-white' : 'text-stone-600 hover:bg-stone-100'}`}>{number}</button>)}<button type="button" aria-label="Próxima página" disabled={page === pageCount} onClick={() => setPage((current) => current + 1)} className="rounded-md border border-stone-200 p-2 text-stone-600 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight size={14} /></button></div></div></div>
            </div>
          </div>

          <div className="mt-8 flex flex-col justify-between gap-4 rounded-xl bg-[#0b2c20] px-5 py-5 text-[#f8f6f1] sm:flex-row sm:items-center sm:px-6"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300/70">Simulação final · NF&apos;s aprovadas</p><p className="mt-1 text-xs text-emerald-100/55">Taxa de antecipação já descontada</p></div><div className="flex items-center gap-3"><div className="text-right"><p className="text-[10px] uppercase tracking-wider text-emerald-100/55">Valor líquido a receber</p><p className="mt-1 text-xl font-semibold tracking-tight text-emerald-300">R$ 9.800,00</p></div><div className="hidden size-9 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300 sm:flex"><ChevronDown size={17} className="-rotate-90" /></div></div></div>
        </section>
        <footer className="flex items-center justify-between px-1 py-6 text-[10px] uppercase tracking-widest text-emerald-100/35"><span>Antecipe · Kanastra Hackathon</span><span className="hidden sm:block">Dados protegidos e auditáveis</span></footer>
      </div>
    </main>
  )
}
