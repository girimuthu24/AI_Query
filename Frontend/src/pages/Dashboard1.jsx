import { motion, AnimatePresence } from 'framer-motion';
import { FileSpreadsheet, BarChart3, Brain, PieChart, TableProperties, Clock,
         Hash, Lightbulb, FileText, Download, Eye, Trash2, RefreshCw,
         UploadCloud, CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import UploadZone from '../components/UploadZone';
import { useFileStore } from '../stores/useFileStore';
import { useAuth } from '../App';
import { canUploadFiles, canDeleteFile } from '../utils/permissions';

const fadeUp = (d = 0) => ({ initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.45, delay: d } });

const stagger = { initial: 'hidden', animate: 'visible', variants: { visible: { transition: { staggerChildren: 0.09 } } } };
const cardVar = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

/* ── Glass summary card ── */
function SummaryCard({ icon: Icon, title, value, sub, color }) {
  return (
    <motion.div variants={cardVar} whileHover={{ y: -5, boxShadow: `0 14px 36px ${color}28` }}
      onMouseEnter={e => e.currentTarget.style.borderColor = color + '55'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'}
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 18, padding: '20px 18px', position: 'relative', overflow: 'hidden', transition: 'border-color 0.2s', cursor: 'default' }}
    >
      <div style={{ width: 42, height: 42, borderRadius: 12, background: color + '18', border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        <Icon size={19} color={color} />
      </div>
      <p style={{ fontSize: 21, fontWeight: 800, color: '#fff', lineHeight: 1, marginBottom: 3 }}>{value}</p>
      <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2 }}>{title}</p>
      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)' }}>{sub}</p>
      <div style={{ position: 'absolute', top: -16, right: -16, width: 70, height: 70, borderRadius: '50%', background: color + '0E', filter: 'blur(18px)' }} />
    </motion.div>
  );
}

/* ── KPI pill ── */
function KpiPill({ icon: Icon, label, value, color }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${color}28`, borderRadius: 13, padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={15} color={color} />
      </div>
      <div>
        <p style={{ fontSize: 17, fontWeight: 800, color: '#fff' }}>{value}</p>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.42)', marginTop: 1 }}>{label}</p>
      </div>
    </div>
  );
}

/* ── SVG bar chart ── */
const BAR_DATA = [
  { label: 'Jan', h: 55 }, { label: 'Feb', h: 78 }, { label: 'Mar', h: 62 },
  { label: 'Apr', h: 88 }, { label: 'May', h: 71 }, { label: 'Jun', h: 100 },
];
function BarChart() {
  const W = 440, H = 150, PAD = 28, bw = 42, gap = (W - PAD * 2 - bw * 6) / 5;
  return (
    <svg viewBox={`0 0 ${W} ${H + 26}`} style={{ width: '100%', overflow: 'visible' }}>
      <defs>
        <linearGradient id="bg1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38BDF8" /><stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
      {[0, 33, 66, 100].map(v => (
        <line key={v} x1={PAD} x2={W - PAD} y1={H - v / 100 * H} y2={H - v / 100 * H} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      ))}
      {BAR_DATA.map(({ label, h }, i) => {
        const x = PAD + i * (bw + gap), bH = h / 100 * H, y = H - bH;
        return (
          <g key={label}>
            <motion.rect x={x} width={bw} rx={6} fill="url(#bg1)" opacity={0.85}
              initial={{ height: 0, y: H }} animate={{ height: bH, y }} transition={{ delay: 0.3 + i * 0.1, duration: 0.5, ease: 'easeOut' }} />
            <text x={x + bw / 2} y={H + 17} textAnchor="middle" fontSize="11" fill="rgba(255,255,255,0.38)">{label}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── AI Status indicator ── */
const STATUS_CFG = {
  Processing: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', icon: Loader2,       spin: true  },
  Completed:  { color: '#10B981', bg: 'rgba(16,185,129,0.12)', icon: CheckCircle2,  spin: false },
  Failed:     { color: '#EF4444', bg: 'rgba(239,68,68,0.11)',  icon: XCircle,       spin: false },
};
function AIStatus({ status }) {
  const c = STATUS_CFG[status] ?? STATUS_CFG.Processing;
  const Icon = c.icon;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: c.bg, border: `1px solid ${c.color}38`, fontSize: 11, fontWeight: 700, color: c.color, whiteSpace: 'nowrap' }}>
      <Icon size={11} style={{ animation: c.spin ? 'spin 1s linear infinite' : 'none' }} />{status}
    </span>
  );
}

/* ── File type icon colour ── */
const TYPE_COLOR = { '.xlsx': '#10B981', '.xls': '#10B981', '.csv': '#3B82F6', '.pdf': '#EF4444', '.pbix': '#8B5CF6' };
function FileIcon({ type }) {
  const color = TYPE_COLOR[type] ?? '#94A3B8';
  return (
    <div style={{ width: 36, height: 36, borderRadius: 9, background: color + '18', border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <FileText size={16} color={color} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Page
─────────────────────────────────────────────────────────────────────────── */
export default function Dashboard1() {
  const { files, addFile, clearAll, STATUS } = useFileStore();
  const { user } = useAuth();
  const role     = user?.role ?? 'user';

  const canUpload = canUploadFiles(role);
  const canDelete = canDeleteFile(role);

  const completed  = files.filter(f => f.status === STATUS.COMPLETED).length;
  const processing = files.filter(f => f.status === STATUS.PROCESSING).length;

  return (
    <div style={{ minHeight: '100vh', background: '#0B1120', padding: '88px 0 64px' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* Header */}
        <motion.div {...fadeUp(0)}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#3B82F6', marginBottom: 6 }}>Dashboard 1</p>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 4 }}>Upload Center</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>Upload your data files and get instant AI-powered analysis and insights.</p>
        </motion.div>

        {/* ── STEP 11: Upload zone ── */}
        <motion.div {...fadeUp(0.08)}>
          {canUpload ? (
            <UploadZone
              label="Upload Excel, CSV, PDF or Power BI Files"
              formats={['.xlsx', '.xls', '.csv', '.pdf', '.pbix']}
              accept=".xlsx,.xls,.csv,.pdf,.pbix"
              accentColor="#3B82F6"
              onFileAdded={addFile}
            />
          ) : (
            <div style={{ padding: '32px', borderRadius: 20, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', textAlign: 'center' }}>
              <AlertCircle size={28} color="#EF4444" style={{ margin: '0 auto 10px' }} />
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 600 }}>Upload requires Admin or Super Admin access.</p>
            </div>
          )}
        </motion.div>

        {/* Summary cards */}
        <motion.div {...stagger} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 14 }}>
          <SummaryCard icon={UploadCloud}    title="Total Uploads"    value={files.length}  sub="files in history"            color="#3B82F6" />
          <SummaryCard icon={CheckCircle2}   title="Completed"        value={completed}      sub="successfully analysed"       color="#10B981" />
          <SummaryCard icon={Brain}          title="AI Insights"      value="38"             sub="patterns & anomalies found"  color="#38BDF8" />
          <SummaryCard icon={PieChart}       title="Visualizations"   value="9"              sub="auto-generated chart types"  color="#8B5CF6" />
        </motion.div>

        {/* Analytics grid */}
        <motion.div {...fadeUp(0.2)} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr)', gap: 18 }}>
          {/* Bar chart */}
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '22px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <p style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>Monthly Uploads</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>Files processed per month</p>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#38BDF8', background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.22)', borderRadius: 20, padding: '3px 9px' }}>LIVE</span>
            </div>
            <BarChart />
          </div>

          {/* KPI pills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontWeight: 700, color: '#fff', fontSize: 14, marginBottom: 2 }}>Key Metrics</p>
            <KpiPill icon={TableProperties} label="Total Rows"      value="2,847"  color="#3B82F6" />
            <KpiPill icon={Hash}            label="Total Columns"   value="12"     color="#38BDF8" />
            <KpiPill icon={Lightbulb}       label="Insights Found"  value="38"     color="#8B5CF6" />
            <KpiPill icon={Clock}           label="Avg Process Time" value="1.4s"  color="#10B981" />
          </div>
        </motion.div>

        {/* ── STEP 12: File history table ── */}
        <motion.div {...fadeUp(0.28)}>
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, overflow: 'hidden' }}>

            {/* Table header */}
            <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>File History</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.38)', marginTop: 2 }}>
                  {files.length} file{files.length !== 1 ? 's' : ''}
                  {processing > 0 && <span style={{ color: '#F59E0B', marginLeft: 8 }}>· {processing} processing</span>}
                </p>
              </div>
              {canDelete && files.length > 0 && (
                <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  onClick={clearAll}
                  style={{ padding: '7px 14px', borderRadius: 9, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#EF4444', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Trash2 size={12} /> Clear All
                </motion.button>
              )}
            </div>

            {/* Column headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: 0, padding: '10px 22px', background: 'rgba(255,255,255,0.025)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['File Name', 'Type', 'Upload Date', 'Size', 'AI Status', ''].map(h => (
                <p key={h} style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.09em', textTransform: 'uppercase' }}>{h}</p>
              ))}
            </div>

            {/* Rows */}
            <div style={{ minHeight: 60 }}>
              <AnimatePresence>
                {files.length === 0 ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ padding: '36px', textAlign: 'center', color: 'rgba(255,255,255,0.28)', fontSize: 13 }}
                  >
                    No files uploaded yet. Drop a file above to get started.
                  </motion.div>
                ) : (
                  files.map((f, i) => (
                    <motion.div key={f.id}
                      initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 14 }}
                      transition={{ delay: i * 0.05 }}
                      style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: 0, alignItems: 'center', padding: '12px 22px', borderBottom: i < files.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none', transition: 'background 0.15s', cursor: 'default' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      {/* File name */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <FileIcon type={f.type} />
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</p>
                      </div>

                      {/* Type */}
                      <span style={{ fontSize: 11, fontWeight: 700, color: TYPE_COLOR[f.type] ?? '#94A3B8', background: (TYPE_COLOR[f.type] ?? '#94A3B8') + '18', border: `1px solid ${(TYPE_COLOR[f.type] ?? '#94A3B8')}30`, borderRadius: 20, padding: '2px 9px', width: 'fit-content' }}>{f.type}</span>

                      {/* Date */}
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{f.date}</p>

                      {/* Size */}
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{f.size}</p>

                      {/* AI Status */}
                      <AIStatus status={f.status} />

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 5 }}>
                        {[Eye, Download].map((Ic, j) => (
                          <button key={j}
                            style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.45)', transition: 'color 0.15s, background 0.15s' }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                          >
                            <Ic size={12} />
                          </button>
                        ))}
                        {f.status === 'Failed' && (
                          <button
                            style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#F59E0B' }}
                          >
                            <RefreshCw size={12} />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
