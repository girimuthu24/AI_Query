import { motion } from 'framer-motion';
import { FileText, Brain, Tag, Percent, TableProperties, Layers, TrendingUp, AlertTriangle, Star } from 'lucide-react';
import UploadZone from '../components/UploadZone';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: 'easeOut' },
});

const stagger = {
  initial: 'hidden',
  animate: 'visible',
  variants: { visible: { transition: { staggerChildren: 0.1 } } },
};
const cardVar = {
  hidden:  { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

function GlassCard({ icon: Icon, title, value, sub, color }) {
  return (
    <motion.div
      variants={cardVar}
      whileHover={{ y: -6, boxShadow: `0 16px 40px ${color}33` }}
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '22px 20px', cursor: 'default', transition: 'border-color 0.25s', position: 'relative', overflow: 'hidden' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = color + '66'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
    >
      <div style={{ width: 44, height: 44, borderRadius: 14, background: color + '1A', border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <Icon size={20} color={color} />
      </div>
      <p style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.1, marginBottom: 4 }}>{value}</p>
      <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{title}</p>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{sub}</p>
      <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: color + '10', filter: 'blur(20px)' }} />
    </motion.div>
  );
}

function KpiPill({ icon: Icon, label, value, color }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${color}33`, borderRadius: 14, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={16} color={color} />
      </div>
      <div>
        <p style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{value}</p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>{label}</p>
      </div>
    </div>
  );
}

/* ── Data Table ── */
const TABLE_HEADERS = ['Customer ID', 'Category', 'Revenue ($)', 'Status'];
const TABLE_ROWS = [
  ['CUS-00412', 'Sales',     '$14,820', 'Active'],
  ['CUS-00389', 'Marketing', '$9,340',  'Pending'],
  ['CUS-00501', 'Operations','$21,650', 'Active'],
  ['CUS-00278', 'Finance',   '$7,120',  'Closed'],
  ['CUS-00614', 'Sales',     '$18,940', 'Active'],
];
const STATUS_COLOR = { Active: '#10B981', Pending: '#F59E0B', Closed: '#EF4444' };

function DataTable() {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px' }}>
        <thead>
          <tr>
            {TABLE_HEADERS.map(h => (
              <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#06B6D4', background: 'rgba(6,182,212,0.1)', borderBottom: '1px solid rgba(6,182,212,0.25)', whiteSpace: 'nowrap' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TABLE_ROWS.map((row, i) => (
            <motion.tr
              key={i}
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.07 }}
              style={{ cursor: 'default' }}
              onMouseEnter={e => { Array.from(e.currentTarget.querySelectorAll('td')).forEach(td => td.style.background = 'rgba(56,189,248,0.06)'); }}
              onMouseLeave={e => { Array.from(e.currentTarget.querySelectorAll('td')).forEach(td => td.style.background = 'rgba(255,255,255,0.025)'); }}
            >
              {row.map((cell, j) => (
                <td key={j} style={{ padding: '10px 14px', fontSize: 13, color: j === 0 ? 'rgba(255,255,255,0.6)' : '#fff', background: 'rgba(255,255,255,0.025)', borderRadius: j === 0 ? '8px 0 0 8px' : j === row.length - 1 ? '0 8px 8px 0' : 0, transition: 'background 0.15s', whiteSpace: 'nowrap' }}>
                  {j === row.length - 1 ? (
                    <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLOR[cell] ?? '#fff', background: (STATUS_COLOR[cell] ?? '#fff') + '18', border: `1px solid ${(STATUS_COLOR[cell] ?? '#fff')}33`, borderRadius: 20, padding: '2px 9px' }}>{cell}</span>
                  ) : cell}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ── Insight pills ── */
const INSIGHTS = [
  { icon: TrendingUp,    label: 'Revenue trend detected',  desc: 'Sales revenue up 18.4% over last 30 days',    color: '#10B981' },
  { icon: AlertTriangle, label: 'Anomaly on row 47',       desc: 'Outlier value $0.00 — likely data entry error', color: '#F59E0B' },
  { icon: Star,          label: 'Top category: Sales',     desc: 'Sales accounts for 62% of total revenue',      color: '#38BDF8' },
];

/* ── page ── */
export default function Dashboard2() {
  return (
    <div style={{ minHeight: '100vh', background: '#0B1120', padding: '32px 0 64px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* Page title */}
        <motion.div {...fadeUp(0)}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#06B6D4', marginBottom: 6 }}>Dashboard 2</p>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 6 }}>CSV & PDF Intelligence</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>Extract structured data and AI summaries from CSV spreadsheets and PDF documents.</p>
        </motion.div>

        {/* Upload zone */}
        <motion.div {...fadeUp(0.1)}>
          <UploadZone
            label="Upload CSV or PDF Files"
            formats={['.csv', '.pdf']}
            accept=".csv,.pdf"
            accentColor="#06B6D4"
          />
        </motion.div>

        {/* Dashboard cards */}
        <motion.div {...stagger} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <GlassCard icon={TableProperties} title="CSV Analytics"      value="5,120"  sub="records · 8 columns parsed"      color="#06B6D4" />
          <GlassCard icon={FileText}        title="PDF Intelligence"   value="8"      sub="pages · 24 paragraphs extracted" color="#7C3AED" />
          <GlassCard icon={Brain}           title="AI Summary"         value="97%"    sub="confidence on extracted data"    color="#38BDF8" />
          <GlassCard icon={Layers}          title="Data Visualization" value="6"      sub="auto-generated visualizations"   color="#2563EB" />
        </motion.div>

        {/* Data table + KPIs */}
        <motion.div {...fadeUp(0.25)} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr)', gap: 20 }}>

          {/* Table */}
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 20, padding: '24px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <p style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>Extracted Data Preview</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>First 5 rows · 4 columns</p>
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#06B6D4', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)', borderRadius: 20, padding: '3px 10px' }}>5,120 rows</span>
            </div>
            <DataTable />
          </div>

          {/* KPI cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontWeight: 700, color: '#fff', fontSize: 15, marginBottom: 4 }}>Key Metrics</p>
            <KpiPill icon={TableProperties} label="Records Found"    value="5,120"  color="#06B6D4" />
            <KpiPill icon={FileText}        label="Pages Extracted"  value="8"      color="#7C3AED" />
            <KpiPill icon={Tag}             label="AI Tags"          value="142"    color="#38BDF8" />
            <KpiPill icon={Percent}         label="Confidence Score" value="97.3%"  color="#10B981" />
          </div>
        </motion.div>

        {/* Extracted Insights */}
        <motion.div {...fadeUp(0.35)} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 20, padding: '24px 22px' }}>
          <p style={{ fontWeight: 700, color: '#fff', fontSize: 15, marginBottom: 18 }}>Extracted Insights</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {INSIGHTS.map(({ icon: Icon, label, desc, color }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                whileHover={{ x: 4 }}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 14, background: color + '0D', border: `1px solid ${color}2A`, cursor: 'default' }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: color + '20', border: `1px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={16} color={color} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{label}</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{desc}</p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color, background: color + '18', border: `1px solid ${color}33`, borderRadius: 20, padding: '3px 10px', flexShrink: 0, whiteSpace: 'nowrap' }}>AI Detected</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
