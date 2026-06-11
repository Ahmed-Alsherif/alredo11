import { NavLink } from 'react-router-dom';
import {
  FiAlertCircle,
  FiBarChart2,
  FiBell,
  FiDollarSign,
  FiGrid,
  FiLogOut,
  FiMap,
  FiMapPin,
  FiRefreshCw,
  FiTruck,
  FiUsers,
} from 'react-icons/fi';

const operations = [
  { label: 'لوحة التشغيل', to: '/', icon: <FiGrid /> },
  { label: 'المناطق', to: '/zones', icon: <FiMap /> },
  { label: 'المسارات', to: '/routes', icon: <FiMapPin /> },
  { label: 'المشتركون', to: '/subscribers', icon: <FiUsers /> },
  { label: 'الموظفون', to: '/staff', icon: <FiUsers /> },
  { label: 'تتبع الشاحنات', to: '/tracking', icon: <FiTruck /> },
];

const management = [
  { label: 'الإشعارات', to: '/notifications', icon: <FiBell /> },
  { label: 'الشكاوى والبلاغات', to: '/complaints', icon: <FiAlertCircle /> },
  { label: 'التقارير', to: '/reports', icon: <FiBarChart2 /> },
  { label: 'التدوير والمكافآت', to: '/recycling', icon: <FiRefreshCw /> },
  { label: 'المالية', to: '/finance', icon: <FiDollarSign /> },
  { label: 'تسويات الجباية', to: '/settlements', icon: <FiDollarSign /> },
];

function NavSection({ title, items }) {
  return (
    <>
      <div className="nav-label">{title}</div>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <span className="icon">{item.icon}</span>
          {item.label}
        </NavLink>
      ))}
    </>
  );
}

export default function Sidebar({ user, onLogout, isOpen, closeSidebar }) {
  const displayName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username : 'مدير النظام';
  const roleName = user ? user.role_display || user.role : 'مدير النظام';
  const avatarLetter = displayName ? displayName.charAt(0).toUpperCase() : 'س';

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <div className="brand-icon">س</div>
        <div className="brand-text">
          <h2>سلة</h2>
          <span>إدارة النفايات والتدوير</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavSection title="التشغيل" items={operations} />
        <div style={{ marginTop: 10 }} />
        <NavSection title="الإدارة" items={management} />
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{avatarLetter}</div>
          <div className="user-details">
            <h4>{displayName}</h4>
            <span>{roleName}</span>
          </div>
        </div>
        <button className="logout-btn" onClick={onLogout} title="تسجيل الخروج">
          <FiLogOut />
        </button>
      </div>
    </aside>
  );
}
