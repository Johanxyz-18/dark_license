import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

const icons = {
  success: <CheckCircle size={18} className="text-green-400" />,
  error: <XCircle size={18} className="text-red-400" />,
  warning: <AlertCircle size={18} className="text-amber-400" />,
  info: <Info size={18} className="text-red-400" />,
}

const borders = {
  success: 'border-green-500/30',
  error: 'border-red-500/30',
  warning: 'border-amber-500/30',
  info: 'border-red-500/30',
}

export default function Notification({ message, type = 'info', onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.95 }}
      className={`flex items-start gap-3 p-4 bg-[#111111] border ${borders[type]} rounded-xl shadow-xl max-w-sm`}
    >
      {icons[type]}
      <p className="flex-1 text-sm text-zinc-200">{message}</p>
      {onClose && (
        <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
          <X size={14} />
        </button>
      )}
    </motion.div>
  )
}
