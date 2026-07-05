import { forwardRef } from 'react'

const Input = forwardRef(function Input({
  label,
  error,
  hint,
  icon,
  rightIcon,
  className = '',
  ...props
}, ref) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-zinc-300">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          className={`
            w-full bg-[#0a0a0a] border rounded-xl px-4 py-2.5 text-sm
            text-zinc-100 placeholder-zinc-600
            transition-all duration-200 outline-none
            focus:ring-2 focus:ring-red-500/40 focus:border-red-500
            ${error ? 'border-red-500/70 focus:border-red-500 focus:ring-red-500/30' : 'border-zinc-800/80'}
            ${icon ? 'pl-10' : ''}
            ${rightIcon ? 'pr-10' : ''}
            ${className}
          `}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 cursor-pointer">
            {rightIcon}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-zinc-500">{hint}</p>}
    </div>
  )
})

export default Input
