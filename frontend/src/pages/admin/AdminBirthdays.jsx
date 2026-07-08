import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Cake } from 'lucide-react'
import Calendar from '../../components/Calendar'
import Avatar from '../../components/Avatar'
import SearchBar from '../../components/SearchBar'
import PageHeader from '../../components/PageHeader'
import LoadingSpinner from '../../components/LoadingSpinner'
import api from '../../services/api'

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

// Parsea fecha de cumpleaños en hora local para evitar desfase de zona horaria
function parseDate(dateStr) {
  if (!dateStr) return null
  const parts = String(dateStr).slice(0, 10).split('-')
  return new Date(+parts[0], +parts[1] - 1, +parts[2])
}

export default function AdminBirthdays() {
  const [birthdays, setBirthdays] = useState([])
  const [search, setSearch] = useState('')
  const [selectedMonth, setSelectedMonth] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getBirthdays()
      .then(({ birthdays: data }) => setBirthdays(data))
      .catch(() => setBirthdays([]))
      .finally(() => setLoading(false))
  }, [])

  const today = new Date()

  const filtered = birthdays.filter(b => {
    const matchSearch = !search || b.displayName.toLowerCase().includes(search.toLowerCase())
    const d = parseDate(b.birthday)
    const matchMonth = selectedMonth === 'all' || (d && d.getMonth() === parseInt(selectedMonth))
    return matchSearch && matchMonth
  })

  const grouped = MONTHS.reduce((acc, month, i) => {
    const items = filtered.filter(b => { const d = parseDate(b.birthday); return d && d.getMonth() === i })
    if (items.length) acc[i] = items
    return acc
  }, {})

  if (loading) return <LoadingSpinner message="Cargando cumpleaños..." />

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader title="Cumpleaños" subtitle={`${birthdays.length} cumpleaños registrados en la base de datos`} />

      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <h2 className="font-semibold text-white mb-3">Calendario</h2>
          <Calendar birthdays={birthdays} />
        </div>

        <div className="space-y-4">
          <div className="flex gap-3">
            <SearchBar value={search} onChange={setSearch} placeholder="Buscar persona..." className="flex-1" />
            <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}
              className="bg-[#111111] border border-zinc-800 text-zinc-300 text-sm rounded-xl px-3 py-2.5 outline-none focus:border-red-500">
              <option value="all">Todos los meses</option>
              {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {Object.entries(grouped).map(([monthIdx, items]) => (
              <div key={monthIdx}>
                <div className="flex items-center gap-2 mb-2">
                  <Cake size={14} className="text-amber-400" />
                  <h3 className="text-sm font-semibold text-amber-300">{MONTHS[monthIdx]}</h3>
                  <span className="text-xs text-zinc-500">({items.length})</span>
                </div>
                <div className="space-y-2">
                  {items.map((b, i) => {
                    const d = parseDate(b.birthday)
                    const isToday = d && d.getMonth() === today.getMonth() && d.getDate() === today.getDate()
                    return (
                      <motion.div key={b.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-colors
                          ${isToday ? 'bg-amber-500/10 border-amber-500/30' : 'bg-[#111111] border-zinc-800/50'}`}>
                        <Avatar src={b.avatar} alt={b.displayName} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{b.systemName || b.displayName}</p>
                          <p className="text-xs text-zinc-400">@{b.robloxUsername}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-white">{d.getDate()}</p>
                          <p className="text-xs text-zinc-500">{MONTHS[d.getMonth()].slice(0,3)}</p>
                        </div>
                        {isToday && <span className="text-lg">🎉</span>}
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            ))}
            {Object.keys(grouped).length === 0 && (
              <div className="text-center py-8 text-zinc-500">No se encontraron cumpleaños</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
