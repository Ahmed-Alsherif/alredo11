import { useState, useEffect } from 'react';
import Topbar from '../components/Topbar';
import api from '../api';
import { FiCheckCircle, FiXCircle, FiClock, FiFileText } from 'react-icons/fi';

export default function Settlements() {
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettlements();
  }, []);

  const fetchSettlements = async () => {
    try {
      const res = await api.get('/finance/settlements/');
      // Sort: pending first, then by date descending
      const sorted = res.data.sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (b.status === 'pending' && a.status !== 'pending') return 1;
        return new Date(b.created_at) - new Date(a.created_at);
      });
      setSettlements(sorted);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (!window.confirm('هل أنت متأكد من اعتماد محضر التسليم؟')) return;
    try {
      await api.post(`/finance/settlements/${id}/approve/`);
      fetchSettlements();
    } catch (e) {
      alert('حدث خطأ أثناء اعتماد المحضر');
    }
  };

  const handleReject = async (id) => {
    const note = window.prompt('يرجى كتابة سبب الرفض (ملاحظات للمندوب):');
    if (note === null) return; // User cancelled
    try {
      await api.post(`/finance/settlements/${id}/reject/`, { note });
      fetchSettlements();
    } catch (e) {
      alert('حدث خطأ أثناء رفض المحضر');
    }
  };

  if (loading) return <div style={{ color: '#fff', padding: 40 }}>جاري تحميل محاضر العهدة...</div>;

  return (
    <>
      <Topbar title="تسويات الجباية (العهد)" subtitle="مراجعة واعتماد عهد المناديب اليومية" />
      <div className="page-content">
        <div className="card fade-in">
          <div className="toolbar" style={{ marginBottom: 20 }}>
            <h3 style={{ fontWeight: 700 }}>سجل محاضر العهدة</h3>
          </div>
          
          {settlements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              لا توجد محاضر عهدة مسجلة بعد.
            </div>
          ) : (
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>رقم المحضر</th>
                    <th>المندوب</th>
                    <th>إجمالي المبلغ</th>
                    <th>التاريخ</th>
                    <th>الحالة</th>
                    <th>المحاسب (المعتمد)</th>
                    <th>ملاحظات</th>
                    <th>الإجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {settlements.map((s) => (
                    <tr key={s.id} style={{ backgroundColor: s.status === 'pending' ? 'rgba(255, 171, 0, 0.05)' : 'transparent' }}>
                      <td style={{ fontWeight: 600 }}>#{s.id}</td>
                      <td>{s.agent_name || 'غير معروف'}</td>
                      <td style={{ fontWeight: 700, color: 'var(--success)' }}>
                        {parseFloat(s.total_amount).toLocaleString()} ر.س
                      </td>
                      <td>{new Date(s.created_at).toLocaleString('ar-SA')}</td>
                      <td>
                        {s.status === 'pending' && <span className="badge warning"><FiClock /> قيد المراجعة</span>}
                        {s.status === 'approved' && <span className="badge success"><FiCheckCircle /> معتمد</span>}
                        {s.status === 'rejected' && <span className="badge danger"><FiXCircle /> مرفوض</span>}
                      </td>
                      <td>{s.accountant_name || '-'}</td>
                      <td style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={s.note}>
                        {s.note || '-'}
                      </td>
                      <td>
                        {s.status === 'pending' ? (
                          <div style={{ display: 'flex', gap: 10 }}>
                            <button className="btn btn-primary" style={{ padding: '6px 12px' }} onClick={() => handleApprove(s.id)}>
                              اعتماد
                            </button>
                            <button className="btn btn-secondary" style={{ padding: '6px 12px', borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={() => handleReject(s.id)}>
                              رفض
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>تمت المراجعة</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
