/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // PatchGuard Design System
        bg: {
          primary:  '#0D1117',
          surface:  '#161B22',
          elevated: '#1C2128',
        },
        border: {
          DEFAULT: '#30363D',
          subtle:  '#21262D',
        },
        severity: {
          critical: '#FF3B3B',
          high:     '#FF8C00',
          medium:   '#FFD700',
          low:      '#00C853',
          info:     '#2196F3',
        },
        brand: {
          DEFAULT: '#238636',
          hover:   '#2EA043',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in':    'fadeIn 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
