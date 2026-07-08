/**
 * AdminJustifications.jsx — Revisión de justificaciones de usuarios
 */
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Eye, FileText, Phone, Gamepad2, AlertTriangle } from 'lucide-react'
import Avatar from '../../components/Avatar'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import PageHeader from '../../components/PageHeader'
import LoadingSpinner from '../../components/LoadingSpinner'
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/Table'
import SearchBar from '../../components/SearchBar'
import api from '../../services/api'

function toDateStr(fecha) {
  if (!fecha) return ''
  if (typeof fecha === 'string') return fecha.slice(0, 10)
  return new Date(fecha).toISOString().slice(0, 10)
}

export default function AdminJustifications() {
  const [justList, setJustList]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [viewModal, setViewModal] = useState(null)
  const [toast, setToast]         = useState(null)
  const [search, setSearch]       = useState('')
  const [filter, setFilter]       = useState('all')

  const loadJust = async () => {
    try {
      const { justifications } = await api.getJustifications()
      setJustList(justifications)
    } catch {
      setJustList([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadJust() }, [])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Usuarios con 3+ rechazadas — para el aviso admin
  const rejectedByUser = justList
    .filter(j => j.estado === 'rechazada')
    .reduce((acc, j) => {
      const key = j.userId
      if (!acc[key]) acc[key] = { name: j.systemName || j.displayName, avatar: j.avatar, username: j.username, count: 0 }
      acc[key].count++
      return acc
    }, {})
  const usersWithWarning = Object.values(rejectedByUser).filter(u => u.count >= 3)

  const updateJust = async (id, estado) => {
    try {
      const { justification } = await api.updateJustification(id, estado)
      setJustList(prev => prev.map(j => j.id === id ? justification : j))
      setViewModal(prev => prev?.id === id ? justification : prev)      showToast(estado === 'aprobada' ? '✓ Justificación aprobada' : '✗ Justificación rechazada',
        estado === 'aprobada' ? 'success' : 'error')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  // Filtrado
  const filtered = justList.filter(j => {
    const matchFilter = filter === 'all' || j.estado === filter
    const term = search.toLowerCase()
    const matchSearch = !search ||
      (j.systemName || j.displayName || '').toLowerCase().includes(term) ||
      (j.username || '').toLowerCase().includes(term) ||
      (j.motivo || '').toLowerCase().includes(term) ||
      (j.eventoNombre || '').toLowerCase().includes(term)
    return matchFilter && matchSearch
  })

  const counts = {
    all:       justList.length,
    pendiente: justList.filter(j => j.estado === 'pendiente').length,
    aprobada:  justList.filter(j => j.estado === 'aprobada').length,
    rechazada: justList.filter(j => j.estado === 'rechazada').length,
  }

  if (loading) return <LoadingSpinner message="Cargando justificaciones..." />

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title="Justificaciones"
        subtitle="Revisa y gestiona las justificaciones de ausencia de los miembros"
      />

      {/* ══ AVISO: usuarios con 3+ rechazadas ══ */}
      <AnimatePresence>
        {usersWithWarning.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl border border-red-500/40 bg-red-500/8 overflow-hidden"
          >
            {/* Header del aviso */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-red-500/20 bg-red-500/10">
              <div className="p-1.5 rounded-lg bg-red-500/20">
                <AlertTriangle size={16} className="text-red-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-red-300">
                  ⚠ {usersWithWarning.length} miembro{usersWithWarning.length > 1 ? 's' : ''} con 3 o más justificaciones rechazadas
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Estos usuarios no están tomando en serio sus justificaciones. Considera hablar con ellos.
                </p>
              </div>
            </div>
            {/* Lista de usuarios problemáticos */}
            <div className="divide-y divide-red-500/10">
              {usersWithWarning.map(u => (
                <div key={u.username} className="flex items-center gap-3 px-4 py-2.5">
                  <Avatar src={u.avatar} alt={u.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{u.name}</p>
                    <p className="text-xs text-zinc-500">@{u.username}</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/30">
                    <AlertTriangle size={11} className="text-red-400" />
                    <span className="text-xs font-bold text-red-400">{u.count} rechazadas</span>
                  </div>
                  <button
                    onClick={() => setFilter('rechazada'); setSearch(u.name)}
                    className="text-xs text-zinc-500 hover:text-red-400 transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10">
                    Ver →
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filtros de estado */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar por nombre, motivo..." className="flex-1" />
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'all',       label: 'Todas',      dot: 'bg-zinc-400' },
            { key: 'pendiente', label: 'Pendientes', dot: 'bg-amber-400' },
            { key: 'aprobada',  label: 'Aprobadas',  dot: 'bg-green-400' },
            { key: 'rechazada', label: 'Rechazadas', dot: 'bg-red-400' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all border
                ${filter === f.key
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-[#111111] text-zinc-400 border-zinc-800 hover:text-white'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${filter === f.key ? 'bg-white' : f.dot}`} />
              {f.label}
              <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-xs
                ${filter === f.key ? 'bg-white/20' : 'bg-zinc-700/60 text-zinc-400'}`}>
                {counts[f.key]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <FileText size={40} className="text-zinc-700" />
          <p className="text-zinc-400 font-medium">No hay justificaciones</p>
          <p className="text-zinc-600 text-sm">
            {filter !== 'all' ? 'Prueba con otro filtro' : 'Los usuarios aún no han enviado justificaciones'}
          </p>
        </div>
      ) : (
        <Table>
          <Thead>
            <tr>
              <Th>Miembro</Th>
              <Th>Roblox</Th>
              <Th>Teléfono</Th>
              <Th>Motivo</Th>
              <Th>Fecha</Th>
              <Th>Estado</Th>
              <Th>Acciones</Th>
            </tr>
          </Thead>
          <Tbody>
            {filtered.map(j => (
              <Tr key={j.id}>
                {/* Miembro */}
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar src={j.avatar} alt={j.systemName || j.displayName} size="sm" />
                    <div>
                      <p className="text-sm font-semibold text-white">{j.systemName || j.displayName}</p>
                      <p className="text-xs text-zinc-500">@{j.username}</p>
                    </div>
                  </div>
                </Td>
                {/* Roblox */}
                <Td>
                  <div className="flex flex-col gap-0.5">
                    <span className="flex items-center gap-1 text-xs text-zinc-300">
                      <Gamepad2 size={11} className="text-zinc-500" />
                      {j.displayName || '—'}
                    </span>
                    {j.robloxId && (
                      <span className="text-xs text-zinc-600 font-mono">ID: {j.robloxId}</span>
                    )}
                  </div>
                </Td>
                {/* Teléfono */}
                <Td>
                  <span className="flex items-center gap-1 text-xs text-zinc-300">
                    <Phone size={11} className="text-zinc-500" />
                    {j.phone || <span className="text-zinc-600">—</span>}
                  </span>
                </Td>
                {/* Motivo */}
                <Td>
                  <div>
                    <p className="text-sm text-white font-medium">{j.motivo}</p>
                    {j.eventoNombre && (
                      <p className="text-xs text-red-400 mt-0.5">{j.eventoNombre}</p>
                    )}
                  </div>
                </Td>
                {/* Fecha */}
                <Td>
                  <span className="text-sm text-zinc-300">
                    {new Date(toDateStr(j.fecha) + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </Td>
                {/* Estado */}
                <Td>
                  <Badge variant={j.estado} dot>
                    {j.estado.charAt(0).toUpperCase() + j.estado.slice(1)}
                  </Badge>
                </Td>
                {/* Acciones */}
                <Td>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setViewModal(j)}
                      className="p-1.5 rounded-lg hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                      title="Ver detalle">
                      <Eye size={14} />
                    </button>
                    {j.estado === 'pendiente' && (
                      <>
                        <button onClick={() => updateJust(j.id, 'aprobada')}
                          className="p-1.5 rounded-lg hover:bg-green-500/10 text-zinc-400 hover:text-green-400 transition-colors"
                          title="Aprobar">
                          <Check size={14} />
                        </button>
                        <button onClick={() => updateJust(j.id, 'rechazada')}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-colors"
                          title="Rechazar">
                          <X size={14} />
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

      {/* Modal detalle */}
      <Modal isOpen={!!viewModal} onClose={() => setViewModal(null)} title="Detalle de Justificación">
        {viewModal && (
          <div className="space-y-4">
            {/* Header usuario */}
            <div className="flex items-center gap-3 p-4 bg-[#0a0a0a]/60 rounded-xl border border-zinc-800/50">
              <Avatar src={viewModal.avatar} alt={viewModal.systemName || viewModal.displayName} size="lg" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-base">{viewModal.systemName || viewModal.displayName}</p>
                <p className="text-xs text-zinc-400">@{viewModal.username}</p>
              </div>
              <Badge variant={viewModal.estado} dot>
                {viewModal.estado.charAt(0).toUpperCase() + viewModal.estado.slice(1)}
              </Badge>
            </div>

            {/* Datos de Roblox y teléfono */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/40">
                <p className="text-xs text-zinc-500 mb-1 flex items-center gap-1"><Gamepad2 size={11} />Roblox</p>
                <p className="text-sm text-white font-medium">{viewModal.displayName || '—'}</p>
                {viewModal.robloxId && (
                  <p className="text-xs text-zinc-500 font-mono mt-0.5">ID: {viewModal.robloxId}</p>
                )}
              </div>
              <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/40">
                <p className="text-xs text-zinc-500 mb-1 flex items-center gap-1"><Phone size={11} />Teléfono</p>
                <p className="text-sm text-white font-medium">{viewModal.phone || '—'}</p>
              </div>
            </div>

            {/* Datos justificación */}
            <div className="space-y-3">
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Motivo</p>
                <p className="text-sm text-white font-medium">{viewModal.motivo}</p>
              </div>
              {viewModal.eventoNombre && (
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Actividad</p>
                  <p className="text-sm text-red-300">{viewModal.eventoNombre}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Fecha</p>
                <p className="text-sm text-white">
                  {new Date(toDateStr(viewModal.fecha) + 'T12:00:00').toLocaleDateString('es-ES', { dateStyle: 'long' })}
                </p>
              </div>
              {viewModal.descripcion && (
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Descripción</p>
                  <p className="text-sm text-zinc-300 leading-relaxed">{viewModal.descripcion}</p>
                </div>
              )}
            </div>

            {/* Acciones */}
            {viewModal.estado === 'pendiente' && (
              <div className="flex gap-3 pt-2 border-t border-zinc-800">
                <Button variant="success" fullWidth icon={<Check size={14} />} onClick={() => updateJust(viewModal.id, 'aprobada')}>
                  Aprobar
                </Button>
                <Button variant="danger" fullWidth icon={<X size={14} />} onClick={() => updateJust(viewModal.id, 'rechazada')}>
                  Rechazar
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
            className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl shadow-xl text-sm font-medium text-white z-50
              ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
