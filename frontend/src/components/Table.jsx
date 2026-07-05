import { motion } from 'framer-motion'

export function Table({ children, className = '' }) {
  return (
    <div className={`overflow-x-auto rounded-2xl border border-red-900/20 ${className}`}>
      <table className="w-full text-sm">{children}</table>
    </div>
  )
}

export function Thead({ children }) {
  return (
    <thead className="bg-[#0a0a0a]/70 border-b border-red-900/20">
      {children}
    </thead>
  )
}

export function Th({ children, className = '' }) {
  return (
    <th className={`px-4 py-3 text-left text-xs font-semibold text-zinc-400 uppercase tracking-wider ${className}`}>
      {children}
    </th>
  )
}

export function Tbody({ children }) {
  return <tbody className="divide-y divide-zinc-800/50">{children}</tbody>
}

export function Tr({ children, className = '' }) {
  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`hover:bg-zinc-800/30 transition-colors ${className}`}
    >
      {children}
    </motion.tr>
  )
}

export function Td({ children, className = '' }) {
  return (
    <td className={`px-4 py-3 text-zinc-300 ${className}`}>
      {children}
    </td>
  )
}
