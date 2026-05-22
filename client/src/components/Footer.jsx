import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="border-t border-border-subtle mt-20 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg bg-accent-gradient flex items-center justify-center shadow-glow-sm">
              <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <span className="font-black text-lg tracking-tight text-gradient">KINO</span>
          </Link>

          <p className="text-text-muted text-sm">
            © 2026 KINO. Смотрите вместе.
          </p>

          <div className="flex items-center gap-5">
            {['Фильмы', 'Сериалы'].map(label => (
              <Link
                key={label}
                to={`/${label === 'Фильмы' ? 'movies' : 'series'}`}
                className="text-text-muted text-sm hover:text-white transition-colors"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
