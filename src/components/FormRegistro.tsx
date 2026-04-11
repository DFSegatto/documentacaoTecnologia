import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase, type CategoriaDB, type Sessao, type ArquivoUpload } from '../lib/supabase'
import Editor from './Editor'
import UploadAnexos from './UploadAnexos'

interface RegistroFormData {
  id?: string
  titulo: string
  sessao_id: string
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
  const [searchParams] = useSearchParams()

  const [titulo,      setTitulo]      = useState(inicial?.titulo      ?? '')
  const [sessaoId,    setSessaoId]    = useState(inicial?.sessao_id   ?? searchParams.get('sessao') ?? '')
  const [categoriaId, setCategoriaId] = useState(inicial?.categoria_id ?? '')
  const [conteudo,    setConteudo]    = useState(inicial?.conteudo    ?? '')
  const [anexos,      setAnexos]      = useState<ArquivoUpload[]>(inicial?.anexosExistentes ?? [])
  const [sessoes,     setSessoes]     = useState<Sessao[]>([])
  const [categorias,  setCategorias]  = useState<CategoriaDB[]>([])
  const [salvando,    setSalvando]    = useState(false)
  const [erro,        setErro]        = useState('')

  useEffect(() => {
    supabase.from('sessoes').select('*').order('nome').then(({ data }) => {
      setSessoes((data ?? []) as Sessao[])
    })
    supabase.from('categorias').select('*').order('nome').then(({ data }) => {
      const cats = (data ?? []) as CategoriaDB[]
      setCategorias(cats)
      if (!categoriaId && cats.length > 0) setCategoriaId(cats[0].id)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!titulo.trim())                               { setErro('O título é obrigatório.'); return }
    if (!conteudo.trim() || conteudo === '<p></p>')   { setErro('O conteúdo não pode estar vazio.'); return }
    if (!categoriaId)                                 { setErro('Selecione uma categoria.'); return }

    setSalvando(true); setErro('')

    try {
      let registroId = inicial?.id

      const payload = {
        titulo,
        sessao_id:    sessaoId   || null,
        categoria_id: categoriaId || null,
        conteudo,
      }

      if (modo === 'criar') {
        const { data: { user } } = await supabase.auth.getUser()
        const { data, error } = await supabase
          .from('registros')
          .insert({ ...payload, criado_por: user?.id })
          .select('id').single()
        if (error) throw error
        registroId = data.id
      } else {
        // Busca estado atual para salvar no histórico antes de atualizar
        const { data: atual } = await supabase
          .from('registros')
          .select('titulo, conteudo, editado_por')
          .eq('id', inicial!.id)
          .single()

        const { data: { user: currentUser } } = await supabase.auth.getUser()

        const { error } = await supabase
          .from('registros')
          .update({ ...payload, atualizado_em: new Date().toISOString(), editado_por: currentUser?.id })
          .eq('id', inicial!.id)
        if (error) throw error

        // Salva snapshot no histórico
        if (atual) {
          await supabase.from('registro_historico').insert({
            registro_id: inicial!.id,
            titulo:      atual.titulo,
            conteudo:    atual.conteudo,
            editado_por: currentUser?.id,
          })
        }
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

  const sessaoSelecionada   = sessoes.find(s => s.id === sessaoId)
  const categoriaSelecionada = categorias.find(c => c.id === categoriaId)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Título */}
      <div>
        <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)}
          placeholder="Título do registro..."
          className="w-full text-2xl font-semibold bg-transparent border-none outline-none text-gray-900 placeholder:text-gray-300 py-1" />
        <div className="h-px bg-gray-200 mt-2" />
      </div>

      {/* Sessão */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">Sessão <span className="text-gray-400 font-normal">(opcional)</span></label>
          <a href="/sessoes" className="text-xs text-brand-600 hover:underline">+ Gerenciar sessões</a>
        </div>
        {sessoes.length === 0 ? (
          <p className="text-sm text-gray-400 bg-gray-50 rounded-xl px-4 py-3">
            Nenhuma sessão criada.{' '}
            <a href="/sessoes" className="text-brand-600 hover:underline font-medium">Criar agora</a>
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setSessaoId('')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition border
                ${!sessaoId ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}`}>
              Sem sessão
            </button>
            {sessoes.map(s => (
              <button key={s.id} type="button" onClick={() => setSessaoId(s.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition border-2
                  ${sessaoId === s.id ? 'text-white border-transparent' : 'bg-white border-transparent hover:border-gray-200'}`}
                style={sessaoId === s.id ? { backgroundColor: s.cor } : { color: s.cor, borderColor: s.cor + '44' }}>
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                {s.nome}
              </button>
            ))}
          </div>
        )}
        {sessaoSelecionada && (
          <p className="text-xs text-gray-400 mt-2">Sessão: <strong style={{ color: sessaoSelecionada.cor }}>{sessaoSelecionada.nome}</strong></p>
        )}
      </div>

      {/* Categoria */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">Categoria</label>
          <a href="/categorias" className="text-xs text-brand-600 hover:underline">+ Gerenciar categorias</a>
        </div>
        {categorias.length === 0 ? (
          <p className="text-sm text-gray-400 bg-gray-50 rounded-xl px-4 py-3">
            Nenhuma categoria.{' '}
            <a href="/categorias" className="text-brand-600 hover:underline font-medium">Criar agora</a>
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categorias.map(cat => (
              <button key={cat.id} type="button" onClick={() => setCategoriaId(cat.id)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition border-2 ${cat.cor}
                  ${categoriaId === cat.id ? 'border-gray-600 scale-105' : 'border-transparent'}`}>
                {cat.nome}
              </button>
            ))}
          </div>
        )}
        {categoriaSelecionada && (
          <p className="text-xs text-gray-400 mt-2">
            Categoria: <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${categoriaSelecionada.cor}`}>{categoriaSelecionada.nome}</span>
          </p>
        )}
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

      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <button type="button" onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-700 transition">
          Cancelar
        </button>
        <button type="submit" disabled={salvando}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition disabled:opacity-60 disabled:cursor-not-allowed">
          {salvando
            ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Salvando...</>
            : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>{modo === 'criar' ? 'Salvar registro' : 'Salvar alterações'}</>
          }
        </button>
      </div>
    </form>
  )
}
