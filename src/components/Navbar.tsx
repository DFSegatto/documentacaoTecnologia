import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface NavbarProps {
  userEmail?: string | null
}

export default function Navbar({ userEmail }: NavbarProps) {
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="text-sm font-semibold text-gray-900 group-hover:text-brand-600 transition">
            Base de Conhecimento
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link to="/categorias"
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 text-sm px-3 py-1.5 rounded-lg transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a2 2 0 012-2z" />
            </svg>
            <span className="hidden sm:inline">Categorias</span>
          </Link>

          <Link to="/registros/novo"
            className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-3.5 py-1.5 rounded-lg transition">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Novo registro
          </Link>

          <div className="flex items-center gap-2 pl-2 border-l border-gray-100">
            {userEmail && <span className="text-xs text-gray-500 hidden sm:block">{userEmail}</span>}
            <button onClick={handleLogout} title="Sair"
              className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
