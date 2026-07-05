import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Check, X, Eye, CalendarDays, Users, CheckCircle2, Circle, ChevronDown, ChevronUp, Trash2, FileText } from 'lucide-react'
import { useApp } from '../../hooks/useApp'
import Avatar from '../../components/Avatar'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import Input from '../../components/Input'
import PageHeader from '../../components/PageHeader'
import LoadingSpinner from '../../components/LoadingSpinner'
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/Table'
import api from '../../services/api'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDateStr(fecha) {
  if (!fecha) return ''
  if (typeof fecha === 'string') return fecha.slice(0, 10)
  return new Date(fecha).toISOString().slice(0, 10)
}

function monthKey(fecha) {
  const s = toDateStr(fecha)
  return s.slice(0, 7) // 'YYYY-MM'
}
function monthLabel(key) {
  const [y, m] = key.split('-')
  const name = new Date(+y, +m - 1, 1).toLocaleDateString('es-ES', { month: 'long' })
  return `${name.charAt(0).toUpperCase() + name.slice(1)} ${y}`
}
function weekNum(fecha) {
  return Math.ceil(new Date(toDateStr(fecha) + 'T00:00:00').getDate() / 7)
}
const WEEK_LABELS = ['', 'Semana 1', 'Semana 2', 'Semana 3', 'Semana 4', 'Semana 5']

function organize(events) {
  const map = {}
  events.forEach(ev => {
    const mk = monthKey(ev.fecha)
    const wn = weekNum(ev.fecha)
    if (!map[mk]) map[mk] = {}
    if (!map[mk][wn]) map[mk][wn] = []
    map[mk][wn].push(ev)
  })
  Object.values(map).forEach(weeks =>
    Object.values(weeks).forEach(arr => arr.sort((a, b) => new Date(a.fecha) - new Date(b.fecha)))
  )
  return map
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function AdminJustifications() {
  const { currentUser, refreshEvents } = useApp()
  const [justList, setJustList]           = useState([])
  const [createModal, setCreateModal]     = useState(false)
  const [viewModal, setViewModal]         = useState(null)
  const [expandedJust, setExpandedJust]   = useState(null)
  const [toast, setToast]                 = useState(null)
  const [events, setEvents]               = useState([])
  const [loading, setLoading]             = useState(true)
  const [form, setForm]                   = useState({ titulo: '', descripcion: '', fecha: '', participantes: '' })

  const loadData = async () => {
    try {
      const [{ events: evts }, { justifications }] = await Promise.all([
        api.getEvents(),
        api.getJustifications(),
      ])
      setEvents(evts)
      setJustList(justifications)
    } catch {
      setEvents([])
      setJustList([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  const data       = organize(events)
  const months     = Object.keys(data).sort((a, b) => b.localeCompare(a))
  const [selMonth, setSelMonth]           = useState(() => months[0] ?? null)
  const [openWeeks, setOpenWeeks]         = useState({}) // { weekNum: bool }

  const activeMonth = months.includes(selMonth) ? selMonth : months[0] ?? null

  // Al cambiar de mes, resetear semanas abiertas
  const handleMonthSelect = (mk) => {
    setSelMonth(mk)
    setOpenWeeks({})
  }

  const toggleWeek = (wn) => setOpenWeeks(p => ({ ...p, [wn]: !p[wn] }))

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      const { event } = await api.createEvent(form)
      setEvents(prev => [event, ...prev])
      refreshEvents()
      setSelMonth(monthKey(form.fecha))
      setOpenWeeks({ [weekNum(form.fecha)]: true })
      setForm({ titulo: '', descripcion: '', fecha: '', participantes: '' })
      setCreateModal(false)
      showToast('✓ Actividad creada')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const toggleRealizada = async (id, current) => {
    try {
      const { event } = await api.updateEvent(id, { realizada: !current })
      setEvents(prev => prev.map(ev => ev.id === id ? event : ev))
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const deleteEvent = async (id) => {
    try {
      await api.deleteEvent(id)
      setEvents(prev => prev.filter(ev => ev.id !== id))
      refreshEvents()
      showToast('Actividad eliminada', 'error')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const updateJust = async (id, estado) => {
    try {
      const { justification } = await api.updateJustification(id, estado)
      setJustList(prev => prev.map(j => j.id === id ? justification : j))
      showToast(estado === 'aprobada' ? '✓ Aprobada' : '✗ Rechazada', estado === 'aprobada' ? 'success' : 'error')
      setViewModal(null)
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const getJust = (ev) => justList.filter(j => j.eventoId === ev.id || j.fecha === ev.fecha)
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const total = events.length
  const realizadas = events.filter(e => e.realizada).length

  return (
    <div className="space-y-6 max-w-7xl">
      {loading ? (
        <LoadingSpinner message="Cargando actividades..." />
      ) : (
        <>
      <PageHeader
        title="Actividades"
        subtitle="Crea actividades y revisa las justificaciones de ausencia de cada una"
        action={<Button icon={<Plus size={16} />} onClick={() => setCreateModal(true)} size="lg">Nueva Actividad</Button>}
      />

      {/* Stats */}
      {total > 0 && (
        <div className="flex gap-3 flex-wrap">
          {[
            { label: 'Total',      value: total,             color: 'text-white',     bg: 'bg-zinc-800/60 border-zinc-700/40' },
            { label: 'Realizadas', value: realizadas,        color: 'text-green-400', bg: 'bg-green-500/5 border-green-500/20' },
            { label: 'Pendientes', value: total - realizadas, color: 'text-zinc-400', bg: 'bg-zinc-800/40 border-zinc-700/30' },
          ].map(s => (
            <div key={s.label} className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border ${s.bg}`}>
              <span className={`text-xl font-bold ${s.color}`}>{s.value}</span>
              <span className="text-xs text-zinc-500">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {events.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center">
            <CalendarDays size={32} className="text-zinc-600" />
          </div>
          <p className="text-zinc-400 font-medium">No hay actividades aún</p>
          <Button icon={<Plus size={16} />} onClick={() => setCreateModal(true)}>Crear primera actividad</Button>
        </div>
      )}

      {months.length > 0 && (
        <div className="flex gap-2 flex-col sm:flex-row sm:items-start">

          {/* ── Sidebar de meses ── */}
          <div className="flex sm:flex-col gap-2 flex-wrap sm:flex-nowrap sm:w-44 flex-shrink-0">
            {months.map(mk => {
              const count = Object.values(data[mk]).flat().length
              const isActive = activeMonth === mk
              return (
                <button key={mk} onClick={() => handleMonthSelect(mk)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all border w-full text-left
                    ${isActive
                      ? 'bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/20'
                      : 'bg-[#111111] text-zinc-400 border-zinc-800/70 hover:border-red-500/30 hover:text-white'
                    }`}>
                  <span>{monthLabel(mk)}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-md ${isActive ? 'bg-red-500/40 text-red-100' : 'bg-zinc-800 text-zinc-500'}`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* ── Semanas del mes seleccionado ── */}
          {activeMonth && data[activeMonth] && (
            <div className="flex-1 min-w-0 space-y-2">
              {Object.keys(data[activeMonth]).sort((a, b) => +a - +b).map((wn, wi) => {
                const weekEvents = data[activeMonth][wn]
                const isOpen = openWeeks[wn] ?? false
                const doneCount = weekEvents.filter(e => e.realizada).length

                return (
                  <motion.div key={wn}
                    initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: wi * 0.04 }}
                    className="rounded-2xl border border-zinc-800/70 overflow-hidden bg-[#111111]">

                    {/* Week accordion header */}
                    <button onClick={() => toggleWeek(wn)}
                      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-zinc-800/40 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-sm font-semibold text-white">{WEEK_LABELS[+wn]}</span>
                        <span className="text-xs text-zinc-600">
                          {weekEvents[0] && new Date(toDateStr(weekEvents[0].fecha) + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                          {' — '}
                          {weekEvents[weekEvents.length - 1] && new Date(toDateStr(weekEvents[weekEvents.length - 1].fecha) + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {doneCount > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                            {doneCount} realizadas
                          </span>
                        )}
                        <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                          {weekEvents.length} {weekEvents.length === 1 ? 'actividad' : 'actividades'}
                        </span>
                        {isOpen ? <ChevronUp size={15} className="text-zinc-500" /> : <ChevronDown size={15} className="text-zinc-500" />}
                      </div>
                    </button>

                    {/* Week content */}
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden border-t border-zinc-800/60">
                          <div className="p-3 space-y-2">
                            {weekEvents.map((ev, i) => {
                              const just = getJust(ev)
                              const justExpanded = expandedJust === ev.id
                              const d = new Date(toDateStr(ev.fecha) + 'T00:00:00')
                              const dayName = d.toLocaleDateString('es-ES', { weekday: 'long' })

                              return (
                                <div key={ev.id}
                                  className={`rounded-xl border overflow-hidden transition-all
                                    ${ev.realizada ? 'border-green-500/20' : 'border-zinc-800/60'}`}>

                                  {/* ── Fila principal de la actividad ── */}
                                  <div className="flex items-stretch">
                                    {/* Día */}
                                    <div className={`flex-shrink-0 w-14 flex flex-col items-center justify-center py-3 border-r
                                      ${ev.realizada ? 'border-green-500/15 bg-green-500/5' : 'border-zinc-800/50 bg-zinc-900/40'}`}>
                                      <span className="text-xs text-zinc-500 capitalize">{dayName.slice(0, 3)}</span>
                                      <span className={`text-base font-bold leading-tight mt-0.5 ${ev.realizada ? 'text-green-400' : 'text-white'}`}>
                                        {d.getDate()}
                                      </span>
                                    </div>

                                    {/* Info + acciones */}
                                    <div className="flex-1 flex items-center gap-3 px-3 py-2.5 min-w-0">
                                      {/* Toggle realizada */}
                                      <button onClick={() => toggleRealizada(ev.id, ev.realizada)}
                                        className="flex-shrink-0 hover:scale-110 transition-transform"
                                        title={ev.realizada ? 'Marcar como pendiente' : 'Marcar como realizada'}>
                                        {ev.realizada
                                          ? <CheckCircle2 size={18} className="text-green-400" />
                                          : <Circle size={18} className="text-zinc-600 hover:text-zinc-300" />}
                                      </button>

                                      {/* Título y meta */}
                                      <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium truncate ${ev.realizada ? 'text-white' : 'text-zinc-200'}`}>
                                          {ev.titulo}
                                        </p>
                                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                          {ev.participantes && (
                                            <span className="flex items-center gap-1 text-xs text-zinc-500">
                                              <Users size={10} />{ev.participantes}
                                            </span>
                                          )}
                                          {ev.descripcion && (
                                            <span className="text-xs text-zinc-600 truncate max-w-xs">{ev.descripcion}</span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Acciones */}
                                      <div className="flex items-center gap-1.5 flex-shrink-0">
                                        {/* Botón para ver/ocultar justificaciones — solo si hay o la actividad fue realizada */}
                                        {ev.realizada && (
                                          <button
                                            onClick={() => setExpandedJust(justExpanded ? null : ev.id)}
                                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border
                                              ${justExpanded
                                                ? 'bg-red-500/15 text-red-400 border-red-500/25'
                                                : 'bg-zinc-800/80 text-zinc-400 hover:text-white border-zinc-700/40'}`}>
                                            <FileText size={12} />
                                            <span className="hidden sm:inline">Ausencias</span>
                                            {just.length > 0 && (
                                              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold
                                                ${justExpanded ? 'bg-red-500/30 text-red-300' : 'bg-zinc-700 text-zinc-300'}`}>
                                                {just.length}
                                              </span>
                                            )}
                                            {justExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                                          </button>
                                        )}
                                        <button onClick={() => deleteEvent(ev.id)}
                                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-700 hover:text-red-400 transition-colors"
                                          title="Eliminar actividad">
                                          <Trash2 size={13} />
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                  {/* ── Panel de justificaciones (se abre al clickear "Ausencias") ── */}
                                  <AnimatePresence>
                                    {ev.realizada && justExpanded && (
                                      <motion.div
                                        key="just-panel"
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.18 }}
                                        className="overflow-hidden border-t border-zinc-800/50">
                                        <div className="p-3 space-y-2">
                                          <p className="text-xs text-zinc-600 uppercase tracking-widest font-semibold">
                                            Justificaciones de ausencia
                                          </p>
                                          {just.length === 0 ? (
                                            <p className="text-zinc-500 text-xs text-center py-4">
                                              Ningún miembro justificó ausencia para esta actividad
                                            </p>
                                          ) : (
                                            <Table>
                                              <Thead>
                                                <tr>
                                                  <Th>Usuario</Th>
                                                  <Th>Motivo</Th>
                                                  <Th>Estado</Th>
                                                  <Th>Acciones</Th>
                                                </tr>
                                              </Thead>
                                              <Tbody>
                                                {just.map(j => (
                                                  <Tr key={j.id}>
                                                    <Td>
                                                      <div className="flex items-center gap-2">
                                                        <Avatar src={j.avatar} alt={j.systemName || j.displayName} size="sm" />
                                                        <p className="text-sm font-medium text-white">{j.systemName || j.displayName}</p>
                                                      </div>
                                                    </Td>
                                                    <Td><p className="text-sm text-white">{j.motivo}</p></Td>
                                                    <Td>
                                                      <Badge variant={j.estado} dot>
                                                        {j.estado.charAt(0).toUpperCase() + j.estado.slice(1)}
                                                      </Badge>
                                                    </Td>
                                                    <Td>
                                                      <div className="flex items-center gap-1">
                                                        <button onClick={() => setViewModal(j)}
                                                          className="p-1.5 rounded-lg hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                                                          title="Ver detalle">
                                                          <Eye size={13} />
                                                        </button>
                                                        {j.estado === 'pendiente' && (
                                                          <>
                                                            <button onClick={() => updateJust(j.id, 'aprobada')}
                                                              className="p-1.5 rounded-lg hover:bg-green-500/10 text-zinc-400 hover:text-green-400 transition-colors"
                                                              title="Aprobar">
                                                              <Check size={13} />
                                                            </button>
                                                            <button onClick={() => updateJust(j.id, 'rechazada')}
                                                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-colors"
                                                              title="Rechazar">
                                                              <X size={13} />
                                                            </button>
                                                          </>
                                                        )}
                                                      </div>
                                                    </Td>
                                                  </Tr>
                                                ))}
                                              </Tbody>
                                            </Table>
                                          )}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              )
                            })}
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
      )}

      {/* Modal: Nueva Actividad */}
      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="Nueva Actividad">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Título" placeholder="Ej: Reunión semanal, Torneo..." value={form.titulo} onChange={set('titulo')} required />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-300">Descripción</label>
            <textarea value={form.descripcion} onChange={set('descripcion')} rows={3} placeholder="Describe la actividad..."
              className="w-full bg-[#0a0a0a] border border-zinc-800/80 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500 transition-all resize-none" required />
          </div>
          <Input label="Fecha" type="date" value={form.fecha} onChange={set('fecha')} required />
          <Input label="¿Quiénes participan?" placeholder="Ej: Todos los moderadores..." value={form.participantes} onChange={set('participantes')} />
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" fullWidth onClick={() => setCreateModal(false)}>Cancelar</Button>
            <Button type="submit" fullWidth>Crear actividad</Button>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal isOpen={!!viewModal} onClose={() => setViewModal(null)} title="Detalle de Justificación">
        {viewModal && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-[#0a0a0a]/60 rounded-xl">
              <Avatar src={viewModal.avatar} alt={viewModal.systemName || viewModal.displayName} size="md" />
              <div><p className="font-semibold text-white">{viewModal.systemName || viewModal.displayName}</p><p className="text-xs text-zinc-400">@{viewModal.username}</p></div>
              <div className="ml-auto"><Badge variant={viewModal.estado} dot>{viewModal.estado.charAt(0).toUpperCase() + viewModal.estado.slice(1)}</Badge></div>
            </div>
            <div className="space-y-3">
              <div><p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Motivo</p><p className="text-sm text-white font-medium">{viewModal.motivo}</p></div>
              <div><p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Fecha</p><p className="text-sm text-white">{new Date(toDateStr(viewModal.fecha)).toLocaleDateString('es-ES', { dateStyle: 'long' })}</p></div>
              <div><p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Descripción</p><p className="text-sm text-zinc-300 leading-relaxed">{viewModal.descripcion}</p></div>
            </div>
            {viewModal.estado === 'pendiente' && (
              <div className="flex gap-3 pt-2 border-t border-zinc-800">
                <Button variant="success" fullWidth icon={<Check size={14} />} onClick={() => updateJust(viewModal.id, 'aprobada')}>Aprobar</Button>
                <Button variant="danger" fullWidth icon={<X size={14} />} onClick={() => updateJust(viewModal.id, 'rechazada')}>Rechazar</Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl shadow-xl text-sm font-medium text-white z-50
              ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
        </>
      )}
    </div>
  )
}
