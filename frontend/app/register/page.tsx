'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Lock, User, AlertCircle, Building2, Wallet, ShieldCheck } from 'lucide-react'
import { registerApi } from '@/lib/api'
import { useAuth, UserRole } from '@/lib/auth-context'

export default function RegisterPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('EMPRESA')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setLoading(true)

    try {
      const data = await registerApi(username, password, role)
      login(data.token, { username: data.username, role: data.role })
      router.push('/plataforma')
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0B2C20] px-4 py-12 text-[#f8f6f1]">
      {/* Botão de Retorno */}
      <div className="w-full max-w-md mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 hover:text-white transition"
        >
          <ArrowLeft size={14} />
          <span>Voltar para a página inicial</span>
        </Link>
      </div>

      {/* Card de Registro Off-White */}
      <div className="w-full max-w-md rounded-2xl bg-[#F8F6F1] p-8 text-stone-900 shadow-2xl sm:p-10">
        <div className="text-center">
          <div className="relative mx-auto h-9 w-32 mb-6">
            <Image
              src="/logo-antecipe-claro.svg"
              alt="Logo Antecipe"
              fill
              priority
              className="object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0B2C20]">
            Criar Nova Conta
          </h1>
          <p className="mt-1 text-xs text-stone-600">
            Selecione seu perfil operacional e comece a operar recebíveis
          </p>
        </div>

        {errorMsg && (
          <div className="mt-6 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
            <AlertCircle size={16} className="shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {/* Seleção do Perfil (Role) */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600 mb-2">
              Tipo de Perfil (RBAC)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('EMPRESA')}
                className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition ${
                  role === 'EMPRESA'
                    ? 'border-[#0B2C20] bg-emerald-50 text-[#0B2C20] font-bold shadow-sm ring-1 ring-[#0B2C20]'
                    : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                }`}
              >
                <Wallet size={18} className="mb-1 text-emerald-800" />
                <span className="text-xs">Empresa Cedente</span>
                <span className="text-[10px] text-stone-500 font-normal">Submete notas</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('GESTOR')}
                className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition ${
                  role === 'GESTOR'
                    ? 'border-[#0B2C20] bg-emerald-50 text-[#0B2C20] font-bold shadow-sm ring-1 ring-[#0B2C20]'
                    : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                }`}
              >
                <Building2 size={18} className="mb-1 text-emerald-800" />
                <span className="text-xs">Gestor do Fundo</span>
                <span className="text-[10px] text-stone-500 font-normal">Ajusta regras</span>
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="username"
              className="block text-[11px] font-bold uppercase tracking-wider text-stone-600"
            >
              Usuário
            </label>
            <div className="relative mt-1.5">
              <User size={15} className="absolute left-3.5 top-3.5 text-stone-400" />
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: financeiro_empresa"
                className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pl-10 pr-4 text-xs font-medium text-stone-800 placeholder-stone-400 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-[11px] font-bold uppercase tracking-wider text-stone-600"
            >
              Senha
            </label>
            <div className="relative mt-1.5">
              <Lock size={15} className="absolute left-3.5 top-3.5 text-stone-400" />
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full rounded-xl border border-stone-200 bg-white py-2.5 pl-10 pr-4 text-xs font-medium text-stone-800 placeholder-stone-400 shadow-sm transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex h-12 min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#0B2C20] text-xs font-bold uppercase tracking-wider text-[#F8F6F1] shadow-md transition hover:bg-[#103B2C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50"
          >
            <span>{loading ? 'Cadastrando...' : 'Criar Conta'}</span>
            <ArrowRight size={15} />
          </button>
        </form>

        <div className="mt-8 border-t border-stone-200 pt-6 text-center text-xs text-stone-600">
          Já possui conta?{' '}
          <Link
            href="/login"
            className="font-bold text-[#0B2C20] hover:text-emerald-700 transition"
          >
            Fazer login
          </Link>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-2 text-xs text-emerald-200/60">
        <ShieldCheck size={14} className="text-emerald-400" />
        <span>Controle de acesso por perfil (RBAC) integrado</span>
      </div>
    </main>
  )
}
