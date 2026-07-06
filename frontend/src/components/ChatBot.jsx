import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Bot, Trash2 } from 'lucide-react'
import { useApp } from '../hooks/useApp'

// ── Base de conocimiento ──────────────────────────────────────
const KB = [
  // Saludos
  { keys: ['hola', 'hey', 'buenas', 'buenos', 'hi', 'saludos', 'buen dia', 'buenas tardes', 'buenas noches'],
    text: () => '¡Hola! Soy el asistente de Dark License. ¿En qué te puedo ayudar hoy?' },

  // Justificaciones — cómo enviar
  { keys: ['como justifico', 'cómo justifico', 'como envio', 'cómo envío', 'enviar justif', 'nueva justif', 'justificar ausencia'],
    text: () => 'Para justificar una ausencia:\n1. Ve a **Justificaciones**\n2. Busca la actividad en la lista\n3. Haz clic sobre ella\n4. Escribe el motivo y descripción\n5. Presiona **Enviar**\n\n✓ Solo puedes justificar una vez por actividad.' },

  // Estados
  { keys: ['pendiente', 'aprobada', 'rechazada', 'estado', 'que significa'],
    text: () => 'Los estados de justificación son:\n• 🟡 **Pendiente** — esperando que el admin la revise\n• ✅ **Aprobada** — fue aceptada\n• ❌ **Rechazada** — no fue aceptada\n\nPuedes ver tus estados en "Mis justificaciones".' },

  // No ve actividades
  { keys: ['no veo actividad', 'no hay actividad', 'vacio', 'vacío', 'sin actividad', 'lista vacia'],
    text: () => 'Si no aparecen actividades puede ser porque:\n• Los admins aún no han publicado ninguna\n• Están fuera del período activo\n\nEspera a que un administrador cree actividades.' },

  // Cuánto tarda
  { keys: ['cuanto tarda', 'cuánto tarda', 'cuando aprueban', 'tiempo revision', 'cuanto demora'],
    text: () => 'Los admins revisan las justificaciones manualmente.\nNo hay un tiempo fijo, pero generalmente es en pocos días.\nPuedes ver el estado actual en "Mis justificaciones".' },

  // Contraseña
  { keys: ['contraseña', 'password', 'cambiar pass', 'olvidé', 'olvide'],
    text: () => 'Para cambiar tu contraseña ve a:\n**Configuración → Cambiar contraseña**\n\nNecesitas saber tu contraseña actual. Si la olvidaste, contacta a un admin.' },

  // Perfil / nombre
  { keys: ['perfil', 'nombre', 'como me llamo', 'cambiar nombre', 'nombre sistema'],
    text: () => 'Tu nombre en el sistema lo asigna el administrador al crearte la cuenta.\nPuedes editarlo desde **Mi Perfil → Editar**.' },

  // Roblox username
  { keys: ['roblox', 'username roblox', 'cambiar roblox', 'actualizar roblox'],
    text: () => 'Puedes actualizar tu username de Roblox en **Configuración**.\n\n⚠️ Solo puedes cambiarlo una vez cada **7 días**.' },

  // Cumpleaños
  { keys: ['cumpleaños', 'birthday', 'fecha nacimiento', 'cuando es mi cumple'],
    text: () => 'Tu cumpleaños se configura en **Configuración → Fecha de cumpleaños**.\nAparece en el calendario de la comunidad y recibirás un saludo el día de tu cumpleaños 🎂' },

  // DL en el nombre
  { keys: ['dl', 'dark license', 'por que necesito dl', 'que es dl'],
    text: () => '**DL** es la etiqueta del grupo en Roblox.\n\nSi tu nombre de Roblox no contiene "DL", tu cuenta puede ser suspendida automáticamente.\n\nEjemplos válidos: DL_TuNombre, TuNombreDL, Johan_DL' },

  // Cuenta suspendida
  { keys: ['suspendida', 'bloqueada', 'inactiva', 'no puedo entrar', 'cuenta desactivada'],
    text: () => 'Si tu cuenta está suspendida puede ser porque:\n• Quitaste "DL" de tu nombre en Roblox\n• Un admin la desactivó manualmente\n\nPara reactivarla: agrega "DL" a tu nombre en Roblox e intenta ingresar de nuevo. Si persiste, contacta a un admin.' },

  // Admin
  { keys: ['admin', 'administrador', 'contactar', 'hablar con'],
    text: () => 'Para contactar a un administrador, hazlo directamente en el servidor de Discord o Roblox de Dark License.' },

  // Registro
  { keys: ['registrar', 'registro', 'crear cuenta', 'como entro', 'como me uno'],
    text: () => 'Para registrarte en Dark License:\n1. Ve a la pantalla de login\n2. Haz clic en **Registrarse**\n3. Verifica tu username de Roblox (debe tener "DL")\n4. Completa los datos\n\nSolo pueden registrarse miembros del grupo.' },

  // Notificaciones
  { keys: ['notificacion', 'notificaciones', 'alerta'],
    text: () => 'Las notificaciones aparecen en la campana (🔔) arriba a la derecha.\nTe avisan sobre justificaciones aprobadas/rechazadas y cumpleaños.' },

  // Ayuda general
  { keys: ['ayuda', 'help', 'no entiendo', 'que puedo hacer', 'opciones'],
    text: () => 'Puedo ayudarte con:\n• 📋 Justificaciones de ausencia\n• 🔐 Cambio de contraseña\n• 👤 Perfil y nombre\n• 🎮 Username de Roblox\n• 🎂 Cumpleaños\n• ❓ Dudas generales\n\n¿Sobre qué tema necesitas ayuda?' },

  // Gracias
  { keys: ['gracias', 'thanks', 'ok', 'perfecto', 'entendi', 'entendí', 'listo'],
    text: () => '¡De nada! Si tienes más preguntas, aquí estaré. 😊' },

  // Insultos / pruebas
  { keys: ['eres tonto', 'no sirves', 'malo', 'inutil', 'inútil'],
    text: () => 'Entiendo tu frustración. Si algo no está funcionando bien, cuéntame y lo revisamos juntos.' },
]

function getAnswer(text) {
  const lower = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  // Busca coincidencia exacta primero (más palabras clave matches = mejor)
  let best = null
  let bestScore = 0
  for (const entry of KB) {
    const score = entry.keys.filter(k => lower.includes(k.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))).length
    if (score > bestScore) { bestScore = score; best = entry }
  }
  if (best) return best.text()
  return '🤔 No tengo información sobre eso. Puedes preguntar sobre justificaciones, contraseña, perfil, Roblox, cumpleaños o contactar a un admin.'
}

const SUGERENCIAS = [
  '¿Cómo justifico una ausencia?',
  '¿Qué significa "pendiente"?',
  '¿Cómo cambio mi contraseña?',
  '¿Qué es DL?',
]

export default function ChatBot({ context = 'general' }) {
  const { currentUser } = useApp()
  const [open, setOpen]     = useState(false)
  const [input, setInput]   = useState('')
  const [typing, setTyping] = useState(false)
  const [msgs, setMsgs]     = useState([
    { from: 'bot', text: `¡Hola${currentUser?.systemName ? ', ' + currentUser.systemName : ''}! Soy el asistente de Dark License. ¿En qué te puedo ayudar?` }
  ])
  const bottomRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, typing])

  const send = (text) => {
    const msg = (text || input).trim()
    if (!msg) return
    setMsgs(p => [...p, { from: 'user', text: msg }])
    setInput('')
    setTyping(true)
    setTimeout(() => {
      setMsgs(p => [...p, { from: 'bot', text: getAnswer(msg) }])
      setTyping(false)
    }, 600)
  }

  const clearChat = () => {
    setMsgs([{ from: 'bot', text: `¡Hola${currentUser?.systemName ? ', ' + currentUser.systemName : ''}! ¿En qué te puedo ayudar?` }])
  }

  // Renderiza texto con **negrita**
  const renderText = (text) => {
    return text.split('\n').map((line, i) => {
      const parts = line.split(/\*\*(.+?)\*\*/g)
      return (
        <span key={i}>
          {parts.map((p, j) => j % 2 === 1 ? <strong key={j} className="text-white font-semibold">{p}</strong> : p)}
          {i < text.split('\n').length - 1 && <br />}
        </span>
      )
    })
  }

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-40 p-3.5 rounded-2xl bg-red-600 hover:bg-red-500 shadow-xl shadow-red-600/40 text-white transition-all hover:scale-105"
        aria-label="Abrir asistente"
      >
        <AnimatePresence mode="wait">
          <motion.div key={open ? 'close' : 'open'}
            initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.15 }}>
            {open ? <X size={20} /> : <MessageCircle size={20} />}
          </motion.div>
        </AnimatePresence>
      </button>

      {/* Ventana */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{    opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, type: 'spring', damping: 25 }}
            className="fixed bottom-24 right-6 z-40 w-80 sm:w-96 bg-[#111111] border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ maxHeight: '500px' }}
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b border-zinc-800 bg-[#0d0d0d]">
              <div className="w-8 h-8 rounded-xl bg-red-600/20 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                <Bot size={15} className="text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white leading-none">Asistente DL</p>
                <p className="text-xs text-zinc-500 mt-0.5">Siempre activo</p>
              </div>
              <button onClick={clearChat} title="Limpiar chat"
                className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-600 hover:text-zinc-400 transition-colors">
                <Trash2 size={13} />
              </button>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-0">
              {msgs.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.from === 'bot' && (
                    <div className="w-6 h-6 rounded-lg bg-red-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot size={11} className="text-red-400" />
                    </div>
                  )}
                  <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed
                    ${m.from === 'user'
                      ? 'bg-red-600 text-white rounded-br-sm'
                      : 'bg-zinc-800/80 text-zinc-300 rounded-bl-sm border border-zinc-700/40'}`}>
                    {m.from === 'bot' ? renderText(m.text) : m.text}
                  </div>
                </motion.div>
              ))}
              {typing && (
                <div className="flex gap-2 justify-start">
                  <div className="w-6 h-6 rounded-lg bg-red-600/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot size={11} className="text-red-400" />
                  </div>
                  <div className="px-3 py-2.5 rounded-2xl rounded-bl-sm bg-zinc-800/80 border border-zinc-700/40 flex gap-1">
                    {[0,1,2].map(i => (
                      <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-zinc-500 block"
                        animate={{ opacity: [0.3,1,0.3], y: [0,-3,0] }}
                        transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Sugerencias rápidas (solo al inicio) */}
            {msgs.length === 1 && (
              <div className="px-3 pb-2 grid grid-cols-2 gap-1.5">
                {SUGERENCIAS.map((q, i) => (
                  <button key={i} onClick={() => send(q)}
                    className="text-left px-2.5 py-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 text-xs text-zinc-400 hover:text-white transition-colors border border-zinc-700/40 leading-tight">
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="px-3 pb-3 pt-2 border-t border-zinc-800">
              <div className="flex gap-2 items-center bg-zinc-900/80 border border-zinc-800 rounded-xl px-3 py-2 focus-within:border-red-500/50 transition-colors">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                  placeholder="Escribe tu pregunta..."
                  className="flex-1 bg-transparent text-sm text-zinc-200 placeholder-zinc-600 outline-none"
                />
                <button onClick={() => send()} disabled={!input.trim()}
                  className="p-1.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white transition-all hover:scale-105 active:scale-95">
                  <Send size={13} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
