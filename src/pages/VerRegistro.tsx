import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { supabase, type Registro, type Anexo, type Categoria } from '../lib/supabase'
import Navbar from '../components/Navbar'
import CategoriaBadge from '../components/CategoriaBadge'

export default function VerRegistro() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [registro,    setRegistro]    = useState<Registro | null>(null)
  const [anexos,      setAnexos]      = useState<Anexo[]>([])
  const [userEmail,   setUserEmail]   = useState('')
  const [loading,     setLoading]     = useState(true)
  const [confirmando, setConfirmando] = useState(false)
  const [excluindo,   setExcluindo]   = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? ''))
  }, [])

  useEffect(() => {
    if (!id) return
    async function carregar() {
      const { data: reg } = await supabase.from('registros').select('*').eq('id', id).single()
      const { data: anx } = await supabase.from('anexos').select('*').eq('registro_id', id).order('criado_em')
      setRegistro(reg as Registro)
      setAnexos((anx ?? []) as Anexo[])
      setLoading(false)
    }
    carregar()
  }, [id])

  async function handleExcluir() {
    setExcluindo(true)
    await supabase.from('anexos').delete().eq('registro_id', id)
    await supabase.from('registros').delete().eq('id', id)
    navigate('/')
  }

  function formatarData(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  }

  if (loading) return (
    <div className="min-h-screen bg-[#f8f7f4]">
      <Navbar userEmail={userEmail} />
      <div className="flex items-center justify-center py-32">
        <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  )

  if (!registro) return (
    <div className="min-h-screen bg-[#f8f7f4]">
      <Navbar userEmail={userEmail} />
      <div className="text-center py-32">
        <div className="text-4xl mb-3">🔍</div>
        <p className="font-medium text-gray-700">Registro não encontrado</p>
        <Link to="/" className="text-sm text-brand-600 hover:underline mt-2 inline-block">Voltar</Link>
      </div>
    </div>
  )

  const imagens = anexos.filter(a => a.tipo === 'imagem')
  const pdfs    = anexos.filter(a => a.tipo === 'pdf')

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      <Navbar userEmail={userEmail} />

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link to="/" className="hover:text-gray-600 transition">Registros</Link>
          <span>/</span>
          <span className="text-gray-700 truncate max-w-xs">{registro.titulo}</span>
        </div>

        <article className="bg-white rounded-2xl border border-gray-100 p-8">
          <div className="mb-6">
            <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
              <CategoriaBadge categoria={registro.categoria as Categoria} />
              <div className="flex items-center gap-2">
                <Link to={`/registros/${id}/editar`}
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Editar
                </Link>

                {confirmando ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Confirmar?</span>
                    <button onClick={handleExcluir} disabled={excluindo}
                      className="text-xs text-white bg-red-500 hover:bg-red-600 px-2.5 py-1.5 rounded-lg transition">
                      {excluindo ? 'Excluindo...' : 'Sim'}
                    </button>
                    <button onClick={() => setConfirmando(false)}
                      className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1.5 transition">
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmando(true)}
                    className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Excluir
                  </button>
                )}
              </div>
            </div>

            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight mb-2">{registro.titulo}</h1>
            <p className="text-sm text-gray-400">
              Criado em {formatarData(registro.criado_em)}
              {registro.atualizado_em !== registro.criado_em && (
                <> · Atualizado em {formatarData(registro.atualizado_em)}</>
              )}
            </p>
          </div>

          <div className="h-px bg-gray-100 mb-6" />

          <div className="tiptap-editor" dangerouslySetInnerHTML={{ __html: registro.conteudo }} />

          {imagens.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Imagens</h3>
              <div className="grid grid-cols-2 gap-3">
                {imagens.map(img => (
                  <a key={img.id} href={img.url} target="_blank" rel="noopener noreferrer">
                    <img src={img.url} alt={img.nome}
                      className="w-full rounded-xl border border-gray-100 object-cover hover:opacity-90 transition" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {pdfs.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Documentos</h3>
              <div className="space-y-2">
                {pdfs.map(pdf => (
                  <a key={pdf.id} href={pdf.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 hover:border-brand-200 hover:bg-brand-50 transition group">
                    <span className="text-xl">📄</span>
                    <span className="text-sm text-gray-700 group-hover:text-brand-700 font-medium truncate">{pdf.nome}</span>
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-brand-500 ml-auto flex-shrink-0"
                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          )}
        </article>

        <div className="mt-6 flex justify-center">
          <Link to="/" className="text-sm text-gray-500 hover:text-gray-800 transition">
            ← Voltar para todos os registros
          </Link>
        </div>
      </main>
    </div>
  )
}
