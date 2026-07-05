import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Bot } from 'lucide-react'

// ── Respuestas según contexto ─────────────────────────────────
const RESPUESTAS_GENERAL = [
  { keys: ['hola', 'hey', 'buenas'],        text: '¡Hola! ¿En qué te puedo ayudar?' },
  { keys: ['justif', 'ausencia', 'faltar'],  text: 'Para justificar una ausencia ve a la sección Justificaciones, abre la actividad y llena el formulario.' },
  { keys: ['contraseña', 'password'],        text: 'Puedes cambiar tu contraseña en Configuración → Cambiar contraseña.' },
  { keys: ['perfil', 'avatar', 'roblox'],    text: 'Tu perfil y avatar se obtienen automáticamente de Roblox. Puedes actualizarlos en Configuración.' },
  { keys: ['cumpleaños', 'birthday'],        text: 'Configura tu fecha de cumpleaños en Configuración y aparecerá en la sección Cumpleaños.' },
  { keys: ['admin', 'contactar', 'ayuda'],   text: 'Contacta a un administrador directamente en el servidor de Discord o Roblox.' },
  { keys: ['estado', 'pendiente', 'aprobada', 'rechazada'], text: 'Los estados son:\n• Pendiente: esperando revisión\n• Aprobada: aceptada ✓\n• Rechazada: no aceptada ✗' },
]

const RESPUESTAS_JUST = [
  { keys: ['como', 'cómo', 'enviar', 'nueva'], text: '1. Busca la actividad en la lista\n2. Haz clic sobre ella para abrirla\n3. Escribe el motivo\n4. Presiona Enviar' },
  { keys: ['no veo', 'no hay', 'vacio', 'vacío'], text: 'Si no ves actividades es porque los admins aún no han publicado ninguna.' },
  { keys: ['dos veces', 'otra vez', 'ya envié'], text: 'Solo puedes enviar una justificación por actividad. Si ya la enviaste aparece el ✓ verde.' },
  { keys: ['cuánto', 'cuando', 'tiempo'],      text: 'Los admins revisan las justificaciones manualmente. Puedes ver el estado en "Mis justificaciones".' },
  ...RESPUESTAS_GENERAL,
]

function getAnswer(text, context) {
  const lower = text.toLowerCase()
  const base  = context === 'justifications' ? RESPUESTAS_JUST : RESPUESTAS_GENERAL
  const found = base.find(r => r.keys.some(k => lower.includes(k)))
  return found?.text || 'No entendí bien. Prueba preguntar sobre justificaciones, contraseña, perfil o cumpleaños.'
}

const SUGERENCIAS = {
  general:        ['¿Cómo justifico una ausencia?', '¿Cómo cambio mi contraseña?', '¿Qué es el estado pendiente?'],
  justifications: ['¿Cómo envío una justificación?', '¿Por qué no veo actividades?', '¿Cuánto tarda en aprobarse?'],
}

export default function ChatBot({ context = 'general' }) {
  const [open, setOpen]         = useState(false)
  const [input, setInput]       = useState('')
  const [typing, setTyping]     = useState(false)
  const [msgs, setMsgs]         = useState([
    { from: 'bot', text: context === 'justifications'
        ? '¡Hola! Soy el asistente de Justificaciones. ¿En qué te ayudo?'
        : '¡Hola! Soy el asistente de Dark License. ¿En qué te ayudo?' }
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
      setMsgs(p => [...p, { from: 'bot', text: getAnswer(msg, context) }])
      setTyping(false)
    }, 500)
  }

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-40 p-3.5 rounded-2xl bg-red-600 hover:bg-red-500 shadow-xl shadow-red-600/40 text-white transition-colors"
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
      </button>

      {/* Ventana */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{    opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-40 w-80 bg-[#111111] border border-red-900/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ maxHeight: '460px' }}
          >
            {/* Header */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 bg-[#0d0d0d]">
              <div className="w-7 h-7 rounded-lg bg-red-600/20 flex items-center justify-center">
                <Bot size={14} className="text-red-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white leading-none">Asistente DL</p>
                <p className="text-xs text-zinc-500">{context === 'justifications' ? 'Justificaciones' : 'General'}</p>
              </div>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ maxHeight: '280px' }}>
              {msgs.map((m, i) => (
                <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm whitespace-pre-line
                    ${m.from === 'user'
                      ? 'bg-red-600 text-white rounded-br-sm'
                      : 'bg-zinc-800 text-zinc-300 rounded-bl-sm'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {typing && (
                <div className="flex justify-start">
                  <div className="px-3 py-2.5 rounded-xl rounded-bl-sm bg-zinc-800 flex gap-1">
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
              <div className="px-3 pb-2 space-y-1.5">
                {SUGERENCIAS[context].map((q, i) => (
                  <button key={i} onClick={() => send(q)}
                    className="w-full text-left px-3 py-1.5 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 text-xs text-zinc-400 hover:text-white transition-colors border border-zinc-700/40">
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="px-3 pb-3 pt-2 border-t border-zinc-800">
              <div className="flex gap-2 items-center bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 focus-within:border-red-500/50 transition-colors">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); send() } }}
                  placeholder="Escribe tu pregunta..."
                  className="flex-1 bg-transparent text-sm text-zinc-200 placeholder-zinc-600 outline-none"
                />
                <button onClick={() => send()} disabled={!input.trim()}
                  className="p-1.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white transition-colors">
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
