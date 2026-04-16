import { useState } from 'react'
import { descriptografar } from '../lib/cripto'
import { TIPOS_CREDENCIAL, type Credencial } from '../lib/supabase'

interface Props {
  credencial: Credencial
  userId: string
}

interface CampoSenhaProps {
  cifrado: string
  userId: string
}

function CampoSenha({ cifrado, userId }: CampoSenhaProps) {
  const [valor,      setValor]      = useState<string | null>(null)
  const [copiado,    setCopiado]    = useState(false)
  const [revelando,  setRevelando]  = useState(false)
  const [erro,       setErro]       = useState(false)
  const [visivel,    setVisivel]    = useState(false)

  async function revelar() {
    if (valor !== null) { setVisivel(v => !v); return }
    setRevelando(true)
    const result = await descriptografar(cifrado, userId)
    if (result === null) { setErro(true); setRevelando(false); return }
    setValor(result)
    setVisivel(true)
    setRevelando(false)
  }

  async function copiar() {
    const texto = valor ?? await descriptografar(cifrado, userId)
    if (!texto) return
    setValor(texto)
    await navigator.clipboard.writeText(texto)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  if (erro) return (
    <span className="text-xs text-red-500">Erro ao descriptografar</span>
  )

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-sm text-gray-800">
        {visivel && valor !== null ? valor : '••••••••••••'}
      </span>
      <button type="button" onClick={revelar} disabled={revelando}
        className="text-gray-400 hover:text-gray-600 transition"
        title={visivel ? 'Ocultar' : 'Revelar senha'}>
        {revelando ? (
          <div className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        ) : visivel ? (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        )}
      </button>
      <button type="button" onClick={copiar}
        className="text-gray-400 hover:text-brand-600 transition"
        title="Copiar senha">
        {copiado ? (
          <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>
    </div>
  )
}

function CampoCopia({ valor, label }: { valor: string; label: string }) {
  const [copiado, setCopiado] = useState(false)
  async function copiar() {
    await navigator.clipboard.writeText(valor)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-sm text-gray-800">{valor || '—'}</span>
      {valor && (
        <button type="button" onClick={copiar}
          className="text-gray-400 hover:text-brand-600 transition" title={`Copiar ${label}`}>
          {copiado ? (
            <svg className="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
      )}
    </div>
  )
}

export default function VisualizarCredencial({ credencial, userId }: Props) {
  const tipo = TIPOS_CREDENCIAL.find(t => t.value === credencial.tipo)

  const linhas: { label: string; conteudo: React.ReactNode }[] = []

  if (credencial.host)   linhas.push({ label: 'Host / IP',  conteudo: <CampoCopia valor={credencial.host} label="host" /> })
  if (credencial.porta)  linhas.push({ label: 'Porta',      conteudo: <CampoCopia valor={credencial.porta} label="porta" /> })
  if (credencial.dominio) linhas.push({ label: 'Domínio',   conteudo: <CampoCopia valor={credencial.dominio} label="domínio" /> })
  if (credencial.usuario) linhas.push({ label: 'Usuário',   conteudo: <CampoCopia valor={credencial.usuario} label="usuário" /> })
  if (credencial.senha_cifrada) linhas.push({
    label: 'Senha',
    conteudo: <CampoSenha cifrado={credencial.senha_cifrada} userId={userId} />,
  })
  if (credencial.observacoes) linhas.push({
    label: 'Observações',
    conteudo: <span className="text-sm text-gray-700">{credencial.observacoes}</span>,
  })

  return (
    <div className="bg-gray-900 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-700">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gray-700 flex items-center justify-center">
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Credencial de acesso</p>
            <p className="text-sm font-medium text-white">{tipo?.label ?? credencial.tipo}</p>
          </div>
        </div>
        <span className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          AES-256 cifrado
        </span>
      </div>

      {/* Campos */}
      <div className="divide-y divide-gray-800">
        {linhas.map(({ label, conteudo }) => (
          <div key={label} className="flex items-center gap-4 px-5 py-3">
            <span className="text-xs font-medium text-gray-500 w-24 flex-shrink-0">{label}</span>
            <div className="flex-1 min-w-0">{conteudo}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
