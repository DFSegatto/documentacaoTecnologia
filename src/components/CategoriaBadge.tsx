import { CATEGORIAS, type Categoria } from '../lib/supabase'

export default function CategoriaBadge({ categoria }: { categoria: Categoria }) {
  const cat = CATEGORIAS.find(c => c.value === categoria)
  if (!cat) return null
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cat.cor}`}>
      {cat.label}
    </span>
  )
}
