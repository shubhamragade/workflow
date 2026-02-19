import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  FolderKanban,
  ClipboardList,
  Lightbulb,
  BarChart3,
  Users,
  Orbit,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import WorkLogs from './pages/WorkLogs';
import Decisions from './pages/Decisions';
import Summaries from './pages/Summaries';
import Members from './pages/Members';
import Login from './pages/Login';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

function MainLayout() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'Admin';
  return (
    <div className="flex min-h-screen bg-background text-text-main font-sans selection:bg-primary/30">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-surface/20 flex flex-col sticky top-0 h-screen overflow-y-auto">
        <div className="p-8 flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20 shadow-soft">
            <Orbit className="text-primary w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-text-main">
            ContextFlow
          </h1>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <SidebarLink to="/" icon={<LayoutDashboard size={18} />} label="Overview" />
          <SidebarLink to="/projects" icon={<FolderKanban size={18} />} label="Projects" />
          <SidebarLink to="/tasks" icon={<ClipboardList size={18} />} label="Execution" />
          <SidebarLink to="/logs" icon={<ClipboardList size={18} />} label="Daily Logs" />
          <SidebarLink to="/decisions" icon={<Lightbulb size={18} />} label="Decisions" />
          {isAdmin && <SidebarLink to="/summaries" icon={<BarChart3 size={18} />} label="Analytics" />}
          {isAdmin && <SidebarLink to="/members" icon={<Users size={18} />} label="Team" />}
        </nav>

        <div className="p-4 border-t border-border mt-auto space-y-3">
          <div className="bg-surface/40 p-3 rounded-xl border border-border flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-xs uppercase">
              {user?.name?.substring(0, 2) || '??'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-semibold truncate text-text-main">{user?.name || 'Unknown User'}</p>
              <p className="text-[10px] text-text-muted truncate uppercase tracking-tighter">{user?.role || 'Guest'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2 border border-error/20 bg-error/5 text-error text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-error/10 transition-all"
          >
            <LogOut size={14} /> Exit System
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-background/50 relative overflow-y-auto">
        <div className="max-w-[1400px] mx-auto min-h-full p-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/logs" element={<WorkLogs />} />
            <Route path="/decisions" element={<Decisions />} />
            <Route path="/summaries" element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <Summaries />
              </ProtectedRoute>
            } />
            <Route path="/members" element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <Members />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </main>
    </div>
  );
}

function SidebarLink({ to, icon, label }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`
        flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 group
        ${isActive
          ? 'bg-primary/10 text-primary border border-primary/10 shadow-sm'
          : 'text-text-muted hover:bg-glass hover:text-white'}
      `}
    >
      <div className="flex items-center gap-3">
        <span className={`${isActive ? 'text-primary' : 'text-text-muted group-hover:text-white'} transition-colors`}>
          {icon}
        </span>
        <span className="text-sm font-medium tracking-wide">{label}</span>
      </div>
      {isActive && (
        <motion.div
          layoutId="active-indicator"
          className="w-1 h-4 bg-primary rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)]"
        />
      )}
    </Link>
  );
}

export default App;
