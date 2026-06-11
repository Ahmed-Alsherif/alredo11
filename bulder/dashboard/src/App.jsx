import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from './api';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Zones from './pages/Zones';
import RoutesPage from './pages/Routes';
import Subscribers from './pages/Subscribers';
import Staff from './pages/Staff';
import Tracking from './pages/Tracking';
import Notifications from './pages/Notifications';
import Complaints from './pages/Complaints';
import Reports from './pages/Reports';
import Recycling from './pages/Recycling';
import Finance from './pages/Finance';
import Settlements from './pages/Settlements';

function AppLayout({ children, user, onLogout }) {
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [children]);

  return (
    <div className="app-layout">
      {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <Sidebar user={user} onLogout={onLogout} isOpen={isSidebarOpen} closeSidebar={() => setSidebarOpen(false)} />
      <div className="main-wrapper">
        <button className="mobile-toggle-btn" onClick={() => setSidebarOpen(true)}>
          ☰
        </button>
        {children}
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const res = await api.get('/users/me/');
          setUser(res.data);
        } catch (e) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      }
      setLoadingAuth(false);
    };
    initAuth();
  }, []);

  if (loadingAuth) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>جاري التحميل...</div>;
  }

  if (!user) {
    return (
      <BrowserRouter>
        <Login onLogin={(u) => setUser(u)} />
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <AppLayout user={user} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/zones" element={<Zones />} />
          <Route path="/routes" element={<RoutesPage />} />
          <Route path="/subscribers" element={<Subscribers />} />
          <Route path="/staff" element={<Staff />} />
          <Route path="/tracking" element={<Tracking />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/complaints" element={<Complaints />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/recycling" element={<Recycling />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/settlements" element={<Settlements />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
