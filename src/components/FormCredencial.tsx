'use client'
import { useState } from 'react'
import { TIPOS_CREDENCIAL, type TipoCredencial } from '../lib/supabase'
import { criptografar } from '../lib/cripto'

export interface CredencialForm {
  tipo: TipoCredencial
  host: string
  porta: string
  usuario: string
  senha: string           // texto claro — só existe em memória, nunca vai ao banco
  dominio: string
  observacoes: string
}

interface Props {
  inicial?: Partial<CredencialForm>
  onChange: (dados: CredencialForm) => void
}

export default function FormCredencial({ inicial, onChange }: Props) {
  const [tipo,        setTipo]        = useState<TipoCredencial>(inicial?.tipo       ?? 'rdp')
  const [host,        setHost]        = useState(inicial?.host        ?? '')
  const [porta,       setPorta]       = useState(inicial?.porta       ?? '3389')
  const [usuario,     setUsuario]     = useState(inicial?.usuario     ?? '')
  const [senha,       setSenha]       = useState(inicial?.senha       ?? '')
  const [dominio,     setDominio]     = useState(inicial?.dominio     ?? '')
  const [observacoes, setObservacoes] = useState(inicial?.observacoes ?? '')
  const [mostrarSenha, setMostrarSenha] = useState(false)

  function atualizar(campo: Partial<CredencialForm>) {
    const novo = { tipo, host, porta, usuario, senha, dominio, observacoes, ...campo }
    setTipo(novo.tipo)
    setHost(novo.host)
    setPorta(novo.porta)
    setUsuario(novo.usuario)
    setSenha(novo.senha)
    setDominio(novo.dominio)
    setObservacoes(novo.observacoes)
    onChange(novo)
  }

  function selecionarTipo(t: TipoCredencial) {
    const def = TIPOS_CREDENCIAL.find(x => x.value === t)
    atualizar({ tipo: t, porta: def?.porta ?? porta })
  }

  const tipoAtual = TIPOS_CREDENCIAL.find(t => t.value === tipo)

  return (
    <div className="space-y-4">
      {/* Tipo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de acesso</label>
        <div className="flex flex-wrap gap-2">
          {TIPOS_CREDENCIAL.map(t => (
            <button key={t.value} type="button" onClick={() => selecionarTipo(t.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition border
                ${tipo === t.value
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Host + Porta */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {tipo === 'vpn' ? 'Servidor / Endpoint' : tipo === 'http' ? 'URL / Endereço' : 'Host / IP'}
          </label>
          <input type="text" value={host} onChange={e => atualizar({ host: e.target.value })}
            placeholder={tipo === 'http' ? 'https://painel.exemplo.com' : '192.168.0.1'}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm
                       focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent
                       transition placeholder:text-gray-400 font-mono" />
        </div>
        {tipo !== 'vpn' && tipo !== 'http' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Porta</label>
            <input type="text" value={porta} onChange={e => atualizar({ porta: e.target.value })}
              placeholder={tipoAtual?.porta || '—'}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm
                         focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent
                         transition placeholder:text-gray-400 font-mono" />
          </div>
        )}
      </div>

      {/* Domínio (só RDP) */}
      {tipo === 'rdp' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Domínio <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <input type="text" value={dominio} onChange={e => atualizar({ dominio: e.target.value })}
            placeholder="EMPRESA ou empresa.local"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm
                       focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent
                       transition placeholder:text-gray-400 font-mono" />
        </div>
      )}

      {/* Usuário + Senha */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Usuário</label>
          <input type="text" value={usuario} onChange={e => atualizar({ usuario: e.target.value })}
            placeholder="administrator"
            autoComplete="off"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm
                       focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent
                       transition placeholder:text-gray-400 font-mono" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
            Senha
            <span className="inline-flex items-center gap-1 text-xs text-green-600 font-normal">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              AES-256
            </span>
          </label>
          <div className="relative">
            <input
              type={mostrarSenha ? 'text' : 'password'}
              value={senha}
              onChange={e => atualizar({ senha: e.target.value })}
              placeholder="••••••••"
              autoComplete="new-password"
              className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-gray-200 text-sm
                         focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent
                         transition placeholder:text-gray-400 font-mono"
            />
            <button type="button" onClick={() => setMostrarSenha(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
              {mostrarSenha ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Observações */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Observações <span className="text-gray-400 font-normal">(opcional)</span>
        </label>
        <textarea value={observacoes} onChange={e => atualizar({ observacoes: e.target.value })}
          placeholder="Ex: Usar apenas fora do horário comercial. VPN necessária antes de conectar."
          rows={2}
          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm
                     focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent
                     transition placeholder:text-gray-400 resize-none" />
      </div>

      {/* Aviso de segurança */}
      <div className="flex items-start gap-2.5 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
        <svg className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <p className="text-xs text-green-700 leading-relaxed">
          <strong>Criptografia no navegador:</strong> a senha é cifrada com AES-256-GCM antes de ser
          enviada ao banco. O servidor nunca recebe nem armazena senhas em texto claro.
          Somente você consegue descriptografar.
        </p>
      </div>
    </div>
  )
}

/** Criptografa todos os campos sensíveis antes de salvar */
export async function criptografarCredencial(
  form: CredencialForm,
  userId: string
): Promise<Omit<CredencialForm, 'senha'> & { senha_cifrada: string }> {
  const senha_cifrada = form.senha ? await criptografar(form.senha, userId) : ''
  const { senha: _, ...resto } = form
  return { ...resto, senha_cifrada }
}
