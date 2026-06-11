import Topbar from '../components/Topbar';
import { useState, useEffect } from 'react';
import api from '../api';
import { FiAlertCircle, FiDollarSign, FiSettings } from 'react-icons/fi';

const typeInfo = {
  alert: { icon: <FiAlertCircle />, color: '#e17055', bg: 'rgba(225,112,85,0.12)', label: 'تنبيه' },
  complaint: { icon: <FiAlertCircle />, color: '#fdcb6e', bg: 'rgba(253,203,110,0.12)', label: 'شكوى' },
  payment: { icon: <FiDollarSign />, color: '#00b894', bg: 'rgba(0,184,148,0.12)', label: 'مالي' },
  system: { icon: <FiSettings />, color: '#6c5ce7', bg: 'rgba(108,92,231,0.12)', label: 'نظام' },
};

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications/');
      setNotifications(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{color:'#fff', padding:40}}>جاري تحميل البيانات...</div>;

  return (
    <>
      <Topbar title="مركز الإشعارات" subtitle="جميع التنبيهات والإشعارات" />
      <div className="page-content">
        <div className="card fade-in">
          {notifications.length === 0 && <div style={{textAlign: 'center', padding: 20}}>لا توجد إشعارات</div>}
          {notifications.map(n => {
            const info = typeInfo[n.type] || typeInfo.system;
            return (
              <div key={n.id} style={{
                display: 'flex', alignItems: 'center', gap: 15, padding: '16px 0',
                borderBottom: '1px solid rgba(255,255,255,0.04)', opacity: n.is_read ? 0.55 : 1,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10, background: info.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.1rem', color: info.color, flexShrink: 0
                }}>
                  {info.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: n.is_read ? 400 : 700, marginBottom: 3 }}>{n.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: 10 }}>
                    <span>{new Date(n.created_at).toLocaleString('ar-SA')}</span>
                    <span className={`badge ${n.type === 'alert' ? 'danger' : n.type === 'complaint' ? 'warning' : n.type === 'payment' ? 'success' : 'purple'}`} style={{ fontSize: '0.65rem', padding: '2px 8px' }}>{info.label}</span>
                  </div>
                </div>
                {!n.is_read && <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0 }}></span>}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
