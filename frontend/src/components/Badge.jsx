const variants = {
  pendiente: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  aprobada: 'bg-green-500/15 text-green-400 border border-green-500/30',
  rechazada: 'bg-red-500/15 text-red-400 border border-red-500/30',
  active: 'bg-green-500/15 text-green-400 border border-green-500/30',
  inactive: 'bg-zinc-700/30 text-zinc-400 border border-zinc-700/50',
  admin: 'bg-red-500/15 text-red-400 border border-red-500/30',
  moderator: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
  user: 'bg-zinc-700/30 text-zinc-400 border border-zinc-700/50',
  info: 'bg-red-500/15 text-red-400 border border-red-500/30',
}

const dots = {
  pendiente: 'bg-amber-400',
  aprobada: 'bg-green-400',
  rechazada: 'bg-red-400',
  active: 'bg-green-400',
  inactive: 'bg-zinc-400',
}

export default function Badge({ variant = 'info', children, dot = false }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant] || variants.info}`}>
      {dot && dots[variant] && (
        <span className={`w-1.5 h-1.5 rounded-full ${dots[variant]}`} />
      )}
      {children}
    </span>
  )
}
