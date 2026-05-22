import { motion } from 'framer-motion'

export function Button({ children, variant = 'primary', size = 'md', loading, className = '', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed select-none'

  const variants = {
    primary:   'bg-gradient-to-r from-accent to-accent-light text-white shadow-glow-sm hover:shadow-glow hover:scale-[1.02] active:scale-[0.98]',
    secondary: 'bg-bg-elevated border border-border text-white hover:bg-bg-overlay hover:border-border-strong active:scale-[0.98]',
    ghost:     'text-text-secondary hover:text-white hover:bg-white/5 active:scale-[0.98]',
    danger:    'bg-red-600/20 border border-red-600/30 text-red-400 hover:bg-red-600/30 active:scale-[0.98]',
  }

  const sizes = {
    sm: 'text-xs px-3 py-2',
    md: 'text-sm px-5 py-2.5',
    lg: 'text-base px-7 py-3.5',
  }

  return (
    <motion.button
      whileTap={{ scale: props.disabled || loading ? 1 : 0.97 }}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={props.disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </motion.button>
  )
}
