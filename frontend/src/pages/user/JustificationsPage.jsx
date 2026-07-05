import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, CalendarDays, CheckCircle2, ChevronDown, ChevronUp, Send } from 'lucide-react'
import { useApp } from '../../hooks/useApp'
import Button from '../../components/Button'
import Badge from '../../components/Badge'
import Modal from '../../components/Modal'
import Input from '../../components/Input'
import PageHeader from '../../components/PageHeader'
import LoadingSpinner from '../../components/LoadingSpinner'
import ChatBot from '../../components/ChatBot'
import api from '../../services/api'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateStr(fecha) {
  if (!fecha) return ''
  if (typeof fecha === 'string') return fecha.slice(0, 10)
  return new Date(fecha).toISOString().slice(0, 10)
}

function monthKey(fecha) {
  return toDateStr(fecha).slice(0, 7)
}
function monthLabel(key) {
  const [y, m] = key.split('-')
  const name = new Date(+y, +m - 1, 1).toLocaleDateString('es-ES', { month: 'long' })
  return `${name.charAt(0).toUpperCase() + name.slice(1)} ${y}`
}
function weekNum(fecha) { return Math.ceil(new Date(toDateStr(fecha) + 'T00:00:00').getDate() / 7) }
const WEEK_LABELS = ['', 'Semana 1', 'Semana 2', 'Semana 3', 'Semana 4', 'Semana 5']

function organize(items, dateField = 'fecha') {
  const map = {}
  items.forEach(item => {
    const mk = monthKey(item[dateField])
    const wn = weekNum(item[dateField])
    if (!map[mk]) map[mk] = {}
    if (!map[mk][wn]) map[mk][wn] = []
    map[mk][wn].push(item)
  })
  Object.values(map).forEach(weeks =>
    Object.values(weeks).forEach(arr => arr.sort((a, b) => new Date(a[dateField]) - new Date(b[dateField])))
  )
  return map
}

// ─── Sidebar de meses + acordeón de semanas ───────────────────────────────────

function MonthWeekLayout({ data, selMonth, onMonthSelect, openWeeks, onToggleWeek, children }) {
  const months = Object.keys(data).sort((a, b) => b.localeCompare(a))
  const activeMonth = months.includes(selMonth) ? selMonth : months[0] ?? null

  return (
    <div className="flex gap-2 flex-col sm:flex-row sm:items-start">
      {/* Months sidebar */}
      <div className="flex sm:flex-col gap-2 flex-wrap sm:flex-nowrap sm:w-40 flex-shrink-0">
        {months.map(mk => {
          const count = Object.values(data[mk]).flat().length
          const isActive = activeMonth === mk
          return (
            <button key={mk} onClick={() => onMonthSelect(mk)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all border w-full text-left
                ${isActive
                  ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/20'
                  : 'bg-[#111111] text-zinc-400 border-zinc-800/70 hover:border-red-500/30 hover:text-white'
                }`}>
              <span className="truncate">{monthLabel(mk)}</span>
              <span className={`text-xs ml-2 px-1.5 py-0.5 rounded-md flex-shrink-0
                ${isActive ? 'bg-red-500/40 text-red-100' : 'bg-zinc-800 text-zinc-500'}`}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Weeks accordion */}
      {activeMonth && data[activeMonth] && (
        <div className="flex-1 min-w-0 space-y-2">
          {Object.keys(data[activeMonth]).sort((a, b) => +a - +b).map((wn, wi) => {
            const items = data[activeMonth][wn]
            const isOpen = openWeeks[wn] ?? false
            return (
              <motion.div key={wn}
                initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: wi * 0.04 }}
                className="rounded-2xl border border-zinc-800/70 overflow-hidden bg-[#111111]">
                {/* Week header button */}
                <button onClick={() => onToggleWeek(wn)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-zinc-800/40 transition-colors">
                  <span className="text-sm font-semibold text-white">{WEEK_LABELS[+wn]}</span>
                  <span className="text-xs text-zinc-600 flex-1 text-left">
                    {items[0] && new Date(toDateStr(items[0].fecha) + 'T00:00:00')
                      .toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                    {' — '}
                    {items[items.length - 1] && new Date(toDateStr(items[items.length - 1].fecha) + 'T00:00:00')
                      .toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 flex-shrink-0">
                    {items.length} {items.length === 1 ? 'registro' : 'registros'}
                  </span>
                  {isOpen ? <ChevronUp size={15} className="text-zinc-500 flex-shrink-0" /> : <ChevronDown size={15} className="text-zinc-500 flex-shrink-0" />}
                </button>
                {/* Week content via render prop */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                      className="overflow-hidden border-t border-zinc-800/60">
                      <div className="p-3 space-y-2">
                        {children(items, activeMonth, wn)}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function JustificationsPage() {
  const { currentUser, adminEvents } = useApp()
  const [justList, setJustList]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [filter, setFilter]           = useState('all')
  // id del evento con el formulario de justificación abierto
  const [openFormId, setOpenFormId]   = useState(null)
  const [forms, setForms]             = useState({}) // { [eventoId]: { motivo, descripcion } }
  const [submitting, setSubmitting]   = useState(false)
  const [successId, setSuccessId]     = useState(null)

  const loadJustifications = () => {
    api.getJustifications()
      .then(({ justifications }) => setJustList(justifications))
      .catch(() => setJustList([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadJustifications() }, [])

  const myJust   = justList.filter(j => j.userId === currentUser?.id)
  const filtered = filter === 'all' ? myJust : myJust.filter(j => j.estado === filter)

  const actData  = organize(adminEvents, 'fecha')
  const justData = organize(filtered, 'fecha')

  const actMonths  = Object.keys(actData).sort((a, b) => b.localeCompare(a))
  const justMonths = Object.keys(justData).sort((a, b) => b.localeCompare(a))

  const [actMonth,  setActMonth]  = useState(() => actMonths[0]  ?? null)
  const [justMonth, setJustMonth] = useState(() => justMonths[0] ?? null)
  const [actWeeks,  setActWeeks]  = useState({})
  const [justWeeks, setJustWeeks] = useState({})

  const alreadyJustified = (id) => myJust.some(j => j.eventoId === id)
  const getForm = (id) => forms[id] || { motivo: '', descripcion: '' }
  const setFormField = (id, field, value) =>
    setForms(prev => ({ ...prev, [id]: { ...getForm(id), [field]: value } }))

  const toggleForm = (ev) => {
    if (alreadyJustified(ev.id)) return
    setOpenFormId(prev => (prev === ev.id ? null : ev.id))
  }

  const handleSubmit = async (ev, e) => {
    e.preventDefault()
    const f = getForm(ev.id)
    if (!f.motivo.trim()) return
    setSubmitting(true)
    try {
      await api.createJustification({
        motivo:       f.motivo.trim(),
        fecha:        ev.fecha,
        descripcion:  f.descripcion.trim(),
        eventoId:     ev.id,
        eventoNombre: ev.titulo,
      })
      loadJustifications()
      setForms(prev => ({ ...prev, [ev.id]: { motivo: '', descripcion: '' } }))
      setOpenFormId(null)
      setSuccessId(ev.id)
      setTimeout(() => setSuccessId(null), 3000)
    } catch (err) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const counts = {
    all:       myJust.length,
    pendiente: myJust.filter(j => j.estado === 'pendiente').length,
    aprobada:  myJust.filter(j => j.estado === 'aprobada').length,
    rechazada: myJust.filter(j => j.estado === 'rechazada').length,
  }

  return (
    <div className="space-y-8 max-w-6xl">
      {loading ? (
        <LoadingSpinner message="Cargando justificaciones..." />
      ) : (
        <>
          <PageHeader
            title="Justificaciones"
            subtitle="Abre una actividad para justificar tu ausencia"
          />

          {/* ══ ACTIVIDADES DEL SERVIDOR ══ */}
          {adminEvents.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <CalendarDays size={16} className="text-red-400" />
                <h2 className="font-semibold text-white text-sm">Actividades del servidor</h2>
                <span className="text-xs text-zinc-600 ml-1">— Abre una para justificar tu ausencia</span>
              </div>
              <MonthWeekLayout
                data={actData} selMonth={actMonth}
                onMonthSelect={(mk) => { setActMonth(mk); setActWeeks({}) }}
                openWeeks={actWeeks}
                onToggleWeek={(wn) => setActWeeks(p => ({ ...p, [wn]: !p[wn] }))}
              >
                {(items) => items.map((ev) => {
                  const justified = alreadyJustified(ev.id)
                  const formOpen  = openFormId === ev.id
                  const d         = new Date(toDateStr(ev.fecha) + 'T00:00:00')
                  const dayName   = d.toLocaleDateString('es-ES', { weekday: 'long' })
                  const f         = getForm(ev.id)
                  return (
                    <div key={ev.id} className={`rounded-xl border overflow-hidden transition-all
                      ${justified ? 'border-green-500/20' : formOpen ? 'border-red-500/30' : 'border-zinc-800/50'}`}>
                      {/* Fila clickeable */}
                      <button onClick={() => toggleForm(ev)} disabled={justified}
                        className="w-full flex items-stretch text-left disabled:cursor-default hover:bg-zinc-800/20 transition-colors">
                        <div className={`flex-shrink-0 w-12 flex flex-col items-center justify-center py-2.5 border-r
                          ${justified ? 'border-green-500/15 bg-green-500/5' : formOpen ? 'border-red-500/20 bg-red-500/5' : 'border-zinc-800/50 bg-zinc-900/30'}`}>
                          <span className="text-xs text-zinc-500 capitalize">{dayName.slice(0, 3)}</span>
                          <span className={`text-base font-bold leading-tight ${justified ? 'text-green-400' : formOpen ? 'text-red-400' : 'text-white'}`}>{d.getDate()}</span>
                        </div>
                        <div className="flex-1 flex items-center gap-3 px-3 py-2.5 min-w-0">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{ev.titulo}</p>
                            {ev.descripcion && <p className="text-xs text-zinc-500 truncate">{ev.descripcion}</p>}
                          </div>
                          <div className="flex-shrink-0">
                            {justified ? (
                              <span className="flex items-center gap-1 text-xs text-green-400 font-medium">
                                <CheckCircle2 size={13} />Justificado
                              </span>
                            ) : (
                              <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg border transition-all
                                ${formOpen ? 'bg-red-500/15 text-red-400 border-red-500/25' : 'bg-zinc-800/80 text-zinc-400 border-zinc-700/40'}`}>
                                Justificar
                                {formOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                      {/* Formulario inline */}
                      <AnimatePresence initial={false}>
                        {formOpen && !justified && (
                          <motion.div key="form"
                            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                            className="overflow-hidden border-t border-red-500/20">
                            <form onSubmit={(e) => handleSubmit(ev, e)} className="p-4 space-y-3 bg-red-500/5">
                              <p className="text-xs text-red-400 font-medium flex items-center gap-1.5">
                                <CalendarDays size={12} />
                                Justificando ausencia en: <strong>{ev.titulo}</strong>
                              </p>
                              <Input label="Motivo" placeholder="Ej: Cita médica, Examen, Trabajo..."
                                value={f.motivo} onChange={e => setFormField(ev.id, 'motivo', e.target.value)} required />
                              <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-zinc-300">
                                  Descripción <span className="text-zinc-600 font-normal">(opcional)</span>
                                </label>
                                <textarea value={f.descripcion} onChange={e => setFormField(ev.id, 'descripcion', e.target.value)}
                                  rows={2} placeholder="Describe brevemente el motivo..."
                                  className="w-full bg-[#0a0a0a] border border-zinc-800/80 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500 transition-all resize-none" />
                              </div>
                              <div className="flex gap-2 pt-1">
                                <Button type="button" variant="secondary" onClick={() => setOpenFormId(null)}>Cancelar</Button>
                                <Button type="submit" icon={<Send size={13} />} disabled={submitting}>
                                  {submitting ? 'Enviando...' : 'Enviar justificación'}
                                </Button>
                              </div>
                            </form>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </MonthWeekLayout>
            </section>
          )}

          {adminEvents.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <CalendarDays size={40} className="text-zinc-700" />
              <p className="text-zinc-400 font-medium">No hay actividades publicadas aún</p>
              <p className="text-zinc-600 text-sm">Los admins publicarán actividades aquí</p>
            </div>
          )}

          {/* ══ MIS JUSTIFICACIONES ══ */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-zinc-400" />
                <h2 className="font-semibold text-white text-sm">Mis justificaciones</h2>
              </div>
              <div className="flex gap-2 flex-wrap">
                {[
                  { key: 'all',       label: 'Todas',      color: 'text-white'     },
                  { key: 'pendiente', label: 'Pendientes', color: 'text-amber-400' },
                  { key: 'aprobada',  label: 'Aprobadas',  color: 'text-green-400' },
                  { key: 'rechazada', label: 'Rechazadas', color: 'text-red-400'   },
                ].map(s => (
                  <button key={s.key} onClick={() => setFilter(s.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                      ${filter === s.key ? 'bg-red-600 text-white' : 'bg-zinc-800/60 text-zinc-400 hover:text-white'}`}>
                    <span className={filter === s.key ? 'text-white' : s.color}>{counts[s.key]}</span>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <FileText size={36} className="text-zinc-700" />
                <p className="text-zinc-400 font-medium">Sin justificaciones</p>
                <p className="text-zinc-600 text-sm">Abre una actividad de arriba para justificar tu ausencia</p>
              </div>
            ) : (
              <MonthWeekLayout
                data={justData} selMonth={justMonth}
                onMonthSelect={(mk) => { setJustMonth(mk); setJustWeeks({}) }}
                openWeeks={justWeeks}
                onToggleWeek={(wn) => setJustWeeks(p => ({ ...p, [wn]: !p[wn] }))}
              >
                {(items) => items.map((j) => {
                  const d = new Date(toDateStr(j.fecha) + 'T00:00:00')
                  const dayName = d.toLocaleDateString('es-ES', { weekday: 'long' })
                  return (
                    <div key={j.id}
                      className="flex items-stretch border border-zinc-800/50 hover:border-red-900/25 rounded-xl overflow-hidden transition-all">
                      <div className="flex-shrink-0 w-12 flex flex-col items-center justify-center py-2.5 border-r border-zinc-800/50 bg-zinc-900/30">
                        <span className="text-xs text-zinc-500 capitalize">{dayName.slice(0, 3)}</span>
                        <span className="text-base font-bold text-white leading-tight">{d.getDate()}</span>
                      </div>
                      <div className="flex-1 flex items-center gap-3 px-3 py-2.5 min-w-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-white truncate">{j.motivo}</p>
                            {j.eventoNombre && (
                              <span className="text-xs text-red-400 flex items-center gap-1 flex-shrink-0">
                                <CalendarDays size={10} />{j.eventoNombre}
                              </span>
                            )}
                          </div>
                          {j.descripcion && <p className="text-xs text-zinc-500 truncate">{j.descripcion}</p>}
                        </div>
                        <div className="flex-shrink-0">
                          <Badge variant={j.estado} dot>
                            {j.estado.charAt(0).toUpperCase() + j.estado.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </MonthWeekLayout>
            )}
          </section>

          {/* Toast */}
          <AnimatePresence>
            {successId && (
              <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="fixed bottom-24 right-6 flex items-center gap-2 px-4 py-3 bg-green-600 rounded-xl shadow-xl text-white text-sm font-medium z-50">
                <CheckCircle2 size={16} />
                Justificación enviada correctamente
              </motion.div>
            )}
          </AnimatePresence>

          {/* Chatbot con contexto específico de justificaciones */}
          <ChatBot context="justifications" />
        </>
      )}
    </div>
  )
}
