/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand palette
        primary: {
          50:  '#EEEDFE',
          100: '#CECBF6',
          200: '#AFA9EC',
          300: '#9B8DF5',
          400: '#7C6BF0',
          500: '#6355E0',
          600: '#5B4DE0',
          700: '#4A3ECC',
          800: '#3C3489',
          900: '#26215C',
        },
        teal: {
          50:  '#E1F5EE',
          100: '#9FE1CB',
          300: '#2CC9A0',
          400: '#1D9E75',
          600: '#0F6E56',
          800: '#085041',
        },
        coral: {
          300: '#F06464',
          400: '#D85A30',
          600: '#993C1D',
        },
        amber: {
          300: '#F5A623',
          400: '#BA7517',
          600: '#854F0B',
        },
        blue: {
          400: '#4A9EF5',
          600: '#2563EB',
        },
        surface: {
          0:   '#0E0F13',
          50:  '#14151A',
          100: '#1A1B22',
          200: '#22232C',
          300: '#2C2D38',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      borderRadius: {
        'xl':  '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      spacing: {
        '4.5': '1.125rem',
        '5.5': '1.375rem',
      },
      boxShadow: {
        'glow':       '0 0 40px rgba(124,107,240,0.15)',
        'glow-sm':    '0 0 20px rgba(124,107,240,0.1)',
        'card':       '0 4px 24px rgba(0,0,0,0.4)',
        'modal':      '0 20px 60px rgba(0,0,0,0.6)',
      },
      animation: {
        'fade-in':    'fadeIn 0.2s ease',
        'slide-up':   'slideUp 0.2s ease',
        'spin-slow':  'spin 2s linear infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:     { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideUp:    { from: { opacity: 0, transform: 'translateY(20px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        pulseSoft:  { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.5 } },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms')({ strategy: 'class' }),
  ],
}
