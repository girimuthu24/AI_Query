import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Users, Shield, Settings, Activity, LogOut, Database, Key, BarChart3, AlertTriangle } from 'lucide-react';
import { useAuth } from '../App';

const NAV = [
  { icon: BarChart3, label: 'Overview',        id: 'overview' },
  { icon: Shield,    label: 'Manage Admins',   id: 'admins' },
  { icon: Users,     label: 'Manage Users',    id: 'users' },
  { icon: Activity,  label: 'Audit Logs',      id: 'logs' },
  { icon: Database,  label: 'DB Settings',     id: 'db' },
  { icon: Settings,  label: 'Site Settings',   id: 'settings' },
  { icon: Key,       label: 'AI Config',        id: 'ai' },
];

const fadeUp = (d = 0) => ({ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, delay: d } });

function ForceChangeModal({ onSave }) {
  const [pwd, setPwd]   = useState('');
  const [conf, setConf] = useState('');
  const [err, setErr]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (pwd.length < 8)  { setErr('Password must be at least 8 characters.'); return; }
    if (pwd !== conf)    { setErr('Passwords do not match.'); return; }
    setLoading(true);
    setErr('');
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL?.replace('/api', '')}/superadmin/force-change-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ new_password: pwd }),
      });
      if (!res.ok) { const d = await res.json(); setErr(d.detail || 'Failed.'); }
      else onSave();
    } catch { setErr('Network error.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        style={{ background: 'rgba(15,23,42,0.98)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 20, padding: '36px 40px', width: 420 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <AlertTriangle size={22} color="#EF4444" />
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Change Required</h2>
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>
          This is your first login. You must change the default password before continuing.
        </p>
        {['New Password', 'Confirm Password'].map((label, i) => (
          <div key={label} style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>{label}</label>
            <input type="password" value={i === 0 ? pwd : conf} onChange={e => i === 0 ? setPwd(e.target.value) : setConf(e.target.value)}
              style={{ width: '100%', padding: '11px 14px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        ))}
        {err && <p style={{ color: '#FCA5A5', fontSize: 12, marginBottom: 12 }}>⚠ {err}</p>}
        <button onClick={handleSave} disabled={loading}
          style={{ width: '100%', padding: '12px', borderRadius: 11, background: 'linear-gradient(135deg,#EF4444,#8B5CF6)', border: 'none', color: '#fff', fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
        >{loading ? 'Saving...' : 'Set New Password'}</button>
      </motion.div>
    </div>
  );
}

export default function SuperAdminDashboard() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');

  const mustChange = user?.must_change_password;

  const handleLogout  = () => { logout(); navigate('/login', { replace: true }); };
  const handlePwdSaved = () => updateUser({ must_change_password: false });

  return (
    <div style={{ minHeight: '100vh', background: '#0B1120', paddingTop: 72 }}>
      {mustChange && <ForceChangeModal onSave={handlePwdSaved} />}

      <div style={{ display: 'flex', height: 'calc(100vh - 72px)' }}>
        {/* Sidebar */}
        <motion.aside
          initial={{ x: -60, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
          style={{ width: 240, background: 'rgba(255,255,255,0.03)', borderRight: '1px solid rgba(255,255,255,0.07)', padding: '24px 16px', display: 'flex', flexDirection: 'column', flexShrink: 0 }}
        >
          <div style={{ marginBottom: 8 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>Super Admin</p>
            {NAV.map(({ icon: Icon, label, id }) => (
              <button key={id} onClick={() => setTab(id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, marginBottom: 4, background: tab === id ? 'rgba(239,68,68,0.12)' : 'transparent', border: 'none', borderLeft: `2px solid ${tab === id ? '#EF4444' : 'transparent'}`, cursor: 'pointer', color: tab === id ? '#EF4444' : 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: tab === id ? 700 : 500, textAlign: 'left' }}
              >
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 'auto' }}>
            <div style={{ padding: '12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', marginBottom: 8 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{user?.name}</p>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#EF4444', background: 'rgba(239,68,68,0.12)', padding: '2px 8px', borderRadius: 20, display: 'inline-block', marginTop: 4 }}>👑 Super Admin</span>
            </div>
            <button onClick={handleLogout}
              style={{ width: '100%', padding: '10px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#F87171', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            ><LogOut size={14} /> Sign Out</button>
          </div>
        </motion.aside>

        {/* Main */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
          <motion.div {...fadeUp()}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#EF4444', marginBottom: 6 }}>System Control</p>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', marginBottom: 4 }}>Super Admin Dashboard</h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 28 }}>Full system access — manage admins, users, AI settings, site config and audit logs.</p>
          </motion.div>

          {tab === 'overview' && (
            <motion.div {...fadeUp(0.1)}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14, marginBottom: 28 }}>
                {[
                  { icon: Shield,   label: 'Admin Accounts',  value: '—', color: '#8B5CF6' },
                  { icon: Users,    label: 'User Accounts',   value: '—', color: '#3B82F6' },
                  { icon: Activity, label: 'Audit Events',    value: '—', color: '#10B981' },
                  { icon: Database, label: 'DB Status',       value: 'OK', color: '#F59E0B' },
                ].map(({ icon: Icon, label, value, color }) => (
                  <motion.div key={label} whileHover={{ y: -4 }}
                    style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${color}22`, borderRadius: 16, padding: '20px', cursor: 'default' }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 11, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                      <Icon size={18} color={color} />
                    </div>
                    <p style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{value}</p>
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{label}</p>
                  </motion.div>
                ))}
              </div>

              <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 16, padding: '20px 24px' }}>
                <p style={{ fontWeight: 700, color: '#FCA5A5', fontSize: 14, marginBottom: 6 }}>Full Access Summary</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>
                  You have unrestricted access: create/edit/delete Admin accounts, manage all Users, view all uploads and AI queries, manage AI settings, site settings, database settings, storage, view audit logs, activate/deactivate any account, reset passwords.
                </p>
              </div>
            </motion.div>
          )}

          {tab !== 'overview' && (
            <motion.div {...fadeUp()}>
              <h1 style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 20, textTransform: 'capitalize' }}>
                {NAV.find(n => n.id === tab)?.label}
              </h1>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
                Connect to API: <code style={{ color: '#EF4444' }}>/superadmin/{tab}/</code>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}
