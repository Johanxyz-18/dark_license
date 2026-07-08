import { useState } from 'react'
import { motion } from 'framer-motion'
import { Edit2, Gamepad2, Hash, Calendar, CheckCircle } from 'lucide-react'
import { useApp } from '../../hooks/useApp'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Avatar from '../../components/Avatar'
import Badge from '../../components/Badge'
import Modal from '../../components/Modal'
import Input from '../../components/Input'

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/50 border border-zinc-800/40">
      <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400">{icon}</div>
      <div>
        <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold text-white mt-0.5">{value || '—'}</p>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const { currentUser, updateCurrentUser } = useApp()
  const [editOpen, setEditOpen] = useState(false)
  const [saved, setSaved]       = useState(false)
  const [form, setForm]         = useState({
    systemName: currentUser?.systemName || '',
    birthday:   currentUser?.birthday?.slice(0, 10) || '',
  })

  const handleSave = async () => {
    try {
      await updateCurrentUser({ systemName: form.systemName, birthday: form.birthday })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      setEditOpen(false)
    } catch (err) {
      alert(err.message)
    }
  }

  const formatBirthday = (d) => {
    if (!d) return 'No establecida'
    // Forzar parse en hora local para evitar desfase de zona horaria
    const parts = d.slice(0, 10).split('-')
    const date = new Date(+parts[0], +parts[1] - 1, +parts[2])
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">Mi Perfil</h1>
        <p className="text-zinc-400 text-sm mt-1">Tu información en el sistema</p>
      </motion.div>

      {/* Avatar card */}
      <Card>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 20 }} className="relative">
            <Avatar src={currentUser?.avatar} alt={currentUser?.systemName} size="2xl" online />
          </motion.div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
              {/* Nombre del sistema — el que puso el admin o el usuario */}
              <h2 className="text-2xl font-bold text-white">{currentUser?.systemName}</h2>
              <Badge variant={currentUser?.role}>{currentUser?.role}</Badge>
            </div>
            {/* Nombre de Roblox debajo, más pequeño */}
            <p className="text-zinc-400 text-sm mb-1">Roblox: {currentUser?.robloxUsername}</p>
            <p className="text-zinc-600 text-xs">@{currentUser?.username}</p>
          </div>

          <Button variant="outline" icon={<Edit2 size={14} />} onClick={() => setEditOpen(true)}>
            Editar
          </Button>
        </div>
      </Card>

      {/* Info */}
      <Card>
        <h3 className="font-semibold text-white mb-4">Información</h3>
        <div className="space-y-3">
          <InfoRow icon={<Gamepad2 size={16} />} label="Username de Roblox" value={currentUser?.robloxUsername} />
          <InfoRow icon={<Hash size={16} />} label="Roblox ID" value={currentUser?.robloxId} />
          <InfoRow icon={<Calendar size={16} />} label="Fecha de cumpleaños" value={formatBirthday(currentUser?.birthday)} />
        </div>
      </Card>

      {/* Modal editar */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Editar Perfil">
        <div className="space-y-4">
          <Input label="Nombre en el sistema" value={form.systemName}
            onChange={e => setForm(f => ({ ...f, systemName: e.target.value }))}
            placeholder="Tu nombre para mostrar" />
          <Input label="Fecha de cumpleaños" type="date" value={form.birthday}
            onChange={e => setForm(f => ({ ...f, birthday: e.target.value }))}
            max={new Date().toISOString().slice(0, 10)} />
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" fullWidth onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button fullWidth onClick={handleSave}>Guardar</Button>
          </div>
        </div>
      </Modal>

      {saved && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 bg-green-600 rounded-xl shadow-xl text-white text-sm font-medium z-50">
          <CheckCircle size={16} />Perfil actualizado
        </motion.div>
      )}
    </div>
  )
}
