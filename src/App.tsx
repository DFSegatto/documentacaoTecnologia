import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import type { User } from '@supabase/supabase-js'

import Login          from './pages/Login'
import Home           from './pages/Home'
import NovoRegistro   from './pages/NovoRegistro'
import VerRegistro    from './pages/VerRegistro'
import EditarRegistro from './pages/EditarRegistro'
import Categorias     from './pages/Categorias'

type AuthState = 'loading' | 'authenticated' | 'unauthenticated'

function Spinner() {
  return (
    <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function RotaProtegida({ estado, children }: { estado: AuthState; children: React.ReactNode }) {
  if (estado === 'loading')         return <Spinner />
  if (estado === 'unauthenticated') return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  const [user,   setUser]   = useState<User | null>(null)
  const [estado, setEstado] = useState<AuthState>('loading')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null)
      setEstado(data.user ? 'authenticated' : 'unauthenticated')
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ?? null
      setUser(u)
      setEstado(u ? 'authenticated' : 'unauthenticated')
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <Routes>
      <Route path="/login" element={
        estado === 'loading' ? <Spinner />
        : estado === 'authenticated' ? <Navigate to="/" replace />
        : <Login />
      } />
      <Route path="/" element={
        <RotaProtegida estado={estado}><Home user={user} /></RotaProtegida>
      } />
      <Route path="/registros/novo" element={
        <RotaProtegida estado={estado}><NovoRegistro user={user} /></RotaProtegida>
      } />
      <Route path="/registros/:id" element={
        <RotaProtegida estado={estado}><VerRegistro user={user} /></RotaProtegida>
      } />
      <Route path="/registros/:id/editar" element={
        <RotaProtegida estado={estado}><EditarRegistro user={user} /></RotaProtegida>
      } />
      <Route path="/categorias" element={
        <RotaProtegida estado={estado}><Categorias user={user} /></RotaProtegida>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
