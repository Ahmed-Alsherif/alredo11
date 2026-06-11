import { useEffect, useState } from 'react';
import { FiBell, FiSearch } from 'react-icons/fi';
import api from '../api';

export default function Topbar({ title, subtitle }) {
  const [notifs, setNotifs] = useState([]);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await api.get('/notifications/');
        setNotifs(res.data.slice(0, 5));
      } catch {
        setNotifs([]);
      }
    };
    fetchNotifs();
  }, []);

  const unreadCount = notifs.filter((n) => !n.is_read).length;

  return (
    <header className="topbar">
      <div className="page-title">
        <h1>{title}</h1>
        {subtitle && <span>{subtitle}</span>}
      </div>
      <div className="topbar-actions">
        <button className="action-btn" title="بحث">
          <FiSearch />
        </button>
        <button className="action-btn" title="الإشعارات">
          <FiBell />
          {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
        </button>
      </div>
    </header>
  );
}
