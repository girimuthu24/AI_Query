import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Moon, Sun, Database, User, LogOut, ChevronDown,
         LayoutDashboard, ShieldCheck } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

/* ─────────────────────────────────────────────────────────────────────────
   RBAC nav item sets
───────────────────────────────────────────────────────────────────────── */
const PUBLIC_LINKS = [
  { label: 'Home',     to: '/',         type: 'link' },
  { label: 'Features', to: '/#features', type: 'link' },
  { label: 'About',    to: '/#about',    type: 'link' },
];

const AUTH_LINKS = [
  { label: 'Home', to: '/', type: 'link' },
];

/* ─────────────────────────────────────────────────────────────────────────
   NavLink — hover slide underline + active state
───────────────────────────────────────────────────────────────────────── */
function NavLink({ label, to, isActive }) {
  const [hovered, setHovered] = useState(false);
  const lit = isActive || hovered;

  return (
    <Link
      to={to}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 14,
        color: lit ? '#38BDF8' : 'rgba(255,255,255,0.82)',
        textDecoration: 'none', paddingBottom: 4,
        transition: 'color 0.2s', whiteSpace: 'nowrap',
      }}
    >
      {label}
      <motion.span
        initial={false}
        animate={{ scaleX: lit ? 1 : 0, opacity: lit ? 1 : 0 }}
        transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: 2, borderRadius: 2,
          background: 'linear-gradient(90deg,#3B82F6,#38BDF8)',
          transformOrigin: 'left', display: 'block',
        }}
      />
    </Link>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Gradient button (Login / Register)
───────────────────────────────────────────────────────────────────────── */
const BTN_CFG = {
  blue:   { bg: 'linear-gradient(135deg,#3B82F6,#06B6D4)', sh: 'rgba(59,130,246,0.40)', shH: 'rgba(59,130,246,0.65)', hover: { y: -3 }, fw: 600 },
  purple: { bg: 'linear-gradient(135deg,#8B5CF6,#EC4899)', sh: 'rgba(139,92,246,0.38)', shH: 'rgba(236,72,153,0.55)', hover: { scale: 1.06 }, fw: 700 },
};

function GradBtn({ label, to, variant }) {
  const c = BTN_CFG[variant];
  return (
    <motion.div
      whileHover={{ ...c.hover, boxShadow: `0 8px 24px ${c.shH}` }}
      whileTap={{ scale: 0.96 }}
      style={{ background: c.bg, boxShadow: `0 4px 14px ${c.sh}`, borderRadius: 10 }}
    >
      <Link to={to} style={{ display: 'block', padding: '8px 20px', fontFamily: "'Poppins',sans-serif", fontWeight: c.fw, fontSize: 13, color: '#fff', textDecoration: 'none', whiteSpace: 'nowrap' }}>
        {label}
      </Link>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   User profile dropdown (logged-in)
───────────────────────────────────────────────────────────────────────── */
function ProfileDropdown({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  // close on outside click
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const initials = user.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';
  const roleColor = user.role === 'super_admin' ? '#EF4444' : user.role === 'admin' ? '#8B5CF6' : '#3B82F6';
  const dashPath  = user.role === 'super_admin' ? '/super-admin/dashboard' : user.role === 'admin' ? '/admin/dashboard' : '/user/dashboard';

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <motion.button
        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 12px 6px 6px', borderRadius: 12,
          background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
          cursor: 'pointer', color: '#fff',
        }}
      >
        {/* avatar */}
        <div style={{ width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 12, background: `linear-gradient(135deg,${roleColor},#38BDF8)`, flexShrink: 0 }}>
          {initials}
        </div>
        <div style={{ textAlign: 'left' }}>
          <p style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 12, color: '#fff', lineHeight: 1.1 }}>{user.name}</p>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 1, textTransform: 'capitalize' }}>{user.role}</p>
        </div>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ color: 'rgba(255,255,255,0.45)', display: 'flex' }}>
          <ChevronDown size={13} />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              width: 200, borderRadius: 14, overflow: 'hidden',
              background: 'rgba(15,23,42,0.98)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.10)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.55)', zIndex: 60,
            }}
          >
            {/* user info strip */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <p style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 13, color: '#fff' }}>{user.name}</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>{user.email}</p>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6, padding: '2px 8px', borderRadius: 20, background: `${roleColor}22`, border: `1px solid ${roleColor}44`, fontSize: 10, fontWeight: 700, color: roleColor, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {user.role === 'admin' ? <ShieldCheck size={9} /> : <User size={9} />} {user.role}
              </span>
            </div>

            {/* menu items */}
            {[
              { icon: User,            label: 'My Profile',  action: () => { setOpen(false); } },
              { icon: LayoutDashboard, label: 'My Dashboard', action: () => { setOpen(false); navigate(dashPath); } },
            ].map(({ icon: Icon, label, action }) => (
              <button key={label} onClick={action}
                style={{ width: '100%', padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, color: 'rgba(255,255,255,0.72)', fontFamily: "'Poppins',sans-serif", fontWeight: 500, fontSize: 13, transition: 'background 0.15s, color 0.15s', textAlign: 'left' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(255,255,255,0.72)'; }}
              >
                <Icon size={14} /> {label}
              </button>
            ))}

            {/* logout */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '6px 8px' }}>
              <button onClick={() => { setOpen(false); onLogout(); }}
                style={{ width: '100%', padding: '10px 10px', borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, color: '#F87171', fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 13, transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.10)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Mobile item
───────────────────────────────────────────────────────────────────────── */
function MobileLink({ label, to, isActive, onClose }) {
  return (
    <Link to={to} onClick={onClose}
      style={{
        display: 'block', padding: '11px 14px', borderRadius: 10,
        fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 14,
        color: isActive ? '#38BDF8' : 'rgba(255,255,255,0.78)',
        textDecoration: 'none',
        background: isActive ? 'rgba(56,189,248,0.08)' : 'transparent',
        borderLeft: isActive ? '2px solid #38BDF8' : '2px solid transparent',
      }}
    >
      {label}
    </Link>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Navbar
───────────────────────────────────────────────────────────────────────── */
export default function Navbar({ darkMode, toggleDark, user, onLogout }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const isLoggedIn = !!user;

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  // RBAC: pick the correct nav link set
  const navLinks = isLoggedIn ? AUTH_LINKS : PUBLIC_LINKS;

  return (
    <motion.header
      initial={{ y: -72, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: scrolled
          ? 'linear-gradient(90deg,rgba(15,23,42,0.97),rgba(30,41,59,0.97))'
          : 'linear-gradient(90deg,rgba(15,23,42,0.82),rgba(30,41,59,0.82))',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        boxShadow: scrolled ? '0 4px 36px rgba(0,0,0,0.50)' : '0 2px 16px rgba(0,0,0,0.28)',
        transition: 'background 0.35s, box-shadow 0.35s',
      }}
    >
      {/* 4-colour accent bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,#3B82F6 0%,#06B6D4 35%,#8B5CF6 65%,#10B981 100%)', opacity: 0.75 }} />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 28px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <motion.div whileHover={{ rotate: [0, -8, 8, 0], transition: { duration: 0.5 } }}
            style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(59,130,246,0.40)' }}
          >
            <Database size={17} color="#fff" />
          </motion.div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <motion.span
              whileHover={{ textShadow: '0 0 16px rgba(56,189,248,0.9),0 0 32px rgba(56,189,248,0.5)' }}
              style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 800, fontSize: 21, color: '#38BDF8', letterSpacing: '-0.02em' }}
            >DQai</motion.span>
            <span style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 400, fontSize: 10, color: '#94A3B8', letterSpacing: '0.09em', marginTop: 1 }}>Data Query AI</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex" style={{ alignItems: 'center', gap: 30 }}>
          {/* RBAC link set */}
          {navLinks.map(item => (
            <NavLink key={item.to} label={item.label} to={item.to} isActive={pathname === item.to} />
          ))}

          {/* Auth actions — shown only when logged OUT */}
          {!isLoggedIn && (
            <>
              <GradBtn label="Login"    to="/login"    variant="blue" />
              <GradBtn label="Register" to="/register" variant="purple" />
            </>
          )}
        </nav>

        {/* Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* dark-mode toggle */}
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }} onClick={toggleDark}
            style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.55)' }}
          >
            {darkMode ? <Sun size={15} /> : <Moon size={15} />}
          </motion.button>

          {/* Profile dropdown — logged IN only */}
          {isLoggedIn && (
            <div className="hidden md:block">
              <ProfileDropdown user={user} onLogout={onLogout} />
            </div>
          )}

          {/* Mobile hamburger */}
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setMenuOpen(v => !v)} className="md:hidden"
            style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
          >
            {menuOpen ? <X size={17} /> : <Menu size={17} />}
          </motion.button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div key="mob"
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden', background: 'rgba(11,17,32,0.98)', borderTop: '1px solid rgba(255,255,255,0.07)', padding: '10px 20px 18px' }}
          >
            {navLinks.map(item => (
              <MobileLink key={item.to} label={item.label} to={item.to} isActive={pathname === item.to} onClose={() => setMenuOpen(false)} />
            ))}

            {/* auth buttons */}
            {!isLoggedIn ? (
              <div style={{ display: 'flex', gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                {[{ label:'Login', to:'/login', bg:'linear-gradient(135deg,#3B82F6,#06B6D4)' }, { label:'Register', to:'/register', bg:'linear-gradient(135deg,#8B5CF6,#EC4899)' }].map(b => (
                  <Link key={b.label} to={b.to} onClick={() => setMenuOpen(false)}
                    style={{ flex: 1, padding: '10px 0', borderRadius: 10, background: b.bg, color: '#fff', fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 13, textDecoration: 'none', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >{b.label}</Link>
                ))}
              </div>
            ) : (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', marginBottom: 6 }}>
                  <p style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 13, color: '#fff' }}>{user.name}</p>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'capitalize' }}>{user.role}</p>
                </div>
                <button onClick={() => { setMenuOpen(false); onLogout(); }}
                  style={{ width: '100%', padding: '11px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#F87171', fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
