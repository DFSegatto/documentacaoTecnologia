import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import type { User } from '@supabase/supabase-js'

import Login       from './pages/Login'
import Home        from './pages/Home'
import NovoRegistro from './pages/NovoRegistro'
import VerRegistro  from './pages/VerRegistro'
import EditarRegistro from './pages/EditarRegistro'

function RotaProtegida({ user, children }: { user: User | null; children: React.ReactNode }) {
  if (user === undefined) return (
    <div className="min-h-screen bg-[#f8f7f4] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  const [user, setUser] = useState<User | null | undefined>(undefined)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <Routes>
      <Route path="/login" element={
        user ? <Navigate to="/" replace /> : <Login />
      } />
      <Route path="/" element={
        <RotaProtegida user={user}><Home /></RotaProtegida>
      } />
      <Route path="/registros/novo" element={
        <RotaProtegida user={user}><NovoRegistro /></RotaProtegida>
      } />
      <Route path="/registros/:id" element={
        <RotaProtegida user={user}><VerRegistro /></RotaProtegida>
      } />
      <Route path="/registros/:id/editar" element={
        <RotaProtegida user={user}><EditarRegistro /></RotaProtegida>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
