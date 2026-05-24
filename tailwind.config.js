/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // Primary brand — legal emerald
        brand: {
          50:  '#edfdf6',
          100: '#d2f9e8',
          200: '#a8f0d3',
          300: '#6ee3b8',
          400: '#34cc96',
          500: '#10b377',
          600: '#0a9161',
          700: '#0a7450',
          800: '#0b5c40',
          900: '#0b4c36',
          950: '#042b1f',
        },
        // Neutral slate with warm undertone
        ink: {
          50:  '#f7f7f5',
          100: '#eeede9',
          200: '#dddbd5',
          300: '#c5c2b9',
          400: '#a9a59a',
          500: '#8f8b7f',
          600: '#757067',
          700: '#605c54',
          800: '#504d46',
          900: '#44413b',
          950: '#242219',
        },
        surface: {
          light: '#FAFAF7',
          card:  '#FFFFFF',
          dark:  '#10131A',
          'dark-card': '#171B25',
        }
      },
      screens: { xs: '480px' },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.4'/%3E%3C/svg%3E\")",
      },
      animation: {
        'fade-up':    'fadeUp 0.55s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in':    'fadeIn 0.4s ease both',
        'slide-left': 'slideLeft 0.5s cubic-bezier(0.16,1,0.3,1) both',
        'float':      'float 7s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4,0,0.6,1) infinite',
        'shimmer':    'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideLeft: {
          '0%':   { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
      },
      boxShadow: {
        'soft':      '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card':      '0 4px 16px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)',
        'card-lg':   '0 12px 40px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.06)',
        'brand':     '0 4px 24px rgba(10,145,97,0.25)',
        'brand-lg':  '0 8px 40px rgba(10,145,97,0.3)',
        'inset':     'inset 0 1px 0 rgba(255,255,255,0.06)',
      },
    },
  },
  plugins: [],
}
