import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        paper: 'var(--paper)',
        navy: 'var(--navy)',
        emerald: 'var(--emerald)',
        error: 'var(--error)',
        'paper-2': 'var(--paper-2)',
        'navy-soft': 'var(--navy-soft)',
      },
      fontFamily: {
        sans: ['var(--font-schibsted)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-space-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        card: '14px',
      },
      boxShadow: {
        tactile: '0 2px 0 0 var(--navy)',
        'tactile-sm': '0 1px 0 0 var(--navy)',
      },
      keyframes: {
        pop: {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.04)' },
          '100%': { transform: 'scale(1)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        pop: 'pop 240ms ease-out',
        shake: 'shake 320ms ease-in-out',
        'fade-up': 'fade-up 220ms ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
