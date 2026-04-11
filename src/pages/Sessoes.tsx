import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { User } from '@supabase/supabase-js'
import { supabase, CORES_SESSAO, type Sessao } from '../lib/supabase'
import Navbar from '../components/Navbar'

export default function Sessoes({ user }: { user: User | null }) {
  const [sessoes,     setSessoes]     = useState<Sessao[]>([])
  const [contagens,   setContagens]   = useState<Record<string, number>>({})
  const [loading,     setLoading]     = useState(true)
  const [salvando,    setSalvando]    = useState(false)
  const [excluindo,   setExcluindo]   = useState<string | null>(null)
  const [editando,    setEditando]    = useState<Sessao | null>(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [nome,        setNome]        = useState('')
  const [descricao,   setDescricao]   = useState('')
  const [cor,         setCor]         = useState(CORES_SESSAO[0].value)
  const [erro,        setErro]        = useState('')

  async function carregar() {
    setLoading(true)
    const { data: sess } = await supabase.from('sessoes').select('*').order('nome')
    const { data: regs } = await supabase.from('registros').select('sessao_id')
    const map: Record<string, number> = {}
    regs?.forEach(r => { if (r.sessao_id) map[r.sessao_id] = (map[r.sessao_id] || 0) + 1 })
    setSessoes((sess ?? []) as Sessao[])
    setContagens(map)
    setLoading(false)
  }

  useEffect(() => { carregar() }, [])

  function iniciarEdicao(s: Sessao) {
    setEditando(s); setNome(s.nome); setDescricao(s.descricao); setCor(s.cor)
    setMostrarForm(true); setErro('')
  }

  function cancelar() {
    setEditando(null); setNome(''); setDescricao(''); setCor(CORES_SESSAO[0].value)
    setMostrarForm(false); setErro('')
  }

  async function salvar() {
    if (!nome.trim()) { setErro('O nome é obrigatório.'); return }
    setSalvando(true); setErro('')
    if (editando) {
      const { error } = await supabase.from('sessoes')
        .update({ nome: nome.trim(), descricao: descricao.trim(), cor }).eq('id', editando.id)
      if (error) { setErro('Erro ao salvar.'); setSalvando(false); return }
    } else {
      const { error } = await supabase.from('sessoes')
        .insert({ nome: nome.trim(), descricao: descricao.trim(), cor })
      if (error) { setErro('Erro ao criar sessão.'); setSalvando(false); return }
    }
    await carregar(); cancelar(); setSalvando(false)
  }

  async function excluir(id: string) {
    setExcluindo(id)
    await supabase.from('sessoes').delete().eq('id', id)
    await carregar(); setExcluindo(null)
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      <Navbar userEmail={user?.email} />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link to="/" className="hover:text-gray-600 transition">Registros</Link>
          <span>/</span>
          <span className="text-gray-700">Sessões</span>
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Sessões</h1>
            <p className="text-sm text-gray-500 mt-1">Agrupe registros por sistema ou área</p>
          </div>
          {!mostrarForm && (
            <button onClick={() => { setMostrarForm(true); setEditando(null); setNome(''); setDescricao(''); setCor(CORES_SESSAO[0].value) }}
              className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nova sessão
            </button>
          )}
        </div>

        {mostrarForm && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">
              {editando ? 'Editar sessão' : 'Nova sessão'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome</label>
                <input type="text" value={nome} onChange={e => setNome(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && salvar()}
                  placeholder="Ex: Apontamento Web, eDocs, ERP..."
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent transition placeholder:text-gray-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição <span className="text-gray-400 font-normal">(opcional)</span></label>
                <input type="text" value={descricao} onChange={e => setDescricao(e.target.value)}
                  placeholder="Ex: Suporte ao módulo de apontamento de horas"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent transition placeholder:text-gray-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cor</label>
                <div className="flex flex-wrap gap-2">
                  {CORES_SESSAO.map(c => (
                    <button key={c.value} type="button" onClick={() => setCor(c.value)}
                      className={`w-8 h-8 rounded-lg transition border-2 ${cor === c.value ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c.value }} title={c.label} />
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-gray-500">Pré-visualização:</span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-medium text-white"
                    style={{ backgroundColor: cor }}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                    {nome || 'Nome da sessão'}
                  </span>
                </div>
              </div>

              {erro && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{erro}</p>}

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <button type="button" onClick={cancelar} className="text-sm text-gray-500 hover:text-gray-700 transition">
                  Cancelar
                </button>
                <button type="button" onClick={salvar} disabled={salvando}
                  className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-medium px-4 py-2 rounded-xl text-sm transition disabled:opacity-60">
                  {salvando
                    ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Salvando...</>
                    : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>{editando ? 'Salvar alterações' : 'Criar sessão'}</>
                  }
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : sessoes.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-5xl mb-3">📂</div>
              <p className="font-medium text-gray-600">Nenhuma sessão criada</p>
              <p className="text-sm mt-1">Clique em "Nova sessão" para começar</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {sessoes.map(s => (
                <div key={s.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: s.cor + '22' }}>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        style={{ color: s.cor }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{s.nome}</p>
                      {s.descricao && <p className="text-xs text-gray-400 truncate">{s.descricao}</p>}
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                      {contagens[s.id] ?? 0} registro{(contagens[s.id] ?? 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-3">
                    <button onClick={() => iniciarEdicao(s)}
                      className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition" title="Editar">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button onClick={() => excluir(s.id)} disabled={excluindo === s.id}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50" title="Excluir">
                      {excluindo === s.id
                        ? <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                        : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                      }
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
