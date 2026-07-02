// src/pages/Dashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate }         from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getStaff, createStaff, updateStaff, deleteStaff } from '../services/authService';
import dashboardBg  from '../assets/images/dashboard-bg.jpg';
import adminAvatar  from '../assets/images/admin-avatar.png';
import staffAvatar  from '../assets/images/staff-avatar.png';
import './Dashboard.css';

let toastTimeout;
function useToast() {
  const [toast, setToast] = useState(null);
  const show = (msg, type = 'success') => {
    setToast({ msg, type });
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => setToast(null), 3000);
  };
  return { toast, show };
}

const EMPTY_FORM = { staff_id: '', name: '', gender: 'Male', age: '', domain: '' };

const rowVariant = {
  hidden:  { opacity: 0, x: -16 },
  visible: (i) => ({ opacity: 1, x: 0, transition: { delay: i * 0.045, duration: 0.35 } }),
};

const cardVariant = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

export default function Dashboard() {
  const navigate        = useNavigate();
  const { toast, show } = useToast();

  const user    = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user?.role === 'admin';

  const [records, setRecords]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [modal, setModal]           = useState(false);
  const [editing, setEditing]       = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(null);

  const fetchRecords = async () => {
    setLoading(true); setError('');
    try {
      const { data } = await getStaff();
      setRecords(data);
    } catch {
      setError('Failed to load staff records. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem('access_token')) { navigate('/login'); return; }
    fetchRecords();
  }, []);

  const handleLogout = () => { localStorage.clear(); navigate('/login'); };

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setFormErrors({}); setModal(true); };
  const openEdit = (rec) => {
    setEditing(rec);
    setForm({ staff_id: rec.staff_id, name: rec.name, gender: rec.gender, age: String(rec.age), domain: rec.domain });
    setFormErrors({});
    setModal(true);
  };

  const validateForm = () => {
    const e = {};
    if (!form.staff_id.trim()) e.staff_id = 'Staff ID is required.';
    if (!form.name.trim())     e.name     = 'Name is required.';
    if (!form.domain.trim())   e.domain   = 'Domain is required.';
    const age = Number(form.age);
    if (!form.age || isNaN(age) || age < 18 || age > 65) e.age = 'Age must be between 18 and 65.';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSaving(true);
    const payload = { ...form, age: Number(form.age) };
    try {
      if (editing) {
        const { data } = await updateStaff(editing.id, payload);
        setRecords((r) => r.map((rec) => rec.id === editing.id ? data : rec));
        show('✅ Staff record updated successfully!');
      } else {
        const { data } = await createStaff(payload);
        setRecords((r) => [...r, data]);
        show('✅ New staff record added!');
      }
      setModal(false);
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        const fe = {};
        Object.keys(EMPTY_FORM).forEach((k) => { if (data[k]) fe[k] = Array.isArray(data[k]) ? data[k][0] : data[k]; });
        if (Object.keys(fe).length) setFormErrors(fe);
        else show('❌ Save failed. Please try again.', 'error');
      } else {
        show('❌ Save failed. Please try again.', 'error');
      }
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteStaff(deleting);
      setRecords((r) => r.filter((rec) => rec.id !== deleting));
      show('🗑️ Staff record deleted.');
    } catch {
      show('❌ Delete failed. Please try again.', 'error');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="dashboard-page" style={{ backgroundImage: `url(${dashboardBg})` }}>
      <div className="dash-bg-overlay" />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div className={`toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}
            initial={{ opacity: 0, y: -30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
          >{toast.msg}</motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleting && (
          <motion.div className="overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div className="confirm-dialog"
              initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            >
              <div className="confirm-icon">⚠️</div>
              <h3>Delete Staff Record?</h3>
              <p>This action cannot be undone.</p>
              <div className="confirm-actions">
                <button className="btn-cancel" onClick={() => setDeleting(null)}>Cancel</button>
                <button className="btn-delete-confirm" onClick={confirmDelete}>Yes, Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {modal && (
          <motion.div className="overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div className="modal-card"
              initial={{ scale: 0.88, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            >
              <div className="modal-header">
                <h3>{editing ? '✏️ Edit Staff Record' : '➕ Add New Staff'}</h3>
                <button className="modal-close" onClick={() => setModal(false)}>✕</button>
              </div>
              <form onSubmit={handleSave} noValidate className="modal-form">
                {[
                  { name: 'staff_id', label: 'Staff ID',  type: 'text',   placeholder: 'e.g. STF-001' },
                  { name: 'name',     label: 'Full Name', type: 'text',   placeholder: 'e.g. Alice Johnson' },
                  { name: 'age',      label: 'Age',       type: 'number', placeholder: '18–65' },
                  { name: 'domain',   label: 'Domain',    type: 'text',   placeholder: 'e.g. Engineering' },
                ].map(({ name, label, type, placeholder }) => (
                  <div className="form-group" key={name}>
                    <label>{label}</label>
                    <input type={type} name={name} placeholder={placeholder} value={form[name]}
                      onChange={(e) => { setForm((f) => ({ ...f, [name]: e.target.value })); setFormErrors((fe) => ({ ...fe, [name]: '' })); }}
                      className={formErrors[name] ? 'error-input' : ''}
                    />
                    {formErrors[name] && <span className="field-error">⚠ {formErrors[name]}</span>}
                  </div>
                ))}
                <div className="form-group">
                  <label>Gender</label>
                  <select name="gender" value={form.gender}
                    onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))} className="modal-select"
                  >
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={() => setModal(false)}>Cancel</button>
                  <button type="submit" className="btn-save" disabled={saving}>
                    {saving ? <><span className="spinner" />Saving...</> : editing ? 'Update Record' : 'Add Record'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Sidebar ── */}
      <motion.aside className="sidebar"
        initial={{ x: -60, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="sidebar-brand">
          <div className="sidebar-logo">🏢</div>
          <span>StaffHub</span>
        </div>
        <nav className="sidebar-nav">
          <a className="nav-item active" href="#"><span>📊</span> Dashboard</a>
          <a className="nav-item" href="#"><span>👥</span> Staff</a>
          {isAdmin && <a className="nav-item" href="#"><span>⚙️</span> Settings</a>}
        </nav>
        <div className="sidebar-footer">
          {/* Role-based avatar */}
          <div className="user-info">
            <img
              src={isAdmin ? adminAvatar : staffAvatar}
              alt={isAdmin ? 'Admin Avatar' : 'Staff Avatar'}
              className="user-avatar-img"
            />
            <div>
              <div className="user-name">{user?.username}</div>
              <div className={`role-badge ${isAdmin ? 'role-admin' : 'role-staff'}`}>
                {isAdmin ? '👑 Admin' : '👤 Staff'}
              </div>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>⏻ Logout</button>
        </div>
      </motion.aside>

      {/* ── Main content ── */}
      <motion.main className="dash-main"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.15, ease: 'easeOut' }}
      >
        {/* Stats cards */}
        <motion.div className="stats-row"
          initial="hidden" animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        >
          {[
            { icon: '👥', label: 'Total Staff',  value: records.length,                                color: '#6c63ff' },
            { icon: '♂',  label: 'Male',         value: records.filter(r => r.gender === 'Male').length,   color: '#3b82f6' },
            { icon: '♀',  label: 'Female',       value: records.filter(r => r.gender === 'Female').length, color: '#ec4899' },
            { icon: '🏷', label: 'Domains',      value: [...new Set(records.map(r => r.domain))].length,   color: '#10b981' },
          ].map(({ icon, label, value, color }) => (
            <motion.div key={label} className="stat-card" variants={cardVariant}
              whileHover={{ y: -4, boxShadow: `0 12px 32px ${color}33` }}
            >
              <div className="stat-icon" style={{ color }}>{icon}</div>
              <div className="stat-value" style={{ color }}>{value}</div>
              <div className="stat-label">{label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Header */}
        <motion.header className="dash-header"
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        >
          <div>
            <h2>Staff Directory</h2>
            <p>Manage and view all registered staff members</p>
          </div>
          <div className="header-right">
            <div className="stats-chip"><span>👥</span><strong>{records.length}</strong> Total Staff</div>
            {isAdmin && (
              <motion.button className="btn-add" onClick={openAdd}
                whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }}
              >＋ Add Staff</motion.button>
            )}
          </div>
        </motion.header>

        {/* Role banner */}
        <motion.div className={`access-banner ${isAdmin ? 'banner-admin' : 'banner-staff'}`}
          initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
        >
          {isAdmin
            ? '👑 Admin Mode — You have full access to add, edit, and delete staff records.'
            : '👤 Staff Mode — You have read-only access to view staff records.'}
        </motion.div>

        {/* Table card */}
        <motion.div className="table-card" variants={cardVariant} initial="hidden" animate="visible"
          transition={{ delay: 0.45 }}
        >
          {loading ? (
            <div className="table-loading">
              <div className="loading-spinner" />
              <p>Loading staff records...</p>
            </div>
          ) : error ? (
            <div className="table-error">
              <span>⚠️</span> {error}
              <button onClick={fetchRecords} className="btn-retry">Retry</button>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="staff-table">
                <thead>
                  <tr>
                    <th>S.No</th><th>Staff ID</th><th>Name</th>
                    <th>Gender</th><th>Age</th><th>Domain</th>
                    {isAdmin && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {records.length === 0 ? (
                    <tr><td colSpan={isAdmin ? 7 : 6} className="empty-row">
                      No staff records found.{isAdmin && ' Click "Add Staff" to create one.'}
                    </td></tr>
                  ) : (
                    records.map((rec, i) => (
                      <motion.tr key={rec.id} className="table-row"
                        custom={i} variants={rowVariant} initial="hidden" animate="visible"
                        whileHover={{ backgroundColor: 'rgba(108,99,255,0.08)' }}
                      >
                        <td className="sno">{i + 1}</td>
                        <td className="staff-id-cell">{rec.staff_id}</td>
                        <td>
                          <div className="name-cell">
                            <div className="name-avatar">{rec.name[0]}</div>
                            {rec.name}
                          </div>
                        </td>
                        <td>
                          <span className={`gender-badge gender-${rec.gender.toLowerCase()}`}>
                            {rec.gender === 'Male' ? '♂' : rec.gender === 'Female' ? '♀' : '⚧'} {rec.gender}
                          </span>
                        </td>
                        <td>{rec.age}</td>
                        <td><span className="domain-tag">{rec.domain}</span></td>
                        {isAdmin && (
                          <td className="action-cell">
                            <motion.button className="btn-edit" onClick={() => openEdit(rec)}
                              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                            >✏️ Edit</motion.button>
                            <motion.button className="btn-delete" onClick={() => setDeleting(rec.id)}
                              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}
                            >🗑️ Delete</motion.button>
                          </td>
                        )}
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </motion.main>
    </div>
  );
}
