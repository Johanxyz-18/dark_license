/**
 * AdminActivities.jsx — Gestión de actividades del servidor
 *
 * - Admin crea actividades con fecha
 * - Se auto-cierran a las 30 horas de su fecha de inicio
 * - Los usuarios ven las activas para justificarse
 * - Una vez cerrada ya no acepta justificaciones
 */
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, CalendarDays, Users, CheckCircle2, Circle, Trash2, Clock, Lock } from 'lucide-react'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import Input from '../../components/Input'
import PageHeader from '../../components/PageHeader'
import LoadingSpinner from '../../components/LoadingSpinner'
import Badge from '../../components/Badge'
import { useApp } from '../../hooks/useApp'
import api from '../../services/api'

// ── Helpers ───────────────────────────────────────────────────

function toDateStr(fecha) {
  if (!fecha) return ''
  if (typeof fecha === 'string') return fecha.slice(0, 10)
  return new Date(fecha).toISOString().slice(0, 10)
}

// Una actividad se auto-cierra 30h después de su fecha de inicio (medianoche)
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

function statusBadge(ev) {
  if (ev.realizada)       return { label: 'Realizada', color: 'text-green-400 bg-green-500/10 border-green-500/20' }
  if (isAutoClosed(ev.fecha)) return { label: 'Cerrada',   color: 'text-zinc-400 bg-zinc-700/30 border-zinc-700/40' }
  return { label: 'Activa', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' }
}

// ── Componente ────────────────────────────────────────────────

export default function AdminActivities() {
  const { refreshEvents } = useApp()
  const [events, setEvents]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [creating, setCreating]     = useState(false)
  const [createModal, setCreateModal] = useState(false)
  const [toast, setToast]           = useState(null)
  const [form, setForm]             = useState({ titulo: '', descripcion: '', fecha: '', participantes: '' })
  const [now, setNow]               = useState(Date.now())

  // Ticker para actualizar el countdown cada minuto
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(t)
  }, [])

  const loadEvents = async () => {
    try {
      const { events: evts } = await api.getEvents()
      setEvents(evts)
    } catch {
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadEvents() }, [])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (creating) return
    setCreating(true)
    try {
      const { event } = await api.createEvent({ ...form })
      setEvents(prev => [event, ...prev])
      setForm({ titulo: '', descripcion: '', fecha: '', participantes: '' })
      setCreateModal(false)
      showToast('✓ Actividad creada')
      refreshEvents()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setCreating(false)
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
    if (!window.confirm('¿Eliminar esta actividad? También se eliminarán sus justificaciones.')) return
    try {
      await api.deleteEvent(id)
      setEvents(prev => prev.filter(ev => ev.id !== id))
      refreshEvents()
      showToast('Actividad eliminada', 'error')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  if (loading) return <LoadingSpinner message="Cargando actividades..." />

  const activas  = events.filter(ev => !ev.realizada && !isAutoClosed(ev.fecha))
  const cerradas = events.filter(ev => ev.realizada || isAutoClosed(ev.fecha))

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Actividades"
        subtitle="Gestiona las actividades del servidor. Se cierran automáticamente a las 30 horas."
        action={<Button icon={<Plus size={16} />} onClick={() => setCreateModal(true)}>Nueva Actividad</Button>}
      />

      {/* Stats */}
      <div className="flex gap-3 flex-wrap">
        {[
          { label: 'Total',    value: events.length,   color: 'text-white',     bg: 'bg-zinc-800/60 border-zinc-700/40' },
          { label: 'Activas',  value: activas.length,  color: 'text-amber-400', bg: 'bg-amber-500/5 border-amber-500/20' },
          { label: 'Cerradas', value: cerradas.length, color: 'text-zinc-400',  bg: 'bg-zinc-800/40 border-zinc-700/30' },
        ].map(s => (
          <div key={s.label} className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border ${s.bg}`}>
            <span className={`text-xl font-bold ${s.color}`}>{s.value}</span>
            <span className="text-xs text-zinc-500">{s.label}</span>
          </div>
        ))}
      </div>

      {events.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center">
            <CalendarDays size={32} className="text-zinc-600" />
          </div>
          <p className="text-zinc-400 font-medium">No hay actividades aún</p>
          <Button icon={<Plus size={16} />} onClick={() => setCreateModal(true)}>Crear primera actividad</Button>
        </div>
      )}

      {/* ── Activas ── */}
      {activas.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-amber-400 uppercase tracking-widest flex items-center gap-2">
            <Clock size={14} /> Activas — aceptando justificaciones
          </h2>
          {activas.map(ev => <EventRow key={ev.id} ev={ev} onToggle={toggleRealizada} onDelete={deleteEvent} />)}
        </section>
      )}

      {/* ── Cerradas ── */}
      {cerradas.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
            <Lock size={14} /> Cerradas
          </h2>
          {cerradas.map(ev => <EventRow key={ev.id} ev={ev} onToggle={toggleRealizada} onDelete={deleteEvent} />)}
        </section>
      )}

      {/* Modal nueva actividad */}
      <Modal isOpen={createModal} onClose={() => setCreateModal(false)} title="Nueva Actividad">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input label="Título" placeholder="Ej: Reunión semanal, Torneo..." value={form.titulo} onChange={set('titulo')} required />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-300">Descripción <span className="text-zinc-600">(opcional)</span></label>
            <textarea value={form.descripcion} onChange={set('descripcion')} rows={3}
              placeholder="Describe la actividad..."
              className="w-full bg-[#0a0a0a] border border-zinc-800/80 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500 transition-all resize-none" />
          </div>
          <Input label="Fecha de inicio" type="date" value={form.fecha} onChange={set('fecha')} required
            hint="La actividad se cerrará automáticamente 30 horas después de esta fecha" />
          <Input label="¿Quiénes participan?" placeholder="Ej: Todos los miembros..." value={form.participantes} onChange={set('participantes')} />
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="secondary" fullWidth onClick={() => setCreateModal(false)}>Cancelar</Button>
            <Button type="submit" fullWidth disabled={creating}>{creating ? 'Creando...' : 'Crear actividad'}</Button>
          </div>
        </form>
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
    </div>
  )
}

function EventRow({ ev, onToggle, onDelete }) {
  const d       = new Date(toDateStr(ev.fecha) + 'T12:00:00')
  const closed  = ev.realizada || isAutoClosed(ev.fecha)
  const countdown = timeUntilClose(ev.fecha)
  const sb      = statusBadge(ev)

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className={`flex items-stretch rounded-2xl border overflow-hidden transition-all
        ${ev.realizada ? 'border-green-500/20 bg-[#0a0a0a]' : closed ? 'border-zinc-800/40 bg-[#0a0a0a] opacity-70' : 'border-zinc-800/70 bg-[#111111]'}`}>

      {/* Columna fecha */}
      <div className={`flex-shrink-0 w-16 flex flex-col items-center justify-center py-4 border-r
        ${ev.realizada ? 'border-green-500/15 bg-green-500/5' : closed ? 'border-zinc-800/40 bg-zinc-900/30' : 'border-zinc-800/50 bg-zinc-900/40'}`}>
        <span className="text-xs text-zinc-500 capitalize">
          {d.toLocaleDateString('es-ES', { weekday: 'short' })}
        </span>
        <span className={`text-lg font-bold leading-tight ${ev.realizada ? 'text-green-400' : 'text-white'}`}>
          {d.getDate()}
        </span>
        <span className="text-xs text-zinc-600">
          {d.toLocaleDateString('es-ES', { month: 'short' })}
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 flex items-center gap-3 px-4 py-3 min-w-0">
        <button onClick={() => onToggle(ev.id, ev.realizada)}
          className="flex-shrink-0 hover:scale-110 transition-transform"
          title={ev.realizada ? 'Marcar como pendiente' : 'Marcar como realizada'}
          disabled={closed && !ev.realizada}>
          {ev.realizada
            ? <CheckCircle2 size={20} className="text-green-400" />
            : <Circle size={20} className="text-zinc-600 hover:text-zinc-300" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-white truncate">{ev.titulo}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${sb.color}`}>
              {sb.label}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            {ev.descripcion && <p className="text-xs text-zinc-500 truncate max-w-xs">{ev.descripcion}</p>}
            {ev.participantes && (
              <span className="flex items-center gap-1 text-xs text-zinc-600">
                <Users size={10} />{ev.participantes}
              </span>
            )}
            {countdown && !closed && (
              <span className="flex items-center gap-1 text-xs text-amber-500">
                <Clock size={10} />{countdown}
              </span>
            )}
            {isAutoClosed(ev.fecha) && !ev.realizada && (
              <span className="flex items-center gap-1 text-xs text-zinc-500">
                <Lock size={10} />Cerrada automáticamente
              </span>
            )}
          </div>
        </div>

        <button onClick={() => onDelete(ev.id)}
          className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-700 hover:text-red-400 transition-colors flex-shrink-0"
          title="Eliminar actividad">
          <Trash2 size={14} />
        </button>
      </div>
    </motion.div>
  )
}
