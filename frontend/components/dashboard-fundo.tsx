'use client'

import { useEffect, useState } from 'react'
import { Download, FileJson, RefreshCw, Save, ShieldCheck, Sparkles, Upload, Sliders, Table } from 'lucide-react'
import { fetchRegras, FundoConfig, updateRegras } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { DEMO_CONFIG_FUNDO } from '@/lib/demo-data'
import { TabelaCedente } from './tabela-cedente'

export function DashboardFundo() {
  const { user, isDemo } = useAuth()
  const [abaAtiva, setAbaAtiva] = useState<'regras' | 'recebiveis'>('regras')
  const [config, setConfig] = useState<FundoConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)
  const [jsonText, setJsonText] = useState('')
  const [modoJson, setModoJson] = useState(false)

  const carregar = async () => {
    setLoading(true)
    setMsg(null)
    if (isDemo || user?.username?.startsWith('demo_')) {
      setConfig(DEMO_CONFIG_FUNDO)
      setJsonText(JSON.stringify(DEMO_CONFIG_FUNDO, null, 2))
      setLoading(false)
      return
    }

    try {
      const data = await fetchRegras()
      setConfig(data)
      setJsonText(JSON.stringify(data, null, 2))
    } catch (e: any) {
      setMsg({ tipo: 'erro', texto: e.message || 'Erro ao carregar dados' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    carregar()
  }, [])

  const handleSalvar = async (dadosParaSalvar?: FundoConfig) => {
    const payload = dadosParaSalvar || config
    if (!payload) return
    setSaving(true)
    setMsg(null)

    if (isDemo || user?.username?.startsWith('demo_')) {
      setConfig(payload)
      setJsonText(JSON.stringify(payload, null, 2))
      setSaving(false)
      setMsg({
        tipo: 'ok',
        texto: 'Configuração simulada com sucesso! Em modo demonstração, as regras e filtros reagem dinamicamente.',
      })
      return
    }
    try {
      const res = await updateRegras(payload)
      setConfig(payload)
      setJsonText(JSON.stringify(payload, null, 2))
      setMsg({
        tipo: 'ok',
        texto: `Configuração atualizada! ${res.novas_aprovadas || 0} notas antes rejeitadas tornaram-se Aprovadas e ${res.total_reprecificadas || 0} tiveram o valor recalculado em tempo real.`,
      })
    } catch (e: any) {
      setMsg({ tipo: 'erro', texto: e.message || 'Erro ao salvar regras' })
    } finally {
      setSaving(false)
    }
  }

  const handleExportarJson = () => {
    if (!config) return
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `validadores_${config.fundo.nome.toLowerCase().replace(/\s+/g, '_')}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleUploadJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string)
        if (!parsed.validadores || !parsed.fundo) {
          throw new Error('O arquivo deve conter as chaves "fundo" e "validadores".')
        }
        setConfig(parsed)
        setJsonText(JSON.stringify(parsed, null, 2))
        handleSalvar(parsed)
      } catch (err: any) {
        setMsg({ tipo: 'erro', texto: `Arquivo JSON inválido: ${err.message}` })
      }
    }
    reader.readAsText(file)
  }

  const updateParametro = (index: number, paramKey: string, val: any) => {
    if (!config) return
    const novosValidadores = [...config.validadores]
    novosValidadores[index] = {
      ...novosValidadores[index],
      parametros: {
        ...novosValidadores[index].parametros,
        [paramKey]: val,
      },
    }
    const novoConfig = { ...config, validadores: novosValidadores }
    setConfig(novoConfig)
    setJsonText(JSON.stringify(novoConfig, null, 2))
  }

  const toggleAtivo = (index: number) => {
    if (!config) return
    const novosValidadores = [...config.validadores]
    novosValidadores[index] = {
      ...novosValidadores[index],
      ativo: !novosValidadores[index].ativo,
    }
    const novoConfig = { ...config, validadores: novosValidadores }
    setConfig(novoConfig)
    setJsonText(JSON.stringify(novoConfig, null, 2))
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-emerald-200">
        <RefreshCw size={24} className="animate-spin" />
        <span className="ml-2 text-sm font-semibold">Carregando painel do fundo...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Top Header do Fundo */}
      <section className="rounded-2xl border border-emerald-200/15 bg-[#103b2c] p-6 text-stone-100 shadow-md">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-emerald-300">
              <ShieldCheck size={16} /> Painel de Governança e Compliance
            </div>
            <h2 className="text-2xl font-bold text-[#f8f6f1]">{config?.fundo.nome || 'Fundo de Investimento'}</h2>
            <p className="mt-1 text-xs text-emerald-100/60">CNPJ: {config?.fundo.cnpj || '-'}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleExportarJson}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-300/30 bg-emerald-950/40 px-3 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-900/60"
            >
              <Upload size={14} /> Exportar JSON
            </button>

            <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-emerald-300/30 bg-emerald-950/40 px-3 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-900/60">
              <Download size={14} /> Importar JSON
              <input type="file" accept=".json" onChange={handleUploadJson} className="sr-only" />
            </label>

            <button
              type="button"
              onClick={() => handleSalvar()}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-[#f8f6f1] px-5 py-2.5 text-xs font-bold text-[#0b2c20] shadow hover:bg-white disabled:opacity-50"
            >
              <Save size={15} /> {saving ? 'Salvando e recalculando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>

        {msg && (
          <div
            className={`mt-4 rounded-xl p-4 text-xs font-medium leading-5 ${
              msg.tipo === 'ok'
                ? 'border border-emerald-300/30 bg-emerald-900/60 text-emerald-200'
                : 'border border-rose-300/30 bg-rose-950/60 text-rose-200'
            }`}
          >
            {msg.texto}
          </div>
        )}
      </section>

      {/* Navegação por Abas (Tabs) - Centralizada e na paleta institucional Antecipe (#0B2C20 / Emerald / Off-White) */}
      <nav aria-label="Navegação da Área do Fundo" className="flex justify-center">
        <div className="inline-flex items-center gap-1.5 rounded-2xl border border-emerald-900/15 bg-white/70 p-1.5 shadow-sm backdrop-blur-md dark:border-emerald-500/20 dark:bg-[#103b2c]/80">
          <button
            type="button"
            onClick={() => setAbaAtiva('regras')}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
              abaAtiva === 'regras'
                ? 'bg-[#0b2c20] text-[#f8f6f1] shadow-md dark:bg-emerald-400 dark:text-[#0b2c20]'
                : 'text-stone-600 hover:bg-stone-200/50 hover:text-stone-900 dark:text-emerald-100/70 dark:hover:bg-emerald-900/50 dark:hover:text-emerald-200'
            }`}
          >
            <Sliders size={15} />
            <span>Informações e Validações</span>
          </button>
          <button
            type="button"
            onClick={() => setAbaAtiva('recebiveis')}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
              abaAtiva === 'recebiveis'
                ? 'bg-[#0b2c20] text-[#f8f6f1] shadow-md dark:bg-emerald-400 dark:text-[#0b2c20]'
                : 'text-stone-600 hover:bg-stone-200/50 hover:text-stone-900 dark:text-emerald-100/70 dark:hover:bg-emerald-900/50 dark:hover:text-emerald-200'
            }`}
          >
            <Table size={15} />
            <span>Tabela de Recebíveis e Estatísticas</span>
          </button>
        </div>
      </nav>

      {abaAtiva === 'regras' && (
        <div className="space-y-8">
          {/* Precificação e Fundo */}
          <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-stone-200/80 bg-[#f8f6f1] p-6 text-stone-800 shadow">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">Cadastro do Fundo</p>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-stone-600">Razão Social / Nome</label>
              <input
                type="text"
                value={config?.fundo.nome || ''}
                onChange={(e) => {
                  if (!config) return
                  setConfig({ ...config, fundo: { ...config.fundo, nome: e.target.value } })
                }}
                className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-stone-600">CNPJ do Fundo</label>
              <input
                type="text"
                value={config?.fundo.cnpj || ''}
                onChange={(e) => {
                  if (!config) return
                  setConfig({ ...config, fundo: { ...config.fundo, cnpj: e.target.value } })
                }}
                className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 font-medium"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-200/80 bg-[#f8f6f1] p-6 text-stone-800 shadow">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">Política de Precificação</p>
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-stone-600">Taxa Mensal (% ao mês)</label>
              <div className="relative mt-1">
                <input
                  type="number"
                  step="0.01"
                  value={config?.precificacao.taxa_mensal_percentual ?? 2.0}
                  onChange={(e) => {
                    if (!config) return
                    setConfig({
                      ...config,
                      precificacao: {
                        ...config.precificacao,
                        taxa_mensal_percentual: parseFloat(e.target.value) || 0,
                      },
                    })
                  }}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-emerald-800"
                />
                <span className="absolute right-3 top-2 text-sm text-stone-400">%</span>
              </div>
              <p className="mt-1 text-[11px] text-stone-500">
                Base de desconto simples proporcional ao vencimento (base {config?.precificacao.base_dias || 30} dias).
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-stone-600">Base em Dias</label>
              <input
                type="number"
                value={config?.precificacao.base_dias ?? 30}
                onChange={(e) => {
                  if (!config) return
                  setConfig({
                    ...config,
                    precificacao: {
                      ...config.precificacao,
                      base_dias: parseInt(e.target.value) || 30,
                    },
                  })
                }}
                className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Validadores Dinâmicos */}
      <section className="rounded-2xl bg-[#f8f6f1] p-6 text-stone-800 shadow-[0_20px_60px_rgba(0,0,0,0.14)] sm:p-8">
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500">Motor de Regras</p>
            <h3 className="text-xl font-bold text-stone-800">Parâmetros dos Validadores Ativos e Inativos</h3>
            <p className="mt-1 text-xs text-stone-500">
              Modificações reavaliam em tempo real notas rejeitadas na carteira e atualizam os valores dos cedentes.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setModoJson(!modoJson)}
            className="flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100"
          >
            <FileJson size={14} /> {modoJson ? 'Modo Visual (Formulário)' : 'Modo Editor JSON'}
          </button>
        </div>

        {modoJson ? (
          <div>
            <textarea
              rows={16}
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value)
                try {
                  const p = JSON.parse(e.target.value)
                  setConfig(p)
                } catch {}
              }}
              className="w-full rounded-xl border border-stone-300 bg-stone-900 p-4 font-mono text-xs text-emerald-300 outline-none"
            />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {config?.validadores.map((val, idx) => (
              <div
                key={val.codigo}
                className={`rounded-xl border p-4 transition-all ${
                  val.ativo
                    ? 'border-emerald-300 bg-white shadow-sm'
                    : 'border-stone-200 bg-stone-50/70 opacity-75'
                }`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <div>
                    <h4 className="text-sm font-bold text-stone-800">{val.codigo}</h4>
                    <span className="text-[10px] uppercase tracking-wider text-stone-400">
                      {val.ativo ? 'Validador Ativo' : 'Desativado'}
                    </span>
                  </div>

                  <label className="relative inline-flex cursor-pointer items-center">
                    <input
                      type="checkbox"
                      checked={val.ativo}
                      onChange={() => toggleAtivo(idx)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div className="mt-3 space-y-2 text-xs">
                  {val.codigo === 'VALOR_MINIMO' && (
                    <div>
                      <label className="font-semibold text-stone-600">Valor Mínimo (R$):</label>
                      <input
                        type="number"
                        step="10"
                        value={val.parametros.valor_minimo ?? 100}
                        onChange={(e) => updateParametro(idx, 'valor_minimo', parseFloat(e.target.value) || 0)}
                        className="mt-1 w-full rounded border border-stone-300 p-1.5 text-xs"
                      />
                    </div>
                  )}

                  {val.codigo === 'PRAZO_MAXIMO' && (
                    <div>
                      <label className="font-semibold text-stone-600">Prazo Máximo (Dias):</label>
                      <input
                        type="number"
                        value={val.parametros.prazo_maximo_dias ?? 180}
                        onChange={(e) => updateParametro(idx, 'prazo_maximo_dias', parseInt(e.target.value) || 0)}
                        className="mt-1 w-full rounded border border-stone-300 p-1.5 text-xs"
                      />
                    </div>
                  )}

                  {val.codigo === 'PRAZO_MINIMO' && (
                    <div>
                      <label className="font-semibold text-stone-600">Prazo Mínimo (Dias):</label>
                      <input
                        type="number"
                        value={val.parametros.prazo_minimo_dias ?? 30}
                        onChange={(e) => updateParametro(idx, 'prazo_minimo_dias', parseInt(e.target.value) || 0)}
                        className="mt-1 w-full rounded border border-stone-300 p-1.5 text-xs"
                      />
                    </div>
                  )}

                  {val.codigo === 'CONCENTRACAO_MAXIMA_SACADO' && (
                    <div>
                      <label className="font-semibold text-stone-600">Percentual Máximo (%):</label>
                      <input
                        type="number"
                        step="0.5"
                        value={val.parametros.percentual_maximo ?? 10.0}
                        onChange={(e) => updateParametro(idx, 'percentual_maximo', parseFloat(e.target.value) || 0)}
                        className="mt-1 w-full rounded border border-stone-300 p-1.5 text-xs"
                      />
                    </div>
                  )}

                  {val.codigo === 'CONCENTRACAO_MAXIMA_CEDENTE' && (
                    <div>
                      <label className="font-semibold text-stone-600">Percentual Máximo (%):</label>
                      <input
                        type="number"
                        step="0.5"
                        value={val.parametros.percentual_maximo ?? 8.0}
                        onChange={(e) => updateParametro(idx, 'percentual_maximo', parseFloat(e.target.value) || 0)}
                        className="mt-1 w-full rounded border border-stone-300 p-1.5 text-xs"
                      />
                    </div>
                  )}

                  {val.codigo === 'TIPO_RECEBIVEL' && (
                    <div>
                      <label className="block font-semibold text-stone-600 mb-2">
                        Tipos Aceitos (selecione as opções permitidas):
                      </label>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {[
                          'Duplicata',
                          'Duplicata de Serviço',
                          'Cheque',
                          'CCB',
                          'Nota Comercial',
                        ].map((tipoOpcao) => {
                          const selecionados: string[] = val.parametros.tipos_aceitos || []
                          const isChecked = selecionados.includes(tipoOpcao)

                          return (
                            <label
                              key={tipoOpcao}
                              className={`flex items-center gap-2 rounded-lg border p-2 text-xs cursor-pointer transition ${
                                isChecked
                                  ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-semibold'
                                  : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  const novos = e.target.checked
                                    ? [...selecionados, tipoOpcao]
                                    : selecionados.filter((t) => t !== tipoOpcao)
                                  updateParametro(idx, 'tipos_aceitos', novos)
                                }}
                                className="size-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                              />
                              <span>{tipoOpcao}</span>
                            </label>
                          )
                        })}
                      </div>
                      <p className="mt-1.5 text-[10px] text-stone-500">
                        Selecionados: {(val.parametros.tipos_aceitos || []).join(', ') || 'Nenhum (rejeitará todos)'}
                      </p>
                    </div>
                  )}

                  {val.codigo === 'SITUACAO_CADASTRAL_SACADO' && (
                    <div>
                      <label className="block font-semibold text-stone-600 mb-2">
                        Situação Cadastral Aceita:
                      </label>
                      <div className="flex flex-wrap items-center gap-3">
                        {[
                          { label: 'Ativa', value: 'ATIVA' },
                          { label: 'Inapta', value: 'INAPTA' },
                        ].map((opcao) => {
                          const situacoesAtuais: string[] = (val.parametros.situacoes_aceitas || []).map((s: string) =>
                            s.toUpperCase()
                          )
                          const isSelected = situacoesAtuais.includes(opcao.value)

                          return (
                            <label
                              key={opcao.value}
                              className={`flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs cursor-pointer transition ${
                                isSelected
                                  ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-sm'
                                  : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`situacao_cadastral_${idx}`}
                                value={opcao.value}
                                checked={isSelected}
                                onChange={() => {
                                  updateParametro(idx, 'situacoes_aceitas', [opcao.value])
                                }}
                                className="size-4 border-stone-300 text-emerald-600 focus:ring-emerald-500"
                              />
                              <span>{opcao.label}</span>
                              <span className="text-[10px] uppercase font-mono text-stone-400">({opcao.value})</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {(val.codigo === 'CNPJ_SACADO_VALIDO' || val.codigo === 'NAO_VENCIDA') && (
                    <p className="text-[11px] text-stone-500 italic">
                      Regra estrutural estrita: valida formato matemático e vencimento futuro.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
        </div>
      )}

      {/* Carteira de Recebíveis do Fundo com ordenação e filtros */}
      {abaAtiva === 'recebiveis' && (
        <section className="mt-4">
          <TabelaCedente
            tipo="fundo"
            titulo="Carteira de Recebíveis sob Gestão"
            subtitulo="Visão Executiva do Fundo"
          />
        </section>
      )}
    </div>
  )
}
