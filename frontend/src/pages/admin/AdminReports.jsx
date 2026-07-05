import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Download } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import Card from '../../components/Card'
import Button from '../../components/Button'
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

export default function AdminReports() {
  const [activityData, setActivityData] = useState([])
  const [justStatusData, setJustStatusData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.getActivityChart(), api.getJustificationStatus()])
      .then(([a, j]) => {
        setActivityData(a.activityData)
        setJustStatusData(j.justStatusData)
      })
      .finally(() => setLoading(false))
  }, [])

  const justBarData = justStatusData.map(item => ({
    name: item.name,
    cantidad: item.value,
  }))

  if (loading) return <LoadingSpinner message="Cargando reportes..." />

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title="Reportes"
        subtitle="Estadísticas generadas desde la base de datos"
        action={<Button variant="outline" icon={<Download size={16} />} disabled>Exportar PDF</Button>}
      />

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card padding="p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-white">Actividad mensual</h3>
              <TrendingUp size={16} className="text-red-400" />
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                <XAxis dataKey="name" tick={{ fill: '#52525b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#52525b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="usuarios" name="Usuarios" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} />
                <Area type="monotone" dataKey="justificaciones" name="Justificaciones" stroke="#b91c1c" fill="#b91c1c" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card padding="p-5">
            <h3 className="font-semibold text-white mb-5">Justificaciones por estado</h3>
            <ResponsiveContainer width="100%" height={260}>
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
    </div>
  )
}
