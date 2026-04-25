/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        belami: {
          navy:        '#1B3A5C',
          'navy-light':'#2A527D',
          blue:        '#2E86AB',
          gold:        '#F18F01',
          cream:       '#F5F7FA',
          charcoal:    '#0F1F33',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
      },
      fontWeight: {
        500: '500',
        600: '600',
        700: '700',
      },
      boxShadow: {
        premium: '0 10px 40px -10px rgba(27,58,92,0.25)',
        gold:    '0 8px 30px -8px rgba(241,143,1,0.45)',
      },
      animation: {
        'fade-in':    'fadeIn 0.5s ease-out',
        'slide-up':   'slideUp 0.6s ease-out',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        shimmer:      'shimmer 2.4s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideUp: {
          '0%':   { opacity: 0, transform: 'translateY(24px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(241,143,1,0.6)' },
          '50%':      { boxShadow: '0 0 0 16px rgba(241,143,1,0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-800px 0' },
          '100%': { backgroundPosition:  '800px 0' },
        },
      },
      backgroundOpacity: {
        3: '0.03',
        8: '0.08',
      },
    },
  },
  plugins: [],
};