import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export type Categoria = 'bug' | 'procedimento' | 'duvida' | 'configuracao' | 'outro'

export interface Registro {
  id: string
  titulo: string
  conteudo: string
  categoria: Categoria
  criado_por: string
  criado_em: string
  atualizado_em: string
}

export interface Anexo {
  id: string
  registro_id: string
  nome: string
  url: string
  tipo: 'imagem' | 'pdf'
  criado_em: string
}

export interface ArquivoUpload {
  nome: string
  url: string
  tipo: 'imagem' | 'pdf'
}

export const CATEGORIAS: { value: Categoria; label: string; cor: string }[] = [
  { value: 'bug',          label: 'Bug / Erro',       cor: 'bg-red-100 text-red-700' },
  { value: 'procedimento', label: 'Procedimento',     cor: 'bg-blue-100 text-blue-700' },
  { value: 'duvida',       label: 'Dúvida Frequente', cor: 'bg-yellow-100 text-yellow-700' },
  { value: 'configuracao', label: 'Configuração',     cor: 'bg-purple-100 text-purple-700' },
  { value: 'outro',        label: 'Outro',            cor: 'bg-gray-100 text-gray-700' },
]
