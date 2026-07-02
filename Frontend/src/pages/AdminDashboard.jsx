import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Users, BarChart3, FileText, Shield, LogOut, User, Activity } from 'lucide-react';
import { useAuth } from '../App';

function Toast({ toast }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
          style={{ position: 'fixed', top: 80, right: 24, zIndex: 100, padding: '12px 20px', borderRadius: 12, background: 'rgba(16,185,129,0.9)', color: '#fff', fontWeight: 600, fontSize: 14, boxShadow: '0 8px 24px rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)' }}
        >{toast.msg}</motion.div>
      )}
    </AnimatePresence>
  );
}

const NAV = [
  { icon: BarChart3, label: 'Dashboard',    id: 'dashboard' },
  { icon: Users,     label: 'Manage Users', id: 'users' },
  { icon: FileText,  label: 'Reports',      id: 'reports' },
  { icon: Activity,  label: 'Activity Log', id: 'logs' },
];

const fadeUp = (d = 0) => ({ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, delay: d } });

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab]   = useState('dashboard');
  const [toast, setToast] = useState(null);

  const showToast = (msg) => { setToast({ msg }); setTimeout(() => setToast(null), 3000); };
  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  return (
    <div style={{ minHeight: '100vh', background: '#0B1120', paddingTop: 72 }}>
      <Toast toast={toast} />
      <div style={{ display: 'flex', height: 'calc(100vh - 72px)' }}>

        {/* Sidebar */}
        <motion.aside
          initial={{ x: -60, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
          style={{ width: 230, background: 'rgba(255,255,255,0.03)', borderRight: '1px solid rgba(255,255,255,0.07)', padding: '24px 16px', display: 'flex', flexDirection: 'column', flexShrink: 0 }}
        >
          <div style={{ marginBottom: 8 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>Admin Panel</p>
            {NAV.map(({ icon: Icon, label, id }) => (
              <button key={id} onClick={() => setTab(id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, marginBottom: 4, background: tab === id ? 'rgba(139,92,246,0.12)' : 'transparent', borderLeft: `2px solid ${tab === id ? '#8B5CF6' : 'transparent'}`, border: 'none', cursor: 'pointer', color: tab === id ? '#8B5CF6' : 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: tab === id ? 700 : 500, textAlign: 'left' }}
              >
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 'auto' }}>
            <div style={{ padding: '12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', marginBottom: 8 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{user?.name}</p>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#8B5CF6', background: 'rgba(139,92,246,0.12)', padding: '2px 8px', borderRadius: 20, display: 'inline-block', marginTop: 4 }}>🛡️ Admin</span>
            </div>
            <button onClick={handleLogout}
              style={{ width: '100%', padding: '10px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#F87171', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            ><LogOut size={14} /> Sign Out</button>
          </div>
        </motion.aside>

        {/* Main */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
          {tab === 'dashboard' && (
            <motion.div {...fadeUp()}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#8B5CF6', marginBottom: 6 }}>Admin Dashboard</p>
              <h1 style={{ fontSize: 26, fontWeight: 900, color: '#fff', marginBottom: 20 }}>Overview</h1>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14, marginBottom: 28 }}>
                {[
                  { icon: Users,    label: 'Total Users',    value: '—', color: '#8B5CF6' },
                  { icon: FileText, label: 'Files Uploaded',  value: '—', color: '#3B82F6' },
                  { icon: Activity, label: 'AI Queries Today', value: '—', color: '#10B981' },
                  { icon: Shield,   label: 'Active Sessions', value: '—', color: '#F59E0B' },
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

              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '24px' }}>
                <p style={{ fontWeight: 700, color: '#fff', fontSize: 15, marginBottom: 6 }}>Admin Permissions</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>
                  As Admin you can: view/edit users, activate/deactivate accounts, view uploaded files, generate reports, monitor AI usage, view query history.
                  <br />
                  You cannot: delete or modify Super Admin accounts, access site settings, DB settings, or AI config.
                </p>
              </div>
            </motion.div>
          )}

          {tab === 'users' && (
            <motion.div {...fadeUp()}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#8B5CF6', marginBottom: 6 }}>User Management</p>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 20 }}>Manage Users</h1>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '24px', textAlign: 'center', color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>
                User management API integration — connect to <code style={{ color: '#8B5CF6' }}>/api/admin/view-users/</code>
              </div>
            </motion.div>
          )}

          {(tab === 'reports' || tab === 'logs') && (
            <motion.div {...fadeUp()}>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 20, textTransform: 'capitalize' }}>{tab}</h1>
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '48px', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
                {tab === 'reports' ? 'Reports will appear here.' : 'Activity logs will appear here.'}
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}
