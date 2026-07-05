import { Loader2 } from 'lucide-react'

export default function LoadingSpinner({ message = 'Cargando...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Loader2 size={32} className="text-red-500 animate-spin" />
      <p className="text-zinc-400 text-sm">{message}</p>
    </div>
  )
}

export function LoadingOverlay({ message }) {
  return (
    <div className="absolute inset-0 bg-[#0a0a0a]/60 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl">
      <LoadingSpinner message={message} />
    </div>
  )
}
