import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar } from 'lucide-react'
import { AppProvider, useApp } from './hooks/useApp'
import LoginPage from './pages/LoginPage'
import UserLayout from './layouts/UserLayout'
import AdminLayout from './layouts/AdminLayout'
import HomePage from './pages/user/HomePage'
import ProfilePage from './pages/user/ProfilePage'
import JustificationsPage from './pages/user/JustificationsPage'
import BirthdaysPage from './pages/user/BirthdaysPage'
import SettingsPage from './pages/user/SettingsPage'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminActivities from './pages/admin/AdminActivities'
import AdminJustifications from './pages/admin/AdminJustifications'
import AdminBirthdays from './pages/admin/AdminBirthdays'
import AdminReports from './pages/admin/AdminReports'
import AdminSettings from './pages/admin/AdminSettings'
import Button from './components/Button'
import Input from './components/Input'

// ── Modal de cumpleaños obligatorio ──────────────────────────
function BirthdayModal() {
  const { currentUser, updateCurrentUser } = useApp()
  const [birthday, setBirthday] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  // Solo mostrar si está autenticado y no tiene cumpleaños
  if (!currentUser || currentUser.birthday) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!birthday) return setError('Selecciona tu fecha de cumpleaños')
    setLoading(true)
    try {
      await updateCurrentUser({ birthday })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-sm bg-[#111111] border border-amber-500/30 rounded-2xl overflow-hidden shadow-2xl"
      >
        {/* Header dorado */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
        <div className="p-6">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
              <Calendar size={24} className="text-amber-400" />
            </div>
            <h2 className="text-xl font-bold text-white">¡Un último paso!</h2>
            <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
              Para aparecer en el calendario de cumpleaños de la comunidad, necesitas registrar tu fecha.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-300">Fecha de cumpleaños</label>
              <input
                type="date"
                value={birthday}
                onChange={e => { setBirthday(e.target.value); setError('') }}
                required
                className="w-full bg-[#0a0a0a] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
              />
              {error && <p className="text-xs text-red-400">{error}</p>}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm tracking-wider uppercase transition-all
                bg-gradient-to-r from-amber-700 via-amber-500 to-amber-700
                hover:from-amber-600 hover:via-amber-400 hover:to-amber-600
                text-black shadow-lg shadow-amber-900/40 disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Guardar y continuar →'}
            </button>
          </form>
        </div>
        <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-900/50 to-transparent" />
      </motion.div>
    </div>
  )
}

// ── Rutas ─────────────────────────────────────────────────────
function AppRoutes() {
  const { isAuthenticated, currentUser } = useApp()

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  if (currentUser?.role === 'admin') {
    return (
      <>
        <BirthdayModal />
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="activities" element={<AdminActivities />} />
            <Route path="justifications" element={<AdminJustifications />} />
            <Route path="birthdays" element={<AdminBirthdays />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </>
    )
  }

  return (
    <>
      <BirthdayModal />
      <Routes>
        <Route path="/dashboard" element={<UserLayout />}>
          <Route index element={<HomePage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="justifications" element={<JustificationsPage />} />
          <Route path="birthdays" element={<BirthdaysPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  )
}
