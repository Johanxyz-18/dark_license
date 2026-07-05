import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Clock, Cake, TrendingUp, Activity, UserCheck } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import Card from '../../components/Card'
import Avatar from '../../components/Avatar'
import PageHeader from '../../components/PageHeader'
import LoadingSpinner from '../../components/LoadingSpinner'
import api from '../../services/api'

function StatCard({ icon, label, value, sub, color, delay = 0 }) {
  const gradients = {
    red: 'from-red-600/20 to-red-900/10 border-red-500/30',
    green: 'from-green-600/20 to-green-800/10 border-green-500/30',
    amber: 'from-amber-600/20 to-amber-800/10 border-amber-500/30',
    zinc: 'from-zinc-700/20 to-zinc-800/10 border-zinc-600/30',
  }
  const iconBg = {
    red: 'bg-red-500/20 text-red-400',
    green: 'bg-green-500/20 text-green-400',
    amber: 'bg-amber-500/20 text-amber-400',
    zinc: 'bg-zinc-700/30 text-zinc-400',
  }

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} whileHover={{ y: -3 }}
      className={`bg-gradient-to-br ${gradients[color]} border rounded-2xl p-5 shadow-lg`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${iconBg[color]}`}>{icon}</div>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      <p className="text-sm font-medium text-zinc-300 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-zinc-500 mt-0.5">{sub}</p>}
    </motion.div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#111111] border border-red-900/30 rounded-xl p-3 shadow-xl">
      <p className="text-xs text-zinc-400 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} className="text-sm font-semibold" style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [activityData, setActivityData] = useState([])
  const [justStatusData, setJustStatusData] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.getDashboardStats(),
      api.getActivityChart(),
      api.getJustificationStatus(),
      api.getRecentActivity(),
    ]).then(([s, a, j, r]) => {
      setStats(s.stats)
      setActivityData(a.activityData)
      setJustStatusData(j.justStatusData)
      setRecentActivity(r.recentActivity)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingSpinner message="Cargando dashboard..." />

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader title="Dashboard" subtitle="Resumen general del sistema (datos en tiempo real)" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Users size={20} />} label="Usuarios registrados" value={stats?.totalUsers ?? 0} sub="Cuentas totales" color="red" delay={0.05} />
        <StatCard icon={<UserCheck size={20} />} label="Usuarios activos" value={stats?.activeUsers ?? 0} sub="Estado activo" color="green" delay={0.1} />
        <StatCard icon={<Clock size={20} />} label="Justificaciones pendientes" value={stats?.pendingJustifications ?? 0} sub="Requieren revisión" color="amber" delay={0.15} />
        <StatCard icon={<Cake size={20} />} label="Cumpleaños del mes" value={stats?.birthdaysThisMonth ?? 0} sub="Este mes" color="zinc" delay={0.2} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="lg:col-span-2">
          <Card padding="p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-white">Actividad del sistema</h3>
              <TrendingUp size={16} className="text-red-400" />
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="colorU" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorJ" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#b91c1c" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#b91c1c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                <XAxis dataKey="name" tick={{ fill: '#52525b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#52525b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="usuarios" name="Usuarios" stroke="#ef4444" strokeWidth={2} fill="url(#colorU)" />
                <Area type="monotone" dataKey="justificaciones" name="Justificaciones" stroke="#b91c1c" strokeWidth={2} fill="url(#colorJ)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card padding="p-5">
            <h3 className="font-semibold text-white mb-5">Estado de justificaciones</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={justStatusData} cx="50%" cy="45%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                  {justStatusData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Legend iconType="circle" iconSize={8} formatter={(val) => <span style={{ color: '#71717a', fontSize: 12 }}>{val}</span>} />
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <Activity size={18} className="text-red-400" />
            <h3 className="font-semibold text-white">Actividad reciente</h3>
          </div>
          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <p className="text-zinc-500 text-sm text-center py-6">Sin actividad reciente</p>
            ) : recentActivity.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#0a0a0a]/60 transition-colors">
                <Avatar src={a.avatar} alt={a.user} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white">
                    <span className="font-semibold">{a.user}</span>{' '}
                    <span className="text-zinc-400">{a.message}</span>
                  </p>
                </div>
                <span className="text-xs text-zinc-500 flex-shrink-0">{a.time}</span>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
