import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, CATEGORIAS, type Categoria, type ArquivoUpload } from '../lib/supabase'
import Editor from './Editor'
import UploadAnexos from './UploadAnexos'

interface RegistroFormData {
  id?: string
  titulo: string
  categoria: Categoria
  conteudo: string
  anexosExistentes?: ArquivoUpload[]
}

interface Props {
  inicial?: RegistroFormData
  modo: 'criar' | 'editar'
}

export default function FormRegistro({ inicial, modo }: Props) {
  const navigate = useNavigate()
  const [titulo,    setTitulo]    = useState(inicial?.titulo    ?? '')
  const [categoria, setCategoria] = useState<Categoria>(inicial?.categoria ?? 'procedimento')
  const [conteudo,  setConteudo]  = useState(inicial?.conteudo  ?? '')
  const [anexos,    setAnexos]    = useState<ArquivoUpload[]>(inicial?.anexosExistentes ?? [])
  const [salvando,  setSalvando]  = useState(false)
  const [erro,      setErro]      = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!titulo.trim())   { setErro('O título é obrigatório.'); return }
    if (!conteudo.trim() || conteudo === '<p></p>') { setErro('O conteúdo não pode estar vazio.'); return }

    setSalvando(true)
    setErro('')

    try {
      let registroId = inicial?.id

      if (modo === 'criar') {
        const { data: { user } } = await supabase.auth.getUser()
        const { data, error } = await supabase
          .from('registros')
          .insert({ titulo, categoria, conteudo, criado_por: user?.id })
          .select('id')
          .single()
        if (error) throw error
        registroId = data.id
      } else {
        const { error } = await supabase
          .from('registros')
          .update({ titulo, categoria, conteudo, atualizado_em: new Date().toISOString() })
          .eq('id', inicial!.id)
        if (error) throw error
      }

      // Salvar anexos
      await supabase.from('anexos').delete().eq('registro_id', registroId)
      if (anexos.length > 0) {
        await supabase.from('anexos').insert(
          anexos.map(a => ({ registro_id: registroId, nome: a.nome, url: a.url, tipo: a.tipo }))
        )
      }

      navigate(`/registros/${registroId}`)
    } catch {
      setErro('Erro ao salvar. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Título */}
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

      {/* Categoria */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIAS.map(cat => (
            <button key={cat.value} type="button" onClick={() => setCategoria(cat.value)}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition border
                ${categoria === cat.value
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Conteúdo</label>
        <Editor conteudo={conteudo} onChange={setConteudo} />
      </div>

      {/* Anexos */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Anexos <span className="text-gray-400 font-normal">(imagens e PDFs)</span>
        </label>
        <UploadAnexos onUpload={setAnexos} arquivosExistentes={anexos} />
      </div>

      {erro && <p className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">{erro}</p>}

      {/* Ações */}
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
