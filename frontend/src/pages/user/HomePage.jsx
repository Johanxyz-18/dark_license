import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Clock, Cake, Shield, TrendingUp, X, PartyPopper } from 'lucide-react'
import { useApp } from '../../hooks/useApp'
import Card from '../../components/Card'
import Avatar from '../../components/Avatar'
import Badge from '../../components/Badge'
import PageHeader from '../../components/PageHeader'
import LoadingSpinner from '../../components/LoadingSpinner'
import api from '../../services/api'

function StatCard({ icon, label, value, sub, color, delay = 0 }) {
  const colors = {
    red: 'from-red-600/20 to-red-900/10 border-red-500/30 shadow-red-500/10',
    amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 shadow-amber-500/10',
    green: 'from-green-500/20 to-green-600/10 border-green-500/30 shadow-green-500/10',
    zinc: 'from-zinc-700/20 to-zinc-800/10 border-zinc-600/30 shadow-zinc-500/10',
  }
  const iconColors = {
    red: 'text-red-400 bg-red-500/20',
    amber: 'text-amber-400 bg-amber-500/20',
    green: 'text-green-400 bg-green-500/20',
    zinc: 'text-zinc-400 bg-zinc-700/30',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-5 shadow-lg`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${iconColors[color]}`}>{icon}</div>
        <TrendingUp size={14} className="text-zinc-600" />
      </div>
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
      <p className="text-sm font-medium text-zinc-300">{label}</p>
      {sub && <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>}
    </motion.div>
  )
}

export default function HomePage() {
  const { currentUser } = useApp()
  const [showBirthdayBanner, setShowBirthdayBanner] = useState(false)
  const [myJust, setMyJust] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getJustifications()
      .then(({ justifications }) => setMyJust(justifications))
      .catch(() => setMyJust([]))
      .finally(() => setLoading(false))
  }, [])

  const pending = myJust.filter(j => j.estado === 'pendiente').length
  const total = myJust.length
  const today = new Date()

  useEffect(() => {
    if (currentUser?.birthday) {
      const bd = new Date(currentUser.birthday)
      if (bd.getMonth() === today.getMonth() && bd.getDate() === today.getDate()) {
        setShowBirthdayBanner(true)
      }
    }
  }, [currentUser])

  const getDaysUntilBirthday = () => {
    if (!currentUser?.birthday) return null
    const bd = new Date(currentUser.birthday)
    let next = new Date(today.getFullYear(), bd.getMonth(), bd.getDate())
    if (next < today) next = new Date(today.getFullYear() + 1, bd.getMonth(), bd.getDate())
    const diff = Math.ceil((next - today) / (1000 * 60 * 60 * 24))
    return diff === 0 ? '¡Hoy!' : `${diff} días`
  }

  const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

  if (loading) return <LoadingSpinner message="Cargando tu panel..." />

  return (
    <div className="space-y-6 max-w-6xl">
      <AnimatePresence>
        {showBirthdayBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="relative p-5 bg-gradient-to-r from-amber-500/30 via-orange-500/20 to-amber-500/30 border-2 border-amber-500/50 rounded-2xl shadow-xl shadow-amber-500/20 overflow-hidden"
          >
            <div className="relative flex items-center gap-4">
              <div className="text-5xl">🎂</div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-amber-300">¡Feliz Cumpleaños, {currentUser?.displayName}! 🎉</h2>
                <p className="text-amber-200/80 text-sm mt-0.5">¡Que tengas un día increíble!</p>
              </div>
              <button onClick={() => setShowBirthdayBanner(false)} className="p-1.5 rounded-lg hover:bg-amber-500/20 text-amber-400">
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PageHeader
        title={`Hola, ${currentUser?.displayName} 👋`}
        subtitle={`@${currentUser?.robloxUsername} · ID: ${currentUser?.robloxId}`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<FileText size={20} />} label="Mis justificaciones" value={total} sub="Total enviadas" color="red" delay={0.1} />
        <StatCard icon={<Clock size={20} />} label="Pendientes" value={pending} sub="Esperando respuesta" color="amber" delay={0.15} />
        <StatCard icon={<Cake size={20} />} label="Mi cumpleaños" value={getDaysUntilBirthday() || '—'} sub={currentUser?.birthday ? (() => { const d = new Date(currentUser.birthday); return `${d.getDate()} de ${MONTHS[d.getMonth()]}` })() : 'No establecido'} color="zinc" delay={0.2} />
        <StatCard icon={<Shield size={20} />} label="Estado de cuenta" value={currentUser?.status === 'active' ? 'Activo' : 'Inactivo'} sub="Sin restricciones" color="green" delay={0.25} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Justificaciones recientes</h2>
            <Badge variant="info">{total} total</Badge>
          </div>
          {myJust.length === 0 ? (
            <div className="text-center py-8">
              <FileText size={32} className="text-zinc-700 mx-auto mb-2" />
              <p className="text-zinc-400 text-sm">No tienes justificaciones aún</p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...myJust].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4).map((j, i) => (
                <motion.div key={j.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-[#0a0a0a]/60 border border-zinc-800/50">
                  <FileText size={16} className="text-red-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{j.motivo}</p>
                    <p className="text-xs text-zinc-400">{new Date(j.fecha).toLocaleDateString('es-ES')}</p>
                  </div>
                  <Badge variant={j.estado}>{j.estado.charAt(0).toUpperCase() + j.estado.slice(1)}</Badge>
                </motion.div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Mi cumpleaños</h2>
            <Cake size={16} className="text-amber-400" />
          </div>
          {currentUser?.birthday ? (
            <div className="flex flex-col items-center justify-center py-6 gap-4">
              <Avatar src={currentUser?.avatar} alt={currentUser?.displayName} size="xl" />
              <div className="text-center">
                <p className="text-xl font-bold text-white">{currentUser?.displayName}</p>
                <p className="text-zinc-400 text-sm mt-0.5">
                  {(() => { const d = new Date(currentUser.birthday); return `${d.getDate()} de ${MONTHS[d.getMonth()]}` })()}
                </p>
              </div>
              <div className={`px-4 py-2 rounded-xl font-semibold text-sm ${getDaysUntilBirthday() === '¡Hoy!' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-red-500/10 text-red-300 border border-red-500/20'}`}>
                {getDaysUntilBirthday() === '¡Hoy!' ? '🎉 ¡Hoy es tu cumpleaños!' : `🎂 Faltan ${getDaysUntilBirthday()}`}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Cake size={40} className="text-zinc-700" />
              <p className="text-zinc-400 text-sm">No has configurado tu cumpleaños</p>
              <p className="text-zinc-500 text-xs">Ve a Configuración para añadirlo</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
