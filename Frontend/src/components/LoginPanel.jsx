import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, Eye, EyeOff, Camera, ShieldCheck, User, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const METHODS = [
  { id: 'email', label: 'Email + Password' },
  { id: 'otp',   label: 'OTP Login' },
  { id: 'face',  label: 'Face Recognition' },
];

/* ── Input with icon ── */
function PanelInput({ icon: Icon, type = 'text', placeholder, value, onChange, right }) {
  return (
    <div style={{ position: 'relative' }}>
      <Icon size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.35)', pointerEvents: 'none' }} />
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{
          width: '100%', background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.13)', borderRadius: 12,
          padding: '13px 16px 13px 42px', paddingRight: right ? 44 : 16,
          color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'inherit',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
        onFocus={e => {
          e.target.style.borderColor = 'rgba(37,99,235,0.7)';
          e.target.style.boxShadow  = '0 0 0 3px rgba(37,99,235,0.18), 0 0 16px rgba(37,99,235,0.3)';
        }}
        onBlur={e => {
          e.target.style.borderColor = 'rgba(255,255,255,0.13)';
          e.target.style.boxShadow  = 'none';
        }}
      />
      {right}
    </div>
  );
}

/* ── Full-width action button ── */
function PanelBtn({ label, gradient, onClick, disabled }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, boxShadow: '0 8px 28px rgba(37,99,235,0.45)' }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%', padding: '13px 0', borderRadius: 12, border: 'none',
        background: gradient, color: '#fff', fontWeight: 700, fontSize: 15,
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1,
        fontFamily: 'inherit', transition: 'opacity 0.2s',
      }}
    >
      {label}
    </motion.button>
  );
}

export default function LoginPanel({ isOpen, onClose }) {
  const [tab,     setTab]     = useState('user');   // 'user' | 'admin'
  const [method,  setMethod]  = useState('email');  // 'email' | 'otp' | 'face'
  const [email,   setEmail]   = useState('');
  const [pw,      setPw]      = useState('');
  const [showPw,  setShowPw]  = useState(false);
  const [busy,    setBusy]    = useState(false);
  const [sent,    setSent]    = useState(false);
  const [scanning,setScanning]= useState(false);
  const navigate = useNavigate();

  /* ESC closes */
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  /* lock scroll */
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  /* reset method state when method changes */
  useEffect(() => { setSent(false); setScanning(false); }, [method]);

  const handleLogin = async () => {
    setBusy(true);
    await new Promise(r => setTimeout(r, 1400));
    setBusy(false);
    localStorage.setItem('access_token', 'demo-token');
    onClose();
    navigate('/dashboard');
  };

  const handleSendOtp = async () => {
    setBusy(true);
    await new Promise(r => setTimeout(r, 1200));
    setBusy(false);
    setSent(true);
  };

  const handleFace = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      localStorage.setItem('access_token', 'demo-token');
      onClose();
      navigate('/dashboard');
    }, 3000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="lp-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', zIndex: 200 }}
          />

          {/* Panel */}
          <motion.div
            key="lp-panel"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.35, ease: 'easeOut' }}
            style={{
              position: 'fixed', top: 0, right: 0, height: '100vh', width: 384,
              zIndex: 201, overflowY: 'auto',
              background: 'rgba(11,17,32,0.97)',
              backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
              borderLeft: '1px solid rgba(255,255,255,0.1)',
              display: 'flex', flexDirection: 'column',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Top gradient accent */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#2563EB,#38BDF8,#7C3AED)', borderRadius: '0 0 2px 2px' }} />

            <div style={{ padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: 24, flex: 1 }}>

              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#2563EB,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheck size={18} color="#fff" />
                  </div>
                  <div>
                    <p style={{ fontWeight: 800, color: '#fff', fontSize: 14, lineHeight: 1.1 }}>DQai</p>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>Data Query AI</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ rotate: 90, scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.6)' }}
                >
                  <X size={15} />
                </motion.button>
              </div>

              {/* Title */}
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', marginBottom: 4 }}>Sign In</h2>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>Access your AI-powered analytics workspace.</p>
              </div>

              {/* Role tabs */}
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4, gap: 2 }}>
                {[{ id: 'user', label: 'User Login', Icon: User }, { id: 'admin', label: 'Admin Login', Icon: ShieldCheck }].map(({ id, label, Icon }) => {
                  const active = tab === id;
                  return (
                    <motion.button
                      key={id} onClick={() => setTab(id)}
                      whileTap={{ scale: 0.97 }}
                      style={{
                        flex: 1, padding: '9px 0', borderRadius: 9, border: 'none', cursor: 'pointer',
                        background: active ? 'rgba(37,99,235,0.25)' : 'transparent',
                        fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
                        color: active ? '#60A5FA' : 'rgba(255,255,255,0.45)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        transition: 'background 0.2s, color 0.2s',
                        position: 'relative',
                      }}
                    >
                      <Icon size={13} /> {label}
                      {/* gradient underline */}
                      {active && (
                        <motion.div
                          layoutId="tab-underline"
                          style={{ position: 'absolute', bottom: 2, left: '15%', right: '15%', height: 2, borderRadius: 2, background: 'linear-gradient(90deg,#2563EB,#38BDF8)' }}
                        />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Auth method pills */}
              <div style={{ display: 'flex', gap: 6 }}>
                {METHODS.map(({ id, label }) => {
                  const active = method === id;
                  return (
                    <motion.button
                      key={id} onClick={() => setMethod(id)}
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                      style={{
                        flex: 1, padding: '7px 4px', borderRadius: 20, border: 'none',
                        background: active ? 'linear-gradient(90deg,#2563EB,#06B6D4)' : 'rgba(255,255,255,0.07)',
                        color: active ? '#fff' : 'rgba(255,255,255,0.5)',
                        fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                        transition: 'background 0.2s, color 0.2s',
                        boxShadow: active ? '0 4px 14px rgba(37,99,235,0.35)' : 'none',
                        whiteSpace: 'nowrap', textAlign: 'center',
                      }}
                    >
                      {label}
                    </motion.button>
                  );
                })}
              </div>

              {/* ── METHOD FORMS ── */}
              <AnimatePresence mode="wait">

                {/* Email + Password */}
                {method === 'email' && (
                  <motion.div key="email" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
                  >
                    <PanelInput icon={Mail} type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} />
                    <PanelInput
                      icon={Lock}
                      type={showPw ? 'text' : 'password'}
                      placeholder="Password"
                      value={pw}
                      onChange={e => setPw(e.target.value)}
                      right={
                        <button
                          type="button" onClick={() => setShowPw(v => !v)}
                          style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', display: 'flex', padding: 0 }}
                        >
                          {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      }
                    />
                    <PanelBtn
                      label={busy ? 'Signing in…' : 'Login'}
                      gradient="linear-gradient(90deg,#1d4ed8,#3B82F6,#60A5FA)"
                      onClick={handleLogin}
                      disabled={busy || !email || !pw}
                    />
                  </motion.div>
                )}

                {/* OTP */}
                {method === 'otp' && (
                  <motion.div key="otp" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
                  >
                    <PanelInput icon={Mail} type="email" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} />
                    {sent && (
                      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)', fontSize: 12, color: '#38BDF8', display: 'flex', alignItems: 'center', gap: 8 }}
                      >
                        <Send size={13} /> OTP sent to {email || 'your email'}. Check your inbox.
                      </motion.div>
                    )}
                    <PanelBtn
                      label={busy ? 'Sending…' : sent ? 'Resend OTP' : 'Send OTP'}
                      gradient="linear-gradient(90deg,#0e7490,#06B6D4,#38BDF8)"
                      onClick={handleSendOtp}
                      disabled={busy || !email}
                    />
                  </motion.div>
                )}

                {/* Face Recognition */}
                {method === 'face' && (
                  <motion.div key="face" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}
                  >
                    {/* Camera glow circle */}
                    <motion.div
                      animate={scanning
                        ? { boxShadow: ['0 0 20px rgba(124,58,237,0.5)', '0 0 50px rgba(124,58,237,0.9)', '0 0 20px rgba(124,58,237,0.5)'] }
                        : { boxShadow: '0 0 20px rgba(124,58,237,0.3)' }
                      }
                      transition={{ duration: 1.2, repeat: scanning ? Infinity : 0 }}
                      style={{ width: 100, height: 100, borderRadius: '50%', background: 'rgba(124,58,237,0.12)', border: '2px solid rgba(124,58,237,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
                    >
                      <Camera size={40} color="#a78bfa" />
                      {scanning && (
                        <motion.div
                          style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: '2px solid #7C3AED', opacity: 0 }}
                          animate={{ opacity: [0, 0.8, 0], scale: [1, 1.3, 1.6] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                      )}
                    </motion.div>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 1.5 }}>
                      {scanning ? 'Scanning your face…' : 'Click below to activate your camera and sign in with Face ID.'}
                    </p>
                    {/* Button + badge wrapper */}
                    <div style={{ position: 'relative', width: '100%' }}>
                      <PanelBtn
                        label={scanning ? 'Scanning…' : 'Face Login'}
                        gradient="linear-gradient(90deg,#5b21b6,#7C3AED,#a78bfa)"
                        onClick={handleFace}
                        disabled={scanning}
                      />
                      <span style={{
                        position: 'absolute', top: -10, right: 10,
                        background: '#D97706', color: '#fff', fontSize: 9, fontWeight: 800,
                        padding: '2px 8px', borderRadius: 20, letterSpacing: '0.06em', textTransform: 'uppercase',
                      }}>
                        Coming Soon
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Footer links */}
              <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between' }}>
                <button
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.4)', fontFamily: 'inherit', padding: 0, transition: 'color 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#60A5FA'; e.currentTarget.style.textDecoration = 'underline'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.textDecoration = 'none'; }}
                >
                  Forgot Password?
                </button>
                <a
                  href="/register"
                  style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecoration: 'none', transition: 'color 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#38BDF8'; e.currentTarget.style.textDecoration = 'underline'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.textDecoration = 'none'; }}
                >
                  Create New Account
                </a>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
