import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { loginUser } from '../services/authService';
import { useAuth } from '../App';
import loginBg from '../assets/images/nature.jpg';
import './Login.css';

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECS = 30;

const Particle = ({ style }) => <div className="particle" style={style} />;

function genParticles() {
  return Array.from({ length: 18 }, () => ({
    left:              `${Math.random() * 100}%`,
    top:               `${Math.random() * 100}%`,
    width:             `${4 + Math.random() * 8}px`,
    height:            `${4 + Math.random() * 8}px`,
    animationDelay:    `${Math.random() * 5}s`,
    animationDuration: `${6 + Math.random() * 6}s`,
    opacity: 0.15 + Math.random() * 0.25,
  }));
}
const STATIC_PARTICLES = genParticles();

const ROLE_REDIRECT = {
  super_admin: '/super-admin/dashboard',
  admin:       '/admin/dashboard',
  user:        '/user/dashboard',
};

export default function Login() {
  const navigate = useNavigate();
  const { login, user } = useAuth();

  const [form, setForm]               = useState({ email: '', password: '', role: 'user' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError]       = useState('');
  const [loading, setLoading]         = useState(false);
  const [attempts, setAttempts]       = useState(0);
  const [locked, setLocked]           = useState(false);
  const [countdown, setCountdown]     = useState(0);
  const [shake, setShake]             = useState(false);
  const [showPwd, setShowPwd]         = useState(false);
  const timerRef = useRef(null);

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate(ROLE_REDIRECT[user.role] ?? '/', { replace: true });
  }, [user, navigate]);

  const startLockout = () => {
    setLocked(true);
    setCountdown(LOCKOUT_SECS);
    timerRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(timerRef.current);
          setLocked(false);
          setAttempts(0);
          setApiError('');
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  useEffect(() => () => clearInterval(timerRef.current), []);

  const triggerShake = () => { setShake(true); setTimeout(() => setShake(false), 600); };

  const validate = () => {
    const e = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email    = 'Enter a valid email address.';
    if (!form.password)                                   e.password = 'Password is required.';
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (locked || !validate()) return;
    setLoading(true);
    setApiError('');
    try {
      const { data } = await loginUser({ email: form.email.trim(), password: form.password, role: form.role });
      const { tokens, user: userData } = data;
      localStorage.setItem('access_token',  tokens.access);
      localStorage.setItem('refresh_token', tokens.refresh);
      login({
        id:                  userData.id,
        name:                userData.full_name,
        email:               userData.email,
        role:                userData.role,
        must_change_password: userData.must_change_password,
      });
      const redirect = ROLE_REDIRECT[userData.role] ?? '/';
      navigate(redirect, { replace: true });
    } catch (err) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      triggerShake();
      const serverErr = err.response?.data;
      if (serverErr?.email)    setFieldErrors(fe => ({ ...fe, email: Array.isArray(serverErr.email) ? serverErr.email[0] : serverErr.email }));
      else if (serverErr?.password) setApiError(Array.isArray(serverErr.password) ? serverErr.password[0] : serverErr.password);
      else if (serverErr?.account)  setApiError(Array.isArray(serverErr.account) ? serverErr.account[0] : serverErr.account);
      else setApiError('Login failed. Please check your credentials.');
      if (newAttempts >= MAX_ATTEMPTS) startLockout();
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setFieldErrors(fe => ({ ...fe, [name]: '' }));
    if (!locked) setApiError('');
  };

  return (
    <div className="login-page" style={{ backgroundImage: `url(${loginBg})` }}>
      <div className="login-overlay" />
      {STATIC_PARTICLES.map((s, i) => <Particle key={i} style={s} />)}
      <div className="glow-orb glow1" />
      <div className="glow-orb glow2" />
      <div className="glow-orb glow3" />

      <motion.div
        className={`glass-card login-card ${shake ? 'card-shake' : ''}`}
        initial={{ opacity: 0, y: 60, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div className="brand"
          initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }}
        >
          <motion.div className="logo-icon"
            animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
          >🔐</motion.div>
          <h1>Welcome Back</h1>
          <p>Sign in to your account</p>
        </motion.div>

        {/* Role buttons */}
        <motion.div className="role-btn-group"
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        >
          {[{ value: 'user', icon: '👤', label: 'User' }, { value: 'admin', icon: '🛡️', label: 'Admin' }, { value: 'super_admin', icon: '👑', label: 'SuperAdmin' }].map(({ value, icon, label }) => (
            <button key={value} type="button" disabled={locked}
              onClick={() => setForm(f => ({ ...f, role: value }))}
              className={`role-btn${form.role === value ? ' role-btn-active' : ''}`}
            >
              <span>{icon}</span>{label}
            </button>
          ))}
        </motion.div>

        {/* Attempt dots */}
        <AnimatePresence>
          {attempts > 0 && !locked && (
            <motion.div className="attempt-dots"
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            >
              {[1,2,3,4,5].map(i => (
                <span key={i} className={`dot ${i <= attempts ? 'dot-used' : 'dot-empty'}`} />
              ))}
              <span className="attempt-label">{MAX_ATTEMPTS - attempts} attempt{MAX_ATTEMPTS - attempts !== 1 ? 's' : ''} left</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {apiError && (
            <motion.div className="msg-error"
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
            >⚠️ {apiError}</motion.div>
          )}
        </AnimatePresence>

        {/* Lockout banner */}
        <AnimatePresence>
          {locked && (
            <motion.div className="lockout-banner"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            >
              <div className="lockout-icon">🔒</div>
              <div>
                <strong>Too many failed attempts</strong>
                <p>Try again in</p>
                <div className="countdown-ring">
                  <svg viewBox="0 0 60 60">
                    <circle cx="30" cy="30" r="26" />
                    <circle cx="30" cy="30" r="26"
                      strokeDasharray="163.4"
                      strokeDashoffset={163.4 - (163.4 * countdown) / LOCKOUT_SECS}
                    />
                  </svg>
                  <span>{countdown}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <motion.div className="form-group"
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
          >
            <label>Email Address</label>
            <div className="input-wrapper">
              <span className="input-icon">✉️</span>
              <input
                type="email" name="email"
                placeholder="Enter your email"
                value={form.email} onChange={handleChange}
                className={fieldErrors.email ? 'error-input' : ''}
                disabled={locked} autoComplete="email"
              />
            </div>
            {fieldErrors.email && <span className="field-error">⚠ {fieldErrors.email}</span>}
          </motion.div>

          {/* Password */}
          <motion.div className="form-group"
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}
          >
            <label>Password</label>
            <div className="input-wrapper">
              <span className="input-icon">🔑</span>
              <input
                type={showPwd ? 'text' : 'password'} name="password"
                placeholder="Enter your password"
                value={form.password} onChange={handleChange}
                className={fieldErrors.password ? 'error-input' : ''}
                disabled={locked} autoComplete="current-password"
              />
              <button type="button" className="pwd-toggle" onClick={() => setShowPwd(v => !v)} tabIndex={-1}>
                {showPwd ? '🙈' : '👁️'}
              </button>
            </div>
            {fieldErrors.password && <span className="field-error">⚠ {fieldErrors.password}</span>}
          </motion.div>

          <motion.button
            type="submit" className="btn-primary"
            disabled={loading || locked}
            style={{ marginTop: '12px' }}
            whileHover={!loading && !locked ? { scale: 1.03, y: -2 } : {}}
            whileTap={!loading && !locked ? { scale: 0.97 } : {}}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          >
            {loading ? (
              <><span className="spinner" />Verifying credentials...</>
            ) : locked ? (
              `🔒 Locked — wait ${countdown}s`
            ) : (
              'Sign In'
            )}
          </motion.button>
        </form>

        <motion.div className="auth-link"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
        >
          Don't have an account?{' '}
          <Link to="/register">Create New Account</Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
