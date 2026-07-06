import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Calendar, Users, CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import Card from '../../components/Card'
import Avatar from '../../components/Avatar'
import PageHeader from '../../components/PageHeader'
import LoadingSpinner from '../../components/LoadingSpinner'
import api from '../../services/api'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#111111] border border-red-900/30 rounded-xl p-3 shadow-xl">
      <p className="text-xs text-zinc-400 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} className="text-sm font-medium" style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

function AttendanceBadge({ attended, total }) {
  if (total === 0) return <span className="text-xs text-zinc-600">—</span>
  const pct = Math.round((attended / total) * 100)
  const color = pct >= 80 ? 'text-green-400' : pct >= 50 ? 'text-amber-400' : 'text-red-400'
  const bg    = pct >= 80 ? 'bg-green-500/10 border-green-500/20' : pct >= 50 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20'
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${color} ${bg}`}>
      {pct}%
    </span>
  )
}

export default function AdminReports() {
  const [activityData, setActivityData]   = useState([])
  const [justStatusData, setJustStatusData] = useState([])
  const [months, setMonths]               = useState({}) // { 'YYYY-MM': [...records] }
  const [openMonth, setOpenMonth]         = useState(null)
  const [loading, setLoading]             = useState(true)
  const [loadingMonthly, setLoadingMonthly] = useState(true)

  useEffect(() => {
    Promise.all([api.getActivityChart(), api.getJustificationStatus()])
      .then(([a, j]) => {
        setActivityData(a.activityData)
        setJustStatusData(j.justStatusData)
      })
      .finally(() => setLoading(false))

    api.getMonthly()
      .then(({ months: m }) => setMonths(m || {}))
      .catch(() => setMonths({}))
      .finally(() => setLoadingMonthly(false))
  }, [])

  const justBarData = justStatusData.map(item => ({ name: item.name, cantidad: item.value }))
  const monthKeys   = Object.keys(months).sort((a, b) => b.localeCompare(a))

  const monthLabel = (ym) => {
    const [y, m] = ym.split('-')
    const name = new Date(+y, +m - 1, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    return name.charAt(0).toUpperCase() + name.slice(1)
  }

  if (loading) return <LoadingSpinner message="Cargando reportes..." />

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title="Reportes"
        subtitle="Estadísticas en tiempo real + historial mensual de asistencias"
      />

      {/* Gráficas */}
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card padding="p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-white">Actividad mensual</h3>
              <TrendingUp size={16} className="text-red-400" />
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                <XAxis dataKey="name" tick={{ fill: '#52525b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#52525b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="usuarios" name="Usuarios" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} />
                <Area type="monotone" dataKey="justificaciones" name="Justificaciones" stroke="#b91c1c" fill="#b91c1c" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card padding="p-5">
            <h3 className="font-semibold text-white mb-5">Justificaciones por estado</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={justBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                <XAxis dataKey="name" tick={{ fill: '#52525b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#52525b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="cantidad" name="Cantidad" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      </div>

      {/* Historial mensual */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-red-400" />
          <h2 className="font-semibold text-white">Historial mensual de asistencias</h2>
          <span className="text-xs text-zinc-600 ml-1">— Se guarda automáticamente al cerrar cada mes</span>
        </div>

        {loadingMonthly ? (
          <LoadingSpinner message="Cargando historial..." />
        ) : monthKeys.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center py-10 gap-3">
              <Calendar size={36} className="text-zinc-700" />
              <p className="text-zinc-400 text-sm font-medium">Sin historial mensual aún</p>
              <p className="text-zinc-600 text-xs text-center max-w-xs">
                Al finalizar cada mes se guardará automáticamente el resumen de asistencias de todos los miembros.
              </p>
            </div>
          </Card>
        ) : (
          <div className="space-y-2">
            {monthKeys.map(ym => {
              const records  = months[ym] || []
              const isOpen   = openMonth === ym
              const totalU   = records.length
              const avgAtt   = totalU > 0 ? Math.round(records.reduce((s, r) => s + (r.totalEvents > 0 ? r.attended / r.totalEvents : 0), 0) / totalU * 100) : 0
              const atRisk   = records.filter(r => r.unjustified >= 3).length

              return (
                <div key={ym} className="rounded-2xl border border-zinc-800/60 bg-[#111111] overflow-hidden">
                  {/* Cabecera mes */}
                  <button
                    onClick={() => setOpenMonth(isOpen ? null : ym)}
                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-zinc-800/30 transition-colors">
                    <div className="flex-1 flex items-center gap-4 min-w-0">
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-bold text-white">{monthLabel(ym)}</span>
                        <span className="text-xs text-zinc-500">{totalU} miembros</span>
                      </div>
                      <div className="hidden sm:flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                          <Users size={12} />{totalU} miembros
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-green-400">
                          <CheckCircle2 size={12} />Asistencia media: {avgAtt}%
                        </div>
                        {atRisk > 0 && (
                          <div className="flex items-center gap-1.5 text-xs text-red-400">
                            <AlertTriangle size={12} />{atRisk} en riesgo
                          </div>
                        )}
                      </div>
                    </div>
                    {isOpen ? <ChevronUp size={16} className="text-zinc-500 flex-shrink-0" /> : <ChevronDown size={16} className="text-zinc-500 flex-shrink-0" />}
                  </button>

                  {/* Tabla de registros */}
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      className="border-t border-zinc-800/50 overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-zinc-800/50">
                              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Miembro</th>
                              <th className="px-4 py-3 text-center text-xs font-semibold text-zinc-500 uppercase tracking-wider">Actividades</th>
                              <th className="px-4 py-3 text-center text-xs font-semibold text-zinc-500 uppercase tracking-wider">Asistencia</th>
                              <th className="px-4 py-3 text-center text-xs font-semibold text-zinc-500 uppercase tracking-wider">Justificadas</th>
                              <th className="px-4 py-3 text-center text-xs font-semibold text-zinc-500 uppercase tracking-wider">Sin justificar</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800/30">
                            {records.map((r, i) => (
                              <tr key={r.userId} className={`hover:bg-zinc-800/20 transition-colors ${r.unjustified >= 3 ? 'bg-red-500/5' : ''}`}>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <Avatar src={r.avatar} alt={r.systemName} size="sm" />
                                    <div>
                                      <p className="text-sm font-medium text-white">{r.systemName}</p>
                                      <p className="text-xs text-zinc-500">@{r.username}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className="text-sm text-zinc-300">{r.totalEvents}</span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <AttendanceBadge attended={r.attended} total={r.totalEvents} />
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className="flex items-center justify-center gap-1 text-sm text-green-400">
                                    <CheckCircle2 size={13} />{r.justified}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {r.unjustified === 0 ? (
                                    <span className="text-sm text-zinc-600">0</span>
                                  ) : r.unjustified >= 3 ? (
                                    <span className="flex items-center justify-center gap-1 text-sm text-red-400 font-bold">
                                      <AlertTriangle size={13} />{r.unjustified}
                                    </span>
                                  ) : (
                                    <span className="flex items-center justify-center gap-1 text-sm text-amber-400">
                                      <XCircle size={13} />{r.unjustified}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
