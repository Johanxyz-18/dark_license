import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Filter, ChevronLeft, ChevronRight, Ban, Trash2, CheckCircle,
  Copy, Clock, Link2, Eye, Phone, Gamepad2, Hash,
  Calendar, AlertTriangle, FileText
} from 'lucide-react'
import { Table, Thead, Th, Tbody, Tr, Td } from '../../components/Table'
import Avatar from '../../components/Avatar'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import SearchBar from '../../components/SearchBar'
import PageHeader from '../../components/PageHeader'
import LoadingSpinner from '../../components/LoadingSpinner'
import Modal from '../../components/Modal'
import Input from '../../components/Input'
import api from '../../services/api'

const ROLES   = ['all', 'admin', 'moderator', 'user']
const STATUS  = ['all', 'active', 'inactive']
const PER_PAGE = 8
const JUST_WARN  = 4   // amarillo
const JUST_LIMIT = 6   // rojo

// Indicador visual del conteo de justificaciones
function JustBadge({ count }) {
  if (count === 0) return <span className="text-xs text-zinc-600">—</span>
  if (count >= JUST_LIMIT) return (
    <span className="flex items-center gap-1 text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/25 px-2 py-0.5 rounded-full">
      <AlertTriangle size={11} />{count} ⚠
    </span>
  )
  if (count >= JUST_WARN) return (
    <span className="flex items-center gap-1 text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-full">
      {count}
    </span>
  )
  return (
    <span className="text-xs text-zinc-400 bg-zinc-800/60 border border-zinc-700/40 px-2 py-0.5 rounded-full">
      {count}
    </span>
  )
}

export default function AdminUsers() {
  const [search, setSearch]             = useState('')
  const [roleFilter, setRoleFilter]     = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage]                 = useState(1)
  const [users, setUsers]               = useState([])
  const [loading, setLoading]           = useState(true)
  const [detailUser, setDetailUser]     = useState(null)  // modal detalle
  const [inviteModal, setInviteModal]   = useState(false)
  const [inviteForm, setInviteForm]     = useState({ role: 'user', systemName: '' })
  const [invitations, setInvitations]   = useState([])
  const [newCode, setNewCode]           = useState(null)
  const [creating, setCreating]         = useState(false)
  const [copied, setCopied]             = useState(false)
  const [toast, setToast]               = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadUsers = () => {
    setLoading(true)
    api.getUsers({
      search,
      role:   roleFilter   === 'all' ? '' : roleFilter,
      status: statusFilter === 'all' ? '' : statusFilter,
    })
      .then(({ users: data }) => setUsers(data))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }

  const loadInvitations = () => {
    api.getInvitations()
      .then(({ invitations: data }) => setInvitations(data))
      .catch(() => {})
  }

  useEffect(() => { loadUsers() }, [search, roleFilter, statusFilter])
  useEffect(() => { loadInvitations() }, [])

  const totalPages = Math.ceil(users.length / PER_PAGE)
  const paginated  = users.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    try {
      await api.toggleUserStatus(id, newStatus)
      loadUsers()
      if (detailUser?.id === id) setDetailUser(prev => ({ ...prev, status: newStatus }))
      showToast(newStatus === 'active' ? 'Usuario activado' : 'Usuario desactivado')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const deleteUser = async (id, name) => {
    if (!window.confirm(`¿Eliminar a ${name}? Esta acción no se puede deshacer.`)) return
    try {
      await api.deleteUser(id)
      setDetailUser(null)
      loadUsers()
      showToast('Usuario eliminado', 'error')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleCreateInvite = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      const { invitation } = await api.createInvitation(inviteForm)
      setNewCode(invitation.code)
      loadInvitations()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteInvite = async (id) => {
    try {
      await api.deleteInvitation(id)
      loadInvitations()
      showToast('Invitación eliminada', 'error')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const copyCode = (code) => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const roleColor = (role) => {
    if (role === 'admin')     return 'text-red-400 bg-red-500/10 border-red-500/20'
    if (role === 'moderator') return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    return 'text-zinc-300 bg-zinc-700/30 border-zinc-700/40'
  }

  // Usuarios con muchas justificaciones
  const alertUsers = users.filter(u => u.justCount >= JUST_LIMIT).length

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title="Usuarios"
        subtitle={`${users.length} usuarios${alertUsers > 0 ? ` · ${alertUsers} con ≥${JUST_LIMIT} justificaciones` : ''}`}
        action={
          <Button icon={<Link2 size={16} />} onClick={() => { setInviteModal(true); setNewCode(null); setInviteForm({ role: 'user', systemName: '' }) }}>
            Generar invitación
          </Button>
        }
      />

      {/* Alerta si hay usuarios al límite */}
      {alertUsers > 0 && (
        <div className="flex items-center gap-3 p-3 bg-red-500/8 border border-red-500/20 rounded-xl">
          <AlertTriangle size={15} className="text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-300">
            <span className="font-semibold">{alertUsers} usuario{alertUsers > 1 ? 's' : ''}</span> ha alcanzado o superado el límite de {JUST_LIMIT} justificaciones.
          </p>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Buscar por nombre, Roblox..." className="flex-1" />
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-zinc-400" />
          <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1) }}
            className="bg-[#111111] border border-zinc-800 text-zinc-300 text-sm rounded-xl px-3 py-2.5 outline-none focus:border-red-500">
            {ROLES.map(r => <option key={r} value={r}>{r === 'all' ? 'Todos los roles' : r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
          </select>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
            className="bg-[#111111] border border-zinc-800 text-zinc-300 text-sm rounded-xl px-3 py-2.5 outline-none focus:border-red-500">
            {STATUS.map(s => <option key={s} value={s}>{s === 'all' ? 'Todos' : s === 'active' ? 'Activos' : 'Inactivos'}</option>)}
          </select>
        </div>
      </div>

      {/* Tabla */}
      {loading ? <LoadingSpinner message="Cargando usuarios..." /> : (
        <>
          <Table>
            <Thead>
              <tr>
                <Th>Usuario</Th>
                <Th>Roblox</Th>
                <Th>Teléfono</Th>
                <Th>Rol</Th>
                <Th>Estado</Th>
                <Th>Justif.</Th>
                <Th>Acciones</Th>
              </tr>
            </Thead>
            <Tbody>
              {paginated.length === 0 && (
                <Tr><Td colSpan={7} className="text-center text-zinc-500 py-10">No hay usuarios</Td></Tr>
              )}
              {paginated.map(user => (
                <Tr key={user.id}>
                  {/* Usuario */}
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar src={user.avatar} alt={user.systemName} size="sm" online={user.status === 'active'} />
                      <div>
                        <p className="text-sm font-semibold text-white">{user.systemName}</p>
                        <p className="text-xs text-zinc-500">@{user.username}</p>
                      </div>
                    </div>
                  </Td>
                  {/* Roblox */}
                  <Td>
                    <p className="text-sm text-zinc-300">{user.robloxUsername || '—'}</p>
                    {user.robloxId && <p className="text-xs text-zinc-600 font-mono">ID: {user.robloxId}</p>}
                  </Td>
                  {/* Teléfono */}
                  <Td>
                    <span className="text-sm text-zinc-400">{user.phone || <span className="text-zinc-600">—</span>}</span>
                  </Td>
                  {/* Rol */}
                  <Td><Badge variant={user.role}>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</Badge></Td>
                  {/* Estado */}
                  <Td>
                    <div className="flex flex-col gap-1">
                      <Badge variant={user.status} dot>{user.status === 'active' ? 'Activo' : 'Inactivo'}</Badge>
                      {user.pendingDlDeadline && (
                        <span className="text-xs text-amber-500">DL hasta {new Date(user.pendingDlDeadline).toLocaleDateString('es-ES')}</span>
                      )}
                    </div>
                  </Td>
                  {/* Justificaciones */}
                  <Td><JustBadge count={user.justCount} /></Td>
                  {/* Acciones */}
                  <Td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setDetailUser(user)}
                        className="p-1.5 rounded-lg hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                        title="Ver detalle">
                        <Eye size={14} />
                      </button>
                      <button onClick={() => toggleStatus(user.id, user.status)}
                        className="p-1.5 rounded-lg hover:bg-amber-500/10 text-zinc-400 hover:text-amber-400 transition-colors"
                        title={user.status === 'active' ? 'Desactivar' : 'Activar'}>
                        <Ban size={14} />
                      </button>
                      <button onClick={() => deleteUser(user.id, user.systemName)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-colors"
                        title="Eliminar">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-400">
                {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, users.length)} de {users.length}
              </p>
              <div className="flex items-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-2 rounded-lg bg-[#111111] border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-40">
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm text-zinc-400">{page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-2 rounded-lg bg-[#111111] border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-40">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Invitaciones activas */}
      {invitations.filter(i => !i.used && !i.expired).length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
            <Link2 size={14} /> Invitaciones activas
          </h2>
          <div className="space-y-2">
            {invitations.filter(i => !i.used && !i.expired).map(inv => (
              <div key={inv.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#111111] border border-zinc-800/60">
                <div className="flex-1 flex items-center gap-3 min-w-0">
                  <code className="text-base font-bold text-amber-400 tracking-widest">{inv.code}</code>
                  <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${roleColor(inv.role)}`}>{inv.role}</span>
                  {inv.systemName && <span className="text-xs text-zinc-500">→ {inv.systemName}</span>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="flex items-center gap-1 text-xs text-zinc-600">
                    <Clock size={11} />Expira {new Date(inv.expiresAt).toLocaleDateString('es-ES')}
                  </span>
                  <button onClick={() => copyCode(inv.code)}
                    className="p-1.5 rounded-lg hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors" title="Copiar">
                    <Copy size={13} />
                  </button>
                  <button onClick={() => handleDeleteInvite(inv.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-600 hover:text-red-400 transition-colors" title="Eliminar">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Modal: Detalle de usuario ── */}
      <Modal isOpen={!!detailUser} onClose={() => setDetailUser(null)} title="Detalle de usuario">
        {detailUser && (
          <div className="space-y-4">
            {/* Cabecera */}
            <div className="flex items-center gap-4 p-4 bg-[#0a0a0a]/60 border border-zinc-800/50 rounded-xl">
              <Avatar src={detailUser.avatar} alt={detailUser.systemName} size="xl" online={detailUser.status === 'active'} />
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-white">{detailUser.systemName}</h3>
                <p className="text-sm text-zinc-400">@{detailUser.username}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant={detailUser.role}>{detailUser.role.charAt(0).toUpperCase() + detailUser.role.slice(1)}</Badge>
                  <Badge variant={detailUser.status} dot>{detailUser.status === 'active' ? 'Activo' : 'Inactivo'}</Badge>
                </div>
              </div>
            </div>

            {/* Datos */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-zinc-900/60 border border-zinc-800/40 rounded-xl">
                <p className="text-xs text-zinc-500 mb-1 flex items-center gap-1"><Gamepad2 size={11} />Roblox</p>
                <p className="text-sm text-white font-medium">{detailUser.robloxUsername || '—'}</p>
                {detailUser.robloxId && <p className="text-xs text-zinc-500 font-mono">ID: {detailUser.robloxId}</p>}
              </div>
              <div className="p-3 bg-zinc-900/60 border border-zinc-800/40 rounded-xl">
                <p className="text-xs text-zinc-500 mb-1 flex items-center gap-1"><Phone size={11} />Teléfono</p>
                <p className="text-sm text-white font-medium">{detailUser.phone || '—'}</p>
              </div>
              <div className="p-3 bg-zinc-900/60 border border-zinc-800/40 rounded-xl">
                <p className="text-xs text-zinc-500 mb-1 flex items-center gap-1"><Calendar size={11} />Cumpleaños</p>
                <p className="text-sm text-white font-medium">
                  {detailUser.birthday
                    ? (() => {
                        const parts = detailUser.birthday.slice(0, 10).split('-')
                        const d = new Date(+parts[0], +parts[1] - 1, +parts[2])
                        return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
                      })()
                    : '—'}
                </p>
              </div>
              <div className={`p-3 border rounded-xl ${
                detailUser.justCount >= JUST_LIMIT
                  ? 'bg-red-500/8 border-red-500/25'
                  : detailUser.justCount >= JUST_WARN
                  ? 'bg-amber-500/8 border-amber-500/25'
                  : 'bg-zinc-900/60 border-zinc-800/40'
              }`}>
                <p className="text-xs text-zinc-500 mb-1 flex items-center gap-1"><FileText size={11} />Justificaciones</p>
                <div className="flex items-center gap-2">
                  <p className={`text-2xl font-bold ${
                    detailUser.justCount >= JUST_LIMIT ? 'text-red-400'
                    : detailUser.justCount >= JUST_WARN ? 'text-amber-400'
                    : 'text-white'
                  }`}>{detailUser.justCount}</p>
                  {detailUser.justCount >= JUST_LIMIT && (
                    <span className="text-xs text-red-400 flex items-center gap-1">
                      <AlertTriangle size={11} />Límite alcanzado
                    </span>
                  )}
                  {detailUser.justCount >= JUST_WARN && detailUser.justCount < JUST_LIMIT && (
                    <span className="text-xs text-amber-400">Acercándose al límite</span>
                  )}
                </div>
              </div>
            </div>

            {detailUser.pendingDlDeadline && (
              <div className="flex items-center gap-2 p-3 bg-amber-500/8 border border-amber-500/20 rounded-xl">
                <AlertTriangle size={13} className="text-amber-400 flex-shrink-0" />
                <p className="text-xs text-amber-300">
                  Debe agregar "DL" a su nombre de Roblox antes del{' '}
                  <strong>{new Date(detailUser.pendingDlDeadline).toLocaleDateString('es-ES')}</strong>
                </p>
              </div>
            )}

            <p className="text-xs text-zinc-600">
              Miembro desde {new Date(detailUser.createdAt).toLocaleDateString('es-ES', { dateStyle: 'long' })}
            </p>

            {/* Acciones */}
            <div className="flex gap-3 pt-2 border-t border-zinc-800">
              <Button
                variant={detailUser.status === 'active' ? 'secondary' : 'success'}
                fullWidth
                icon={<Ban size={14} />}
                onClick={() => toggleStatus(detailUser.id, detailUser.status)}>
                {detailUser.status === 'active' ? 'Desactivar cuenta' : 'Activar cuenta'}
              </Button>
              <Button
                variant="danger"
                fullWidth
                icon={<Trash2 size={14} />}
                onClick={() => deleteUser(detailUser.id, detailUser.systemName)}>
                Eliminar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Modal: Generar invitación ── */}
      <Modal isOpen={inviteModal} onClose={() => { setInviteModal(false); setNewCode(null) }} title="Generar invitación">
        {!newCode ? (
          <form onSubmit={handleCreateInvite} className="space-y-4">
            <p className="text-sm text-zinc-400">
              Genera un código único. La persona lo usará al registrarse para obtener el rol asignado.
            </p>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-300">Rol que recibirá</label>
              <select value={inviteForm.role} onChange={e => setInviteForm(f => ({ ...f, role: e.target.value }))}
                className="bg-[#0a0a0a] border border-zinc-800/80 text-zinc-100 text-sm rounded-xl px-3 py-2.5 outline-none focus:border-red-500">
                <option value="user">User</option>
                <option value="moderator">Moderador</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <Input
              label="Nombre en sistema (opcional)"
              placeholder="Nombre que se le asignará"
              value={inviteForm.systemName}
              onChange={e => setInviteForm(f => ({ ...f, systemName: e.target.value }))}
              hint="Si lo dejas vacío se usará su nombre de Roblox"
            />
            <p className="text-xs text-zinc-600">El código expira en 7 días y solo puede usarse una vez.</p>
            <div className="flex gap-3">
              <Button type="button" variant="secondary" fullWidth onClick={() => setInviteModal(false)}>Cancelar</Button>
              <Button type="submit" fullWidth disabled={creating}>
                {creating ? 'Generando...' : '🔑 Generar código'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 text-center">
            <div className="p-6 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">Código de invitación</p>
              <p className="text-3xl font-black text-amber-400 tracking-[0.3em]">{newCode}</p>
              <p className="text-xs text-zinc-600 mt-2">Expira en 7 días · Un solo uso</p>
            </div>
            <button onClick={() => copyCode(newCode)}
              className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700">
              {copied
                ? <><CheckCircle size={16} className="text-green-400" /> ¡Copiado!</>
                : <><Copy size={16} /> Copiar código</>}
            </button>
            <p className="text-xs text-zinc-500">Comparte este código con la persona para que se registre.</p>
            <Button fullWidth onClick={() => { setNewCode(null); setInviteForm({ role: 'user', systemName: '' }) }}>
              Generar otro
            </Button>
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
