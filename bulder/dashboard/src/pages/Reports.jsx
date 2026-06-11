import Topbar from '../components/Topbar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { FiDownload } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import api from '../api';

const tabs = ['تشغيلي', 'مالي', 'النمو'];

export default function Reports() {
  const [activeTab, setActiveTab] = useState('تشغيلي');
  const [financialData, setFinancialData] = useState([]);
  const [operationalData, setOperationalData] = useState([]);
  const [zoneStats, setZoneStats] = useState([]);
  const [growthData, setGrowthData] = useState([]);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      // Financial
      const finRes = await api.get('/reports/financial/');
      const revenueMap = {};
      const expensesMap = {};
      (finRes.data.monthly_revenue || []).forEach(r => revenueMap[r.month] = r.revenue);
      (finRes.data.monthly_expenses || []).forEach(e => expensesMap[e.month] = e.total);
      const allMonths = Array.from(new Set([...Object.keys(revenueMap), ...Object.keys(expensesMap)])).sort();
      setFinancialData(allMonths.map(m => ({
        month: new Date(m).toLocaleDateString('ar-SA', { month: 'short' }),
        revenue: revenueMap[m] || 0,
        expenses: expensesMap[m] || 0,
        profit: (revenueMap[m] || 0) - (expensesMap[m] || 0)
      })));

      // Operational — FR-07-02
      const opRes = await api.get('/reports/operational/');
      setOperationalData(opRes.data.daily_completion || []);
      setZoneStats(opRes.data.zone_stats || []);

      // Growth — FR-07-04
      const grRes = await api.get('/reports/growth/');
      setGrowthData(grRes.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleExport = async (type) => {
    try {
      const response = await api.get(`/reports/export/?type=${type}&format=pdf`, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sall_report_${type}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert('حدث خطأ أثناء التصدير');
    }
  };

  return (
    <>
      <Topbar title="التقارير والإحصائيات" subtitle="تقارير تفصيلية وشاملة من البيانات الحقيقية" />
      <div className="page-content">
        <div className="toolbar fade-in">
          <div style={{ display: 'flex', gap: 8 }}>
            {tabs.map(t => (
              <button key={t} className={`btn btn-sm ${activeTab === t ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab(t)}>{t}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => handleExport('financial')}>
              <FiDownload /> تصدير مالي
            </button>
            <button className="btn btn-secondary" onClick={() => handleExport('subscribers')}>
              <FiDownload /> تصدير المشتركين
            </button>
            <button className="btn btn-secondary" onClick={() => handleExport('staff')}>
              <FiDownload /> تصدير الموظفين
            </button>
          </div>
        </div>

        {activeTab === 'تشغيلي' && (
          <div className="charts-grid fade-in">
            <div className="card">
              <div className="card-header"><h3>📊 نسبة الإنجاز اليومي (آخر 7 أيام)</h3></div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={operationalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="day" stroke="#555570" fontSize={12} />
                  <YAxis stroke="#555570" fontSize={12} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f0f0f5' }} formatter={v => [`${v}%`]} />
                  <Bar dataKey="completed" fill="#00b894" radius={[4, 4, 0, 0]} name="الإنجاز" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <div className="card-header"><h3>🏘️ إحصائيات المناطق</h3></div>
              <div style={{ padding: 10 }}>
                {zoneStats.length > 0 ? zoneStats.map((z, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{z.zone}</span>
                    <div style={{ display: 'flex', gap: 16, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <span>👥 {z.subscribers} مشترك</span>
                      <span style={{ color: z.complaints > 0 ? '#e17055' : '#00b894' }}>📋 {z.complaints} شكوى</span>
                      <span>🔔 {z.field_reports} بلاغ</span>
                    </div>
                  </div>
                )) : <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>لا توجد بيانات</p>}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'مالي' && (
          <div className="charts-grid fade-in">
            <div className="card">
              <div className="card-header"><h3>💰 الإيرادات مقابل المصروفات</h3></div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={financialData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" stroke="#555570" fontSize={12} />
                  <YAxis stroke="#555570" fontSize={12} />
                  <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f0f0f5' }} />
                  <Bar dataKey="revenue" fill="#6c5ce7" radius={[4, 4, 0, 0]} name="الإيرادات" />
                  <Bar dataKey="expenses" fill="#e17055" radius={[4, 4, 0, 0]} name="المصروفات" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <div className="card-header"><h3>📊 صافي الأرباح</h3></div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={financialData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" stroke="#555570" fontSize={12} />
                  <YAxis stroke="#555570" fontSize={12} />
                  <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f0f0f5' }} />
                  <Line type="monotone" dataKey="profit" stroke="#00cec9" strokeWidth={3} dot={{ fill: '#00cec9', r: 5 }} name="صافي الربح" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'النمو' && (
          <div className="charts-grid fade-in">
            <div className="card" style={{ gridColumn: '1 / -1' }}>
              <div className="card-header"><h3>📈 نمو المشتركين الشهري</h3></div>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" stroke="#555570" fontSize={12} />
                  <YAxis stroke="#555570" fontSize={12} />
                  <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f0f0f5' }} />
                  <Line type="monotone" dataKey="total" stroke="#6c5ce7" strokeWidth={3} dot={{ fill: '#6c5ce7', r: 6 }} name="إجمالي المشتركين" />
                  <Line type="monotone" dataKey="new" stroke="#00b894" strokeWidth={2} dot={{ fill: '#00b894', r: 4 }} name="جدد" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
