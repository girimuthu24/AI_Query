/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',

  theme: {
    extend: {
      /* ── Design-system palette ── */
      colors: {
        /* Step 1 spec */
        blue:    { DEFAULT: '#3B82F6', dark: '#2563EB', light: '#60A5FA' },
        cyan:    { DEFAULT: '#06B6D4', dark: '#0891B2', light: '#38BDF8' },
        purple:  { DEFAULT: '#8B5CF6', dark: '#7C3AED', light: '#A78BFA' },
        emerald: { DEFAULT: '#10B981', dark: '#059669', light: '#34D399' },
        /* extended surface tokens */
        navy:    '#0B1120',
        slate:   { 900: '#0F172A', 800: '#1E293B', 700: '#334155', 600: '#475569' },
        'light-bg': '#F8FAFC',
      },

      /* ── Typography ── */
      fontFamily: {
        sans:    ["'Inter'", 'system-ui', 'sans-serif'],
        display: ["'Poppins'", "'Inter'", 'sans-serif'],
      },

      /* ── Shadow tokens ── */
      boxShadow: {
        'glow-blue':    '0 0 20px rgba(59,130,246,0.45), 0 0 40px rgba(59,130,246,0.2)',
        'glow-cyan':    '0 0 20px rgba(6,182,212,0.45),  0 0 40px rgba(6,182,212,0.2)',
        'glow-purple':  '0 0 20px rgba(139,92,246,0.45), 0 0 40px rgba(139,92,246,0.2)',
        'glow-emerald': '0 0 20px rgba(16,185,129,0.45), 0 0 40px rgba(16,185,129,0.2)',
        'card':         '0 4px 24px rgba(0,0,0,0.35)',
        'card-hover':   '0 8px 40px rgba(0,0,0,0.5)',
        'panel':        '0 24px 80px rgba(0,0,0,0.6)',
      },

      /* ── Border radius tokens ── */
      borderRadius: {
        card:  '20px',
        panel: '28px',
        pill:  '9999px',
      },

      /* ── Animations ── */
      animation: {
        'float':         'float 6s ease-in-out infinite',
        'float-slow':    'floatSlow 9s ease-in-out infinite',
        'pulse-glow':    'pulseGlow 2.5s ease-in-out infinite',
        'gradient-x':    'gradientX 12s ease infinite',
        'spin-slow':     'spin 10s linear infinite',
        'fade-up':       'fadeUp 0.55s cubic-bezier(0.22,1,0.36,1) forwards',
        'slide-right':   'slideRight 0.5s cubic-bezier(0.22,1,0.36,1) forwards',
        'scan-line':     'scanLine 2s ease-in-out infinite alternate',
        'particle-drift':'particleDrift linear infinite',
        'ray-move':      'rayMove 8s ease-in-out infinite',
        'zoom-bg':       'zoomBg 20s ease-in-out infinite alternate',
      },

      keyframes: {
        float:        { '0%,100%':{ transform:'translateY(0)' }, '50%':{ transform:'translateY(-18px)' } },
        floatSlow:    { '0%,100%':{ transform:'translateY(0)' }, '50%':{ transform:'translateY(-12px)' } },
        pulseGlow:    { '0%,100%':{ boxShadow:'0 0 14px rgba(59,130,246,0.4)' }, '50%':{ boxShadow:'0 0 34px rgba(6,182,212,0.7)' } },
        gradientX:    { '0%,100%':{ backgroundPosition:'0% 50%' }, '50%':{ backgroundPosition:'100% 50%' } },
        fadeUp:       { from:{ opacity:0, transform:'translateY(28px)' }, to:{ opacity:1, transform:'translateY(0)' } },
        slideRight:   { from:{ opacity:0, transform:'translateX(60px)' }, to:{ opacity:1, transform:'translateX(0)' } },
        scanLine:     { '0%':{ top:'5%', opacity:1 }, '100%':{ top:'92%', opacity:0.3 } },
        particleDrift:{ '0%':{ transform:'translateY(0) rotate(0deg)', opacity:0 }, '10%':{ opacity:1 }, '90%':{ opacity:0.6 }, '100%':{ transform:'translateY(-100vh) rotate(720deg)', opacity:0 } },
        rayMove:      { '0%,100%':{ opacity:0.3, transform:'rotate(-5deg) scaleY(1)' }, '50%':{ opacity:0.7, transform:'rotate(5deg) scaleY(1.2)' } },
        zoomBg:       { '0%':{ transform:'scale(1)' }, '100%':{ transform:'scale(1.08)' } },
      },

      backgroundSize: { '300': '300% 300%' },
      backdropBlur:   { xs: '4px' },
    },
  },

  plugins: [],
};
