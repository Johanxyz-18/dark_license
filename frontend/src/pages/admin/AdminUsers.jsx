import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserPlus, Filter, ChevronLeft, ChevronRight, Ban, Trash2, X, CheckCircle } from 'lucide-react'
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

const ROLES = ['all', 'admin', 'moderator', 'user']
const STATUS = ['all', 'active', 'inactive']
const PER_PAGE = 8

const emptyForm = { username: '', password: '', systemName: '', robloxUsername: '', birthday: '', phone: '', role: 'user' }

export default function AdminUsers() {
  const [search, setSearch]           = useState('')
  const [roleFilter, setRoleFilter]   = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage]               = useState(1)
  const [users, setUsers]             = useState([])
  const [loading, setLoading]         = useState(true)
  const [createModal, setCreateModal] = useState(false)
  const [form, setForm]               = useState(emptyForm)
  const [creating, setCreating]       = useState(false)
  const [toast, setToast]             = useState(null)

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadUsers = () => {
    setLoading(true)
    api.getUsers({ search, role: roleFilter === 'all' ? '' : roleFilter, status: statusFilter === 'all' ? '' : statusFilter })
      .then(({ users: data }) => setUsers(data))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadUsers() }, [search, roleFilter, statusFilter])

  const totalPages = Math.ceil(users.length / PER_PAGE)
  const paginated  = users.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const toggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    try {
      await api.toggleUserStatus(id, newStatus)
      loadUsers()
      showToast(newStatus === 'active' ? 'Usuario activado' : 'Usuario desactivado')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const deleteUser = async (id, name) => {
    if (!window.confirm(`¿Eliminar a ${name}? Esta acción no se puede deshacer.`)) return
    try {
      await api.deleteUser(id)
      loadUsers()
      showToast('Usuario eliminado', 'error')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      await api.createUser({
        username:       form.username.trim(),
        password:       form.password,
        systemName:     form.systemName.trim() || undefined,
        robloxUsername: form.robloxUsername.trim(),
        birthday:       form.birthday || undefined,
        phone:          form.phone.trim() || undefined,
        role:           form.role,
      })
      loadUsers()
      setCreateModal(false)
      setForm(emptyForm)
      showToast('✓ Usuario creado')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setCreating(false)
    }
  }

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="space-y-6 max-w-7xl">
      <PageHeader
        title="Usuarios"
        subtitle={`${users.length} usuarios en la base de datos`}
        action={<Button icon={<UserPlus size={16} />} onClick={() => setCreateModal(true)}>Nuevo usuario</Button>}
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Buscar usuario..." className="flex-1" />
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

      {loading ? (
        <LoadingSpinner message="Cargando usuarios..." />
      ) : (
        <>
          <Table>
            <Thead>
              <tr>
                <Th>Usuario</Th>
                <Th>Nombre en sistema</Th>
                <Th>Username Roblox</Th>
                <Th>Rol</Th>
                <Th>Estado</Th>
                <Th>Acciones</Th>
              </tr>
            </Thead>
            <Tbody>
              {paginated.length === 0 && (
                <Tr><Td colSpan={6} className="text-center text-zinc-500 py-8">No hay usuarios</Td></Tr>
              )}
              {paginated.map(user => (
                <Tr key={user.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar src={user.avatar} alt={user.systemName} size="sm" online={user.status === 'active'} />
                      <div>
                        <p className="text-sm font-semibold text-white">{user.systemName}</p>
                        <p className="text-xs text-zinc-500">@{user.username}</p>
                      </div>
                    </div>
                  </Td>
                  <Td className="text-zinc-300 text-sm">{user.systemName}</Td>
                  <Td className="text-zinc-400 text-sm">{user.robloxUsername}</Td>
                  <Td><Badge variant={user.role}>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</Badge></Td>
                  <Td>
                    <div className="flex flex-col gap-1">
                      <Badge variant={user.status} dot>{user.status === 'active' ? 'Activo' : 'Inactivo'}</Badge>
                      {user.pendingDlDeadline && (
                        <span className="text-xs text-amber-400">
                          DL hasta {new Date(user.pendingDlDeadline).toLocaleDateString('es-ES')}
                        </span>
                      )}
                    </div>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => toggleStatus(user.id, user.status)}
                        className="p-1.5 rounded-lg hover:bg-amber-500/10 text-zinc-400 hover:text-amber-400 transition-colors"
                        title={user.status === 'active' ? 'Desactivar' : 'Activar'}>
                        <Ban size={14} />
                      </button>
                      <button onClick={() => deleteUser(user.id, user.systemName)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-zinc-400 hover:text-red-400 transition-colors"
                        title="Eliminar usuario">
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
                Mostrando {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, users.length)} de {users.length}
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

      {/* Modal: Nuevo usuario */}
      <Modal isOpen={createModal} onClose={() => { setCreateModal(false); setForm(emptyForm) }} title="Nuevo usuario">
        <form onSubmit={handleCreate} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Username del sistema" placeholder="ej: johan159" value={form.username} onChange={set('username')} required />
            <Input label="Contraseña" type="password" placeholder="mínimo 6 caracteres" value={form.password} onChange={set('password')} required />
          </div>
          <Input label="Nombre en el sistema" placeholder="Cómo se llamará (ej: Johan)" value={form.systemName} onChange={set('systemName')}
            hint="Si lo dejas vacío se usará el nombre de Roblox" />
          <Input label="Username de Roblox" placeholder="DL_SuNombre" value={form.robloxUsername} onChange={set('robloxUsername')} required
            hint="No necesita DL aún — tendrá 7 días de gracia para agregarlo" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Fecha de cumpleaños" type="date" value={form.birthday} onChange={set('birthday')} />
            <Input label="Teléfono" placeholder="+57 300..." value={form.phone} onChange={set('phone')} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-300">Rol</label>
            <select value={form.role} onChange={set('role')}
              className="bg-[#0a0a0a] border border-zinc-800/80 text-zinc-100 text-sm rounded-xl px-3 py-2.5 outline-none focus:border-red-500">
              <option value="user">User</option>
              <option value="moderator">Moderador</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" fullWidth onClick={() => { setCreateModal(false); setForm(emptyForm) }}>Cancelar</Button>
            <Button type="submit" fullWidth disabled={creating}>
              {creating ? 'Creando...' : 'Crear usuario'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-medium text-white z-50
              ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
            <CheckCircle size={15} />
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
