import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { User } from '@supabase/supabase-js'
import { supabase, type Registro, type ArquivoUpload } from '../lib/supabase'
import Navbar from '../components/Navbar'
import FormRegistro from '../components/FormRegistro'

export default function EditarRegistro({ user }: { user: User | null }) {
  const { id } = useParams<{ id: string }>()
  const [registro, setRegistro] = useState<Registro | null>(null)
  const [anexos,   setAnexos]   = useState<ArquivoUpload[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    if (!id) return
    async function carregar() {
      const { data: reg } = await supabase.from('registros').select('*').eq('id', id).single()
      const { data: anx } = await supabase.from('anexos').select('nome, url, tipo').eq('registro_id', id)
      setRegistro(reg as Registro)
      setAnexos((anx ?? []) as ArquivoUpload[])
      setLoading(false)
    }
    carregar()
  }, [id])

  if (loading) return (
    <div className="min-h-screen bg-[#f8f7f4]">
      <Navbar userEmail={user?.email} />
      <div className="flex items-center justify-center py-32">
        <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  )

  if (!registro) return (
    <div className="min-h-screen bg-[#f8f7f4]">
      <Navbar userEmail={user?.email} />
      <div className="text-center py-32">
        <p className="font-medium text-gray-700">Registro não encontrado</p>
        <Link to="/" className="text-sm text-brand-600 hover:underline mt-2 inline-block">Voltar</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      <Navbar userEmail={user?.email} />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link to="/" className="hover:text-gray-600 transition">Registros</Link>
          <span>/</span>
          <Link to={`/registros/${id}`} className="hover:text-gray-600 transition truncate max-w-xs">
            {registro.titulo}
          </Link>
          <span>/</span>
          <span className="text-gray-700">Editar</span>
        </div>
        <FormRegistro
          modo="editar"
          inicial={{
            id: registro.id,
            titulo: registro.titulo,
            categoria: registro.categoria,
            conteudo: registro.conteudo,
            anexosExistentes: anexos,
          }}
        />
      </main>
    </div>
  )
}
