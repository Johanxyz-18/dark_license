import { motion } from 'framer-motion'

export default function Card({
  children,
  className = '',
  hover = false,
  glow = false,
  padding = 'p-6',
  onClick,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={hover ? { y: -2, scale: 1.01 } : undefined}
      onClick={onClick}
      className={`
        bg-[#111111] rounded-2xl border border-red-900/20
        ${glow ? 'shadow-lg shadow-red-500/10' : 'shadow-md shadow-black/40'}
        ${hover ? 'cursor-pointer hover:border-red-500/40 transition-colors duration-200' : ''}
        ${padding}
        ${className}
      `}
    >
      {children}
    </motion.div>
  )
}
