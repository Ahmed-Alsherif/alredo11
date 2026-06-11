import Topbar from '../components/Topbar';
import { FiAward } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import api from '../api';

const badgeColors = {
  'حامي البيئة': { bg: 'rgba(0,184,148,0.15)', color: '#00b894' },
  'صديق البيئة': { bg: 'rgba(108,92,231,0.15)', color: '#6c5ce7' },
  'مساهم': { bg: 'rgba(116,185,255,0.15)', color: '#74b9ff' },
};

const rankEmoji = ['🥇', '🥈', '🥉'];

export default function Recycling() {
  const [stats, setStats] = useState({ total_operations: 0, active_participants: 0, total_bags: 0 });
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, leadRes] = await Promise.all([
          api.get('/recycling/stats/'),
          api.get('/recycling/leaderboard/')
        ]);
        setStats(statsRes.data);
        setLeaderboard(leadRes.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div style={{color:'#fff', padding:40}}>جاري تحميل البيانات...</div>;

  return (
    <>
      <Topbar title="التحفيز البيئي" subtitle="إعادة التدوير ولوحة المتصدرين" />
      <div className="page-content">
        <div className="stats-grid fade-in">
          <div className="stat-card green">
            <div className="stat-info">
              <h4>إجمالي عمليات التدوير</h4>
              <div className="stat-value">{stats.total_operations}</div>
            </div>
            <div className="stat-icon">♻️</div>
          </div>
          <div className="stat-card purple">
            <div className="stat-info">
              <h4>المشاركين النشطين</h4>
              <div className="stat-value">{stats.active_participants}</div>
            </div>
            <div className="stat-icon"><FiAward /></div>
          </div>
          <div className="stat-card teal">
            <div className="stat-info">
              <h4>أكياس تم فرزها</h4>
              <div className="stat-value">{stats.total_bags}</div>
            </div>
            <div className="stat-icon">🌿</div>
          </div>
        </div>

        <div className="card fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="card-header">
            <h3>🏆 لوحة المتصدرين البيئية</h3>
          </div>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>المرتبة</th><th>المشترك</th><th>المنطقة</th><th>النقاط</th><th>الرتبة البيئية</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((r, index) => {
                  const rank = index + 1;
                  const badge = r.badge || r.eco_badge || 'مساهم';
                  const bc = badgeColors[badge] || badgeColors['مساهم'];
                  return (
                    <tr key={r.rank || r.id || r.name}>
                      <td style={{ fontSize: '1.2rem' }}>{rankEmoji[rank - 1] || rank}</td>
                      <td>{r.name}</td>
                      <td>{r.zone || r.zone_name}</td>
                      <td style={{ fontWeight: 700, color: 'var(--secondary)' }}>{r.points.toLocaleString()}</td>
                      <td>
                        <span style={{ background: bc.bg, color: bc.color, padding: '4px 14px', borderRadius: 50, fontSize: '0.8rem', fontWeight: 700 }}>
                          {badge}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
