import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import HomePage          from './pages/Homepage';
import Login             from './pages/Login';
import Register          from './pages/Register';
import UserDashboard     from './pages/UserDashboard';
import AdminDashboard    from './pages/AdminDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import Forbidden         from './pages/Forbidden';
import Navbar            from './components/Navbar';
import { FileStoreProvider } from './stores/useFileStore';

/* ── Dark-mode context ─────────────────────────────────────────────────── */
export const DarkModeContext = createContext({ dark: false, toggle: () => {} });
export const useDark = () => useContext(DarkModeContext);

/* ── Auth context ──────────────────────────────────────────────────────── */
const defaultAuth = { user: null, login: () => {}, logout: () => {}, updateUser: () => {} };
export const AuthContext = createContext(defaultAuth);
export const useAuth = () => useContext(AuthContext);

function loadUser() {
  try { return JSON.parse(localStorage.getItem('dqai_user') || 'null'); }
  catch { return null; }
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUser);

  const login = useCallback((payload) => {
    const u = {
      id:                  payload.id,
      name:                payload.name  ?? 'User',
      email:               payload.email ?? '',
      role:                payload.role  ?? 'user',
      must_change_password: payload.must_change_password ?? false,
    };
    localStorage.setItem('dqai_user', JSON.stringify(u));
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('dqai_user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  }, []);

  const updateUser = useCallback((patch) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...patch };
      localStorage.setItem('dqai_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

/* ── Route guards ──────────────────────────────────────────────────────── */
function RequireAuth({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function RequireRole({ role, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to="/403" replace />;
  return children;
}

/* ── Page fade wrapper ─────────────────────────────────────────────────── */
function Page({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: 'easeInOut' }}
      style={{ minHeight: '100vh' }}
    >
      {children}
    </motion.div>
  );
}

/* ── Animated route tree ───────────────────────────────────────────────── */
function AnimatedRoutes() {
  const location = useLocation();
  const { dark, toggle } = useContext(DarkModeContext);
  const { user, logout } = useAuth();

  return (
    <>
      <Navbar darkMode={dark} toggleDark={toggle} user={user} onLogout={logout} />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>

          {/* Public */}
          <Route path="/"         element={<Page><HomePage /></Page>} />
          <Route path="/login"    element={<Page><Login /></Page>} />
          <Route path="/register" element={<Page><Register /></Page>} />
          <Route path="/403"      element={<Page><Forbidden /></Page>} />

          {/* User dashboard */}
          <Route path="/user/dashboard" element={
            <RequireRole role="user">
              <Page><UserDashboard /></Page>
            </RequireRole>
          } />

          {/* Admin dashboard */}
          <Route path="/admin/dashboard" element={
            <RequireRole role="admin">
              <Page><AdminDashboard /></Page>
            </RequireRole>
          } />

          {/* Super Admin dashboard */}
          <Route path="/super-admin/dashboard" element={
            <RequireRole role="super_admin">
              <Page><SuperAdminDashboard /></Page>
            </RequireRole>
          } />

          {/* Legacy dashboard paths — redirect authenticated users to their own dashboard */}
          <Route path="/dashboard"  element={<RequireAuth><RoleRedirect /></RequireAuth>} />
          <Route path="/dashboard1" element={<RequireAuth><RoleRedirect /></RequireAuth>} />
          <Route path="/dashboard2" element={<RequireAuth><RoleRedirect /></RequireAuth>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </>
  );
}

function RoleRedirect() {
  const { user } = useAuth();
  const map = { super_admin: '/super-admin/dashboard', admin: '/admin/dashboard', user: '/user/dashboard' };
  return <Navigate to={map[user?.role] ?? '/'} replace />;
}

/* ── Root ──────────────────────────────────────────────────────────────── */
export default function App() {
  const [dark, setDark] = useState(false);
  const toggle = () => { setDark(d => !d); document.documentElement.classList.toggle('dark'); };

  return (
    <DarkModeContext.Provider value={{ dark, toggle }}>
      <AuthProvider>
        <FileStoreProvider>
          <BrowserRouter>
            <AnimatedRoutes />
          </BrowserRouter>
        </FileStoreProvider>
      </AuthProvider>
    </DarkModeContext.Provider>
  );
}
