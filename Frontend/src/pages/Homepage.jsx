import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { BarChart3, Database, Upload, Zap, Shield, Globe, ArrowRight, Play, Brain } from 'lucide-react';
import { Link } from 'react-router-dom';

// KPI stat card — displayed in a 3-column flex row, fully aligned
function KPICard({ label, value, trend, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6 }}
      className="glass-card"
      whileHover={{ scale: 1.04, boxShadow: `0 12px 32px ${color}33` }}
      style={{ padding: '16px 20px', flex: '1 1 0', minWidth: 0 }}
    >
      <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 4 + delay, repeat: Infinity, ease: 'easeInOut', delay }}>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 500, marginBottom: 4 }}>{label}</p>
        <p style={{ fontSize: 22, fontWeight: 900, color: '#fff', lineHeight: 1.1, textShadow: `0 0 15px ${color}`, marginBottom: 3 }}>{value}</p>
        <p style={{ fontSize: 11, fontWeight: 700, color }}>{trend}</p>
      </motion.div>
    </motion.div>
  );
}

// Animated mini bar chart
function MiniChart({ data, color }) {
  return (
    <div className="flex items-end gap-1 h-12">
      {data.map((h, i) => (
        <motion.div
          key={i}
          initial={{ height: 0 }} animate={{ height: `${h}%` }}
          transition={{ delay: 0.8 + i * 0.08, duration: 0.5, ease: 'easeOut' }}
          style={{ flex: 1, borderRadius: 3, background: `linear-gradient(to top, ${color}, ${color}88)`, minWidth: 6 }}
        />
      ))}
    </div>
  );
}

// Feature card
function FeatureCard({ icon: Icon, title, desc, color, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ delay, duration: 0.5 }}
      whileHover={{ y: -8, boxShadow: `0 20px 40px ${color}22` }}
      className="glass-card-light p-6 group cursor-pointer"
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
    >
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-all group-hover:scale-110"
        style={{ background: `${color}22`, border: `1px solid ${color}44` }}>
        <Icon size={22} style={{ color }} />
      </div>
      <h3 className="font-bold text-white mb-2 text-base">{title}</h3>
      <p className="text-sm text-white/50 leading-relaxed">{desc}</p>
    </motion.div>
  );
}

const features = [
  { icon: Brain,    title: 'AI-Powered Insights',   desc: 'Natural language queries convert to instant analytics with GPT-level intelligence.',   color: '#38BDF8', delay: 0   },
  { icon: BarChart3,title: 'Real-time Dashboards',  desc: 'Live data visualization with interactive Power BI-style charts and KPIs.',             color: '#2563EB', delay: 0.1 },
  { icon: Database, title: 'Multi-Source Fusion',   desc: 'Connect Excel, CSV, PDF, Power BI, and 100+ enterprise data sources.',                 color: '#7C3AED', delay: 0.2 },
  { icon: Shield,   title: 'Enterprise Security',   desc: 'SOC2 Type II, ISO 27001, end-to-end encryption and RBAC access control.',              color: '#06B6D4', delay: 0.3 },
  { icon: Zap,      title: 'Instant Processing',    desc: 'Sub-second query responses powered by distributed cloud compute engines.',             color: '#F59E0B', delay: 0.4 },
  { icon: Globe,    title: 'Global Scale',           desc: 'Multi-region deployment, 99.99% uptime SLA, serving 10,000+ enterprises.',            color: '#10B981', delay: 0.5 },
];

const stats = [
  { value: '10K+',   label: 'Enterprise Clients'  },
  { value: '99.99%', label: 'Uptime SLA'           },
  { value: '2.5B+',  label: 'Queries Processed'   },
  { value: '<0.2s',  label: 'Avg Response Time'   },
];

export default function Homepage() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY       = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div style={{ background: '#0B1120' }}>

      {/* ── HERO ── */}
      <section ref={heroRef} style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center' }}>

        {/* Background */}
        <motion.div
          className="animate-zoom-bg"
          style={{
            position: 'absolute', inset: 0, y: heroY,
            background: `
              radial-gradient(circle at top left, rgba(37,99,235,0.3), transparent 40%),
              radial-gradient(circle at bottom right, rgba(124,58,237,0.25), transparent 40%),
              linear-gradient(135deg, #0B1120 0%, #172554 40%, #1E3A8A 70%, #2563EB 100%)
            `,
          }}
        />

        {/* Light rays */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, overflow: 'hidden' }}>
          {[10, 25, 45, 65, 80].map((left, i) => (
            <div key={i} className="light-ray" style={{ left: `${left}%`, height: '60vh', top: 0, animationDelay: `${i * 1.8}s`, opacity: 0.4 }} />
          ))}
        </div>

        {/* Hero content */}
        <motion.div style={{ opacity: heroOpacity, width: '100%', position: 'relative', zIndex: 10 }}>
          <div style={{ maxWidth: 1400, margin: '0 auto', padding: '96px 24px 64px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 48, alignItems: 'center' }}>

            {/* LEFT — copy */}
            <div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-electric mb-6"
                style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.25)' }}
              >
                <Zap size={12} /> Enterprise AI Analytics Platform
              </motion.div>

              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="text-sm font-bold tracking-[0.25em] uppercase text-electric/70 mb-3">DATA QUERY AI</motion.p>

              <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="text-4xl sm:text-5xl xl:text-6xl font-black text-white leading-[1.08] mb-6">
                Transform Raw Data Into{' '}
                <span className="text-gradient">Intelligent Decisions</span>
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                className="text-base sm:text-lg text-white/55 leading-relaxed mb-8 max-w-lg">
                Upload any data source — Excel, CSV, PDF, Power BI — and get instant AI-driven insights, natural language queries, and real-time dashboards. No code required.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
                className="flex flex-wrap gap-3 mb-10">
                <Link to="/dashboard" className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm text-white transition-all btn-royal" style={{ width: 'auto' }}>
                  Get Started <ArrowRight size={16} />
                </Link>
                <Link to="/dashboard" className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm text-white/80 hover:text-white glass-card transition-all">
                  <Upload size={16} /> Upload Files
                </Link>
                <button className="flex items-center gap-2 px-5 py-3.5 rounded-xl font-semibold text-sm text-white/60 hover:text-white transition-colors">
                  <Play size={14} className="fill-current" /> Watch Demo
                </button>
              </motion.div>

              {/* Trust badges */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
                className="flex flex-wrap gap-4">
                {['SOC2 Certified', 'ISO 27001', 'GDPR Ready', 'HIPAA Compliant'].map(badge => (
                  <span key={badge} className="text-[11px] font-semibold text-white/35 flex items-center gap-1.5">
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} /> {badge}
                  </span>
                ))}
              </motion.div>
            </div>

            {/* RIGHT — Dashboard preview + KPI cards */}
            <motion.div initial={{ opacity: 0, x: 40, rotateY: 15 }} animate={{ opacity: 1, x: 0, rotateY: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }} style={{ perspective: 1000 }}
            >
              <motion.div whileHover={{ rotateY: -3, rotateX: 2 }} transition={{ type: 'spring', stiffness: 200 }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Main dashboard card */}
                <div className="glass-card p-5" style={{ background: 'rgba(11,17,32,0.8)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {/* Topbar */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        {['#EF4444', '#F59E0B', '#10B981'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
                      </div>
                      <p className="text-xs text-white/40 font-mono ml-2">DQai Analytics Dashboard</p>
                    </div>
                    <div className="flex gap-2">
                      <div className="px-2 py-1 rounded text-[10px] font-semibold text-electric" style={{ background: 'rgba(56,189,248,0.1)' }}>LIVE</div>
                      <div className="w-2 h-2 rounded-full bg-green-400 mt-1 animate-pulse" />
                    </div>
                  </div>

                  {/* Charts grid */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="glass-card p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <p className="text-[10px] text-white/40 mb-1 font-semibold">REVENUE TREND</p>
                      <MiniChart data={[40, 65, 50, 80, 60, 90, 75, 100, 85]} color="#2563EB" />
                    </div>
                    <div className="glass-card p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <p className="text-[10px] text-white/40 mb-1 font-semibold">AI QUERIES</p>
                      <MiniChart data={[30, 50, 70, 45, 85, 60, 95, 70, 100]} color="#7C3AED" />
                    </div>
                  </div>

                  {/* KPI row */}
                  <div className="grid grid-cols-3 gap-2">
                    {[{ l: 'Datasets', v: '2,847', c: '#38BDF8' }, { l: 'Queries', v: '14.2K', c: '#7C3AED' }, { l: 'Accuracy', v: '99.8%', c: '#10B981' }].map(({ l, v, c }) => (
                      <div key={l} className="glass-card p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <p className="text-sm font-black text-white" style={{ textShadow: `0 0 12px ${c}` }}>{v}</p>
                        <p className="text-[9px] text-white/40">{l}</p>
                      </div>
                    ))}
                  </div>

                  {/* AI insight strip */}
                  <motion.div className="mt-3 glass-card px-3 py-2 flex items-center gap-2"
                    style={{ background: 'rgba(37,99,235,0.1)', borderColor: 'rgba(37,99,235,0.3)' }}
                    animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Brain size={13} color="#60A5FA" />
                    <p className="text-[11px] text-blue-300">AI: Revenue up 23% YoY — accelerate Q3 campaigns</p>
                  </motion.div>
                </div>

                {/* ── KPI stats: 3 cards perfectly aligned in one row ── */}
                <div style={{ display: 'flex', gap: 12, marginTop: 16, width: '100%' }}>
                  <KPICard label="Total Revenue" value="$4.2M"  trend="↑ 23%"  color="#10B981" delay={0.8} />
                  <KPICard label="Active Users"  value="12,847" trend="↑ 8.3%" color="#38BDF8" delay={1.0} />
                  <KPICard label="AI Insights"   value="847"    trend="Today"  color="#7C3AED" delay={1.2} />
                </div>
              </motion.div>
            </motion.div>

          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
          animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }}
        >
          <p className="text-xs text-white/30 font-medium tracking-widest uppercase">Scroll</p>
          <div style={{ width: 24, height: 38, border: '1.5px solid rgba(255,255,255,0.2)', borderRadius: 12, display: 'flex', justifyContent: 'center', paddingTop: 6 }}>
            <motion.div style={{ width: 4, height: 8, borderRadius: 2, background: '#38BDF8' }} animate={{ y: [0, 12, 0], opacity: [1, 0, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
          </div>
        </motion.div>
      </section>

      {/* ── STATS ── */}
      <section className="py-16 relative z-10" style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px' }} className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(({ value, label }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center">
              <p className="text-3xl sm:text-4xl font-black text-gradient mb-1">{value}</p>
              <p className="text-sm text-white/40 font-medium">{label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 relative z-10">
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <p className="text-xs font-bold tracking-widest uppercase text-electric/60 mb-3">Platform Capabilities</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Everything You Need to <span className="text-gradient">Dominate Data</span></h2>
            <p className="text-white/50 max-w-xl mx-auto text-base">Enterprise-grade AI analytics powered by the world's most advanced language models and data processing engines.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(f => <FeatureCard key={f.title} {...f} />)}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 relative z-10">
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px' }} className="text-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            className="glass-card p-12" style={{ background: 'linear-gradient(135deg, rgba(37,99,235,0.15), rgba(124,58,237,0.15))', border: '1px solid rgba(56,189,248,0.2)', maxWidth: 900, margin: '0 auto' }}
          >
            <p className="text-xs font-bold tracking-widest uppercase text-electric/60 mb-4">Ready to Transform?</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Start Your AI Analytics Journey</h2>
            <p className="text-white/50 mb-8 max-w-lg mx-auto">Join 10,000+ enterprises already making smarter decisions with DQai. Free trial, no credit card required.</p>
            <div className="flex justify-center gap-4 flex-wrap">
              <Link to="/register" className="flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-white btn-royal" style={{ width: 'auto' }}>
                Start Free Trial <ArrowRight size={16} />
              </Link>
              <Link to="/dashboard" className="flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-white/70 hover:text-white glass-card transition-all">
                <BarChart3 size={16} /> View Demo
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

    </div>
  );
}
