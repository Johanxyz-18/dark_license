import { useState } from 'react'

export default function Avatar({ src, alt = '', size = 'md', online = false }) {
  const [imgError, setImgError] = useState(false)

  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl',
    '2xl': 'w-32 h-32 text-4xl',
  }

  const dotSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3.5 h-3.5',
    xl: 'w-4 h-4',
    '2xl': 'w-5 h-5',
  }

  const initials = alt
    ? alt.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <div className="relative inline-flex flex-shrink-0">
      {src && !imgError ? (
        <img
          src={src}
          alt={alt}
          onError={() => setImgError(true)}
          className={`${sizes[size]} rounded-full object-cover ring-2 ring-zinc-800 bg-zinc-900`}
        />
      ) : (
        <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-red-700 to-red-900 flex items-center justify-center text-white font-semibold ring-2 ring-zinc-800`}>
          {initials}
        </div>
      )}
      {online && (
        <span className={`absolute bottom-0 right-0 ${dotSizes[size]} bg-green-400 rounded-full ring-2 ring-[#111111]`} />
      )}
    </div>
  )
}
