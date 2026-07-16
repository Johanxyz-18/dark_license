/**
 * AdminPolls.jsx — Gestión de votaciones para convivencias (admin)
 */
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Vote, Plus, Trash2, Lock, Users, ThumbsUp, ThumbsDown,
  CalendarDays, Clock, CheckCircle, AlertTriangle, Eye
} from 'lucide-react'
import Avatar from '../../components/Avatar'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import Input from '../../components/Input'
import PageHeader from '../../components/PageHeader'
import LoadingSpinner from '../../components/LoadingSpinner'
import Badge from '../../components/Badge'
import api from '../../services/api'

function parseFecha(fecha) {
  if (!fecha) return new Date()
  const p = fecha.slice(0, 10).split('-')
  return new Date(+p[0], +p[1] - 1, +p[2])
}

function timeUntilClose(closesAt) {
  if (!closesAt) return null
  const ms = new Date(closesAt) - Date.now()
  if (ms <= 0) return null
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  if (h >= 24) return `Cierra en ${Math.floor(h / 24)}d ${h % 24}h`
  if (h > 0) return `Cierra en ${h}h ${m}m`
  return `Cierra en ${m}m`
}

export default function AdminPolls() {
  const [polls, setPolls]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [detailPoll, setDetailPoll] = useState(null)
  const [toast, setToast]         = useState(null)
  const [form, setForm]           = useState({
    titulo: '', descripcion: '', fecha: '',
    closesAt: '',   // datetime-local
  })
  const [creating, setCreating]   = useState(false)

  const load = async () => {
    try {
      const { polls: data } = await api.getPolls()
      // Para admin, recargar cada poll con detalles de votos
      setPolls(data)
    } catch {
      setPolls([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!form.titulo || !form.fecha) return
    setCreating(true)
    try {
      const closesAt = form.closesAt
        ? new Date(form.closesAt).toISOString()
        : new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()

      await api.createPoll({ titulo: form.titulo, descripcion: form.descripcion, fecha: form.fecha, closesAt })
      load()
      setCreateOpen(false)
      setForm({ titulo: '', descripcion: '', fecha: '', closesAt: '' })
      showToast('Votación creada y usuarios notificados')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setCreating(false)
    }
  }

  const handleClose = async (id) => {
    if (!window.confirm('¿Cerrar esta votación? Los usuarios que no votaron serán notificados.')) return
    try {
      await api.closePoll(id)
      load()
      if (detailPoll?.id === id) setDetailPoll(null)
      showToast('Votación cerrada — usuarios sin voto notificados')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta votación? No se puede deshacer.')) return
    try {
      await api.deletePoll(id)
      load()
      if (detailPoll?.id === id) setDetailPoll(null)
      showToast('Votación eliminada', 'error')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const loadDetail = async (poll) => {
    try {
      const { poll: full } = await api.getPoll(poll.id)
      setDetailPoll(full)
    } catch {
      setDetailPoll(poll)
    }
  }

  const active = polls.filter(p => !p.closed && new Date() < new Date(p.closesAt))
  const closed = polls.filter(p => p.closed  || new Date() >= new Date(p.closesAt))

  if (loading) return <LoadingSpinner message="Cargando votaciones..." />

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="Convivencias"
        subtitle={`${active.length} votaciones activas · ${closed.length} cerradas`}
        action={
          <Button icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
            Nueva votación
          </Button>
        }
      />

      {/* ══ ACTIVAS ══ */}
      {active.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
            <Vote size={13} className="text-red-400" /> Abiertas
          </h2>
          <div className="space-y-3">
            {active.map(poll => {
              const d       = parseFecha(poll.fecha)
              const total   = poll.siCount + poll.noCount
              const siPct   = total > 0 ? Math.round((poll.siCount / total) * 100) : 0
              const noPct   = total > 0 ? Math.round((poll.noCount / total) * 100) : 0
              const countdown = timeUntilClose(poll.closesAt)

              return (
                <motion.div key={poll.id}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-zinc-800/60 bg-[#111111] overflow-hidden">

                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 p-4 pb-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-bold text-white">{poll.titulo}</p>
                      {poll.descripcion && <p className="text-sm text-zinc-400 mt-0.5">{poll.descripcion}</p>}
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-zinc-500">
                          <CalendarDays size={11} />
                          {d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                        {countdown && (
                          <span className="flex items-center gap-1 text-xs text-amber-400">
                            <Clock size={11} />{countdown}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-xs text-zinc-500">
                          <Users size={11} />{poll.totalVotes} votos
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => loadDetail(poll)}
                        className="p-2 rounded-lg hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors" title="Ver detalle">
                        <Eye size={14} />
                      </button>
                      <button onClick={() => handleClose(poll.id)}
                        className="p-2 rounded-lg hover:bg-amber-500/10 text-zinc-400 hover:text-amber-400 transition-colors" title="Cerrar votación">
                        <Lock size={14} />
                      </button>
                      <button onClick={() => handleDelete(poll.id)}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-colors" title="Eliminar">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Barra resultados */}
                  <div className="px-4 pb-4">
                    <div className="flex h-3 rounded-full overflow-hidden bg-zinc-800 mb-2">
                      <div className="bg-green-500 transition-all duration-500 flex items-center justify-center"
                        style={{ width: `${siPct}%` }}>
                        {siPct >= 15 && <span className="text-[9px] font-bold text-white">{siPct}%</span>}
                      </div>
                      <div className="bg-red-500 transition-all duration-500 flex items-center justify-center"
                        style={{ width: `${noPct}%` }}>
                        {noPct >= 15 && <span className="text-[9px] font-bold text-white">{noPct}%</span>}
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1 text-xs text-green-400 font-semibold">
                        <ThumbsUp size={11} /> Sí: {poll.siCount}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-red-400 font-semibold">
                        <ThumbsDown size={11} /> No: {poll.noCount}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </section>
      )}

      {active.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 border border-zinc-800/50 rounded-2xl bg-[#111111]">
          <Vote size={40} className="text-zinc-700" />
          <p className="text-zinc-400 font-medium">No hay votaciones activas</p>
          <Button icon={<Plus size={14} />} onClick={() => setCreateOpen(true)}>
            Crear primera votación
          </Button>
        </div>
      )}

      {/* ══ CERRADAS ══ */}
      {closed.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
            <Lock size={13} /> Cerradas
          </h2>
          <div className="space-y-2">
            {closed.map(poll => {
              const d     = parseFecha(poll.fecha)
              const total = poll.siCount + poll.noCount
              const siPct = total > 0 ? Math.round((poll.siCount / total) * 100) : 0

              return (
                <div key={poll.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-zinc-800/30 bg-zinc-900/20 opacity-75">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-zinc-300 truncate">{poll.titulo}</p>
                    <p className="text-xs text-zinc-600">
                      {d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {' · '}{poll.totalVotes} votos · {siPct}% Sí
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="flex items-center gap-1 text-xs text-green-400">
                      <ThumbsUp size={11} />{poll.siCount}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-red-400">
                      <ThumbsDown size={11} />{poll.noCount}
                    </span>
                    <button onClick={() => loadDetail(poll)}
                      className="p-1.5 rounded-lg hover:bg-zinc-700 text-zinc-500 hover:text-white transition-colors">
                      <Eye size={13} />
                    </button>
                    <button onClick={() => handleDelete(poll.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-600 hover:text-red-400 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Modal crear votación ── */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Nueva votación de convivencia">
        <form onSubmit={handleCreate} className="space-y-4">
          <p className="text-sm text-zinc-400">
            Al crear la votación, todos los usuarios activos recibirán una notificación para que voten.
          </p>
          <Input label="Título" placeholder="Ej: Convivencia de Julio" value={form.titulo}
            onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} required />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-300">Descripción <span className="text-zinc-600 font-normal">(opcional)</span></label>
            <textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
              rows={2} placeholder="Detalles de la convivencia..."
              className="w-full bg-[#0a0a0a] border border-zinc-800/80 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500 transition-all resize-none" />
          </div>
          <Input label="Fecha de la convivencia" type="date" value={form.fecha}
            onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} required />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-300">
              Cierre de votación <span className="text-zinc-600 font-normal">(opcional — default 48h)</span>
            </label>
            <input type="datetime-local" value={form.closesAt}
              onChange={e => setForm(f => ({ ...f, closesAt: e.target.value }))}
              className="w-full bg-[#0a0a0a] border border-zinc-800/80 rounded-xl px-4 py-2.5 text-sm text-zinc-100 outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500 transition-all" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" fullWidth onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button type="submit" fullWidth disabled={creating} icon={<Vote size={14} />}>
              {creating ? 'Creando...' : 'Crear votación'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Modal detalle de votos ── */}
      <Modal isOpen={!!detailPoll} onClose={() => setDetailPoll(null)} title={detailPoll?.titulo || 'Detalle'}>
        {detailPoll && (
          <div className="space-y-4">
            {/* Resumen */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-zinc-900/60 border border-zinc-800/40 rounded-xl text-center">
                <p className="text-xs text-zinc-500 mb-1">Total votos</p>
                <p className="text-2xl font-bold text-white">{detailPoll.totalVotes}</p>
              </div>
              <div className="p-3 bg-green-500/8 border border-green-500/20 rounded-xl text-center">
                <p className="text-xs text-zinc-500 mb-1 flex items-center justify-center gap-1"><ThumbsUp size={10} />Sí</p>
                <p className="text-2xl font-bold text-green-400">{detailPoll.siCount}</p>
              </div>
              <div className="p-3 bg-red-500/8 border border-red-500/20 rounded-xl text-center">
                <p className="text-xs text-zinc-500 mb-1 flex items-center justify-center gap-1"><ThumbsDown size={10} />No</p>
                <p className="text-2xl font-bold text-red-400">{detailPoll.noCount}</p>
              </div>
            </div>

            {/* Lista de votos */}
            {detailPoll.votes && detailPoll.votes.length > 0 && (
              <div className="space-y-1 max-h-64 overflow-y-auto">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Votos individuales</p>
                {detailPoll.votes.map(v => (
                  <div key={v.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-900/40 border border-zinc-800/30">
                    <Avatar src={v.avatar} alt={v.system_name || v.display_name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{v.system_name || v.display_name}</p>
                      <p className="text-xs text-zinc-500">@{v.username}</p>
                    </div>
                    <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border
                      ${v.respuesta === 'si'
                        ? 'bg-green-500/15 text-green-400 border-green-500/25'
                        : 'bg-red-500/15 text-red-400 border-red-500/25'}`}>
                      {v.respuesta === 'si' ? <><ThumbsUp size={10} /> Sí</> : <><ThumbsDown size={10} /> No</>}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {detailPoll.votes && detailPoll.votes.length === 0 && (
              <p className="text-sm text-zinc-500 text-center py-4">Nadie ha votado aún</p>
            )}

            {/* Acciones */}
            {!detailPoll.closed && (
              <div className="flex gap-3 pt-2 border-t border-zinc-800">
                <Button variant="secondary" fullWidth icon={<Lock size={14} />}
                  onClick={() => handleClose(detailPoll.id)}>
                  Cerrar votación
                </Button>
                <Button variant="danger" fullWidth icon={<Trash2 size={14} />}
                  onClick={() => handleDelete(detailPoll.id)}>
                  Eliminar
                </Button>
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
            className={`fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-medium text-white z-50
              ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
            <CheckCircle size={15} />{toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
