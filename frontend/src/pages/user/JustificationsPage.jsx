/**
 * JustificationsPage.jsx — Panel de justificaciones del usuario
 *
 * - Sección "Actividades": muestra las actividades activas (dentro de 30h).
 *   Las cerradas solo aparecen si el usuario YA justificó en ellas.
 * - Sección "Mis justificaciones": historial del usuario.
 */
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, CalendarDays, CheckCircle2, ChevronDown, ChevronUp, Send, Lock, Clock } from 'lucide-react'
import { useApp } from '../../hooks/useApp'
import Button from '../../components/Button'
import Badge from '../../components/Badge'
import Input from '../../components/Input'
import PageHeader from '../../components/PageHeader'
import LoadingSpinner from '../../components/LoadingSpinner'
import ChatBot from '../../components/ChatBot'
import api from '../../services/api'

// ── Helpers ───────────────────────────────────────────────────

function toDateStr(fecha) {
  if (!fecha) return ''
  if (typeof fecha === 'string') return fecha.slice(0, 10)
  return new Date(fecha).toISOString().slice(0, 10)
}

// Auto-cierre: 30h después de medianoche de la fecha
function isAutoClosed(fecha) {
  const start   = new Date(toDateStr(fecha) + 'T00:00:00')
  const closeAt = new Date(start.getTime() + 30 * 60 * 60 * 1000)
  return new Date() >= closeAt
}

function timeUntilClose(fecha) {
  const start   = new Date(toDateStr(fecha) + 'T00:00:00')
  const closeAt = new Date(start.getTime() + 30 * 60 * 60 * 1000)
  const ms      = closeAt - Date.now()
  if (ms <= 0) return null
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  if (h > 0) return `Cierra en ${h}h ${m}m`
  return `Cierra en ${m}m`
}

// ── Componente principal ──────────────────────────────────────

export default function JustificationsPage() {
  const { currentUser, adminEvents } = useApp()
  const [justList, setJustList]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [filter, setFilter]         = useState('all')
  const [openFormId, setOpenFormId] = useState(null)
  const [forms, setForms]           = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [successId, setSuccessId]   = useState(null)
  const [showAll, setShowAll]       = useState(false) // mostrar todas las actividades vs solo activas

  const loadJust = () => {
    api.getJustifications()
      .then(({ justifications }) => setJustList(justifications))
      .catch(() => setJustList([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadJust() }, [])

  const myJust = justList.filter(j => j.userId === currentUser?.id)

  // Actividades activas (dentro de 30h) + las cerradas donde el usuario ya justificó
  const justifiedEventIds = new Set(myJust.map(j => j.eventoId).filter(Boolean))

  const visibleEvents = adminEvents.filter(ev => {
    if (!isAutoClosed(ev.fecha)) return true          // activa: siempre visible
    return justifiedEventIds.has(ev.id)               // cerrada: solo si ya justificó
  })

  // Agrupar por mes para la sección de actividades
  const eventsByMonth = {}
  visibleEvents.forEach(ev => {
    const mk = toDateStr(ev.fecha).slice(0, 7)
    if (!eventsByMonth[mk]) eventsByMonth[mk] = []
    eventsByMonth[mk].push(ev)
  })
  const eventMonths = Object.keys(eventsByMonth).sort((a, b) => b.localeCompare(a))

  const filtered = filter === 'all' ? myJust : myJust.filter(j => j.estado === filter)

  const alreadyJustified = (id) => myJust.some(j => j.eventoId === id)
  const getForm = (id) => forms[id] || { motivo: '', descripcion: '' }
  const setFormField = (id, field, value) =>
    setForms(prev => ({ ...prev, [id]: { ...getForm(id), [field]: value } }))

  const handleSubmit = async (ev, e) => {
    e.preventDefault()
    const f = getForm(ev.id)
    if (!f.motivo.trim()) return
    setSubmitting(true)
    try {
      await api.createJustification({
        motivo:       f.motivo.trim(),
        fecha:        toDateStr(ev.fecha),
        descripcion:  f.descripcion.trim(),
        eventoId:     ev.id,
        eventoNombre: ev.titulo,
      })
      loadJust()
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

  if (loading) return <LoadingSpinner message="Cargando justificaciones..." />

  return (
    <div className="space-y-8 max-w-4xl">
      <PageHeader
        title="Justificaciones"
        subtitle="Justifica tu ausencia en actividades activas"
      />

      {/* ══ ACTIVIDADES DEL SERVIDOR ══ */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="text-red-400" />
            <h2 className="font-semibold text-white text-sm">Actividades del servidor</h2>
          </div>
        </div>

        {visibleEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 border border-zinc-800/50 rounded-2xl bg-[#111111]">
            <CalendarDays size={36} className="text-zinc-700" />
            <p className="text-zinc-400 text-sm font-medium">No hay actividades activas</p>
            <p className="text-zinc-600 text-xs">Los admins publicarán actividades aquí</p>
          </div>
        ) : (
          <div className="space-y-6">
            {eventMonths.map(mk => {
              const [y, m] = mk.split('-')
              const monthName = new Date(+y, +m - 1, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
              return (
                <div key={mk} className="space-y-2">
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest px-1">
                    {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
                  </p>
                  {eventsByMonth[mk]
                    .sort((a, b) => toDateStr(b.fecha).localeCompare(toDateStr(a.fecha)))
                    .map(ev => {
                      const closed     = isAutoClosed(ev.fecha)
                      const justified  = alreadyJustified(ev.id)
                      const formOpen   = openFormId === ev.id
                      const countdown  = timeUntilClose(ev.fecha)
                      const d          = new Date(toDateStr(ev.fecha) + 'T12:00:00')
                      const f          = getForm(ev.id)

                      return (
                        <div key={ev.id}
                          className={`rounded-xl border overflow-hidden transition-all
                            ${justified ? 'border-green-500/25' : closed ? 'border-zinc-800/30 opacity-60' : formOpen ? 'border-red-500/30' : 'border-zinc-800/60'}`}>

                          {/* Fila principal */}
                          <button
                            onClick={() => {
                              if (justified || closed) return
                              setOpenFormId(prev => prev === ev.id ? null : ev.id)
                            }}
                            disabled={justified || closed}
                            className="w-full flex items-stretch text-left disabled:cursor-default hover:bg-zinc-800/20 transition-colors">

                            {/* Columna día */}
                            <div className={`flex-shrink-0 w-14 flex flex-col items-center justify-center py-3 border-r
                              ${justified ? 'border-green-500/15 bg-green-500/5'
                                : closed ? 'border-zinc-800/30 bg-zinc-900/20'
                                : formOpen ? 'border-red-500/20 bg-red-500/5'
                                : 'border-zinc-800/50 bg-zinc-900/30'}`}>
                              <span className="text-xs text-zinc-500 capitalize">
                                {d.toLocaleDateString('es-ES', { weekday: 'short' })}
                              </span>
                              <span className={`text-base font-bold leading-tight
                                ${justified ? 'text-green-400' : closed ? 'text-zinc-600' : 'text-white'}`}>
                                {d.getDate()}
                              </span>
                            </div>

                            {/* Contenido */}
                            <div className="flex-1 flex items-center gap-3 px-3 py-2.5 min-w-0">
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${closed ? 'text-zinc-500' : 'text-white'}`}>
                                  {ev.titulo}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  {ev.descripcion && (
                                    <p className="text-xs text-zinc-600 truncate max-w-xs">{ev.descripcion}</p>
                                  )}
                                  {countdown && !closed && (
                                    <span className="flex items-center gap-1 text-xs text-amber-500">
                                      <Clock size={10} />{countdown}
                                    </span>
                                  )}
                                  {closed && (
                                    <span className="flex items-center gap-1 text-xs text-zinc-600">
                                      <Lock size={10} />Cerrada
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex-shrink-0">
                                {justified ? (
                                  <span className="flex items-center gap-1 text-xs text-green-400 font-medium">
                                    <CheckCircle2 size={13} />Justificado
                                  </span>
                                ) : closed ? (
                                  <span className="flex items-center gap-1 text-xs text-zinc-600">
                                    <Lock size={13} />Cerrada
                                  </span>
                                ) : (
                                  <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg border transition-all
                                    ${formOpen
                                      ? 'bg-red-500/15 text-red-400 border-red-500/25'
                                      : 'bg-zinc-800/80 text-zinc-400 border-zinc-700/40'}`}>
                                    Justificar
                                    {formOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>

                          {/* Formulario inline */}
                          <AnimatePresence initial={false}>
                            {formOpen && !justified && !closed && (
                              <motion.div key="form"
                                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                                className="overflow-hidden border-t border-red-500/20">
                                <form onSubmit={(e) => handleSubmit(ev, e)} className="p-4 space-y-3 bg-red-500/5">
                                  <p className="text-xs text-red-400 font-medium">
                                    Justificando ausencia en: <strong>{ev.titulo}</strong>
                                  </p>
                                  <Input label="Motivo" placeholder="Ej: Cita médica, Examen, Trabajo..."
                                    value={f.motivo} onChange={e => setFormField(ev.id, 'motivo', e.target.value)} required />
                                  <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-zinc-300">
                                      Descripción <span className="text-zinc-600 font-normal">(opcional)</span>
                                    </label>
                                    <textarea value={f.descripcion}
                                      onChange={e => setFormField(ev.id, 'descripcion', e.target.value)}
                                      rows={2} placeholder="Describe brevemente el motivo..."
                                      className="w-full bg-[#0a0a0a] border border-zinc-800/80 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500 transition-all resize-none" />
                                  </div>
                                  <div className="flex gap-2 pt-1">
                                    <Button type="button" variant="secondary" onClick={() => setOpenFormId(null)}>
                                      Cancelar
                                    </Button>
                                    <Button type="submit" icon={<Send size={13} />} disabled={submitting}>
                                      {submitting ? 'Enviando...' : 'Enviar'}
                                    </Button>
                                  </div>
                                </form>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ══ MIS JUSTIFICACIONES ══ */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-zinc-400" />
            <h2 className="font-semibold text-white text-sm">Mis justificaciones</h2>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { key: 'all',       label: 'Todas',      dot: 'bg-zinc-400' },
              { key: 'pendiente', label: 'Pendientes', dot: 'bg-amber-400' },
              { key: 'aprobada',  label: 'Aprobadas',  dot: 'bg-green-400' },
              { key: 'rechazada', label: 'Rechazadas', dot: 'bg-red-400' },
            ].map(s => (
              <button key={s.key} onClick={() => setFilter(s.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${filter === s.key ? 'bg-red-600 text-white' : 'bg-zinc-800/60 text-zinc-400 hover:text-white'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${filter === s.key ? 'bg-white' : s.dot}`} />
                <span>{counts[s.key]}</span>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 border border-zinc-800/50 rounded-2xl bg-[#111111]">
            <FileText size={32} className="text-zinc-700" />
            <p className="text-zinc-400 text-sm font-medium">
              {filter === 'all' ? 'Sin justificaciones aún' : `Sin justificaciones ${filter}s`}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(j => {
              const d = new Date(toDateStr(j.fecha) + 'T12:00:00')
              return (
                <div key={j.id}
                  className="flex items-stretch border border-zinc-800/50 hover:border-red-900/25 rounded-xl overflow-hidden transition-all">
                  <div className="flex-shrink-0 w-14 flex flex-col items-center justify-center py-2.5 border-r border-zinc-800/50 bg-zinc-900/30">
                    <span className="text-xs text-zinc-500 capitalize">
                      {d.toLocaleDateString('es-ES', { weekday: 'short' })}
                    </span>
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
                    <Badge variant={j.estado} dot>
                      {j.estado.charAt(0).toUpperCase() + j.estado.slice(1)}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Toast éxito */}
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

      <ChatBot context="justifications" />
    </div>
  )
}
