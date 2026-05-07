import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Healthcare intelligence palette
        medical: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
          800: '#075985',
          900: '#0C4A6E',
        },
        clinical: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
        vital: {
          50: '#FEF3C7',
          100: '#FDE68A',
          200: '#FCD34D',
          300: '#FBBF24',
          400: '#F59E0B',
          500: '#D97706',
          600: '#B45309',
          700: '#92400E',
          800: '#78350F',
          900: '#451A03',
        },
        emergency: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
        },
        success: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
        },
        // Enhanced brand colors
        brand: {
          50: '#E6F3F2',
          100: '#BDDEDD',
          200: '#94C9C7',
          300: '#6AB4B1',
          400: '#3D9F9A',
          500: '#007A74',
          600: '#006661',
          700: '#00524E',
          800: '#003D3A',
          900: '#002927',
        },
        navy: {
          700: '#1A3258',
          800: '#112040',
          900: '#0A1628',
          950: '#06101E',
        },
      },
      boxShadow: {
        'medical-soft': '0 8px 32px rgba(0, 122, 116, 0.12)',
        'medical-glow': '0 0 24px rgba(0, 122, 116, 0.15)',
        'clinical-card': '0 4px 20px rgba(30, 41, 59, 0.08), 0 1px 4px rgba(30, 41, 59, 0.04)',
        'clinical-card-hover': '0 8px 32px rgba(30, 41, 59, 0.12), 0 2px 8px rgba(30, 41, 59, 0.08)',
        'vital-glow': '0 0 20px rgba(239, 68, 68, 0.2)',
        'success-glow': '0 0 20px rgba(34, 197, 94, 0.2)',
        'intelligence': '0 0 32px rgba(0, 122, 116, 0.25)',
        'emergency': '0 0 32px rgba(239, 68, 68, 0.3)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-left': {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(0, 122, 116, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(0, 122, 116, 0)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-3px)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'heartbeat': {
          '0%, 100%': { transform: 'scale(1)' },
          '25%': { transform: 'scale(1.1)' },
          '50%': { transform: 'scale(1)' },
        },
        'scan': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(200%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-in-left': 'slide-in-left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-in-right': 'slide-in-right 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        'scale-in': 'scale-in 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        'pulse-glow': 'pulse-glow 2s infinite',
        'float': 'float 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s infinite',
        'heartbeat': 'heartbeat 1.5s ease-in-out infinite',
        'scan': 'scan 3s linear infinite',
      },
      fontFamily: {
        'medical': ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        'display': ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'medical-xs': ['0.65rem', { lineHeight: '1rem', letterSpacing: '0.04em' }],
        'medical-sm': ['0.75rem', { lineHeight: '1.25rem', letterSpacing: '0.025em' }],
        'medical-base': ['0.875rem', { lineHeight: '1.5rem', letterSpacing: '0em' }],
        'medical-lg': ['1rem', { lineHeight: '1.75rem', letterSpacing: '-0.025em' }],
        'medical-xl': ['1.25rem', { lineHeight: '2rem', letterSpacing: '-0.025em' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'medical': '0.75rem',
        'clinical': '0.5rem',
      },
      backdropBlur: {
        'medical': '12px',
      },
    },
  },
  plugins: [],
};

export default config;
