'use client'

import { useRef, useState, useEffect } from 'react'
import { FileUp, Upload, CheckCircle2, AlertCircle, AlertTriangle, X } from 'lucide-react'
import { uploadCSV } from '@/lib/api'

interface UploadLoteCsvProps {
  onUploadSuccess?: () => void
  titulo?: string
  descricao?: string
}

export function UploadLoteCsv({
  onUploadSuccess,
  titulo = 'População do Sistema & Submissão em Lote (CSV)',
  descricao = 'Submeta o arquivo CSV para alimentar o sistema. Cedentes e Fundos únicos receberão contas automáticas de acesso (senha: 123456).'
}: UploadLoteCsvProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)
  const [toastIgnorados, setToastIgnorados] = useState<{ total: number; mensagem: string } | null>(null)

  useEffect(() => {
    if (toastIgnorados) {
      const timer = setTimeout(() => {
        setToastIgnorados(null)
      }, 6000)
      return () => clearTimeout(timer)
    }
  }, [toastIgnorados])

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
        texto: `Lote processado com sucesso! ${aprovados} notas aprovadas, ${barrados} recusadas/duplicadas. Usuários de fundos e cedentes sincronizados com senha 123456.`,
      })

      if (ignorados > 0) {
        setToastIgnorados({
          total: ignorados,
          mensagem: `${ignorados} recebíveis foram ignorados por pertencerem a outros CNPJs e não coincidirem com o CNPJ cadastrado.`,
        })
      }

      if (onUploadSuccess) {
        onUploadSuccess()
      }
    } catch (err: any) {
      setUploadMsg({
        tipo: 'erro',
        texto: `Falha no envio do CSV: ${err.message || 'Erro inesperado'}`,
      })
    } finally {
      setUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  return (
    <section className="rounded-2xl border border-emerald-200/15 bg-[#103b2c] p-5 sm:p-6 text-stone-100 shadow-md">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
            <FileUp size={22} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#f8f6f1]">{titulo}</h2>
            <p className="mt-0.5 text-xs text-emerald-100/60">{descricao}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-2 rounded-lg bg-[#f8f6f1] px-4 py-2.5 text-xs font-bold text-[#0b2c20] transition hover:bg-white disabled:opacity-50 shadow-sm"
          >
            <Upload size={15} /> {uploading ? 'Processando lote...' : 'Upload de Lote (CSV)'}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="sr-only"
          />
        </div>
      </div>

      {uploadMsg && (
        <div
          className={`mt-4 flex items-center gap-2.5 rounded-xl p-3.5 text-xs leading-5 ${
            uploadMsg.tipo === 'ok'
              ? 'border border-emerald-400/30 bg-emerald-950/60 text-emerald-200'
              : 'border border-rose-400/30 bg-rose-950/60 text-rose-200'
          }`}
        >
          {uploadMsg.tipo === 'ok' ? (
            <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle size={16} className="shrink-0 text-rose-400" />
          )}
          <span>{uploadMsg.texto}</span>
        </div>
      )}

      {/* Pop-up de canto de tela (Toast Vermelho) com auto-dismiss para registros ignorados */}
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
    </section>
  )
}
