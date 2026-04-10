import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export interface Registro {
  id: string
  titulo: string
  conteudo: string
  categoria_id: string
  criado_por: string
  criado_em: string
  atualizado_em: string
}

export interface CategoriaDB {
  id: string
  nome: string
  cor: string
  criado_em: string
}

export interface Anexo {
  id: string
  registro_id: string
  nome: string
  url: string
  tipo: 'imagem' | 'pdf'
  tamanho: number
  criado_em: string
}

export interface ArquivoUpload {
  nome: string
  url: string
  tipo: 'imagem' | 'pdf'
  tamanho: number
}

export const CORES_CATEGORIA = [
  { value: 'bg-red-100 text-red-700',    label: 'Vermelho' },
  { value: 'bg-blue-100 text-blue-700',  label: 'Azul' },
  { value: 'bg-green-100 text-green-700',label: 'Verde' },
  { value: 'bg-yellow-100 text-yellow-700', label: 'Amarelo' },
  { value: 'bg-purple-100 text-purple-700', label: 'Roxo' },
  { value: 'bg-pink-100 text-pink-700',  label: 'Rosa' },
  { value: 'bg-orange-100 text-orange-700', label: 'Laranja' },
  { value: 'bg-gray-100 text-gray-700',  label: 'Cinza' },
]

export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB em bytes
