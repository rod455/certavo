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
        paper: 'rgb(var(--paper) / <alpha-value>)',
        'paper-2': 'rgb(var(--paper-2) / <alpha-value>)',
        navy: 'rgb(var(--navy) / <alpha-value>)',
        'navy-soft': 'rgb(var(--navy-soft) / <alpha-value>)',
        'navy-dark': 'rgb(var(--navy-dark) / <alpha-value>)',
        teal: 'rgb(var(--teal) / <alpha-value>)',
        'teal-strong': 'rgb(var(--teal-strong) / <alpha-value>)',
        'teal-soft': 'rgb(var(--teal-soft) / <alpha-value>)',
        error: 'rgb(var(--error) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-schibsted)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-space-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        card: '14px',
      },
      boxShadow: {
        tactile: '0 2px 0 0 rgb(var(--navy))',
        'tactile-sm': '0 1px 0 0 rgb(var(--navy))',
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
