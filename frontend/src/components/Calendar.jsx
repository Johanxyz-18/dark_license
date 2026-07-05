import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DAYS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

export default function Calendar({ birthdays = [], onDayClick }) {
  const today = new Date()
  const [current, setCurrent] = useState({ month: today.getMonth(), year: today.getFullYear() })

  const firstDay = new Date(current.year, current.month, 1).getDay()
  const daysInMonth = new Date(current.year, current.month + 1, 0).getDate()

  const getBirthdaysOnDay = (day) => {
    return birthdays.filter(b => {
      if (!b.birthday) return false
      const d = new Date(b.birthday)
      return d.getMonth() === current.month && d.getDate() === day
    })
  }

  const prev = () => setCurrent(c => {
    if (c.month === 0) return { month: 11, year: c.year - 1 }
    return { month: c.month - 1, year: c.year }
  })

  const next = () => setCurrent(c => {
    if (c.month === 11) return { month: 0, year: c.year + 1 }
    return { month: c.month + 1, year: c.year }
  })

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let i = 1; i <= daysInMonth; i++) cells.push(i)

  return (
    <div className="bg-[#0f172a]/60 rounded-2xl border border-slate-700/50 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prev} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
          <ChevronLeft size={18} />
        </button>
        <span className="font-semibold text-white">
          {MONTHS[current.month]} {current.year}
        </span>
        <button onClick={next} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs text-slate-500 font-medium py-1">{d}</div>
        ))}
      </div>

      {/* Cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />
          const bdays = getBirthdaysOnDay(day)
          const isToday = today.getDate() === day && today.getMonth() === current.month && today.getFullYear() === current.year
          const hasBirthday = bdays.length > 0

          return (
            <motion.button
              key={day}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onDayClick && onDayClick(day, bdays)}
              className={`
                relative flex flex-col items-center justify-center h-9 rounded-lg text-sm font-medium transition-colors
                ${isToday ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : ''}
                ${hasBirthday && !isToday ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : ''}
                ${!isToday && !hasBirthday ? 'text-slate-300 hover:bg-slate-700/50' : ''}
              `}
            >
              {day}
              {hasBirthday && (
                <span className="absolute bottom-0.5 w-1 h-1 bg-amber-400 rounded-full" />
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-700/50">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-blue-600" />
          <span className="text-xs text-slate-400">Hoy</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-amber-500/20 border border-amber-500/30" />
          <span className="text-xs text-slate-400">Cumpleaños</span>
        </div>
      </div>
    </div>
  )
}
