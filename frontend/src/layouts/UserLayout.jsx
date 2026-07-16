import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, User, FileText, Cake, Settings, LogOut, Menu, X,
  Bell, ChevronDown, CheckCircle2, AlertCircle,
  Shield, Vote, ChevronLeft, ChevronRight, GraduationCap
} from 'lucide-react'
import { useApp } from '../hooks/useApp'
import Avatar from '../components/Avatar'
import ChatBot from '../components/ChatBot'
import api from '../services/api'

// ── Tutorial paso a paso ──────────────────────────────────────
const TUTORIAL_STEPS = [
  { emoji: '👋', title: '¡Bienvenido a Dark License!', desc: 'Este es tu panel de miembro. En unos pasos rápidos te explicamos todo lo que necesitas saber.' },
  { emoji: '🏠', title: 'Inicio', desc: 'En la página de inicio ves un resumen de tu actividad: justificaciones enviadas, estado de tu cuenta y actividad reciente.' },
  { emoji: '📋', title: 'Justificaciones', desc: 'Cuando faltes a una actividad, entra aquí y envía una justificación antes de que cierre (30 horas). Elige la actividad, escribe el motivo y envía.' },
  { emoji: '🗳️', title: 'Convivencias', desc: 'Aquí puedes votar si asistirás a las convivencias. Vota "Sí" o "No" antes de que cierre la votación. Si no votas, recibirás un aviso.' },
  { emoji: '🎂', title: 'Cumpleaños', desc: 'Ve la cuenta regresiva hasta tu cumpleaños. Si aún no configuraste tu fecha, ve a Configuración para agregarla.' },
  { emoji: '⚙️', title: 'Configuración', desc: 'Cambia tu contraseña, actualiza tu username de Roblox (máx. 1 vez cada 7 días) y configura tu fecha de cumpleaños.' },
  { emoji: '⚠️', title: 'Importante: el tag DL', desc: 'Tu nombre en Roblox DEBE contener "DL" (ej: DL_TuNombre). Si lo quitas, tu cuenta se suspende automáticamente. ¡Mantenlo siempre!' },
  { emoji: '✅', title: '¡Listo! Ya sabes todo', desc: 'Si tienes dudas usa el asistente 🤖 en la esquina inferior derecha, o abre el tutorial de nuevo desde el botón de arriba.' },
]

const navItems = [
  { to: '/dashboard',                icon: <Home size={18} />,     label: 'Inicio',         end: true },
  { to: '/dashboard/profile',        icon: <User size={18} />,     label: 'Mi Perfil' },
  { to: '/dashboard/justifications', icon: <FileText size={18} />, label: 'Justificaciones' },
  { to: '/dashboard/voting',         icon: <Vote size={18} />,     label: 'Convivencias' },
  { to: '/dashboard/birthdays',      icon: <Cake size={18} />,     label: 'Cumpleaños' },
  { to: '/dashboard/settings',       icon: <Settings size={18} />, label: 'Configuración' },
]

function TutorialModal({ onClose }) {
  const [step, setStep] = useState(0)
  const total   = TUTORIAL_STEPS.length
  const current = TUTORIAL_STEPS[step]
  const isLast  = step === total - 1
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 16 }} transition={{ type: 'spring', damping: 22 }}
        className="w-full max-w-sm bg-[#111111] rounded-2xl overflow-hidden"
        style={{ boxShadow: '0 0 0 1px rgba(180,130,40,0.2), 0 25px 60px rgba(0,0,0,0.7)' }}>
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
        <div className="px-5 pt-4 pb-1">
          <div className="flex gap-1">
            {TUTORIAL_STEPS.map((_, i) => (
              <div key={i} onClick={() => setStep(i)}
                className={`h-1.5 rounded-full flex-1 cursor-pointer transition-all duration-300
                  ${i < step ? 'bg-amber-500' : i === step ? 'bg-amber-400' : 'bg-zinc-700 hover:bg-zinc-600'}`} />
            ))}
          </div>
          <p className="text-xs text-zinc-600 mt-1.5 text-right">{step + 1} / {total}</p>
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={step}
            initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.18 }}
            className="px-5 pb-2 pt-2 min-h-[160px] flex flex-col items-center justify-center text-center">
            <div className="text-5xl mb-4">{current.emoji}</div>
            <h2 className="text-lg font-bold text-white mb-2">{current.title}</h2>
            <p className="text-sm text-zinc-400 leading-relaxed">{current.desc}</p>
          </motion.div>
        </AnimatePresence>
        <div className="px-5 pb-5 pt-3 flex gap-3">
          {step > 0 ? (
            <button onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-1 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 transition-all">
              <ChevronLeft size={14} /> Atrás
            </button>
          ) : (
            <button onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-500 hover:text-zinc-300 border border-zinc-800 transition-all">
              Saltar
            </button>
          )}
          {isLast ? (
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl font-bold text-sm text-black bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 hover:brightness-110 transition-all">
              ¡Entendido! →
            </button>
          ) : (
            <button onClick={() => setStep(s => s + 1)}
              className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl font-bold text-sm text-black bg-gradient-to-r from-amber-700 via-amber-500 to-amber-700 hover:brightness-110 transition-all">
              Siguiente <ChevronRight size={14} />
            </button>
          )}
        </div>
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-amber-900/40 to-transparent" />
      </motion.div>
    </div>
  )
}

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
  const [tutorialOpen, setTutorialOpen] = useState(false)
  const [notifs, setNotifs]           = useState([])
  const [unread, setUnread]           = useState(0)
  const { currentUser } = useApp()

  const loadNotifs = () => {
    api.getNotifications()
      .then(({ notifications, unread: u }) => { setNotifs(notifications); setUnread(u) })
      .catch(() => {})
  }

  useEffect(() => {
    loadNotifs()
    const t = setInterval(loadNotifs, 2 * 60 * 1000)
    return () => clearInterval(t)
  }, [])

  const handleMarkAllRead = async () => {
    await api.markAllRead().catch(() => {})
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
    setUnread(0)
  }

  // Cerrar notif al hacer click fuera
  useEffect(() => {
    const handler = () => setNotifOpen(false)
    if (notifOpen) {
      document.addEventListener('click', handler)
      return () => document.removeEventListener('click', handler)
    }
  }, [notifOpen])

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

      {/* Tutorial modal */}
      <AnimatePresence>
        {tutorialOpen && <TutorialModal onClose={() => setTutorialOpen(false)} />}
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

            {/* ── Botón Tutorial ── */}
            <button
              onClick={() => setTutorialOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-all"
              title="Tutorial">
              <GraduationCap size={15} />
              <span className="hidden sm:inline">Tutorial</span>
            </button>

            {/* ── Notificaciones ── */}
            <div className="relative" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => setNotifOpen(o => !o)}
                className={`relative p-2 rounded-xl transition-colors
                  ${notifOpen ? 'bg-zinc-800 text-white' : 'hover:bg-zinc-800 text-zinc-400 hover:text-white'}`}>
                <Bell size={18} />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center px-1 animate-pulse">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-11 w-80 bg-[#111111] border border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white">Notificaciones</p>
                        {unread > 0 && (
                          <span className="text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full">{unread} nuevas</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {unread > 0 && (
                          <button onClick={handleMarkAllRead} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                            Marcar leídas
                          </button>
                        )}
                        <button onClick={() => setNotifOpen(false)} className="text-zinc-500 hover:text-white">
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifs.length === 0 ? (
                        <div className="flex flex-col items-center py-10 gap-2">
                          <Bell size={24} className="text-zinc-700" />
                          <p className="text-zinc-500 text-sm">Sin notificaciones</p>
                        </div>
                      ) : notifs.map(n => (
                        <div key={n.id}
                          className={`flex items-start gap-3 px-4 py-3 hover:bg-zinc-800/40 transition-colors border-b border-zinc-800/30 last:border-0 cursor-pointer
                            ${!n.read ? 'bg-zinc-800/20' : ''}`}
                          onClick={() => {
                            api.markRead(n.id).catch(() => {})
                            setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))
                            setUnread(p => Math.max(0, p - (!n.read ? 1 : 0)))
                          }}>
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            n.type === 'activity_closed' ? 'bg-amber-500/15' :
                            n.type === 'monthly_reset'   ? 'bg-blue-500/15'  :
                            'bg-red-500/15'}`}>
                            {n.type === 'activity_closed' && <AlertCircle size={13} className="text-amber-400" />}
                            {n.type === 'monthly_reset'   && <CheckCircle2 size={13} className="text-blue-400" />}
                            {n.type === 'warning'         && <AlertCircle size={13} className="text-red-400" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-semibold truncate ${!n.read ? 'text-white' : 'text-zinc-300'}`}>{n.title}</p>
                            <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2 mt-0.5">{n.message}</p>
                            <p className="text-xs text-zinc-700 mt-1">
                              {new Date(n.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                            </p>
                          </div>
                          {!n.read && <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />}
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
