import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, type CategoriaDB, type ArquivoUpload } from '../lib/supabase'
import Editor from './Editor'
import UploadAnexos from './UploadAnexos'

interface RegistroFormData {
  id?: string
  titulo: string
  categoria_id: string
  conteudo: string
  anexosExistentes?: ArquivoUpload[]
}

interface Props {
  inicial?: RegistroFormData
  modo: 'criar' | 'editar'
}

export default function FormRegistro({ inicial, modo }: Props) {
  const navigate = useNavigate()
  const [titulo,      setTitulo]      = useState(inicial?.titulo      ?? '')
  const [categoriaId, setCategoriaId] = useState(inicial?.categoria_id ?? '')
  const [conteudo,    setConteudo]    = useState(inicial?.conteudo    ?? '')
  const [anexos,      setAnexos]      = useState<ArquivoUpload[]>(inicial?.anexosExistentes ?? [])
  const [categorias,  setCategorias]  = useState<CategoriaDB[]>([])
  const [salvando,    setSalvando]    = useState(false)
  const [erro,        setErro]        = useState('')

  useEffect(() => {
    supabase.from('categorias').select('*').order('nome').then(({ data }) => {
      const cats = (data ?? []) as CategoriaDB[]
      setCategorias(cats)
      if (!categoriaId && cats.length > 0) setCategoriaId(cats[0].id)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!titulo.trim())   { setErro('O título é obrigatório.'); return }
    if (!conteudo.trim() || conteudo === '<p></p>') { setErro('O conteúdo não pode estar vazio.'); return }
    if (!categoriaId)     { setErro('Selecione uma categoria.'); return }

    setSalvando(true)
    setErro('')

    try {
      let registroId = inicial?.id

      if (modo === 'criar') {
        const { data: { user } } = await supabase.auth.getUser()
        const { data, error } = await supabase
          .from('registros')
          .insert({ titulo, categoria_id: categoriaId, conteudo, criado_por: user?.id })
          .select('id')
          .single()
        if (error) throw error
        registroId = data.id
      } else {
        const { error } = await supabase
          .from('registros')
          .update({ titulo, categoria_id: categoriaId, conteudo, atualizado_em: new Date().toISOString() })
          .eq('id', inicial!.id)
        if (error) throw error
      }

      await supabase.from('anexos').delete().eq('registro_id', registroId)
      if (anexos.length > 0) {
        await supabase.from('anexos').insert(
          anexos.map(a => ({ registro_id: registroId, nome: a.nome, url: a.url, tipo: a.tipo, tamanho: a.tamanho }))
        )
      }

      navigate(`/registros/${registroId}`)
    } catch {
      setErro('Erro ao salvar. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  const catSelecionada = categorias.find(c => c.id === categoriaId)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <input
          type="text"
          value={titulo}
          onChange={e => setTitulo(e.target.value)}
          placeholder="Título do registro..."
          className="w-full text-2xl font-semibold bg-transparent border-none outline-none text-gray-900 placeholder:text-gray-300 py-1"
        />
        <div className="h-px bg-gray-200 mt-2" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">Categoria</label>
          <a href="/categorias" className="text-xs text-brand-600 hover:underline">+ Gerenciar categorias</a>
        </div>

        {categorias.length === 0 ? (
          <div className="text-sm text-gray-500 bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Nenhuma categoria cadastrada.{' '}
            <a href="/categorias" className="text-brand-600 hover:underline font-medium">Criar agora</a>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categorias.map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoriaId(cat.id)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition border-2
                  ${categoriaId === cat.id ? 'border-gray-500 scale-105' : 'border-transparent'}
                  ${cat.cor}`}
              >
                {cat.nome}
              </button>
            ))}
          </div>
        )}

        {catSelecionada && (
          <p className="text-xs text-gray-400 mt-2">
            Selecionada: <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${catSelecionada.cor}`}>{catSelecionada.nome}</span>
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Conteúdo</label>
        <Editor conteudo={conteudo} onChange={setConteudo} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Anexos <span className="text-gray-400 font-normal">(imagens e PDFs)</span>
        </label>
        <UploadAnexos onUpload={setAnexos} arquivosExistentes={anexos} />
      </div>

      {erro && <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{erro}</p>}

      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <button type="button" onClick={() => navigate(-1)}
          className="text-sm text-gray-500 hover:text-gray-700 transition">
          Cancelar
        </button>
        <button type="submit" disabled={salvando}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition disabled:opacity-60 disabled:cursor-not-allowed">
          {salvando ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Salvando...</>
          ) : (
            <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>{modo === 'criar' ? 'Salvar registro' : 'Salvar alterações'}</>
          )}
        </button>
      </div>
    </form>
  )
}
