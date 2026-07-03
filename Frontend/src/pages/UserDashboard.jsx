import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Brain, Upload, FileText, Trash2, Eye, LogOut, User, MessageSquare } from 'lucide-react';
import { useAuth } from '../App';
import { uploadFile, getUploadPreview, clearUpload, runAIQuery } from '../services/fileService';

const ACCEPTED = ['.xlsx', '.xls', '.csv', '.pdf', '.pbix'];
const TYPE_COLOR = { '.xlsx': '#10B981', '.xls': '#10B981', '.csv': '#3B82F6', '.pdf': '#EF4444', '.pbix': '#8B5CF6' };

function Toast({ toast }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20 }}
          style={{ position: 'fixed', top: 80, right: 24, zIndex: 100, padding: '12px 20px', borderRadius: 12, background: toast.type === 'error' ? 'rgba(239,68,68,0.9)' : 'rgba(16,185,129,0.9)', color: '#fff', fontWeight: 600, fontSize: 14, boxShadow: '0 8px 24px rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)' }}
        >{toast.msg}</motion.div>
      )}
    </AnimatePresence>
  );
}

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const mainRef = useRef(null);

  const [files, setFiles]       = useState([]); // { id, name, type, size, sessionId, preview }
  const [active, setActive]     = useState(null);
  const [prompt, setPrompt]     = useState('');
  const [aiResult, setAiResult] = useState('');
  const [querying, setQuerying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast]       = useState(null);
  const [navTab, setNavTab]     = useState('upload');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination]   = useState(null);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  const ext = (name) => name.slice(name.lastIndexOf('.')).toLowerCase();

  const navigateTo = (tab) => {
    setNavTab(tab);
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  };

  const handleFiles = async (fileList) => {
    setUploading(true);
    const fileArray = Array.from(fileList);

    for (const file of fileArray) {
      const e = ext(file.name);
      if (!ACCEPTED.includes(e)) {
        showToast(`❌ ${file.name}: unsupported format`, 'error');
        continue;
      }

      try {
        // 1. Upload file to backend
        const response = await uploadFile(file);
        const data = response.data;

        // 2. Add to local file list with session_id from backend
        const newFile = {
          id:        data.id || Date.now() + Math.random(),
          name:      data.filename || file.name,
          type:      e,
          size:      (file.size / 1024).toFixed(1) + ' KB',
          sessionId: data.session_id,
          rows:      data.rows_count,
          cols:      data.columns_count,
          preview:   null,
        };
        setFiles(prev => [...prev, newFile]);
        showToast(`✅ ${file.name} uploaded (${data.rows_count || '?'} rows)`);
      } catch (err) {
        const msg = err.response?.data?.detail || err.message || 'Upload failed';
        showToast(`❌ ${file.name}: ${msg}`, 'error');
      }
    }
    setUploading(false);
  };

  const deleteFile = async (id) => {
    const file = files.find(f => f.id === id);
    if (file?.sessionId) {
      try {
        await clearUpload(file.sessionId);
      } catch {
        // Silently ignore — session may already be expired
      }
    }
    setFiles(prev => prev.filter(f => f.id !== id));
    if (active?.id === id) { setActive(null); setAiResult(''); }
    showToast('🗑️ File removed.');
  };

  const handleDrop = (e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); };
  const handleDragOver = (e) => e.preventDefault();

  const handleAIQuery = async () => {
    if (!active || !prompt.trim()) return;
    if (!active.sessionId) {
      showToast('❌ No session ID — file may not be uploaded to backend', 'error');
      return;
    }

    setQuerying(true);
    setAiResult('');

    try {
      const response = await runAIQuery(active.sessionId, prompt, 'SEARCH');
      const data = response.data;
      setAiResult(data.response || 'No response from AI.');
      showToast(`✅ Query completed in ${data.query?.execution_time_ms || '?'}ms`);
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'AI query failed';
      setAiResult(`❌ Error: ${msg}`);
      showToast(`❌ ${msg}`, 'error');
    }
    setQuerying(false);
  };

  const loadPreview = async (file) => {
    if (!file.sessionId) return;
    try {
      const response = await getUploadPreview(file.sessionId);
      const data = response.data;
      setActive({ ...file, previewData: data.preview, totalRows: data.pagination?.total_rows || data.preview?.length || 0 });
      setAiResult('');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to load preview';
      showToast(`❌ ${msg}`, 'error');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0B1120', paddingTop: 72 }}>
      <Toast toast={toast} />

      {/* Sidebar */}
      <div style={{ display: 'flex', height: 'calc(100vh - 72px)' }}>
        <motion.aside
          initial={{ x: -60, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
          style={{ width: 220, background: 'rgba(255,255,255,0.03)', borderRight: '1px solid rgba(255,255,255,0.07)', padding: '24px 16px', display: 'flex', flexDirection: 'column', flexShrink: 0 }}
        >
          <div style={{ marginBottom: 32 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>Navigation</p>
            {[
              { icon: Upload,       label: 'Upload Files',  tab: 'upload' },
              { icon: Brain,        label: 'AI Query',      tab: 'ai' },
              { icon: FileText,     label: 'My Reports',    tab: 'reports' },
              { icon: User,         label: 'My Profile',    tab: 'profile' },
            ].map(({ icon: Icon, label, tab }) => {
              const isActive = navTab === tab;
              return (
                <div key={label}
                  onClick={() => navigateTo(tab)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, marginBottom: 4, background: isActive ? 'rgba(59,130,246,0.12)' : 'transparent', borderLeft: isActive ? '2px solid #3B82F6' : '2px solid transparent', cursor: 'pointer', color: isActive ? '#3B82F6' : 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: isActive ? 700 : 500 }}
                >
                  <Icon size={15} /> {label}
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 'auto' }}>
            <div style={{ padding: '12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', marginBottom: 8 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{user?.name}</p>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#3B82F6', background: 'rgba(59,130,246,0.12)', padding: '2px 8px', borderRadius: 20, display: 'inline-block', marginTop: 4 }}>👤 User</span>
            </div>
            <button onClick={handleLogout}
              style={{ width: '100%', padding: '10px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#F87171', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            ><LogOut size={14} /> Sign Out</button>
          </div>
        </motion.aside>

        {/* Main */}
        <main ref={mainRef} style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#3B82F6', marginBottom: 6 }}>User Dashboard</p>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', marginBottom: 4 }}>My Data & AI Queries</h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 28 }}>Upload files, preview your data, and query it with AI. Data is processed server-side.</p>
          </motion.div>

          {/* Drop Zone */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div
              onDrop={handleDrop} onDragOver={handleDragOver}
              onClick={() => fileRef.current?.click()}
              style={{ border: '2px dashed rgba(59,130,246,0.35)', borderRadius: 18, padding: '36px 24px', textAlign: 'center', cursor: uploading ? 'wait' : 'pointer', background: 'rgba(59,130,246,0.04)', marginBottom: 24, transition: 'border-color 0.2s', opacity: uploading ? 0.6 : 1 }}
              onMouseEnter={e => { if (!uploading) e.currentTarget.style.borderColor = 'rgba(59,130,246,0.7)'; }}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(59,130,246,0.35)'}
            >
              <Upload size={28} color="#3B82F6" style={{ margin: '0 auto 10px' }} />
              <p style={{ fontWeight: 700, color: '#fff', fontSize: 15, marginBottom: 4 }}>
                {uploading ? 'Uploading to server...' : 'Drop files here or click to browse'}
              </p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Supported: {ACCEPTED.join(', ')}</p>
              <input ref={fileRef} type="file" multiple accept={ACCEPTED.join(',')} style={{ display: 'none' }}
                onChange={e => { if (e.target.files) handleFiles(e.target.files); e.target.value = ''; }} />
            </div>
          </motion.div>

          {/* File list */}
          {files.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: 28 }}>
              <p style={{ fontWeight: 700, color: '#fff', fontSize: 14, marginBottom: 12 }}>My Files ({files.length})</p>
              {files.map(f => (
                <motion.div key={f.id}
                  initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: active?.id === f.id ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${active?.id === f.id ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.06)'}`, marginBottom: 6, cursor: 'pointer' }}
                  onClick={() => loadPreview(f)}
                >
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: (TYPE_COLOR[f.type] ?? '#94A3B8') + '18', border: `1px solid ${(TYPE_COLOR[f.type] ?? '#94A3B8')}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FileText size={14} color={TYPE_COLOR[f.type] ?? '#94A3B8'} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{f.size} · {f.type}{f.rows ? ` · ${f.rows} rows` : ''}</p>
                  </div>
                  <button onClick={e => { e.stopPropagation(); deleteFile(f.id); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: 4 }}
                  ><Trash2 size={14} /></button>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* AI Query Panel */}
          {active && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: '24px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <Brain size={18} color="#8B5CF6" />
                <p style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>AI Query — {active.name}</p>
                {active.rows && (
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginLeft: 'auto' }}>
                    {active.rows} rows · {active.cols} cols
                  </span>
                )}
              </div>

              {/* Data preview - all rows */}
              {active.previewData && active.previewData.length > 0 && (
                <div style={{ marginBottom: 16, padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', maxHeight: 500, overflow: 'auto' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    All Data — {active.totalRows || active.previewData.length} rows · {Object.keys(active.previewData[0]).length} cols
                  </p>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead style={{ position: 'sticky', top: 0, background: '#131B2E', zIndex: 1 }}>
                      <tr>
                        <th style={{ padding: '6px 8px', textAlign: 'left', color: 'rgba(255,255,255,0.3)', borderBottom: '1px solid rgba(255,255,255,0.1)', fontWeight: 600, fontSize: 10 }}>#</th>
                        {Object.keys(active.previewData[0]).map(col => (
                          <th key={col} style={{ padding: '6px 8px', textAlign: 'left', color: '#3B82F6', borderBottom: '1px solid rgba(255,255,255,0.1)', fontWeight: 600 }}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {active.previewData.map((row, i) => (
                        <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                          <td style={{ padding: '3px 8px', color: 'rgba(255,255,255,0.25)', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 10 }}>{i + 1}</td>
                          {Object.values(row).map((val, j) => (
                            <td key={j} style={{ padding: '3px 8px', color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.04)', whiteSpace: 'nowrap' }}>{val == null ? '—' : String(val).slice(0, 80)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                <input
                  type="text" placeholder="Ask a question about your data..."
                  value={prompt} onChange={e => setPrompt(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !querying && handleAIQuery()}
                  style={{ flex: 1, padding: '11px 16px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none' }}
                  disabled={querying}
                />
                <button onClick={handleAIQuery} disabled={querying || !prompt.trim()}
                  style={{ padding: '11px 20px', borderRadius: 10, background: 'linear-gradient(135deg,#8B5CF6,#3B82F6)', border: 'none', color: '#fff', fontWeight: 700, fontSize: 13, cursor: (querying || !prompt.trim()) ? 'not-allowed' : 'pointer', opacity: (querying || !prompt.trim()) ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  {querying ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />Querying...</> : <><MessageSquare size={13} />Query</>}
                </button>
              </div>
              {aiResult && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ padding: '16px', background: aiResult.startsWith('❌') ? 'rgba(239,68,68,0.07)' : 'rgba(139,92,246,0.07)', border: `1px solid ${aiResult.startsWith('❌') ? 'rgba(239,68,68,0.2)' : 'rgba(139,92,246,0.2)'}`, borderRadius: 12, color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-line' }}
                >{aiResult}</motion.div>
              )}
            </motion.div>
          )}

          {files.length === 0 && !uploading && (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'rgba(255,255,255,0.25)', fontSize: 14 }}>
              No files uploaded yet. Drop a file above to get started.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}