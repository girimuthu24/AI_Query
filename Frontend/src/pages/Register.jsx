import { useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { registerUser, checkField } from '../services/authService';
import registerBg from '../assets/images/nature1.jpg';
import './Register.css';

const getStrength = (pwd) => {
  let s = 0;
  if (pwd.length >= 8)                     s++;
  if (/[A-Z]/.test(pwd))                   s++;
  if (/[a-z]/.test(pwd))                   s++;
  if (/\d/.test(pwd))                      s++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) s++;
  return s;
};

const strengthMeta = [
  null,
  { label: 'Very Weak',   color: '#ef4444' },
  { label: 'Weak',        color: '#f97316' },
  { label: 'Fair',        color: '#eab308' },
  { label: 'Strong',      color: '#22c55e' },
  { label: 'Very Strong', color: '#10b981' },
];

const INITIAL_FORM   = { full_name: '', email: '', role: 'user', password: '', confirm_password: '' };
const INITIAL_ERRORS = { full_name: '', email: '', password: '', confirm_password: '' };

const containerVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const fieldVariant = {
  hidden:  { opacity: 0, x: -22 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
};

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm]         = useState(INITIAL_FORM);
  const [errors, setErrors]     = useState(INITIAL_ERRORS);
  const [emailCheck, setEmailCheck] = useState('idle'); // idle | checking | ok | taken
  const [apiError, setApiError] = useState('');
  const [success, setSuccess]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [showPwd, setShowPwd]   = useState(false);

  const debounceRef = useRef(null);
  const strength    = getStrength(form.password);
  const meta        = strengthMeta[strength];

  const runEmailCheck = useCallback((value) => {
    if (!value.trim()) { setEmailCheck('idle'); return; }
    clearTimeout(debounceRef.current);
    setEmailCheck('checking');
    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await checkField('email', value.trim());
        setEmailCheck(data.taken ? 'taken' : 'ok');
        if (data.taken) setErrors(e => ({ ...e, email: 'This email is already registered.' }));
        else            setErrors(e => ({ ...e, email: '' }));
      } catch { setEmailCheck('idle'); }
    }, 500);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setErrors(er => ({ ...er, [name]: '' }));
    setApiError('');
    if (name === 'email') runEmailCheck(value);
  };

  const validate = () => {
    const e = { ...INITIAL_ERRORS };
    let ok = true;
    if (form.full_name.trim().length < 2)                  { e.full_name = 'Full name must be at least 2 characters.'; ok = false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))   { e.email     = 'Enter a valid email address.'; ok = false; }
    if (emailCheck === 'taken')                             { e.email     = 'This email is already registered.'; ok = false; }
    if (form.password.length < 8 || strength < 3)          { e.password  = 'Password is too weak. Use uppercase, digits & special chars.'; ok = false; }
    if (form.password !== form.confirm_password)            { e.confirm_password = 'Passwords do not match.'; ok = false; }
    setErrors(e);
    return ok;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError('');
    try {
      await registerUser({
        full_name:        form.full_name.trim(),
        email:            form.email.trim(),
        role:             form.role,
        password:         form.password,
        confirm_password: form.confirm_password,
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2200);
    } catch (err) {
      const data = err.response?.data;
      if (data) {
        const fe = {};
        Object.keys(INITIAL_ERRORS).forEach(f => {
          if (data[f]) fe[f] = Array.isArray(data[f]) ? data[f][0] : data[f];
        });
        if (Object.keys(fe).length) setErrors(prev => ({ ...prev, ...fe }));
        else setApiError(data.non_field_errors?.[0] || 'Registration failed. Please try again.');
      } else {
        setApiError('Network error. Is the backend running?');
      }
    } finally {
      setLoading(false);
    }
  };

  const StatusIcon = () => {
    if (emailCheck === 'checking') return <span className="check-status checking">⟳</span>;
    if (emailCheck === 'ok')       return <span className="check-status ok">✓</span>;
    if (emailCheck === 'taken')    return <span className="check-status taken">✗</span>;
    return null;
  };

  return (
    <div className="register-page" style={{ backgroundImage: `url(${registerBg})` }}>
      <div className="register-overlay" />
      <div className="reg-glow reg-glow1" />
      <div className="reg-glow reg-glow2" />

      <AnimatePresence>
        {success && (
          <motion.div className="success-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div className="success-burst"
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            >
              <div className="success-checkmark">✓</div>
              <h2>Account Created!</h2>
              <p>Redirecting to login...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="glass-card register-card"
        initial={{ opacity: 0, y: 60, scale: 0.93 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div className="brand"
          initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        >
          <motion.div className="logo-icon"
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 4, repeat: Infinity, repeatDelay: 3 }}
          >✨</motion.div>
          <h1>Create Account</h1>
          <p>Fill in your details to get started</p>
        </motion.div>

        {/* Role buttons */}
        <motion.div className="role-btn-group"
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        >
          {[{ value: 'user', icon: '👤', label: 'User' }, { value: 'admin', icon: '🛡️', label: 'Admin' }, { value: 'super_admin', icon: '👑', label: 'SuperAdmin' }].map(({ value, icon, label }) => (
            <button key={value} type="button"
              onClick={() => setForm(f => ({ ...f, role: value }))}
              className={`role-btn${form.role === value ? ' role-btn-active' : ''}`}
            >
              <span>{icon}</span>{label}
            </button>
          ))}
        </motion.div>

        {apiError && (
          <motion.div className="msg-error"
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
          >⚠️ {apiError}</motion.div>
        )}

        <motion.form onSubmit={handleSubmit} noValidate
          variants={containerVariants} initial="hidden" animate="visible"
        >
          {/* Full Name */}
          <motion.div className="form-group" variants={fieldVariant}>
            <label>Full Name</label>
            <input type="text" name="full_name" placeholder="Enter your full name"
              value={form.full_name} onChange={handleChange}
              className={errors.full_name ? 'error-input' : ''}
              autoComplete="name"
            />
            {errors.full_name && <span className="field-error">⚠ {errors.full_name}</span>}
          </motion.div>

          {/* Email */}
          <motion.div className="form-group" variants={fieldVariant}>
            <label>Email Address</label>
            <div className="input-with-status">
              <input type="email" name="email" placeholder="Enter your email address"
                value={form.email} onChange={handleChange}
                className={errors.email ? 'error-input' : emailCheck === 'ok' ? 'ok-input' : ''}
                autoComplete="email"
              />
              <StatusIcon />
            </div>
            {errors.email && <span className="field-error">⚠ {errors.email}</span>}
          </motion.div>

          {/* Password */}
          <motion.div className="form-group" variants={fieldVariant}>
            <label>Password</label>
            <div className="input-with-status">
              <input
                type={showPwd ? 'text' : 'password'} name="password"
                placeholder="Create a strong password"
                value={form.password} onChange={handleChange}
                className={errors.password ? 'error-input' : ''}
                autoComplete="new-password" style={{ paddingRight: '44px' }}
              />
              <button type="button" className="check-status"
                onClick={() => setShowPwd(v => !v)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', right: '12px', opacity: 0.6, pointerEvents: 'auto' }}
                tabIndex={-1}
              >{showPwd ? '🙈' : '👁️'}</button>
            </div>
            {form.password && (
              <div className="strength-wrapper">
                <div className="strength-bars">
                  {[1,2,3,4,5].map(i => (
                    <motion.div key={i} className="strength-segment"
                      animate={{ background: i <= strength ? meta.color : 'rgba(255,255,255,0.1)' }}
                      transition={{ duration: 0.3 }}
                    />
                  ))}
                </div>
                <span className="strength-label" style={{ color: meta.color }}>{meta.label}</span>
              </div>
            )}
            {errors.password && <span className="field-error">⚠ {errors.password}</span>}
          </motion.div>

          {/* Confirm Password */}
          <motion.div className="form-group" variants={fieldVariant}>
            <label>Confirm Password</label>
            <input type="password" name="confirm_password" placeholder="Repeat your password"
              value={form.confirm_password} onChange={handleChange}
              className={errors.confirm_password ? 'error-input' : form.confirm_password && form.confirm_password === form.password ? 'ok-input' : ''}
              autoComplete="new-password"
            />
            {form.confirm_password && form.confirm_password === form.password && !errors.confirm_password && (
              <span className="field-ok">✓ Passwords match</span>
            )}
            {errors.confirm_password && <span className="field-error">⚠ {errors.confirm_password}</span>}
          </motion.div>

          <motion.button
            type="submit" className="btn-primary reg-btn"
            disabled={loading || emailCheck === 'taken'}
            style={{ marginTop: '8px' }}
            whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
            variants={fieldVariant}
          >
            {loading ? <><span className="spinner" />Creating account...</> : 'Create Account'}
          </motion.button>
        </motion.form>

        <motion.div className="auth-link"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
        >
          Already have an account? <Link to="/login">Sign In</Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
