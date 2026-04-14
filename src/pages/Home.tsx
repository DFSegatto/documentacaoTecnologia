import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type { User } from '@supabase/supabase-js'
import { supabase, agruparSessoes, type CategoriaDB, type Sessao, type SessaoComFilhas } from '../lib/supabase'
import Navbar from '../components/Navbar'
import CategoriaBadge from '../components/CategoriaBadge'

interface RegistroLista {
  id: string
  titulo: string
  conteudo: string
  criado_em: string
  sessao: Sessao | null
  categoria: CategoriaDB | null
}

export default function Home({ user }: { user: User | null }) {
  const [registros,    setRegistros]    = useState<RegistroLista[]>([])
  const [arvore,       setArvore]       = useState<SessaoComFilhas[]>([])
  const [todasSessoes, setTodasSessoes] = useState<Sessao[]>([])
  const [categorias,   setCategorias]   = useState<CategoriaDB[]>([])
  const [contagensSessao,   setContagensSessao]   = useState<Record<string, number>>({})
  const [contagensCategoria, setContagensCategoria] = useState<Record<string, number>>({})
  const [loading,      setLoading]      = useState(true)
  const [searchParams, setSearchParams] = useSearchParams()

  const sessaoFiltro    = searchParams.get('sessao')    ?? ''
  const categoriaFiltro = searchParams.get('categoria') ?? ''
  const busca           = searchParams.get('q')         ?? ''

  useEffect(() => {
    supabase.from('sessoes').select('*').order('nome').then(({ data }) => {
      const lista = (data ?? []) as Sessao[]
      setTodasSessoes(lista)
      setArvore(agruparSessoes(lista))
    })
    supabase.from('categorias').select('*').order('nome').then(({ data }) => setCategorias((data ?? []) as CategoriaDB[]))
  }, [])

  useEffect(() => {
    async function carregar() {
      setLoading(true)
      let query = supabase
        .from('registros')
        .select('id, titulo, conteudo, criado_em, sessao:sessoes(id,nome,cor,descricao,criado_em), categoria:categorias(id,nome,cor,criado_em)')
        .order('criado_em', { ascending: false })

      if (sessaoFiltro === 'sem-sessao') query = query.is('sessao_id', null)
      else if (sessaoFiltro)             query = query.eq('sessao_id', sessaoFiltro)
      if (categoriaFiltro)               query = query.eq('categoria_id', categoriaFiltro)
      if (busca) {
        // Busca em título E conteúdo (remove tags HTML do conteúdo no banco via ilike)
        query = query.or(`titulo.ilike.%${busca}%,conteudo.ilike.%${busca}%`)
      }

      const { data } = await query
      setRegistros((data ?? []) as unknown as RegistroLista[])

      const { data: todos } = await supabase.from('registros').select('sessao_id, categoria_id')
      const mapS: Record<string, number> = {}
      const mapC: Record<string, number> = {}
      todos?.forEach(r => {
        const sk = r.sessao_id ?? 'sem-sessao'
        mapS[sk] = (mapS[sk] || 0) + 1
        if (r.categoria_id) mapC[r.categoria_id] = (mapC[r.categoria_id] || 0) + 1
      })
      setContagensSessao(mapS)
      setContagensCategoria(mapC)
      setLoading(false)
    }
    carregar()
  }, [sessaoFiltro, categoriaFiltro, busca])

  function setParam(key: string, value: string) {
    const p = new URLSearchParams(searchParams)
    if (value) p.set(key, value); else p.delete(key)
    // Ao trocar sessão, limpa filtro de categoria
    if (key === 'sessao') p.delete('categoria')
    setSearchParams(p)
  }

  function resumo(html: string, termo: string = '') {
    const texto = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    if (!termo) return texto.slice(0, 130) + '...'
    const idx = texto.toLowerCase().indexOf(termo.toLowerCase())
    if (idx === -1) return texto.slice(0, 130) + '...'
    const start = Math.max(0, idx - 40)
    const end   = Math.min(texto.length, idx + termo.length + 80)
    return (start > 0 ? '...' : '') + texto.slice(start, end) + (end < texto.length ? '...' : '')
  }

  function formatarData(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const total = Object.values(contagensSessao).reduce((a, b) => a + b, 0)

  // Categorias relevantes para a sessão selecionada
  const categoriasVisiveis = categoriaFiltro || sessaoFiltro
    ? categorias.filter(c => contagensCategoria[c.id])
    : categorias

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      <Navbar userEmail={user?.email} />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Registros</h1>
            <p className="text-sm text-gray-500 mt-1">{registros.length} {registros.length === 1 ? 'artigo' : 'artigos'} encontrados</p>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-56 flex-shrink-0 space-y-5">
            {/* Sessões */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-1.5">Sessões</p>
              <div className="space-y-0.5">
                {/* Todas */}
                <button onClick={() => setParam('sessao', '')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition
                    ${!sessaoFiltro ? 'bg-brand-600 text-white font-medium' : 'text-gray-600 hover:bg-white'}`}>
                  <span>Todas</span>
                  <span className={`text-xs ${!sessaoFiltro ? 'text-brand-200' : 'text-gray-400'}`}>{total}</span>
                </button>

                {/* Sessões e sub-sessões em árvore */}
                {arvore.map(sessao => {
                  const totalSessao = (contagensSessao[sessao.id] ?? 0) +
                    sessao.filhas.reduce((acc, f) => acc + (contagensSessao[f.id] ?? 0), 0)
                  const ativa = sessaoFiltro === sessao.id
                  const filhaAtiva = sessao.filhas.some(f => f.id === sessaoFiltro)

                  return (
                    <div key={sessao.id}>
                      {/* Sessão raiz */}
                      <button onClick={() => setParam('sessao', sessao.id)}
                        className={`w-full flex items-center gap-2 justify-between px-3 py-2 rounded-lg text-sm transition
                          ${ativa ? 'font-medium text-white' : filhaAtiva ? 'text-gray-800 bg-gray-100' : 'text-gray-600 hover:bg-white'}`}
                        style={ativa ? { backgroundColor: sessao.cor } : {}}>
                        <span className="flex items-center gap-1.5 min-w-0">
                          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                            style={{ color: ativa ? 'white' : sessao.cor }}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                          <span className="truncate">{sessao.nome}</span>
                        </span>
                        <span className={`text-xs flex-shrink-0 ${ativa ? 'opacity-70' : 'text-gray-400'}`}>
                          {totalSessao}
                        </span>
                      </button>

                      {/* Sub-sessões indentadas */}
                      {sessao.filhas.map((filha, idx) => {
                        const filhaAtv = sessaoFiltro === filha.id
                        return (
                          <button key={filha.id} onClick={() => setParam('sessao', filha.id)}
                            className={`w-full flex items-center gap-1.5 justify-between pl-6 pr-3 py-1.5 rounded-lg text-xs transition
                              ${filhaAtv ? 'font-medium text-white' : 'text-gray-500 hover:bg-white hover:text-gray-700'}`}
                            style={filhaAtv ? { backgroundColor: filha.cor } : {}}>
                            <span className="flex items-center gap-1.5 min-w-0">
                              {/* Conector L */}
                              <span className="flex-shrink-0 text-gray-300" style={{ fontSize: 10 }}>
                                {idx === sessao.filhas.length - 1 ? '└' : '├'}
                              </span>
                              <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                style={{ color: filhaAtv ? 'white' : filha.cor }}>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                              </svg>
                              <span className="truncate">{filha.nome}</span>
                            </span>
                            <span className={`flex-shrink-0 ${filhaAtv ? 'opacity-70' : 'text-gray-400'}`}>
                              {contagensSessao[filha.id] ?? 0}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )
                })}

                {/* Sem sessão */}
                <button onClick={() => setParam('sessao', 'sem-sessao')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition
                    ${sessaoFiltro === 'sem-sessao' ? 'bg-gray-700 text-white font-medium' : 'text-gray-400 hover:bg-white hover:text-gray-600'}`}>
                  <span>Sem sessão</span>
                  <span className={`text-xs ${sessaoFiltro === 'sem-sessao' ? 'text-gray-300' : 'text-gray-300'}`}>
                    {contagensSessao['sem-sessao'] ?? 0}
                  </span>
                </button>
              </div>
            </div>

            {/* Categorias */}
            {categoriasVisiveis.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-1.5">Categorias</p>
                <div className="space-y-0.5">
                  {categoriaFiltro && (
                    <button onClick={() => setParam('categoria', '')}
                      className="w-full text-left px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600 transition">
                      ← Todas as categorias
                    </button>
                  )}
                  {categoriasVisiveis.map(cat => (
                    <button key={cat.id} onClick={() => setParam('categoria', categoriaFiltro === cat.id ? '' : cat.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition
                        ${categoriaFiltro === cat.id ? 'bg-gray-100 font-medium' : 'text-gray-600 hover:bg-white'}`}>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cat.cor}`}>
                        {cat.nome}
                      </span>
                      <span className="text-xs text-gray-400">{contagensCategoria[cat.id] ?? 0}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {todasSessoes.length === 0 && (
              <Link to="/sessoes" className="block px-3 py-2 text-xs text-brand-600 hover:underline">
                + Criar sessões
              </Link>
            )}
          </aside>

          {/* Lista de registros */}
          <div className="flex-1 space-y-3 min-w-0">
            <div className="mb-4">
              <input type="search" value={busca} onChange={e => setParam('q', e.target.value)}
                placeholder="Buscar por título..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent placeholder:text-gray-400 transition" />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : registros.length > 0 ? (
              registros.map(r => (
                <Link key={r.id} to={`/registros/${r.id}`}
                  className="block bg-white rounded-xl border border-gray-100 p-5 hover:border-brand-200 hover:shadow-sm transition group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {r.sessao && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md"
                            style={{ backgroundColor: r.sessao.cor + '22', color: r.sessao.cor }}>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                            </svg>
                            {r.sessao.nome}
                          </span>
                        )}
                        {r.categoria && <CategoriaBadge categoria={r.categoria} />}
                        <span className="text-xs text-gray-400">{formatarData(r.criado_em)}</span>
                      </div>
                      <h2 className="font-semibold text-gray-900 group-hover:text-brand-600 transition truncate">{r.titulo}</h2>
                      {busca && r.titulo.toLowerCase().indexOf(busca.toLowerCase()) === -1 && r.conteudo.toLowerCase().indexOf(busca.toLowerCase()) !== -1 && (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600 mt-0.5">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          Encontrado no conteúdo
                        </span>
                      )}
                      {r.conteudo && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2 leading-relaxed">{resumo(r.conteudo, busca)}</p>
                      )}
                    </div>
                    <svg className="w-4 h-4 text-gray-300 group-hover:text-brand-400 transition flex-shrink-0 mt-1"
                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-20 text-gray-400">
                <div className="text-5xl mb-3">🗂</div>
                <p className="font-medium text-gray-600">Nenhum registro encontrado</p>
                <p className="text-sm mt-1">
                  {sessaoFiltro
                    ? <Link to={`/registros/novo?sessao=${sessaoFiltro}`} className="text-brand-600 hover:underline">Criar registro nesta sessão</Link>
                    : 'Crie o primeiro usando o botão "Novo registro"'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
