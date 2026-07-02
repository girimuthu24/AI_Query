import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../App';

const ROLE_REDIRECT = {
  super_admin: '/super-admin/dashboard',
  admin:       '/admin/dashboard',
  user:        '/user/dashboard',
};

export default function Forbidden() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate(user ? (ROLE_REDIRECT[user.role] ?? '/') : '/login', { replace: true });
    }, 3000);
    return () => clearTimeout(timer);
  }, [user, navigate]);

  return (
    <div style={{ minHeight: '100vh', background: '#0B1120', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ textAlign: 'center', padding: '48px 40px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 24, backdropFilter: 'blur(16px)', maxWidth: 420 }}
      >
        <div style={{ fontSize: 56, marginBottom: 16 }}>🚫</div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 8 }}>403 — Access Denied</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 20 }}>
          You don't have permission to view this page.
        </p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)' }}>
          Redirecting you to {user ? 'your dashboard' : 'login'} in 3 seconds...
        </p>
      </motion.div>
    </div>
  );
}
