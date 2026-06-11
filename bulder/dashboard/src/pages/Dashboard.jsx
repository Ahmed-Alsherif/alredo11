import Topbar from '../components/Topbar';
import { FiUsers, FiTruck, FiDollarSign, FiTrendingUp, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useState, useEffect } from 'react';
import api from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [financials, setFinancials] = useState({ monthly_revenue: [], monthly_expenses: [] });
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, finRes, notifRes] = await Promise.all([
          api.get('/reports/dashboard/'),
          api.get('/reports/financial/'),
          api.get('/notifications/')
        ]);
        setStats(statsRes.data);
        setFinancials(finRes.data);
        setNotifications(notifRes.data.slice(0, 5)); // Just get the latest 5
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div style={{color:'#fff', padding:40}}>جاري تحميل البيانات...</div>;
  if (!stats) return <div style={{color:'#fff', padding:40}}>فشل في تحميل البيانات</div>;

  const totalSubscribers = stats.subscribers_count;
  const activeZones = stats.zones_count;
  const totalRevenue = stats.total_revenue;
  const openComplaints = stats.open_complaints;

  // Since we don't have historical growth from backend easily yet, let's just make a simple chart from color distribution
  const zoneDistribution = [
    { name: 'منتظم (أخضر)', value: stats.color_distribution.green || 0 },
    { name: 'متأخر بسيط (أصفر)', value: stats.color_distribution.yellow || 0 },
    { name: 'متأخر (أحمر)', value: stats.color_distribution.red || 0 },
  ].filter(i => i.value > 0);

  // Map financial data to chart format
  // It returns [{ month: '2026-05-01', revenue: 500 }, ...]
  const chartData = financials.monthly_revenue.map(r => {
    const expenses = financials.monthly_expenses.find(e => e.month === r.month)?.total || 0;
    return {
      month: new Date(r.month).toLocaleDateString('ar-SA', { month: 'short' }),
      revenue: r.revenue,
      expenses: expenses
    };
  });

  return (
    <>
      <Topbar title="لوحة التحكم" subtitle="نظرة عامة على النظام" />
      <div className="page-content">
        {/* Stats */}
        <div className="stats-grid fade-in">
          <div className="stat-card purple">
            <div className="stat-info">
              <h4>إجمالي المشتركين</h4>
              <div className="stat-value">{totalSubscribers.toLocaleString()}</div>
              <div className="stat-change up"><FiTrendingUp /> +12% هذا الشهر</div>
            </div>
            <div className="stat-icon"><FiUsers /></div>
          </div>

          <div className="stat-card teal">
            <div className="stat-info">
              <h4>المناطق النشطة</h4>
              <div className="stat-value">{activeZones}</div>
              <div className="stat-change up"><FiTrendingUp /> نشط حالياً</div>
            </div>
            <div className="stat-icon"><FiTruck /></div>
          </div>

          <div className="stat-card green">
            <div className="stat-info">
              <h4>إجمالي الإيرادات</h4>
              <div className="stat-value">{totalRevenue.toLocaleString()} <span style={{fontSize:'0.9rem'}}>ر.س</span></div>
              <div className="stat-change up"><FiTrendingUp /> الأرباح: {stats.net_profit.toLocaleString()} ر.س</div>
            </div>
            <div className="stat-icon"><FiDollarSign /></div>
          </div>

          <div className="stat-card orange">
            <div className="stat-info">
              <h4>الشكاوى المفتوحة</h4>
              <div className="stat-value">{openComplaints}</div>
              <div className="stat-change down"><FiAlertCircle /> تحتاج متابعة</div>
            </div>
            <div className="stat-icon"><FiAlertCircle /></div>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="charts-grid fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="card">
            <div className="card-header">
              <h3>توزيع حالة المشتركين</h3>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={zoneDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {zoneDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={
                      entry.name.includes('أخضر') ? '#00b894' :
                      entry.name.includes('أصفر') ? '#fdcb6e' : '#e17055'
                    } />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f0f0f5' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <div className="card-header">
              <h3>💰 الإيرادات والمصروفات</h3>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="#555570" fontSize={12} />
                <YAxis stroke="#555570" fontSize={12} />
                <Tooltip
                  contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f0f0f5' }}
                />
                <Bar dataKey="revenue" fill="#6c5ce7" radius={[4, 4, 0, 0]} name="الإيرادات" />
                <Bar dataKey="expenses" fill="#00cec9" radius={[4, 4, 0, 0]} name="المصروفات" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>



        {/* Recent Activity */}
        <div className="card fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="card-header">
            <h3>🔔 آخر الإشعارات</h3>
          </div>
          <div>
            {notifications.map(n => (
              <div key={n.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
                borderBottom: '1px solid rgba(255,255,255,0.04)', opacity: n.is_read ? 0.6 : 1
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: n.type === 'system' ? 'rgba(108,92,231,0.15)' :
                    n.type === 'complaint' ? 'rgba(253,203,110,0.15)' :
                    n.type === 'payment' ? 'rgba(0,184,148,0.15)' : 'rgba(108,92,231,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem',
                  color: n.type === 'system' ? '#6c5ce7' :
                    n.type === 'complaint' ? '#fdcb6e' :
                    n.type === 'payment' ? '#00b894' : '#6c5ce7',
                  flexShrink: 0
                }}>
                  {n.type === 'system' ? <FiCheckCircle /> : <FiAlertCircle />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: !n.is_read ? 600 : 400 }}>{n.title}</div>
                  <div style={{ fontSize: '0.75rem', color: '#555570' }}>{new Date(n.created_at).toLocaleDateString('ar-SA')}</div>
                </div>
                {!n.is_read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6c5ce7' }}></span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
