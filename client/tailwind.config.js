/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        bg: {
          base: '#07070d',
          surface: '#0f0f1a',
          elevated: '#161625',
          overlay: '#1e1e30',
        },
        accent: {
          DEFAULT: '#7c3aed',
          light: '#a855f7',
          glow: 'rgba(124,58,237,0.3)',
        },
        border: {
          subtle: 'rgba(255,255,255,0.06)',
          DEFAULT: 'rgba(255,255,255,0.1)',
          strong: 'rgba(255,255,255,0.18)',
        },
        text: {
          primary: '#ffffff',
          secondary: '#a1a1aa',
          muted: '#52525b',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'accent-gradient': 'linear-gradient(135deg, #7c3aed, #a855f7)',
        'card-gradient': 'linear-gradient(180deg, transparent 40%, rgba(7,7,13,0.95) 100%)',
      },
      boxShadow: {
        'glow-sm': '0 0 20px rgba(124,58,237,0.2)',
        'glow': '0 0 40px rgba(124,58,237,0.3)',
        'glow-lg': '0 0 60px rgba(124,58,237,0.4)',
        'card': '0 8px 32px rgba(0,0,0,0.5)',
        'modal': '0 25px 50px rgba(0,0,0,0.8)',
      },
      backdropBlur: {
        xs: '4px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16,1,0.3,1)',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.16,1,0.3,1)',
        'shimmer': 'shimmer 1.5s infinite',
        'pulse-slow': 'pulse 3s infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        scaleIn: { from: { opacity: 0, transform: 'scale(0.95)' }, to: { opacity: 1, transform: 'scale(1)' } },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
