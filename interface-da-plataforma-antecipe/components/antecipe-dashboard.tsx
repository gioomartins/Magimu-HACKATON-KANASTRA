'use client'

import { useRef, useState } from 'react'
import { AlertTriangle, ArrowUpRight, Check, ChevronDown, FileUp, Info, Upload, X } from 'lucide-react'

const receivables = [
  { id: 'NF 0142', payer: 'Loja Aurora', due: '30 dias', value: 'R$ 10.000,00', status: 'Aprovada' },
  { id: 'NF 0148', payer: 'Comercial Norte', due: '45 dias', value: 'R$ 8.750,00', status: 'Aprovada' },
  { id: 'NF 0152', payer: 'Grupo Horizonte', due: '30 dias', value: 'R$ 12.500,00', status: 'Aprovada' },
  { id: 'NF 0157', payer: 'Mercado Sol', due: '90 dias', value: 'R$ 4.500,00', status: 'Recusada' },
  { id: 'NF 0161', payer: 'Padaria Central', due: '60 dias', value: 'R$ 6.200,00', status: 'Aprovada' },
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
            <div className="overflow-x-auto"><div className="min-w-[680px]"><div className="grid grid-cols-[1fr_1.5fr_1fr_1.2fr_1fr] border-b border-stone-200/80 px-4 pb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500"><span>Nota</span><span>Sacado</span><span>Vencimento</span><span>Valor</span><span>Status</span></div>{receivables.map((item) => <div key={item.id}><div className="grid grid-cols-[1fr_1.5fr_1fr_1.2fr_1fr] items-center border-b border-stone-200/60 px-4 py-4 text-sm"><span className="font-semibold text-stone-800">{item.id}</span><span className="font-medium">{item.payer}</span><span className="text-stone-600">{item.due}</span><span className="font-medium">{item.value}</span><span><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${item.status === 'Aprovada' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'}`}>{item.status === 'Aprovada' ? <Check size={12} /> : <X size={12} />}{item.status}</span></span></div>{item.status === 'Recusada' && showExplanation && <div className="flex items-start gap-3 border-b border-rose-100 bg-rose-50 px-4 py-4 text-xs leading-5 text-rose-800"><AlertTriangle size={16} className="mt-0.5 shrink-0 text-rose-500" /><div><span className="font-bold">Por que foi recusada?</span><p>Prazo acima do limite: vence em 90 dias; o limite configurado do fundo é 60 dias.</p></div><button type="button" aria-label="Fechar explicação" onClick={() => setShowExplanation(false)} className="ml-auto rounded p-1 text-rose-400 hover:bg-rose-100"><X size={14} /></button></div>}</div>)}</div></div>
          </div>

          <div className="mt-8 flex flex-col justify-between gap-4 rounded-xl bg-[#0b2c20] px-5 py-5 text-[#f8f6f1] sm:flex-row sm:items-center sm:px-6"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300/70">Simulação final · NF&apos;s aprovadas</p><p className="mt-1 text-xs text-emerald-100/55">Taxa de antecipação já descontada</p></div><div className="flex items-center gap-3"><div className="text-right"><p className="text-[10px] uppercase tracking-wider text-emerald-100/55">Valor líquido a receber</p><p className="mt-1 text-xl font-semibold tracking-tight text-emerald-300">R$ 9.800,00</p></div><div className="hidden size-9 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300 sm:flex"><ChevronDown size={17} className="-rotate-90" /></div></div></div>
        </section>
        <footer className="flex items-center justify-between px-1 py-6 text-[10px] uppercase tracking-widest text-emerald-100/35"><span>Antecipe · Kanastra Hackathon</span><span className="hidden sm:block">Dados protegidos e auditáveis</span></footer>
      </div>
    </main>
  )
}
