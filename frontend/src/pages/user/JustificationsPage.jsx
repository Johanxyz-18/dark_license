/**
 * JustificationsPage.jsx — Panel de justificaciones del usuario
 *
 * - Aviso si tiene 3+ rechazadas (warning) o 6+ aprobadas (felicitación)
 * - Sección "Actividades": actividades activas para justificar
 * - Sección "Mis justificaciones": tabs separados Pendientes / Aprobadas / Rechazadas
 */
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, CalendarDays, CheckCircle2, ChevronDown, ChevronUp,
  Send, Lock, Clock, AlertTriangle, Trophy, XCircle, CheckCircle, Timer
} from 'lucide-react'
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

function isAutoClosed(ev) {
  const closeAt = ev?.closesAt || ev?.closes_at
  if (!closeAt) return false
  return new Date() >= new Date(closeAt)
}

function timeUntilClose(ev) {
  const closeAt = ev?.closesAt || ev?.closes_at
  if (!closeAt) return null
  const ms = new Date(closeAt) - Date.now()
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
  const [activeTab, setActiveTab]   = useState('pendiente') // pendiente | aprobada | rechazada
  const [openFormId, setOpenFormId] = useState(null)
  const [forms, setForms]           = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [successId, setSuccessId]   = useState(null)

  const loadJust = () => {
    api.getJustifications()
      .then(({ justifications }) => setJustList(justifications))
      .catch(() => setJustList([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadJust() }, [])

  const myJust = justList.filter(j => j.userId === currentUser?.id)

  const counts = {
    pendiente: myJust.filter(j => j.estado === 'pendiente').length,
    aprobada:  myJust.filter(j => j.estado === 'aprobada').length,
    rechazada: myJust.filter(j => j.estado === 'rechazada').length,
  }

  // Avisos según contadores
  const showRejectedWarning = counts.rechazada >= 3
  const showApprovedTrophy  = counts.aprobada  >= 6

  // Actividades visibles
  const justifiedEventIds = new Set(myJust.map(j => j.eventoId).filter(Boolean))
  const visibleEvents = adminEvents.filter(ev => {
    if (!isAutoClosed(ev)) return true
    return justifiedEventIds.has(ev.id)
  })

  // Agrupar actividades por mes
  const eventsByMonth = {}
  visibleEvents.forEach(ev => {
    const mk = toDateStr(ev.fecha).slice(0, 7)
    if (!eventsByMonth[mk]) eventsByMonth[mk] = []
    eventsByMonth[mk].push(ev)
  })
  const eventMonths = Object.keys(eventsByMonth).sort((a, b) => b.localeCompare(a))

  const filtered = myJust.filter(j => j.estado === activeTab)

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

  if (loading) return <LoadingSpinner message="Cargando justificaciones..." />

  return (
    <div className="space-y-8 max-w-4xl">
      <PageHeader
        title="Justificaciones"
        subtitle="Justifica tu ausencia en actividades activas"
      />

      {/* ══ AVISO: 3+ RECHAZADAS ══ */}
      <AnimatePresence>
        {showRejectedWarning && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            className="flex items-start gap-3 p-4 rounded-2xl border border-red-500/30 bg-red-500/5"
          >
            <div className="p-2 rounded-xl bg-red-500/15 text-red-400 flex-shrink-0">
              <AlertTriangle size={18} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-red-300">
                ⚠ Tienes {counts.rechazada} justificaciones rechazadas
              </p>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Tu historial muestra varias ausencias sin justificación válida. Te recomendamos tomarte más en serio la asistencia y redactar justificaciones con más detalle. El admin ha sido notificado.
              </p>
            </div>
            <span className="text-2xl font-black text-red-500/40">{counts.rechazada}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ AVISO: 6+ APROBADAS ══ */}
      <AnimatePresence>
        {showApprovedTrophy && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            className="flex items-start gap-3 p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5"
          >
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 flex-shrink-0">
              <Trophy size={18} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-300">
                🏆 {counts.aprobada} justificaciones aprobadas
              </p>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Has mantenido un buen historial de justificaciones. ¡Sigue así y demuestra tu compromiso con el servidor!
              </p>
            </div>
            <span className="text-2xl font-black text-amber-500/40">{counts.aprobada}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ ACTIVIDADES DEL SERVIDOR ══ */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-red-400" />
          <h2 className="font-semibold text-white text-sm">Actividades del servidor</h2>
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
                      const closed    = isAutoClosed(ev)
                      const justified = alreadyJustified(ev.id)
                      const formOpen  = openFormId === ev.id
                      const countdown = timeUntilClose(ev)
                      const d         = new Date(toDateStr(ev.fecha) + 'T12:00:00')
                      const f         = getForm(ev.id)

                      return (
                        <div key={ev.id}
                          className={`rounded-xl border overflow-hidden transition-all
                            ${justified ? 'border-green-500/25' : closed ? 'border-zinc-800/30 opacity-60' : formOpen ? 'border-red-500/30' : 'border-zinc-800/60'}`}>

                          <button
                            onClick={() => {
                              if (justified || closed) return
                              setOpenFormId(prev => prev === ev.id ? null : ev.id)
                            }}
                            disabled={justified || closed}
                            className="w-full flex items-stretch text-left disabled:cursor-default hover:bg-zinc-800/20 transition-colors">

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

      {/* ══ MIS JUSTIFICACIONES — TABS ══ */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText size={16} className="text-zinc-400" />
          <h2 className="font-semibold text-white text-sm">Mis justificaciones</h2>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-zinc-900/60 rounded-xl border border-zinc-800/50">
          {[
            { key: 'pendiente', label: 'Pendientes', icon: <Timer size={13} />,       color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/20 text-amber-300' },
            { key: 'aprobada',  label: 'Aprobadas',  icon: <CheckCircle size={13} />, color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20 text-green-300' },
            { key: 'rechazada', label: 'Rechazadas', icon: <XCircle size={13} />,     color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/20 text-red-300' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all
                ${activeTab === tab.key
                  ? `border ${tab.bg}`
                  : 'text-zinc-500 hover:text-zinc-300'}`}>
              <span className={activeTab === tab.key ? '' : tab.color}>{tab.icon}</span>
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold
                ${activeTab === tab.key ? 'bg-white/10' : 'bg-zinc-800 text-zinc-500'}`}>
                {counts[tab.key]}
              </span>
            </button>
          ))}
        </div>

        {/* Panel rechazadas — aviso extra */}
        {activeTab === 'rechazada' && counts.rechazada > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center gap-2.5 p-3 rounded-xl border border-red-500/20 bg-red-500/5">
            <XCircle size={14} className="text-red-400 flex-shrink-0" />
            <p className="text-xs text-zinc-400 leading-relaxed">
              {counts.rechazada >= 3
                ? <span className="text-red-300 font-semibold">Atención: tienes {counts.rechazada} rechazadas. Por favor tómate más en serio las justificaciones.</span>
                : `Tienes ${counts.rechazada} justificación${counts.rechazada > 1 ? 'es' : ''} rechazada${counts.rechazada > 1 ? 's' : ''}. Intenta ser más detallado en futuras justificaciones.`}
            </p>
          </motion.div>
        )}

        {/* Panel aprobadas — mensaje positivo */}
        {activeTab === 'aprobada' && counts.aprobada >= 6 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center gap-2.5 p-3 rounded-xl border border-amber-500/20 bg-amber-500/5">
            <Trophy size={14} className="text-amber-400 flex-shrink-0" />
            <p className="text-xs text-amber-300 font-medium">
              ¡Excelente! Tienes {counts.aprobada} justificaciones aprobadas. Eres un miembro responsable del servidor.
            </p>
          </motion.div>
        )}

        {/* Lista */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 border border-zinc-800/50 rounded-2xl bg-[#111111]">
            <FileText size={32} className="text-zinc-700" />
            <p className="text-zinc-400 text-sm font-medium">
              {activeTab === 'pendiente' ? 'Sin justificaciones pendientes'
                : activeTab === 'aprobada' ? 'Sin justificaciones aprobadas aún'
                : 'Sin justificaciones rechazadas'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(j => {
              const d = new Date(toDateStr(j.fecha) + 'T12:00:00')
              return (
                <motion.div key={j.id}
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex items-stretch border rounded-xl overflow-hidden transition-all
                    ${j.estado === 'rechazada' ? 'border-red-900/30 hover:border-red-800/40'
                      : j.estado === 'aprobada' ? 'border-green-900/30 hover:border-green-800/40'
                      : 'border-zinc-800/50 hover:border-zinc-700/50'}`}>
                  <div className={`flex-shrink-0 w-14 flex flex-col items-center justify-center py-2.5 border-r
                    ${j.estado === 'rechazada' ? 'border-red-900/20 bg-red-500/5'
                      : j.estado === 'aprobada' ? 'border-green-900/20 bg-green-500/5'
                      : 'border-zinc-800/50 bg-zinc-900/30'}`}>
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
                </motion.div>
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
