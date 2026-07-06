import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Lock, Eye, EyeOff, Gamepad2, AlertCircle, Phone, Shield } from 'lucide-react'
import { useApp } from '../hooks/useApp'
import Button from '../components/Button'
import Input from '../components/Input'
import darkLicenseLogo from '../assets/dark-license-logo.png'
import api from '../services/api'

// ── Códigos de país ───────────────────────────────────────────
const COUNTRY_CODES = [
  { code: '+1',   flag: '🇺🇸', name: 'EEUU / Canadá' },
  { code: '+52',  flag: '🇲🇽', name: 'México' },
  { code: '+54',  flag: '🇦🇷', name: 'Argentina' },
  { code: '+56',  flag: '🇨🇱', name: 'Chile' },
  { code: '+57',  flag: '🇨🇴', name: 'Colombia' },
  { code: '+51',  flag: '🇵🇪', name: 'Perú' },
  { code: '+58',  flag: '🇻🇪', name: 'Venezuela' },
  { code: '+593', flag: '🇪🇨', name: 'Ecuador' },
  { code: '+591', flag: '🇧🇴', name: 'Bolivia' },
  { code: '+595', flag: '🇵🇾', name: 'Paraguay' },
  { code: '+598', flag: '🇺🇾', name: 'Uruguay' },
  { code: '+34',  flag: '🇪🇸', name: 'España' },
  { code: '+55',  flag: '🇧🇷', name: 'Brasil' },
  { code: '+44',  flag: '🇬🇧', name: 'Reino Unido' },
  { code: '+49',  flag: '🇩🇪', name: 'Alemania' },
  { code: '+33',  flag: '🇫🇷', name: 'Francia' },
  { code: '+39',  flag: '🇮🇹', name: 'Italia' },
  { code: '+7',   flag: '🇷🇺', name: 'Rusia' },
  { code: '+81',  flag: '🇯🇵', name: 'Japón' },
  { code: '+82',  flag: '🇰🇷', name: 'Corea del Sur' },
  { code: '+86',  flag: '🇨🇳', name: 'China' },
  { code: '+91',  flag: '🇮🇳', name: 'India' },
  { code: '+61',  flag: '🇦🇺', name: 'Australia' },
  { code: '+27',  flag: '🇿🇦', name: 'Sudáfrica' },
  { code: '+966', flag: '🇸🇦', name: 'Arabia Saudita' },
  { code: '+971', flag: '🇦🇪', name: 'Emiratos Árabes' },
  { code: '+62',  flag: '🇮🇩', name: 'Indonesia' },
  { code: '+63',  flag: '🇵🇭', name: 'Filipinas' },
  { code: '+60',  flag: '🇲🇾', name: 'Malasia' },
]

// ── Logo de Dark License ──────────────────────────────────────
function DLLogo({ size = 96 }) {
  return (
    <img
      src={darkLicenseLogo}
      alt="Dark License"
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: 'contain' }}
      draggable={false}
    />
  )
}

// ── Campo con estilo dorado ───────────────────────────────────
function GoldInput({ label, icon, error, rightIcon, ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-semibold text-amber-600/80 uppercase tracking-widest">{label}</label>
      )}
      <div className={`flex items-center gap-2 bg-[#0d0b08] border rounded-xl px-3 py-2.5 transition-all
        ${error ? 'border-red-500/60' : 'border-amber-900/40 focus-within:border-amber-500/60 focus-within:shadow-[0_0_12px_rgba(245,158,11,0.1)]'}`}>
        {icon && <span className="text-amber-700/70 flex-shrink-0">{icon}</span>}
        <input
          {...props}
          className="flex-1 bg-transparent text-zinc-100 text-sm placeholder-zinc-700 outline-none"
        />
        {rightIcon && <span className="text-amber-700/70 flex-shrink-0 cursor-pointer">{rightIcon}</span>}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

// ── Formulario de Login ───────────────────────────────────────
function LoginForm() {
  const { login } = useApp()
  const [form, setForm]         = useState({ username: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError]       = useState('')
  const [dlRemoved, setDlRemoved] = useState(false)
  const [loading, setLoading]   = useState(false)

  const handle = async (e) => {
    e.preventDefault()
    setError(''); setDlRemoved(false); setLoading(true)
    const res = await login(form.username, form.password)
    if (!res.success) { setError(res.error); if (res.reason === 'dl_removed') setDlRemoved(true) }
    setLoading(false)
  }

  return (
    <form onSubmit={handle} className="space-y-4">
      <GoldInput label="Usuario" placeholder="Tu nombre de usuario" type="text"
        value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
        icon={<User size={15} />} required />
      <GoldInput label="Contraseña" placeholder="••••••••"
        type={showPass ? 'text' : 'password'}
        value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
        icon={<Lock size={15} />}
        rightIcon={<span onClick={() => setShowPass(p => !p)}>{showPass ? <EyeOff size={15}/> : <Eye size={15}/>}</span>}
        required />

      {error && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          className={`flex items-start gap-2.5 p-3 rounded-xl border
            ${dlRemoved ? 'bg-amber-950/40 border-amber-700/40' : 'bg-red-950/40 border-red-800/40'}`}>
          <AlertCircle size={15} className={`flex-shrink-0 mt-0.5 ${dlRemoved ? 'text-amber-400' : 'text-red-400'}`} />
          <div>
            <p className={`text-sm font-semibold ${dlRemoved ? 'text-amber-300' : 'text-red-300'}`}>
              {dlRemoved ? '⚠ Acceso suspendido' : 'Error al ingresar'}
            </p>
            <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{error}</p>
            {dlRemoved && (
              <p className="text-xs text-amber-600/80 mt-1">
                Vuelve a agregar <span className="text-amber-400 font-bold">DL</span> a tu nombre de Roblox e intenta de nuevo — la cuenta se reactivará sola.
              </p>
            )}
          </div>
        </motion.div>
      )}

      <button type="submit" disabled={loading}
        className="w-full py-3 rounded-xl font-bold text-sm tracking-widest uppercase transition-all
          bg-gradient-to-r from-amber-700 via-amber-500 to-amber-700
          hover:from-amber-600 hover:via-amber-400 hover:to-amber-600
          text-black shadow-lg shadow-amber-900/40 disabled:opacity-50 disabled:cursor-not-allowed
          border border-amber-600/30">
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"/>
            Verificando...
          </span>
        ) : '⚔ Ingresar al servidor'}
      </button>
    </form>
  )
}

// ── Formulario de Registro ────────────────────────────────────
function RegisterForm() {
  const { register } = useApp()

  // Paso 0: código de invitación (opcional)
  const [inviteCode, setInviteCode]     = useState('')
  const [inviteData, setInviteData]     = useState(null)  // { role, systemName } si el código es válido
  const [inviteError, setInviteError]   = useState('')
  const [checkingCode, setCheckingCode] = useState(false)
  const [skipCode, setSkipCode]         = useState(false) // registro público sin código

  // Paso 1: verificar Roblox
  const [robloxInput, setRobloxInput] = useState('')
  const [robloxData, setRobloxData]   = useState(null)
  const [robloxError, setRobloxError] = useState('')
  const [verifying, setVerifying]     = useState(false)

  // Paso 2: datos de cuenta
  const [form, setForm]         = useState({ username: '', password: '', confirm: '', phoneCode: '+57', phone: '' })
  const [showPass, setShowPass] = useState(false)
  const [errors, setErrors]     = useState({})
  const [apiError, setApiError] = useState('')
  const [loading, setLoading]   = useState(false)

  // ── Verificar código ──
  const handleCheckCode = async (e) => {
    e.preventDefault()
    if (!inviteCode.trim()) return setInviteError('Escribe el código de invitación.')
    setCheckingCode(true); setInviteError('')
    try {
      const data = await api.checkInviteCode(inviteCode.trim().toUpperCase())
      setInviteData(data)
    } catch (err) {
      setInviteError(err.message || 'Código inválido.')
    } finally {
      setCheckingCode(false)
    }
  }

  // ── Verificar Roblox ──
  const handleVerify = async (e) => {
    e.preventDefault()
    setRobloxError(''); setRobloxData(null)
    if (!robloxInput.trim()) return setRobloxError('Escribe tu username de Roblox primero.')
    setVerifying(true)
    try {
      const res  = await fetch(`/api/roblox?username=${encodeURIComponent(robloxInput.trim())}`)
      const data = await res.json()
      if (!res.ok || data.error) { setRobloxError(data.error || 'No se pudo verificar.'); return }
      // Si es registro público (sin código) sí necesita DL
      if (!inviteData && !data.displayName?.toLowerCase().includes('dl')) {
        setRobloxError('Tu nombre de Roblox debe contener "DL". Ej: DL_TuNombre, JohanDL...')
        return
      }
      setRobloxData(data)
    } catch {
      setRobloxError('Error de conexión. Intenta de nuevo.')
    } finally {
      setVerifying(false)
    }
  }

  const validate = () => {
    const e = {}
    if (!form.username.trim())          e.username = 'El usuario es requerido'
    if (form.password.length < 6)       e.password = 'Mínimo 6 caracteres'
    if (form.password !== form.confirm) e.confirm  = 'Las contraseñas no coinciden'
    if (!form.phone.trim())             e.phone    = 'El teléfono es requerido'
    else if (!/^\d{6,15}$/.test(form.phone.replace(/\s/g, ''))) e.phone = 'Solo dígitos, 6-15 caracteres'
    return e
  }

  const handle = async (e) => {
    e.preventDefault(); setApiError('')
    const errs = validate()
    if (Object.keys(errs).length) return setErrors(errs)
    setLoading(true)
    const res = await register({
      username:       form.username,
      password:       form.password,
      robloxUsername: robloxInput.trim(),
      phone:          `${form.phoneCode}${form.phone.replace(/\s/g,'')}`,
      inviteCode:     inviteData ? inviteCode.trim().toUpperCase() : undefined,
    })
    if (!res.success) setApiError(res.error)
    setLoading(false)
  }

  const set = (k) => (e) => { setForm(f => ({...f,[k]:e.target.value})); setErrors(err=>({...err,[k]:''})) }

  // ── PASO 1: verificar Roblox (pantalla principal) ──
  if (!robloxData) return (
    <div className="space-y-4">
      {/* Si ya validó un código, mostrar el badge */}
      {inviteData && (
        <div className="flex items-center gap-2.5 p-3 bg-green-950/30 border border-green-700/30 rounded-xl">
          <span className="text-green-400 text-sm">✓</span>
          <div>
            <p className="text-xs text-green-300 font-semibold">
              Código válido — rol: <span className="capitalize">{inviteData.role}</span>
            </p>
            {inviteData.systemName && (
              <p className="text-xs text-zinc-500">Nombre asignado: {inviteData.systemName}</p>
            )}
          </div>
          <button onClick={() => { setInviteData(null); setSkipCode(false); setInviteCode('') }}
            className="ml-auto text-xs text-zinc-600 hover:text-zinc-400">quitar</button>
        </div>
      )}

      {/* Aviso DL solo si no tiene código */}
      {!inviteData && (
        <div className="flex items-start gap-2.5 p-3 bg-amber-950/30 border border-amber-800/30 rounded-xl">
          <Shield size={14} className="text-amber-500 mt-0.5 flex-shrink-0"/>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Tu nombre de Roblox debe contener <span className="text-white font-bold">DL</span> para registrarte sin código.
          </p>
        </div>
      )}

      {/* Formulario verificar Roblox */}
      <form onSubmit={handleVerify} className="space-y-3">
        <GoldInput label="Username de Roblox" placeholder="Ej: DL_TuNombre" type="text"
          value={robloxInput} onChange={e => { setRobloxInput(e.target.value); setRobloxError('') }}
          icon={<Gamepad2 size={15}/>} error={robloxError} required />
        {robloxError && (
          <div className="flex items-start gap-2 p-3 bg-red-950/40 border border-red-800/30 rounded-xl">
            <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5"/>
            <p className="text-xs text-red-300">{robloxError}</p>
          </div>
        )}
        <button type="submit" disabled={verifying}
          className="w-full py-3 rounded-xl font-bold text-sm tracking-widest uppercase transition-all
            bg-gradient-to-r from-amber-700 via-amber-500 to-amber-700
            hover:from-amber-600 hover:via-amber-400 hover:to-amber-600
            text-black shadow-lg shadow-amber-900/40 disabled:opacity-50 border border-amber-600/30">
          {verifying
            ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"/>Verificando en Roblox...</span>
            : '🔍 Verificar username →'}
        </button>
      </form>

      {/* Separador + opción código */}
      {!inviteData && (
        <>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-zinc-800/80" />
            <span className="text-xs text-zinc-600">¿Tienes un código?</span>
            <div className="flex-1 h-px bg-zinc-800/80" />
          </div>

          {/* Expandible: ingresar código */}
          {!skipCode ? (
            <button onClick={() => setSkipCode(true)}
              className="w-full py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-amber-400 border border-zinc-800/60 hover:border-amber-600/30 transition-all flex items-center justify-center gap-2">
              <Shield size={13} /> Tengo un código de invitación
            </button>
          ) : (
            <form onSubmit={handleCheckCode} className="space-y-2">
              <GoldInput
                label="Código de invitación"
                placeholder="Ej: DL-ABC123"
                type="text"
                value={inviteCode}
                onChange={e => { setInviteCode(e.target.value.toUpperCase()); setInviteError('') }}
                icon={<Shield size={15}/>}
                error={inviteError}
              />
              {inviteError && (
                <div className="flex items-start gap-2 p-3 bg-red-950/40 border border-red-800/30 rounded-xl">
                  <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5"/>
                  <p className="text-xs text-red-300">{inviteError}</p>
                </div>
              )}
              <div className="flex gap-2">
                <button type="button" onClick={() => { setSkipCode(false); setInviteCode(''); setInviteError('') }}
                  className="px-3 py-2 rounded-xl text-xs text-zinc-500 hover:text-zinc-300 border border-zinc-800 transition-all">
                  Cancelar
                </button>
                <button type="submit" disabled={checkingCode || !inviteCode.trim()}
                  className="flex-1 py-2 rounded-xl font-bold text-xs tracking-widest uppercase transition-all
                    bg-gradient-to-r from-amber-700 via-amber-500 to-amber-700
                    text-black disabled:opacity-50 border border-amber-600/30">
                  {checkingCode
                    ? <span className="flex items-center justify-center gap-2"><span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin"/>Verificando...</span>
                    : '🔑 Aplicar código'}
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  )

  // ── PASO 2: datos de cuenta ──
  return (
    <form onSubmit={handle} className="space-y-3">
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-3 p-3 bg-amber-950/30 border border-amber-700/40 rounded-xl">
        <img src={robloxData.avatar} alt={robloxData.displayName}
          className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-amber-600/30"
          onError={e => { e.target.src=`https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${robloxData.username}` }}/>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-amber-300 truncate">{robloxData.displayName}</p>
          <p className="text-xs text-zinc-500">@{robloxData.username} · ID: {robloxData.id}</p>
        </div>
        <div className="text-right">
          <span className="text-xs text-amber-400 font-semibold block">✓ Verificado</span>
          <button type="button" onClick={() => { setRobloxData(null); setApiError('') }}
            className="text-xs text-zinc-600 hover:text-zinc-400">cambiar</button>
        </div>
      </motion.div>

      <GoldInput label="Usuario del sistema" placeholder="Elige tu nombre de usuario" type="text"
        value={form.username} onChange={set('username')} error={errors.username} icon={<User size={15}/>} required/>
      <GoldInput label="Contraseña" placeholder="••••••••" type={showPass?'text':'password'}
        value={form.password} onChange={set('password')} error={errors.password} icon={<Lock size={15}/>}
        rightIcon={<span onClick={()=>setShowPass(p=>!p)} className="cursor-pointer">{showPass?<EyeOff size={15}/>:<Eye size={15}/>}</span>} required/>
      <GoldInput label="Confirmar contraseña" placeholder="••••••••" type={showPass?'text':'password'}
        value={form.confirm} onChange={set('confirm')} error={errors.confirm} icon={<Lock size={15}/>} required/>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-amber-600/80 uppercase tracking-widest flex items-center gap-1.5">
          <Phone size={13}/> Teléfono
        </label>
        <div className={`flex bg-[#0d0b08] border rounded-xl overflow-hidden transition-all
          ${errors.phone ? 'border-red-500/60' : 'border-amber-900/40 focus-within:border-amber-500/60'}`}>
          <select value={form.phoneCode} onChange={e=>setForm(f=>({...f,phoneCode:e.target.value}))}
            className="bg-transparent text-zinc-300 text-xs px-2 py-2.5 outline-none border-r border-amber-900/30 cursor-pointer flex-shrink-0" style={{maxWidth:'120px'}}>
            {COUNTRY_CODES.map(c=>(
              <option key={c.code} value={c.code} style={{background:'#0d0b08'}}>{c.flag} {c.code} {c.name}</option>
            ))}
          </select>
          <input type="tel" placeholder="000 000 0000" value={form.phone}
            onChange={e=>{setForm(f=>({...f,phone:e.target.value}));setErrors(err=>({...err,phone:''}))}}
            className="flex-1 bg-transparent text-zinc-100 text-sm px-3 py-2.5 outline-none placeholder-zinc-700 min-w-0"/>
        </div>
        {errors.phone && <p className="text-xs text-red-400">{errors.phone}</p>}
      </div>      {apiError && (
        <div className="flex items-start gap-2 p-3 bg-red-950/40 border border-red-800/30 rounded-xl">
          <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5"/>
          <p className="text-xs text-red-300">{apiError}</p>
        </div>
      )}

      <button type="submit" disabled={loading}
        className="w-full py-3 rounded-xl font-bold text-sm tracking-widest uppercase transition-all
          bg-gradient-to-r from-amber-700 via-amber-500 to-amber-700
          hover:from-amber-600 hover:via-amber-400 hover:to-amber-600
          text-black shadow-lg shadow-amber-900/40 disabled:opacity-50 border border-amber-600/30">
        {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"/>Creando cuenta...</span> : '⚔ Unirse al servidor'}
      </button>
    </form>
  )
}

// ── Página principal ──────────────────────────────────────────
export default function LoginPage() {
  const [tab, setTab] = useState('login')

  return (
    <div className="min-h-screen bg-[#080608] flex items-center justify-center p-4 relative overflow-hidden">

      {/* Fondo con partículas y gradientes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Gradiente dorado arriba */}
        <div className="absolute -top-60 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-amber-600/5 rounded-full blur-[120px]"/>
        {/* Gradiente rojo abajo izquierda */}
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-red-900/8 rounded-full blur-[100px]"/>
        {/* Gradiente rojo abajo derecha */}
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-red-950/8 rounded-full blur-[100px]"/>
        {/* Líneas decorativas */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-600/20 to-transparent"/>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-600/10 to-transparent"/>
        {/* Puntos decorativos */}
        <div className="absolute top-8 left-8 w-1 h-1 rounded-full bg-amber-500/30"/>
        <div className="absolute top-8 right-8 w-1 h-1 rounded-full bg-amber-500/30"/>
        <div className="absolute bottom-8 left-8 w-1 h-1 rounded-full bg-amber-500/20"/>
        <div className="absolute bottom-8 right-8 w-1 h-1 rounded-full bg-amber-500/20"/>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0,  scale: 1    }}
        transition={{ duration: 0.5, type: 'spring', damping: 22 }}
        className="w-full max-w-md relative z-10"
      >
        {/* ── Header con logo ── */}
        <div className="flex flex-col items-center mb-8 gap-4">
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 180, damping: 18 }}
            className="relative"
          >
            {/* Glow detrás del logo */}
            <div className="absolute inset-0 rounded-full bg-amber-500/15 blur-2xl scale-125"/>
            <DLLogo size={110} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center"
          >
            <h1 className="text-3xl font-black tracking-widest uppercase"
              style={{ background: 'linear-gradient(135deg, #d97706, #fde68a, #d97706)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Dark License
            </h1>
            <p className="text-zinc-600 text-xs tracking-[0.35em] uppercase mt-1">· Panel de gestión ·</p>
          </motion.div>
        </div>

        {/* ── Card principal ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, #100e0b, #0d0b08)',
            boxShadow: '0 0 0 1px rgba(180,130,40,0.2), 0 25px 60px rgba(0,0,0,0.7), inset 0 1px 0 rgba(245,158,11,0.08)',
          }}
        >
          {/* Borde dorado decorativo arriba */}
          <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, #d97706, #fde68a, #d97706, transparent)' }}/>

          {/* Tabs */}
          <div className="flex relative">
            {[
              { key: 'login',    label: 'Ingresar'    },
              { key: 'register', label: 'Registrarse' },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-all relative
                  ${tab === t.key ? 'text-amber-400' : 'text-zinc-600 hover:text-zinc-400'}`}>
                {t.label}
                {tab === t.key && (
                  <motion.div layoutId="gold-tab"
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ background: 'linear-gradient(90deg, transparent, #f59e0b, transparent)' }}/>
                )}
              </button>
            ))}
            {/* Separador vertical */}
            <div className="absolute top-3 bottom-3 left-1/2 w-px bg-amber-900/30"/>
          </div>

          {/* Separador */}
          <div className="h-px mx-0" style={{ background: 'linear-gradient(90deg, transparent, rgba(180,130,40,0.15), transparent)' }}/>

          {/* Contenido */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {tab === 'login' ? (
                <motion.div key="login"
                  initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.18 }}>
                  <LoginForm />
                </motion.div>
              ) : (
                <motion.div key="register"
                  initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }}>
                  <RegisterForm />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Borde dorado decorativo abajo */}
          <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, #92400e, transparent)' }}/>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="text-center text-zinc-700 text-xs mt-6 tracking-widest uppercase">
          · Dark License General © 2025 ·
        </motion.p>
      </motion.div>
    </div>
  )
}
