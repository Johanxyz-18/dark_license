import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Gamepad2, Calendar, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { useApp } from '../../hooks/useApp'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Input from '../../components/Input'

function Section({ title, description, icon, children }) {
  return (
    <Card>
      <div className="flex items-start gap-3 mb-5 pb-5 border-b border-zinc-800/50">
        <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400">{icon}</div>
        <div>
          <h3 className="font-semibold text-white">{title}</h3>
          <p className="text-zinc-500 text-sm mt-0.5">{description}</p>
        </div>
      </div>
      {children}
    </Card>
  )
}

export default function SettingsPage() {
  const { currentUser, updateCurrentUser } = useApp()
  const [toast, setToast] = useState(null)
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)

  const [passForm, setPassForm] = useState({ old: '', newPass: '', confirm: '' })
  const [robloxForm, setRobloxForm] = useState({ username: currentUser?.robloxUsername || '' })
  const [bdForm, setBdForm] = useState({ birthday: currentUser?.birthday?.slice(0, 10) || '' })

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handlePassword = async (e) => {
    e.preventDefault()
    if (passForm.newPass !== passForm.confirm) return showToast('Las contraseñas no coinciden', 'error')
    if (passForm.newPass.length < 6) return showToast('Mínimo 6 caracteres', 'error')
    try {
      await updateCurrentUser({ oldPassword: passForm.old, newPassword: passForm.newPass })
      showToast('Contraseña actualizada correctamente')
      setPassForm({ old: '', newPass: '', confirm: '' })
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleRoblox = async (e) => {
    e.preventDefault()
    try {
      await updateCurrentUser({ robloxUsername: robloxForm.username })
      showToast('Username de Roblox actualizado')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleBirthday = async (e) => {
    e.preventDefault()
    if (!bdForm.birthday) return showToast('Selecciona una fecha', 'error')
    try {
      await updateCurrentUser({ birthday: bdForm.birthday })
      showToast('Fecha de cumpleaños guardada')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">Configuración</h1>
        <p className="text-zinc-400 text-sm mt-1">Personaliza tu cuenta</p>
      </motion.div>

      {/* Cumpleaños */}
      <Section
        title="Fecha de cumpleaños"
        description="Tu cumpleaños aparecerá en el calendario de la comunidad"
        icon={<Calendar size={18} />}
      >
        {!currentUser?.birthday && (
          <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <p className="text-sm text-amber-300 font-medium">⚠ Aún no has registrado tu fecha de cumpleaños</p>
            <p className="text-xs text-zinc-500 mt-0.5">Es obligatorio para aparecer en el calendario.</p>
          </div>
        )}
        <form onSubmit={handleBirthday} className="space-y-3">
          <Input
            label="Fecha de cumpleaños"
            type="date"
            value={bdForm.birthday}
            onChange={e => setBdForm({ birthday: e.target.value })}
            required
          />
          <Button type="submit" icon={<Calendar size={14} />}>Guardar fecha</Button>
        </form>
      </Section>

      {/* Cambiar contraseña */}
      <Section
        title="Cambiar contraseña"
        description="Asegura tu cuenta con una contraseña fuerte"
        icon={<Lock size={18} />}
      >
        <form onSubmit={handlePassword} className="space-y-3">
          <Input
            label="Contraseña actual"
            type={showOld ? 'text' : 'password'}
            placeholder="••••••••"
            value={passForm.old}
            onChange={e => setPassForm(f => ({ ...f, old: e.target.value }))}
            rightIcon={<span onClick={() => setShowOld(p => !p)} className="cursor-pointer">{showOld ? <EyeOff size={14} /> : <Eye size={14} />}</span>}
            required
          />
          <Input
            label="Nueva contraseña"
            type={showNew ? 'text' : 'password'}
            placeholder="••••••••"
            value={passForm.newPass}
            onChange={e => setPassForm(f => ({ ...f, newPass: e.target.value }))}
            rightIcon={<span onClick={() => setShowNew(p => !p)} className="cursor-pointer">{showNew ? <EyeOff size={14} /> : <Eye size={14} />}</span>}
            required
          />
          <Input
            label="Confirmar nueva contraseña"
            type="password"
            placeholder="••••••••"
            value={passForm.confirm}
            onChange={e => setPassForm(f => ({ ...f, confirm: e.target.value }))}
            required
          />
          <Button type="submit" icon={<Lock size={14} />}>Actualizar contraseña</Button>
        </form>
      </Section>

      {/* Roblox */}
      <Section
        title="Username de Roblox"
        description="Puedes cambiarlo una vez cada 7 días"
        icon={<Gamepad2 size={18} />}
      >
        {currentUser?.robloxNameChangedAt && (
          <p className="text-xs text-zinc-500 mb-3">
            Último cambio: {new Date(currentUser.robloxNameChangedAt).toLocaleDateString('es-ES')}
          </p>
        )}
        <form onSubmit={handleRoblox} className="space-y-3">
          <Input
            label="Nuevo username de Roblox"
            placeholder="DL_TuNombre"
            value={robloxForm.username}
            onChange={e => setRobloxForm({ username: e.target.value })}
            required
          />
          <Button type="submit" icon={<Gamepad2 size={14} />}>Actualizar username</Button>
        </form>
      </Section>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 20, x: 20 }}
            className={`fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-sm font-medium
              ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'} text-white z-50`}
          >
            <CheckCircle size={16} />
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
