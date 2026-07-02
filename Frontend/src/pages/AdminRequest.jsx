import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Clock, CheckCircle, XCircle, User, Building2, FileText, Mail, AlertTriangle, Lock } from 'lucide-react';
import { useAuth } from '../App';
import { canApproveAdminRequest, canCreateRole, ROLES, roleLabel } from '../utils/permissions';

const fadeUp = (d = 0) => ({ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.45, delay: d } });

/* ── Shared field ── */
function Field({ label, icon: Icon, type = 'text', name, value, onChange, placeholder, error, required }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}{required && <span style={{ color: '#EF4444', marginLeft: 3 }}>*</span>}
      </label>
      <div style={{ position: 'relative' }}>
        {Icon && <Icon size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)', pointerEvents: 'none' }} />}
        {type === 'textarea' ? (
          <textarea name={name} value={value} onChange={onChange} placeholder={placeholder} rows={3}
            style={{ width: '100%', padding: '11px 14px', paddingLeft: Icon ? 38 : 14, background: 'rgba(255,255,255,0.06)', border: `1px solid ${error ? '#EF4444' : 'rgba(255,255,255,0.12)'}`, borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit', resize: 'vertical', transition: 'border-color 0.2s, box-shadow 0.2s' }}
            onFocus={e => { e.target.style.borderColor = '#3B82F6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)'; }}
            onBlur={e => { e.target.style.borderColor = error ? '#EF4444' : 'rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none'; }}
          />
        ) : (
          <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder}
            style={{ width: '100%', padding: '11px 14px', paddingLeft: Icon ? 38 : 14, background: 'rgba(255,255,255,0.06)', border: `1px solid ${error ? '#EF4444' : 'rgba(255,255,255,0.12)'}`, borderRadius: 10, color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s, box-shadow 0.2s' }}
            onFocus={e => { e.target.style.borderColor = '#3B82F6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)'; }}
            onBlur={e => { e.target.style.borderColor = error ? '#EF4444' : 'rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none'; }}
          />
        )}
      </div>
      {error && <p style={{ fontSize: 11, color: '#FCA5A5', marginTop: 2 }}>{error}</p>}
    </div>
  );
}

/* ── Status badge ── */
const STATUS_CFG = {
  pending:  { label: 'Pending Approval', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', icon: Clock },
  approved: { label: 'Approved',         color: '#10B981', bg: 'rgba(16,185,129,0.12)', icon: CheckCircle },
  rejected: { label: 'Rejected',         color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  icon: XCircle },
};
function StatusBadge({ status }) {
  const c = STATUS_CFG[status] ?? STATUS_CFG.pending;
  const Icon = c.icon;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: c.bg, border: `1px solid ${c.color}40`, fontSize: 11, fontWeight: 700, color: c.color }}>
      <Icon size={11} />{c.label}
    </span>
  );
}

/* ── Seed requests (super_admin sees these) ── */
const SEED = [
  { id: 'r1', name: 'Jordan Lee',   email: 'jordan@acme.com',   department: 'Engineering',  reason: 'Need dashboard access to manage team uploads and run analytics reports.',   status: 'pending',  requested: '2025-07-10 10:22' },
  { id: 'r2', name: 'Morgan Price', email: 'morgan@acme.com',   department: 'Finance',      reason: 'Responsible for monthly reporting; require Admin access to all data sources.', status: 'pending',  requested: '2025-07-10 09:55' },
  { id: 'r3', name: 'Alex Rivera',  email: 'alex@acme.com',     department: 'Operations',   reason: 'Oversee data pipeline and need elevated permissions for file management.',  status: 'approved', requested: '2025-07-09 14:30' },
];

export default function AdminRequest() {
  const { user } = useAuth();
  const role = user?.role ?? 'user';
  const isSuperAdmin = canApproveAdminRequest(role);

  /* ── Request form state ── */
  const EMPTY = { name: '', email: '', department: '', reason: '' };
  const [form,    setForm]    = useState(EMPTY);
  const [errors,  setErrors]  = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  /* ── Approval queue state ── */
  const [requests, setRequests] = useState(SEED);

  /* ── Permission check: can this role even submit an admin request? ── */
  // Users can request admin; admins cannot request super_admin via this form
  const blockedRole = role === ROLES.SUPER_ADMIN;

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setErrors(er => ({ ...er, [e.target.name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())       e.name       = 'Full name is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required.';
    if (!form.department.trim()) e.department = 'Department is required.';
    if (form.reason.trim().length < 20) e.reason = 'Please provide at least 20 characters.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setSubmitted(true);
  };

  const handleDecision = (id, decision) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: decision } : r));
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0B1120', padding: '88px 0 64px' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* Page header */}
        <motion.div {...fadeUp(0)}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#8B5CF6', marginBottom: 6 }}>Access Management</p>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 6 }}>Admin Access Request</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)' }}>
            {isSuperAdmin ? 'Review and approve pending admin access requests.' : 'Submit a request for elevated access. A Super Admin will review your application.'}
          </p>
        </motion.div>

        {/* ── REQUEST FORM (non-super_admin sees this) ── */}
        {!isSuperAdmin && (
          <motion.div {...fadeUp(0.1)}>
            <AnimatePresence mode="wait">
              {submitted ? (
                /* Success state */
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 20, padding: '48px 32px', textAlign: 'center' }}
                >
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}
                    style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}
                  >
                    <Clock size={32} color="#10B981" />
                  </motion.div>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Request Submitted</h2>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', maxWidth: 360, margin: '0 auto 20px' }}>Your admin access request has been sent. Status is set to <strong style={{ color: '#F59E0B' }}>Pending Approval</strong> until reviewed by a Super Admin.</p>
                  <StatusBadge status="pending" />
                  <div style={{ marginTop: 24 }}>
                    <button onClick={() => { setSubmitted(false); setForm(EMPTY); }}
                      style={{ padding: '9px 22px', borderRadius: 10, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                    >Submit Another Request</button>
                  </div>
                </motion.div>
              ) : (
                /* Request form */
                <motion.form key="form" onSubmit={handleSubmit}
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 20, padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}
                >
                  {/* Info strip */}
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 16px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 12 }}>
                    <AlertTriangle size={15} color="#60A5FA" style={{ flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
                      Admin access grants elevated permissions including file uploads, dashboard management, and analytics reporting. Only request if required for your role.
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <Field label="Full Name"   icon={User}      name="name"       value={form.name}       onChange={handleChange} placeholder="Your full name"    error={errors.name}       required />
                    <Field label="Email"       icon={Mail}      type="email" name="email" value={form.email} onChange={handleChange} placeholder="work@company.com" error={errors.email}      required />
                  </div>
                  <Field label="Department"   icon={Building2} name="department"  value={form.department}  onChange={handleChange} placeholder="e.g. Engineering, Finance" error={errors.department} required />
                  <Field label="Reason for Admin Access" icon={FileText} type="textarea" name="reason" value={form.reason} onChange={handleChange} placeholder="Describe why you need admin access and how you plan to use it..." error={errors.reason} required />

                  <motion.button type="submit" disabled={loading}
                    whileHover={{ scale: 1.02, boxShadow: '0 8px 24px rgba(139,92,246,0.4)' }} whileTap={{ scale: 0.98 }}
                    style={{ padding: '13px 0', borderRadius: 12, background: 'linear-gradient(135deg,#8B5CF6,#6366F1)', border: 'none', color: '#fff', fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit' }}
                  >
                    {loading ? <><span className="spinner" /> Submitting...</> : <><ShieldCheck size={16} /> Submit Admin Request</>}
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── APPROVAL QUEUE (super_admin only) ── */}
        {isSuperAdmin && (
          <motion.div {...fadeUp(0.1)}>
            {/* Permission rule callout */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '12px 16px', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 12, marginBottom: 20 }}>
              <Lock size={14} color="#A78BFA" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
                <strong style={{ color: '#A78BFA' }}>Permission Rule:</strong> Only Super Admins can approve or reject admin access requests. Admins and Users cannot perform these actions.
              </p>
            </div>

            {/* Queue table */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 20, overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>Pending Requests</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{requests.filter(r => r.status === 'pending').length} awaiting your review</p>
                </div>
                <span style={{ fontSize: 20, fontWeight: 800, color: '#8B5CF6' }}>{requests.filter(r => r.status === 'pending').length}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {requests.map((req, i) => (
                  <motion.div key={req.id}
                    initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                    style={{ padding: '18px 24px', borderBottom: i < requests.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', display: 'flex', gap: 16, alignItems: 'flex-start' }}
                  >
                    {/* Avatar */}
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#fff', flexShrink: 0 }}>
                      {req.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                        <p style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>{req.name}</p>
                        <StatusBadge status={req.status} />
                      </div>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>{req.email} · {req.department} · {req.requested}</p>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, borderLeft: '2px solid rgba(139,92,246,0.4)', paddingLeft: 10 }}>{req.reason}</p>
                    </div>

                    {/* Actions — only when pending */}
                    {req.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={() => handleDecision(req.id, 'approved')}
                          style={{ padding: '7px 16px', borderRadius: 9, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.35)', color: '#10B981', fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}
                        >
                          <CheckCircle size={13} /> Approve
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={() => handleDecision(req.id, 'rejected')}
                          style={{ padding: '7px 16px', borderRadius: 9, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontWeight: 600, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}
                        >
                          <XCircle size={13} /> Reject
                        </motion.button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Role restriction notice (shown to super_admin on request-form side) ── */}
        {isSuperAdmin && (
          <motion.div {...fadeUp(0.2)}
            style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 16, padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'flex-start' }}
          >
            <ShieldCheck size={16} color="#60A5FA" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <p style={{ fontWeight: 600, fontSize: 13, color: '#fff', marginBottom: 4 }}>Your Permissions (Super Admin)</p>
              <ul style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 2, paddingLeft: 16 }}>
                <li>✅ Approve or reject admin access requests</li>
                <li>✅ Create Admin and Super Admin accounts</li>
                <li>✅ Full access to all dashboards and file operations</li>
                <li>✅ View session monitoring</li>
                <li>⛔ Admins cannot create or approve Admins</li>
                <li>⛔ Users cannot request Super Admin access via this form</li>
              </ul>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
