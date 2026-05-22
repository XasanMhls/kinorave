import { getInitials } from '../../utils/format'

const COLORS = [
  'from-violet-600 to-purple-600',
  'from-blue-600 to-cyan-600',
  'from-pink-600 to-rose-600',
  'from-orange-600 to-amber-600',
  'from-emerald-600 to-teal-600',
]

function colorForName(name = '') {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}

export function Avatar({ src, name = '', size = 'md', className = '' }) {
  const sizes = { xs: 'w-6 h-6 text-xs', sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base', xl: 'w-16 h-16 text-xl' }
  const color = colorForName(name)

  return (
    <div className={`${sizes[size]} rounded-full overflow-hidden flex-shrink-0 ring-2 ring-white/10 ${className}`}>
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <div className={`w-full h-full bg-gradient-to-br ${color} flex items-center justify-center font-bold text-white`}>
          {getInitials(name)}
        </div>
      )}
    </div>
  )
}
