/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        nova: {
          bg: '#0f172a',
          bgSoft: '#111c34',
          panel: '#15213b',
          panelSoft: '#1a2745',
          line: '#24324f',
          text: '#e5eefb',
          muted: '#94a3b8',
          brandFrom: '#4f46e5',
          brandVia: '#2563eb',
          brandTo: '#7c3aed',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Sora', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        panel: '0 24px 60px rgba(2, 6, 23, 0.42)',
        glow: '0 12px 40px rgba(59, 130, 246, 0.22)',
        inset: 'inset 0 1px 0 rgba(255,255,255,0.08)',
        'glow-brand': '0 0 24px rgba(168,85,247,0.35), 0 0 48px rgba(168,85,247,0.14)',
        'glow-fuchsia': '0 0 20px rgba(236,72,153,0.32)',
        'glass-hover': '0 28px 80px rgba(71,85,105,0.18), 0 0 0 1px rgba(255,255,255,0.45)',
      },
      backgroundSize: {
        '300%': '300%',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'typing': 'typing 1.5s steps(3, end) infinite',
        'voice-ring': 'voiceRing 1.4s ease-in-out infinite',
        'shimmer': 'shimmer 2.4s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow-pulse': 'glowPulse 3s ease-in-out infinite',
        'micro-bounce': 'microBounce 0.38s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(10px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        typing: { '0%, 100%': { opacity: '0.2' }, '50%': { opacity: '1' } },
        voiceRing: {
          '0%': { transform: 'scale(0.94)', opacity: '0.65' },
          '50%': { transform: 'scale(1.06)', opacity: '1' },
          '100%': { transform: 'scale(0.94)', opacity: '0.65' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.5', filter: 'blur(18px)' },
          '50%': { opacity: '0.85', filter: 'blur(22px)' },
        },
        microBounce: {
          '0%, 100%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.18)' },
          '70%': { transform: 'scale(0.94)' },
        },
      },
    },
  },
  plugins: [],
};
