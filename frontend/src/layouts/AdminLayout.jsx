import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, FileText, Cake, BarChart3,
  Settings, LogOut, Menu, X, Bell, Shield, ChevronDown
} from 'lucide-react'
import { useApp } from '../hooks/useApp'
import Avatar from '../components/Avatar'

const navItems = [
  { to: '/admin', icon: <LayoutDashboard size={18} />, label: 'Dashboard', end: true },
  { to: '/admin/users', icon: <Users size={18} />, label: 'Usuarios' },
  { to: '/admin/justifications', icon: <FileText size={18} />, label: 'Justificaciones' },
  { to: '/admin/birthdays', icon: <Cake size={18} />, label: 'Cumpleaños' },
  { to: '/admin/reports', icon: <BarChart3 size={18} />, label: 'Reportes' },
  { to: '/admin/settings', icon: <Settings size={18} />, label: 'Configuración' },
]

function SidebarContent({ onClose }) {
  const { currentUser, logout } = useApp()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-red-900/30">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg shadow-red-600/30">
          <Shield size={18} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-white text-sm leading-tight">Dark License</p>
          <p className="text-xs text-red-400">Panel Administrador</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="ml-auto text-zinc-400 hover:text-white transition-colors lg:hidden">
            <X size={20} />
          </button>
        )}
      </div>

      {/* User info */}
      <div className="px-3 py-4 border-b border-red-900/30">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <Avatar src={currentUser?.avatar} alt={currentUser?.displayName} size="md" online />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">{currentUser?.systemName || currentUser?.displayName}</p>
            <p className="text-xs text-red-400 truncate">Administrador</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onClose}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
              transition-all duration-200
              ${isActive
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-white'
              }
            `}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-red-900/30">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { currentUser } = useApp()

  return (
    <div className="flex h-screen bg-[#0a0a0a] overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#111111] border-r border-red-900/30 flex-shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-[#111111] border-r border-red-900/30 z-50 lg:hidden"
            >
              <SidebarContent onClose={() => setSidebarOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-[#111111]/90 backdrop-blur border-b border-red-900/30 flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <Menu size={20} />
          </button>
          <div className="hidden lg:flex items-center gap-2">
            <Shield size={16} className="text-red-500" />
            <h1 className="text-sm font-medium text-zinc-400">Panel de{' '}
              <span className="text-red-400 font-semibold">Administración</span>
            </h1>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <button className="relative p-2 rounded-xl hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0a0a0a]/70 border border-red-900/30">
              <Avatar src={currentUser?.avatar} alt={currentUser?.displayName} size="sm" />
              <span className="text-sm text-white font-medium hidden sm:block">{currentUser?.systemName || currentUser?.displayName}</span>
              <ChevronDown size={14} className="text-zinc-400" />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
