import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, User, FileText, Cake, Settings, LogOut, Menu, X,
  Bell, ChevronDown, BookOpen, CheckCircle2, AlertCircle,
  Gamepad2, Calendar, Lock, Shield
} from 'lucide-react'
import { useApp } from '../hooks/useApp'
import Avatar from '../components/Avatar'
import ChatBot from '../components/ChatBot'
import api from '../services/api'

// ── Guía de instrucciones por sección ────────────────────────
const GUIDE = [
  {
    section: '🏠 Inicio',
    steps: [
      'Ve el resumen de tus justificaciones y tu cumpleaños.',
      'El indicador de estado muestra si tu cuenta está activa.',
      'Las justificaciones recientes aparecen en la parte inferior.',
    ],
  },
  {
    section: '👤 Mi Perfil',
    steps: [
      'Aquí ves tu nombre en el sistema, username de Roblox e ID.',
      'Haz clic en "Editar" para cambiar tu nombre en el sistema.',
      'También puedes actualizar tu fecha de cumpleaños desde aquí.',
    ],
  },
  {
    section: '📋 Justificaciones',
    steps: [
      'Verás las actividades activas publicadas por los admins.',
      'Haz clic sobre una actividad para abrir el formulario.',
      'Escribe el motivo de tu ausencia y haz clic en "Enviar".',
      'Las actividades se cierran automáticamente a las 30 horas.',
      'Una vez enviada, puedes ver el estado en "Mis justificaciones".',
    ],
  },
  {
    section: '🎂 Cumpleaños',
    steps: [
      'Muestra la cuenta regresiva hasta tu próximo cumpleaños.',
      'Si no configuraste tu fecha aún, ve a Configuración.',
      'El día de tu cumpleaños aparecerá una sorpresa 🎉',
    ],
  },
  {
    section: '⚙️ Configuración',
    steps: [
      'Cambia tu contraseña en la sección correspondiente.',
      'Actualiza tu username de Roblox (1 vez cada 7 días).',
      'Registra o actualiza tu fecha de cumpleaños.',
    ],
  },
  {
    section: '💡 Tips',
    steps: [
      'Tu nombre de Roblox debe contener "DL" o tu cuenta se suspende.',
      'Si tu cuenta se suspende, pon "DL" en tu nombre de Roblox e intenta ingresar.',
      'Usa el asistente (🤖) si tienes dudas sobre cualquier función.',
    ],
  },
]

const navItems = [
  { to: '/dashboard',                  icon: <Home size={18} />,     label: 'Inicio',           end: true },
  { to: '/dashboard/profile',          icon: <User size={18} />,     label: 'Mi Perfil' },
  { to: '/dashboard/justifications',   icon: <FileText size={18} />, label: 'Justificaciones' },
  { to: '/dashboard/birthdays',        icon: <Cake size={18} />,     label: 'Cumpleaños' },
  { to: '/dashboard/settings',         icon: <Settings size={18} />, label: 'Configuración' },
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
          <Shield size={16} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-white text-sm leading-tight">Dark License</p>
          <p className="text-xs text-zinc-500">Panel de Usuario</p>
        </div>
        {onClose && (
          <button onClick={onClose} className="ml-auto text-zinc-400 hover:text-white transition-colors lg:hidden">
            <X size={20} />
          </button>
        )}
      </div>

      {/* User info */}
      <div className="px-3 py-4 border-b border-red-900/30">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0a0a0a]/60 border border-zinc-800/60">
          <Avatar src={currentUser?.avatar} alt={currentUser?.systemName || currentUser?.displayName} size="md" online />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">
              {currentUser?.systemName || currentUser?.displayName}
            </p>
            <p className="text-xs text-zinc-500 truncate">@{currentUser?.username}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(item => (
          <NavLink key={item.to} to={item.to} end={item.end} onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
               ${isActive
                 ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                 : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-white'}`
            }>
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-red-900/30">
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200">
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

export default function UserLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifOpen, setNotifOpen]     = useState(false)
  const [guideOpen, setGuideOpen]     = useState(false)
  const [myJustifs, setMyJustifs]     = useState([])
  const { currentUser } = useApp()

  useEffect(() => {
    api.getJustifications()
      .then(({ justifications }) => {
        const recent = justifications
          .filter(j => j.estado !== 'pendiente')
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5)
        setMyJustifs(recent)
      })
      .catch(() => {})
  }, [])

  // Cerrar paneles al hacer click fuera
  useEffect(() => {
    const handler = () => {
      setNotifOpen(false)
      setGuideOpen(false)
    }
    if (notifOpen || guideOpen) {
      document.addEventListener('click', handler)
      return () => document.removeEventListener('click', handler)
    }
  }, [notifOpen, guideOpen])

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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)} />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-[#111111] border-r border-red-900/30 z-50 lg:hidden">
              <SidebarContent onClose={() => setSidebarOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-[#111111]/90 backdrop-blur border-b border-red-900/30 flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
          <button onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">
            <Menu size={20} />
          </button>

          <div className="hidden lg:block">
            <h1 className="text-sm font-medium text-zinc-400">
              Bienvenido,{' '}
              <span className="text-white font-semibold">
                {currentUser?.systemName || currentUser?.displayName}
              </span>
            </h1>
          </div>

          <div className="flex items-center gap-2 ml-auto">

            {/* ── Guía de uso ── */}
            <div className="relative" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => { setGuideOpen(o => !o); setNotifOpen(false) }}
                className={`relative p-2 rounded-xl transition-colors
                  ${guideOpen
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'}`}
                title="Guía de uso">
                <BookOpen size={18} />
              </button>
              <AnimatePresence>
                {guideOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-11 w-80 bg-[#111111] border border-amber-500/20 rounded-2xl shadow-2xl z-50 overflow-hidden">

                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-amber-500/5">
                      <div className="flex items-center gap-2">
                        <BookOpen size={15} className="text-amber-400" />
                        <p className="text-sm font-bold text-white">Guía de uso</p>
                      </div>
                      <button onClick={() => setGuideOpen(false)} className="text-zinc-500 hover:text-white">
                        <X size={14} />
                      </button>
                    </div>

                    {/* Contenido scrolleable */}
                    <div className="max-h-[420px] overflow-y-auto p-3 space-y-3">
                      {GUIDE.map((section, si) => (
                        <div key={si} className="rounded-xl border border-zinc-800/50 overflow-hidden">
                          <div className="px-3 py-2 bg-zinc-800/40">
                            <p className="text-xs font-bold text-white">{section.section}</p>
                          </div>
                          <ul className="px-3 py-2 space-y-1.5">
                            {section.steps.map((step, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="w-4 h-4 rounded-full bg-red-600/20 text-red-400 text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                                  {i + 1}
                                </span>
                                <p className="text-xs text-zinc-400 leading-relaxed">{step}</p>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}

                      {/* Footer */}
                      <div className="p-3 bg-red-500/5 border border-red-500/15 rounded-xl">
                        <p className="text-xs text-zinc-500 leading-relaxed">
                          ¿Más dudas? Usa el asistente{' '}
                          <span className="text-red-400 font-semibold">🤖</span>{' '}
                          en la esquina inferior derecha.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Notificaciones ── */}
            <div className="relative" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => { setNotifOpen(o => !o); setGuideOpen(false) }}
                className={`relative p-2 rounded-xl transition-colors
                  ${notifOpen
                    ? 'bg-zinc-800 text-white'
                    : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'}`}>
                <Bell size={18} />
                {myJustifs.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-11 w-72 bg-[#111111] border border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                      <p className="text-sm font-semibold text-white">Notificaciones</p>
                      <button onClick={() => setNotifOpen(false)} className="text-zinc-500 hover:text-white">
                        <X size={14} />
                      </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {myJustifs.length === 0 ? (
                        <div className="flex flex-col items-center py-8 gap-2">
                          <Bell size={24} className="text-zinc-700" />
                          <p className="text-zinc-500 text-sm">Sin notificaciones nuevas</p>
                        </div>
                      ) : myJustifs.map(j => (
                        <div key={j.id}
                          className="flex items-start gap-3 px-4 py-3 hover:bg-zinc-800/40 transition-colors border-b border-zinc-800/40 last:border-0">
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5
                            ${j.estado === 'aprobada' ? 'bg-green-500/15' : 'bg-red-500/15'}`}>
                            {j.estado === 'aprobada'
                              ? <CheckCircle2 size={13} className="text-green-400" />
                              : <AlertCircle size={13} className="text-red-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-white leading-relaxed">
                              Tu justificación{' '}
                              <span className="font-semibold text-zinc-200">"{j.motivo}"</span>{' '}
                              fue{' '}
                              <span className={`font-semibold ${j.estado === 'aprobada' ? 'text-green-400' : 'text-red-400'}`}>
                                {j.estado}
                              </span>
                            </p>
                            {j.eventoNombre && (
                              <p className="text-xs text-zinc-600 mt-0.5">{j.eventoNombre}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Avatar ── */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0a0a0a]/70 border border-red-900/30">
              <Avatar src={currentUser?.avatar} alt={currentUser?.displayName} size="sm" />
              <span className="text-sm text-white font-medium hidden sm:block">
                {currentUser?.systemName || currentUser?.displayName}
              </span>
              <ChevronDown size={14} className="text-zinc-400" />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      <ChatBot context="general" />
    </div>
  )
}
