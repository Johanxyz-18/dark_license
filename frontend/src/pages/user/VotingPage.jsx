/**
 * VotingPage.jsx — Votaciones de convivencias (usuario)
 */
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Vote, CalendarDays, Clock, CheckCircle2, XCircle, Lock, Users, ThumbsUp, ThumbsDown } from 'lucide-react'
import PageHeader from '../../components/PageHeader'
import LoadingSpinner from '../../components/LoadingSpinner'
import Badge from '../../components/Badge'
import api from '../../services/api'

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

function parseFecha(fecha) {
  if (!fecha) return new Date()
  const p = fecha.slice(0, 10).split('-')
  return new Date(+p[0], +p[1] - 1, +p[2])
}

export default function VotingPage() {
  const [polls, setPolls]     = useState([])
  const [loading, setLoading] = useState(true)
  const [voting, setVoting]   = useState({}) // { [pollId]: true }
  const [toast, setToast]     = useState(null)

  const load = () => {
    api.getPolls()
      .then(({ polls: data }) => setPolls(data))
      .catch(() => setPolls([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleVote = async (pollId, respuesta) => {
    setVoting(v => ({ ...v, [pollId]: true }))
    try {
      await api.vote(pollId, respuesta)
      setPolls(prev => prev.map(p =>
        p.id === pollId ? { ...p, myVote: respuesta,
          siCount: respuesta === 'si' ? (p.myVote === 'no' ? p.siCount + 1 : p.myVote ? p.siCount : p.siCount + 1) : (p.myVote === 'si' ? p.siCount - 1 : p.siCount),
          noCount: respuesta === 'no' ? (p.myVote === 'si' ? p.noCount + 1 : p.myVote ? p.noCount : p.noCount + 1) : (p.myVote === 'no' ? p.noCount - 1 : p.noCount),
          totalVotes: p.myVote ? p.totalVotes : p.totalVotes + 1,
        } : p
      ))
      // Recargar para tener conteos exactos
      load()
      showToast(respuesta === 'si' ? '✓ Votaste que sí asistirás' : '✓ Votaste que no asistirás')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setVoting(v => ({ ...v, [pollId]: false }))
    }
  }

  const handleRemoveVote = async (pollId) => {
    setVoting(v => ({ ...v, [pollId]: true }))
    try {
      await api.removeVote(pollId)
      load()
      showToast('Voto eliminado')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setVoting(v => ({ ...v, [pollId]: false }))
    }
  }

  const active  = polls.filter(p => !p.closed && new Date() < new Date(p.closesAt))
  const closed  = polls.filter(p => p.closed  || new Date() >= new Date(p.closesAt))

  if (loading) return <LoadingSpinner message="Cargando votaciones..." />

  return (
    <div className="space-y-8 max-w-3xl">
      <PageHeader
        title="Convivencias"
        subtitle="Vota si asistirás a las convivencias del servidor"
      />

      {/* ══ VOTACIONES ACTIVAS ══ */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Vote size={16} className="text-red-400" />
          <h2 className="font-semibold text-white text-sm">Votaciones abiertas</h2>
          {active.length > 0 && (
            <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-medium">
              {active.length}
            </span>
          )}
        </div>

        {active.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 border border-zinc-800/50 rounded-2xl bg-[#111111]">
            <Vote size={36} className="text-zinc-700" />
            <p className="text-zinc-400 text-sm font-medium">No hay votaciones abiertas</p>
            <p className="text-zinc-600 text-xs">Los admins publicarán convivencias aquí</p>
          </div>
        ) : (
          <div className="space-y-4">
            {active.map(poll => {
              const d          = parseFecha(poll.fecha)
              const countdown  = timeUntilClose(poll.closesAt)
              const isVoting   = voting[poll.id]
              const total      = poll.siCount + poll.noCount
              const siPct      = total > 0 ? Math.round((poll.siCount / total) * 100) : 0
              const noPct      = total > 0 ? Math.round((poll.noCount / total) * 100) : 0
              const noVoted    = !poll.myVote

              return (
                <motion.div key={poll.id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl border overflow-hidden transition-all
                    ${poll.myVote === 'si' ? 'border-green-500/30'
                      : poll.myVote === 'no' ? 'border-red-500/30'
                      : 'border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.06)]'}`}>

                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 p-4 pb-3 bg-zinc-900/40">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-white">{poll.titulo}</h3>
                        {noVoted && (
                          <span className="text-xs bg-amber-500/15 text-amber-400 border border-amber-500/25 px-2 py-0.5 rounded-full font-semibold animate-pulse">
                            Pendiente de voto
                          </span>
                        )}
                      </div>
                      {poll.descripcion && (
                        <p className="text-sm text-zinc-400 mt-1">{poll.descripcion}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-zinc-500">
                          <CalendarDays size={11} />
                          {d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                        {countdown && (
                          <span className="flex items-center gap-1 text-xs text-amber-500">
                            <Clock size={11} />{countdown}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-xs text-zinc-500">
                          <Users size={11} />{poll.totalVotes} votos
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  {total > 0 && (
                    <div className="px-4 py-2">
                      <div className="flex h-2 rounded-full overflow-hidden bg-zinc-800">
                        <div className="bg-green-500 transition-all duration-500" style={{ width: `${siPct}%` }} />
                        <div className="bg-red-500 transition-all duration-500" style={{ width: `${noPct}%` }} />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-green-400 font-medium">{siPct}% Sí ({poll.siCount})</span>
                        <span className="text-xs text-red-400 font-medium">{noPct}% No ({poll.noCount})</span>
                      </div>
                    </div>
                  )}

                  {/* Botones de voto */}
                  <div className="px-4 pb-4 pt-2">
                    {poll.myVote ? (
                      <div className="space-y-2">
                        <div className={`flex items-center gap-2 p-3 rounded-xl border
                          ${poll.myVote === 'si'
                            ? 'bg-green-500/10 border-green-500/30 text-green-300'
                            : 'bg-red-500/10 border-red-500/30 text-red-300'}`}>
                          {poll.myVote === 'si'
                            ? <CheckCircle2 size={16} className="text-green-400 flex-shrink-0" />
                            : <XCircle size={16} className="text-red-400 flex-shrink-0" />}
                          <p className="text-sm font-semibold">
                            Votaste: <span className="capitalize">{poll.myVote === 'si' ? '✓ Sí asistiré' : '✗ No asistiré'}</span>
                          </p>
                          <button onClick={() => handleRemoveVote(poll.id)} disabled={isVoting}
                            className="ml-auto text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
                            cambiar
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleVote(poll.id, poll.myVote === 'si' ? 'no' : 'si')} disabled={isVoting}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold border transition-all disabled:opacity-50
                              ${poll.myVote === 'si'
                                ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                                : 'border-green-500/30 text-green-400 hover:bg-green-500/10'}`}>
                            {poll.myVote === 'si'
                              ? <><ThumbsDown size={13} /> Cambiar a No</>
                              : <><ThumbsUp size={13} /> Cambiar a Sí</>}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs text-amber-400 font-medium mb-3">⚠ Aún no has votado en esta convivencia</p>
                        <div className="flex gap-3">
                          <button onClick={() => handleVote(poll.id, 'si')} disabled={isVoting}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm border border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all disabled:opacity-50">
                            <ThumbsUp size={16} />
                            {isVoting ? '...' : 'Sí asistiré'}
                          </button>
                          <button onClick={() => handleVote(poll.id, 'no')} disabled={isVoting}
                            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50">
                            <ThumbsDown size={16} />
                            {isVoting ? '...' : 'No asistiré'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </section>

      {/* ══ HISTORIAL ══ */}
      {closed.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Lock size={14} className="text-zinc-500" />
            <h2 className="font-semibold text-zinc-500 text-sm">Historial de votaciones</h2>
          </div>
          <div className="space-y-2">
            {closed.map(poll => {
              const d     = parseFecha(poll.fecha)
              const total = poll.siCount + poll.noCount
              const siPct = total > 0 ? Math.round((poll.siCount / total) * 100) : 0

              return (
                <div key={poll.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-zinc-800/40 bg-zinc-900/20 opacity-70">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-300 truncate">{poll.titulo}</p>
                    <p className="text-xs text-zinc-600">
                      {d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {' · '}{poll.totalVotes} votos · {siPct}% asistirán
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {poll.myVote === 'si' && <Badge variant="aprobada" dot>Votaste Sí</Badge>}
                    {poll.myVote === 'no' && <Badge variant="rechazada" dot>Votaste No</Badge>}
                    {!poll.myVote && <Badge variant="pendiente" dot>No votaste</Badge>}
                    <span className="flex items-center gap-1 text-xs text-zinc-600">
                      <Lock size={10} />Cerrada
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-24 right-6 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-white text-sm font-medium z-50
              ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
            <CheckCircle2 size={16} />{toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
