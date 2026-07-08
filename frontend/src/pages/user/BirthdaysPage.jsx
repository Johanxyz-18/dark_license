import { motion, AnimatePresence } from 'framer-motion'
import { Cake, PartyPopper, Calendar, Settings } from 'lucide-react'
import { useApp } from '../../hooks/useApp'
import { Link } from 'react-router-dom'
import Card from '../../components/Card'
import Avatar from '../../components/Avatar'

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function BirthdayCountdown({ birthday }) {
  const today = new Date()
  // Parsear en hora local para evitar desfase de zona horaria
  const parts = birthday.slice(0, 10).split('-')
  const bd = new Date(+parts[0], +parts[1] - 1, +parts[2])
  let next = new Date(today.getFullYear(), bd.getMonth(), bd.getDate())
  if (next < today) next = new Date(today.getFullYear() + 1, bd.getMonth(), bd.getDate())

  const msLeft = next - today
  const daysLeft = Math.floor(msLeft / (1000 * 60 * 60 * 24))
  const hoursLeft = Math.floor((msLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutesLeft = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60))

  const isToday = daysLeft === 0
  const age = today.getFullYear() - bd.getFullYear() + (isToday ? 0 : 0)
  const nextAge = today.getFullYear() - bd.getFullYear() + (isToday ? 0 : 1)

  return (
    <div className="space-y-4">
      {isToday ? (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center p-6 bg-gradient-to-br from-amber-500/20 to-orange-500/10 border-2 border-amber-500/50 rounded-2xl"
        >
          <div className="text-6xl mb-3">🎂</div>
          <h2 className="text-2xl font-bold text-amber-300">¡Hoy es tu cumpleaños!</h2>
          <p className="text-amber-200/80 mt-1">¡Felicidades! 🎉🎊🎈</p>
        </motion.div>
      ) : (
        <>
          <div className="text-center mb-2">
            <p className="text-slate-400 text-sm">Tu próximo cumpleaños será el</p>
            <p className="text-white font-bold text-lg mt-0.5">
              {bd.getDate()} de {MONTHS[bd.getMonth()]}
            </p>
            <p className="text-slate-500 text-xs mt-0.5">Cumplirás {nextAge} años</p>
          </div>

          {/* Countdown blocks */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: daysLeft, label: 'Días' },
              { value: hoursLeft, label: 'Horas' },
              { value: minutesLeft, label: 'Minutos' },
            ].map((c, i) => (
              <motion.div
                key={c.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="text-center p-4 bg-[#0f172a]/60 border border-slate-700/50 rounded-2xl"
              >
                <p className="text-4xl font-bold text-white tabular-nums">{String(c.value).padStart(2, '0')}</p>
                <p className="text-xs text-slate-400 mt-1">{c.label}</p>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function BirthdaysPage() {
  const { currentUser } = useApp()

  const today = new Date()
  const hasBirthday = !!currentUser?.birthday
  const isToday = hasBirthday && (() => {
    const parts = currentUser.birthday.slice(0, 10).split('-')
    const d = new Date(+parts[0], +parts[1] - 1, +parts[2])
    return d.getMonth() === today.getMonth() && d.getDate() === today.getDate()
  })()

  return (
    <div className="space-y-6 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">Mi Cumpleaños</h1>
        <p className="text-slate-400 text-sm mt-1">Cuenta regresiva hasta tu día especial</p>
      </motion.div>

      {/* Today birthday notification */}
      <AnimatePresence>
        {isToday && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-5 bg-gradient-to-r from-amber-500/20 to-orange-500/10 border border-amber-500/40 rounded-2xl"
          >
            <div className="flex items-center gap-2 mb-3">
              <PartyPopper size={20} className="text-amber-400" />
              <h2 className="font-bold text-amber-300">¡Hoy es tu cumpleaños! 🎉</h2>
            </div>
            <p className="text-amber-200/80 text-sm">¡Que tengas un día increíble, {currentUser?.displayName}! 🎂🎊</p>
          </motion.div>
        )}
      </AnimatePresence>

      {hasBirthday ? (
        <>
          {/* Profile + countdown */}
          <Card>
            <div className="flex flex-col items-center gap-5 mb-6 pb-6 border-b border-slate-700/50">
              <Avatar src={currentUser?.avatar} alt={currentUser?.displayName} size="xl" />
              <div className="text-center">
                <p className="text-xl font-bold text-white">{currentUser?.displayName}</p>
                <p className="text-slate-400 text-sm">@{currentUser?.robloxUsername}</p>
              </div>
            </div>
            <BirthdayCountdown birthday={currentUser.birthday} />
          </Card>

          {/* Birthday details */}
          <Card>
            <h3 className="font-semibold text-white mb-4">Información de cumpleaños</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-[#0f172a]/50 border border-slate-700/30 rounded-xl">
                <Calendar size={16} className="text-blue-400" />
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Fecha de cumpleaños</p>
                  <p className="text-sm font-semibold text-white mt-0.5">
                    {(() => {
                      const parts = currentUser.birthday.slice(0, 10).split('-')
                      const d = new Date(+parts[0], +parts[1] - 1, +parts[2])
                      return `${d.getDate()} de ${MONTHS[d.getMonth()]} de ${d.getFullYear()}`
                    })()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-[#0f172a]/50 border border-slate-700/30 rounded-xl">
                <Cake size={16} className="text-violet-400" />
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Próxima edad</p>
                  <p className="text-sm font-semibold text-white mt-0.5">
                    {(() => {
                      const parts = currentUser.birthday.slice(0, 10).split('-')
                      const bd = new Date(+parts[0], +parts[1] - 1, +parts[2])
                      const next = new Date(today.getFullYear(), bd.getMonth(), bd.getDate())
                      const age = today.getFullYear() - bd.getFullYear() + (next < today ? 1 : 0)
                      return `${age} años`
                    })()}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </>
      ) : (
        /* No birthday set */
        <Card>
          <div className="flex flex-col items-center justify-center py-12 gap-5">
            <div className="w-20 h-20 rounded-2xl bg-slate-700/50 flex items-center justify-center">
              <Cake size={40} className="text-slate-500" />
            </div>
            <div className="text-center">
              <h3 className="text-white font-semibold text-lg">No has configurado tu cumpleaños</h3>
              <p className="text-slate-400 text-sm mt-1">
                Añade tu fecha de cumpleaños para ver la cuenta regresiva y recibir el saludo del equipo.
              </p>
            </div>
            <Link to="/dashboard/settings">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium text-sm transition-colors"
              >
                <Settings size={16} />
                Ir a Configuración
              </motion.button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  )
}
