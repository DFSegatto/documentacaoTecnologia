import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase, CATEGORIAS, type Registro, type Categoria } from '../lib/supabase'
import Navbar from '../components/Navbar'
import CategoriaBadge from '../components/CategoriaBadge'

export default function Home() {
  const [registros,   setRegistros]   = useState<Registro[]>([])
  const [contagens,   setContagens]   = useState<Record<string, number>>({})
  const [loading,     setLoading]     = useState(true)
  const [userEmail,   setUserEmail]   = useState('')
  const [searchParams, setSearchParams] = useSearchParams()

  const categoria = searchParams.get('categoria') ?? ''
  const busca     = searchParams.get('q')         ?? ''

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? ''))
  }, [])

  useEffect(() => {
    async function carregar() {
      setLoading(true)
      let query = supabase
        .from('registros')
        .select('id, titulo, categoria, criado_em, conteudo')
        .order('criado_em', { ascending: false })

      if (categoria) query = query.eq('categoria', categoria)
      if (busca)     query = query.ilike('titulo', `%${busca}%`)

      const { data } = await query
      setRegistros((data ?? []) as Registro[])

      const { data: todos } = await supabase.from('registros').select('categoria')
      const map: Record<string, number> = {}
      todos?.forEach(r => { map[r.categoria] = (map[r.categoria] || 0) + 1 })
      setContagens(map)
      setLoading(false)
    }
    carregar()
  }, [categoria, busca])

  function resumo(html: string) {
    return html.replace(/<[^>]*>/g, '').slice(0, 140) + '...'
  }

  function formatarData(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  function setFiltro(cat: string) {
    const p = new URLSearchParams(searchParams)
    if (cat) p.set('categoria', cat)
    else p.delete('categoria')
    setSearchParams(p)
  }

  function setBusca(q: string) {
    const p = new URLSearchParams(searchParams)
    if (q) p.set('q', q)
    else p.delete('q')
    setSearchParams(p)
  }

  const totalRegistros = Object.values(contagens).reduce((a, b) => a + b, 0)

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      <Navbar userEmail={userEmail} />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Registros</h1>
          <p className="text-sm text-gray-500 mt-1">
            {registros.length} {registros.length === 1 ? 'artigo' : 'artigos'} encontrados
          </p>
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-52 flex-shrink-0 space-y-1">
            <button onClick={() => setFiltro('')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition
                ${!categoria ? 'bg-brand-600 text-white font-medium' : 'text-gray-600 hover:bg-white hover:text-gray-900'}`}>
              <span>Todos</span>
              <span className={`text-xs ${!categoria ? 'text-brand-200' : 'text-gray-400'}`}>{totalRegistros}</span>
            </button>
            {CATEGORIAS.map(cat => (
              <button key={cat.value} onClick={() => setFiltro(cat.value)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition
                  ${categoria === cat.value ? 'bg-brand-600 text-white font-medium' : 'text-gray-600 hover:bg-white hover:text-gray-900'}`}>
                <span>{cat.label}</span>
                <span className={`text-xs ${categoria === cat.value ? 'text-brand-200' : 'text-gray-400'}`}>
                  {contagens[cat.value] ?? 0}
                </span>
              </button>
            ))}
          </aside>

          {/* Lista */}
          <div className="flex-1 space-y-3">
            <div className="mb-4">
              <input type="search" value={busca} onChange={e => setBusca(e.target.value)}
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
                      <div className="flex items-center gap-2 mb-1.5">
                        <CategoriaBadge categoria={r.categoria as Categoria} />
                        <span className="text-xs text-gray-400">{formatarData(r.criado_em)}</span>
                      </div>
                      <h2 className="font-semibold text-gray-900 group-hover:text-brand-600 transition truncate">
                        {r.titulo}
                      </h2>
                      {r.conteudo && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                          {resumo(r.conteudo)}
                        </p>
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
                <div className="text-4xl mb-3">🗂</div>
                <p className="font-medium text-gray-600">Nenhum registro encontrado</p>
                <p className="text-sm mt-1">Crie o primeiro usando o botão &quot;Novo registro&quot;</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
