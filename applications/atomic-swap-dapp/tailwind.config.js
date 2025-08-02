/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        atomic: {
          primary: '#6366f1',
          secondary: '#8b5cf6',
          accent: '#06b6d4',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
          dark: '#1e293b',
          light: '#f8fafc',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'atomic-pulse': 'atomic-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'atomic-spin': 'atomic-spin 1s linear infinite',
      },
      keyframes: {
        'atomic-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'atomic-spin': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        }
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
