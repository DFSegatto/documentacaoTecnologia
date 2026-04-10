import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import FormRegistro from '../components/FormRegistro'

export default function NovoRegistro() {
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? ''))
  }, [])

  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      <Navbar userEmail={userEmail} />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link to="/" className="hover:text-gray-600 transition">Registros</Link>
          <span>/</span>
          <span className="text-gray-700">Novo registro</span>
        </div>
        <FormRegistro modo="criar" />
      </main>
    </div>
  )
}
