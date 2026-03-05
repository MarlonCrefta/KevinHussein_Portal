import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LayoutDashboard, Plus, MessageSquare, LogOut, Menu, X, List, User, Users, Settings } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuthContext } from '../contexts'

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/agendamentos', label: 'Agendamentos', icon: List },
  { href: '/admin/clientes', label: 'Clientes', icon: Users },
  { href: '/admin/vagas', label: 'Publicar Horários', icon: Plus },
  { href: '/admin/whatsapp', label: 'WhatsApp', icon: MessageSquare },
  { href: '/admin/configuracoes', label: 'Configurações', icon: Settings },
]

export default function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuthContext()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Redirect se não autenticado (exceto na página de login)
  useEffect(() => {
    if (!isAuthenticated && location.pathname !== '/admin') {
      navigate('/admin')
    }
  }, [isAuthenticated, location.pathname, navigate])

  useEffect(() => {
    setIsSidebarOpen(false)
  }, [location])

  const handleLogout = async () => {
    await logout()
    navigate('/admin')
  }

  // Don't show sidebar on login page
  if (location.pathname === '/admin' || location.pathname === '/admin/login') {
    return (
      <div className="relative min-h-screen bg-slate-50">
        <div className="relative z-10">
          <Outlet />
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-slate-50">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <Link to="/admin/dashboard" className="flex items-center gap-2">
            <img src="/LOGO SEM FUNDO.png" alt="Kevin Hussein" className="w-9 h-9 object-contain" />
            <span className="font-semibold text-lg text-gray-800">Admin</span>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-gray-500 hover:text-gray-800 transition-colors"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="lg:hidden fixed inset-0 z-40 bg-black/20"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200
        transform transition-transform duration-300 lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-5">
          {/* Logo */}
          <Link to="/admin/dashboard" className="flex items-center gap-3 mb-8">
            <img src="/LOGO SEM FUNDO.png" alt="Kevin Hussein Tattoo" className="w-11 h-11 object-contain" />
            <div>
              <span className="font-semibold text-lg text-gray-800 block">Kevin Hussein</span>
              <span className="text-gray-400 text-xs flex items-center gap-1">
                <User size={10} /> {user?.name || 'Admin'}
              </span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="space-y-1">
            {navItems.map(item => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                    ${isActive 
                      ? 'bg-indigo-600 text-white' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                    }
                  `}
                >
                  <item.icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-5 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 w-full"
          >
            <LogOut size={20} />
            <span className="font-medium">Sair</span>
          </button>
          <Link
            to="/"
            className="flex items-center justify-center gap-2 mt-3 text-gray-400 hover:text-indigo-600 text-sm transition-colors duration-200"
          >
            Voltar ao site
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}
