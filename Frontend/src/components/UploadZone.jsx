import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, CheckCircle, XCircle, File, X, CloudUpload } from 'lucide-react';

const ACCEPTED_TYPES = ['.xlsx', '.xls', '.csv', '.pdf', '.pbix'];

export default function UploadZone({
  label       = 'Upload Files',
  formats     = ACCEPTED_TYPES,
  accept      = '.xlsx,.xls,.csv,.pdf,.pbix',
  accentColor = '#3B82F6',
  onFileAdded,          // callback(File) — called when upload completes
}) {
  const [dragOver, setDragOver] = useState(false);
  const [file,     setFile]     = useState(null);
  const [error,    setError]    = useState('');
  const [progress, setProgress] = useState(0);
  const [status,   setStatus]   = useState('idle'); // idle|uploading|done|error
  const inputRef  = useRef(null);
  const timerRef  = useRef(null);

  const validExt = formats.map(f => f.toLowerCase());
  const glow     = accentColor + '44';

  const startUpload = useCallback((f) => {
    const ext = '.' + f.name.split('.').pop().toLowerCase();
    if (!validExt.includes(ext)) {
      setError(`"${ext}" is not supported. Accepted: ${formats.join('  ')}`);
      setStatus('error'); setFile(null); return;
    }
    setError(''); setFile(f); setStatus('uploading'); setProgress(0);
    let p = 0;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      p += Math.random() * 16 + 6;
      if (p >= 100) {
        clearInterval(timerRef.current);
        setProgress(100);
        setTimeout(() => {
          setStatus('done');
          onFileAdded?.(f);            // notify parent
        }, 280);
      } else {
        setProgress(Math.min(Math.round(p), 99));
      }
    }, 100);
  }, [validExt, formats, onFileAdded]);

  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) startUpload(f);
  };
  const onInputChange = (e) => {
    const f = e.target.files[0];
    if (f) startUpload(f);
    e.target.value = '';
  };
  const reset = () => {
    clearInterval(timerRef.current);
    setFile(null); setProgress(0); setStatus('idle'); setError('');
  };

  return (
    <motion.div
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      onClick={() => (status === 'idle' || status === 'error') && inputRef.current?.click()}
      animate={{
        borderColor: dragOver        ? accentColor
                   : status === 'done'  ? '#10B981'
                   : status === 'error' ? '#EF4444'
                   : 'rgba(59,130,246,0.30)',
        boxShadow: dragOver        ? `0 0 32px ${glow}`
                 : status === 'done'  ? '0 0 22px rgba(16,185,129,0.25)'
                 : 'none',
        scale: dragOver ? 1.012 : 1,
      }}
      transition={{ duration: 0.18 }}
      style={{
        border: '2px dashed rgba(59,130,246,0.30)',
        borderRadius: 20,
        background: dragOver ? `${accentColor}0A` : 'rgba(255,255,255,0.03)',
        padding: '44px 28px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
        cursor: status === 'uploading' ? 'default' : 'pointer',
        position: 'relative', overflow: 'hidden',
        transition: 'background 0.2s',
      }}
    >
      <input ref={inputRef} type="file" accept={accept} style={{ display: 'none' }} onChange={onInputChange} />

      <AnimatePresence mode="wait">

        {/* ── DONE ── */}
        {status === 'done' && (
          <motion.div key="done" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}
          >
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.05 }}
              style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '2px solid #10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <CheckCircle size={30} color="#10B981" />
            </motion.div>
            <p style={{ fontWeight: 700, fontSize: 14, color: '#10B981' }}>Upload Complete</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', maxWidth: 260, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file?.name}</p>
            <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
              onClick={e => { e.stopPropagation(); reset(); }}
              style={{ padding: '7px 18px', borderRadius: 9, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.13)', color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <X size={12} /> Upload Another
            </motion.button>
          </motion.div>
        )}

        {/* ── UPLOADING ── */}
        {status === 'uploading' && (
          <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ width: '100%', maxWidth: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <File size={18} color={accentColor} />
              <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>{file?.name}</p>
            </div>
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>
                <span>Uploading…</span><span>{progress}%</span>
              </div>
              <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.08 }}
                  style={{ height: '100%', borderRadius: 999, background: `linear-gradient(90deg,${accentColor},#38BDF8)` }} />
              </div>
            </div>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>AI processing will begin automatically…</p>
          </motion.div>
        )}

        {/* ── IDLE / ERROR ── */}
        {(status === 'idle' || status === 'error') && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center' }}
          >
            {/* animated cloud icon */}
            <motion.div animate={{ y: [0, -7, 0] }} transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
              style={{ width: 64, height: 64, borderRadius: '50%', background: `${accentColor}16`, border: `1.5px solid ${accentColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <CloudUpload size={28} color={accentColor} />
            </motion.div>

            <div>
              <p style={{ fontWeight: 700, fontSize: 15, color: '#fff', marginBottom: 4 }}>{label}</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Drag & drop your file here, or click to browse</p>
            </div>

            {/* format pills */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
              {formats.map(f => (
                <span key={f} style={{ padding: '3px 10px', borderRadius: 20, background: `${accentColor}18`, border: `1px solid ${accentColor}33`, color: accentColor, fontSize: 11, fontWeight: 700 }}>{f}</span>
              ))}
            </div>

            <motion.button whileHover={{ scale: 1.04, boxShadow: `0 6px 20px ${glow}` }} whileTap={{ scale: 0.96 }}
              onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}
              style={{ padding: '10px 26px', borderRadius: 10, background: `linear-gradient(135deg,${accentColor},#38BDF8)`, border: 'none', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Browse Files
            </motion.button>

            {status === 'error' && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 9, background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.25)' }}
              >
                <XCircle size={14} color="#EF4444" />
                <p style={{ fontSize: 12, color: '#FCA5A5' }}>{error}</p>
              </motion.div>
            )}
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  );
}
