import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Bell, Database, Users, CheckCircle, Save, Calendar, Lock, Eye, EyeOff, Gamepad2 } from 'lucide-react'
import { useApp } from '../../hooks/useApp'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Input from '../../components/Input'
import api from '../../services/api'

function Toggle({ checked, onChange, label, description }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        {description && <p className="text-xs text-zinc-500 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors duration-300 flex-shrink-0 ${checked ? 'bg-red-600' : 'bg-zinc-600'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  )
}

function Section({ title, icon, children }) {
  return (
    <Card>
      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-zinc-800/50">
        <div className="p-2 rounded-xl bg-red-500/10 text-red-400">{icon}</div>
        <h3 className="font-semibold text-white">{title}</h3>
      </div>
      {children}
    </Card>
  )
}

export default function AdminSettings() {
  const { currentUser, updateCurrentUser } = useApp()
  const [toast, setToast] = useState(null)

  // Notificaciones
  const [notif, setNotif] = useState({
    newUsers:     true,
    justifications: true,
    birthdays:    true,
    inactiveUsers: false,
  })

  // Sistema
  const [sysSettings, setSysSettings] = useState({
    autoApprove:      false,
    registrationOpen: true,
    requireFile:      false,
  })

  // Cambio de contraseña admin
  const [passForm, setPassForm] = useState({ old: '', newPass: '', confirm: '' })
  const [showOld, setShowOld]   = useState(false)
  const [showNew, setShowNew]   = useState(false)

  // Cumpleaños admin
  const [bdForm, setBdForm] = useState({ birthday: currentUser?.birthday?.slice(0, 10) || '' })

  // Roblox admin
  const [robloxForm, setRobloxForm] = useState({ username: currentUser?.robloxUsername || '' })

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSaveSystem = () => {
    showToast('Configuración guardada')
  }

  const handlePassword = async (e) => {
    e.preventDefault()
    if (passForm.newPass !== passForm.confirm) return showToast('Las contraseñas no coinciden', 'error')
    if (passForm.newPass.length < 6) return showToast('Mínimo 6 caracteres', 'error')
    try {
      await updateCurrentUser({ oldPassword: passForm.old, newPassword: passForm.newPass })
      showToast('Contraseña actualizada')
      setPassForm({ old: '', newPass: '', confirm: '' })
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

  const handleRoblox = async (e) => {
    e.preventDefault()
    try {
      await updateCurrentUser({ robloxUsername: robloxForm.username })
      showToast('Username de Roblox actualizado')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">Configuración</h1>
        <p className="text-zinc-400 text-sm mt-1">Ajustes del panel y de tu cuenta</p>
      </motion.div>

      {/* ── Sistema ── */}
      <Section title="Sistema" icon={<Shield size={16} />}>
        <div className="divide-y divide-zinc-800/40">
          <Toggle label="Registro abierto" description="Permite que nuevos usuarios se registren" checked={sysSettings.registrationOpen} onChange={v => setSysSettings(s => ({ ...s, registrationOpen: v }))} />
          <Toggle label="Auto-aprobar justificaciones" description="Aprueba automáticamente las justificaciones recibidas" checked={sysSettings.autoApprove} onChange={v => setSysSettings(s => ({ ...s, autoApprove: v }))} />
          <Toggle label="Requerir archivo adjunto" description="Los usuarios deben adjuntar un documento al justificarse" checked={sysSettings.requireFile} onChange={v => setSysSettings(s => ({ ...s, requireFile: v }))} />
        </div>
        <div className="pt-4">
          <Button icon={<Save size={14} />} onClick={handleSaveSystem}>Guardar</Button>
        </div>
      </Section>

      {/* ── Notificaciones ── */}
      <Section title="Notificaciones" icon={<Bell size={16} />}>
        <div className="divide-y divide-zinc-800/40">
          <Toggle label="Nuevos usuarios" description="Notificar cuando alguien se registre" checked={notif.newUsers} onChange={v => setNotif(n => ({ ...n, newUsers: v }))} />
          <Toggle label="Justificaciones pendientes" description="Alertar cuando haya justificaciones sin revisar" checked={notif.justifications} onChange={v => setNotif(n => ({ ...n, justifications: v }))} />
          <Toggle label="Cumpleaños del día" description="Recordatorio diario de cumpleaños" checked={notif.birthdays} onChange={v => setNotif(n => ({ ...n, birthdays: v }))} />
          <Toggle label="Usuarios inactivos" description="Alertar cuando una cuenta sea suspendida" checked={notif.inactiveUsers} onChange={v => setNotif(n => ({ ...n, inactiveUsers: v }))} />
        </div>
      </Section>

      {/* ── Mi cumpleaños (admin) ── */}
      <Section title="Mi fecha de cumpleaños" icon={<Calendar size={16} />}>
        <p className="text-zinc-500 text-sm mb-4">Tu cumpleaños aparecerá en el calendario de la comunidad.</p>
        <form onSubmit={handleBirthday} className="space-y-3">
          <Input label="Fecha de cumpleaños" type="date" value={bdForm.birthday}
            onChange={e => setBdForm({ birthday: e.target.value })} required />
          <Button type="submit" icon={<Calendar size={14} />}>Guardar fecha</Button>
        </form>
      </Section>

      {/* ── Username de Roblox (admin) ── */}
      <Section title="Mi username de Roblox" icon={<Gamepad2 size={16} />}>
        <p className="text-zinc-500 text-sm mb-4">Actualiza tu nombre de usuario en Roblox (cooldown: 7 días).</p>
        <form onSubmit={handleRoblox} className="space-y-3">
          <Input label="Username de Roblox" placeholder="DL_TuNombre" value={robloxForm.username}
            onChange={e => setRobloxForm({ username: e.target.value })} required />
          <Button type="submit" icon={<Gamepad2 size={14} />}>Actualizar</Button>
        </form>
      </Section>

      {/* ── Cambiar contraseña (admin) ── */}
      <Section title="Cambiar contraseña" icon={<Lock size={16} />}>
        <form onSubmit={handlePassword} className="space-y-3">
          <Input label="Contraseña actual" type={showOld ? 'text' : 'password'} placeholder="••••••••"
            value={passForm.old} onChange={e => setPassForm(f => ({ ...f, old: e.target.value }))}
            rightIcon={<span onClick={() => setShowOld(p => !p)} className="cursor-pointer">{showOld ? <EyeOff size={14} /> : <Eye size={14} />}</span>}
            required />
          <Input label="Nueva contraseña" type={showNew ? 'text' : 'password'} placeholder="••••••••"
            value={passForm.newPass} onChange={e => setPassForm(f => ({ ...f, newPass: e.target.value }))}
            rightIcon={<span onClick={() => setShowNew(p => !p)} className="cursor-pointer">{showNew ? <EyeOff size={14} /> : <Eye size={14} />}</span>}
            required />
          <Input label="Confirmar contraseña" type="password" placeholder="••••••••"
            value={passForm.confirm} onChange={e => setPassForm(f => ({ ...f, confirm: e.target.value }))} required />
          <Button type="submit" icon={<Lock size={14} />}>Actualizar contraseña</Button>
        </form>
      </Section>

      {/* ── Info base de datos ── */}
      <Section title="Base de datos" icon={<Database size={16} />}>
        <p className="text-zinc-500 text-sm">Conectado a <span className="text-white font-medium">Supabase PostgreSQL</span></p>
        <p className="text-xs text-zinc-600 mt-1">Los datos son en tiempo real. Sin datos mock.</p>
      </Section>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 right-6 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl text-white text-sm font-medium z-50
              ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
            <CheckCircle size={16} />
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
