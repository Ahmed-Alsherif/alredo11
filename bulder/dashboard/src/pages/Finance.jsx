import Topbar from '../components/Topbar';
import { FiDollarSign, FiTrendingUp, FiMinusCircle, FiPlusCircle } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import api from '../api';

export default function Finance() {
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // form for new expense
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const [payRes, expRes, advRes] = await Promise.all([
        api.get('/finance/payments/'),
        api.get('/finance/expenses/'),
        api.get('/finance/advances/')
      ]);
      
      const payments = (payRes.data || []).map(p => ({ ...p, type: 'collection', amount: p.amount, created_at: p.date || p.created_at, description: `مشترك: ${p.subscriber_name || '-'}` }));
      const expenses = (expRes.data || []).map(e => ({ ...e, type: 'expense', amount: e.amount, created_at: e.date || e.created_at, description: e.description }));
      const advances = (advRes.data || []).map(a => ({ ...a, type: 'advance', amount: a.amount, created_at: a.date || a.created_at, description: `سلفة للموظف ${a.employee_name || '-'}` }));
      
      const combined = [...payments, ...expenses, ...advances].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setTransactions(combined);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async () => {
    if (!description || !amount) return;
    try {
      await api.post('/finance/expenses/', {
        amount: parseFloat(amount),
        description: description
      });
      setShowExpenseModal(false);
      setDescription('');
      setAmount('');
      fetchTransactions();
    } catch (e) {
      alert('حدث خطأ أثناء حفظ المصروف');
    }
  };

  if (loading) return <div style={{color:'#fff', padding:40}}>جاري تحميل البيانات...</div>;

  const totalCollected = transactions.filter(t => t.type === 'collection').reduce((s, t) => s + parseFloat(t.amount), 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);
  const totalAdvances = transactions.filter(t => t.type === 'advance').reduce((s, t) => s + parseFloat(t.amount), 0);

  return (
    <>
      <Topbar title="الشؤون المالية" subtitle="التحصيل والمصروفات والسُلف" />
      <div className="page-content">
        <div className="stats-grid fade-in">
          <div className="stat-card green">
            <div className="stat-info">
              <h4>إجمالي التحصيل</h4>
              <div className="stat-value">{totalCollected.toLocaleString()} <span style={{ fontSize: '0.85rem' }}>ر.س</span></div>
              <div className="stat-change up"><FiTrendingUp /> هذا الأسبوع</div>
            </div>
            <div className="stat-icon"><FiPlusCircle /></div>
          </div>
          <div className="stat-card red">
            <div className="stat-info">
              <h4>إجمالي المصروفات</h4>
              <div className="stat-value">{totalExpenses.toLocaleString()} <span style={{ fontSize: '0.85rem' }}>ر.س</span></div>
            </div>
            <div className="stat-icon"><FiMinusCircle /></div>
          </div>
          <div className="stat-card orange">
            <div className="stat-info">
              <h4>السُلف القائمة</h4>
              <div className="stat-value">{totalAdvances.toLocaleString()} <span style={{ fontSize: '0.85rem' }}>ر.س</span></div>
            </div>
            <div className="stat-icon"><FiDollarSign /></div>
          </div>
          <div className="stat-card purple">
            <div className="stat-info">
              <h4>الصافي</h4>
              <div className="stat-value">{(totalCollected - totalExpenses).toLocaleString()} <span style={{ fontSize: '0.85rem' }}>ر.س</span></div>
            </div>
            <div className="stat-icon"><FiDollarSign /></div>
          </div>
        </div>

        <div className="toolbar fade-in" style={{ animationDelay: '0.05s' }}>
          <h3 style={{ fontWeight: 700 }}>سجل العمليات المالية</h3>
          <button className="btn btn-primary" onClick={() => setShowExpenseModal(true)}>
            <FiPlusCircle /> تسجيل مصروف
          </button>
        </div>

        <div className="card fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th><th>النوع</th><th>التفاصيل</th><th>المبلغ</th><th>التاريخ</th><th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t, i) => {
                  const typeLabel = t.type === 'collection' ? 'تحصيل' : t.type === 'expense' ? 'مصروف' : 'سلفة';
                  return (
                  <tr key={t.id}>
                    <td>{i + 1}</td>
                    <td>
                      <span className={`badge ${t.type === 'collection' ? 'success' : t.type === 'expense' ? 'danger' : 'warning'}`}>
                        {typeLabel}
                      </span>
                    </td>
                    <td>
                      {t.description}
                    </td>
                    <td style={{ fontWeight: 700, color: t.type === 'collection' ? 'var(--success)' : 'var(--danger)' }}>
                      {t.type === 'collection' ? '+' : '-'}{parseFloat(t.amount).toLocaleString()} ر.س
                    </td>
                    <td>{new Date(t.created_at).toLocaleDateString('ar-SA')}</td>
                    <td>
                      <span className={`badge success`}>
                        مسجّل
                      </span>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </div>

        {showExpenseModal && (
          <div className="modal-overlay" onClick={() => setShowExpenseModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>تسجيل مصروف جديد</h2>
                <button className="close-btn" onClick={() => setShowExpenseModal(false)}>✕</button>
              </div>
              <div className="form-group">
                <label>وصف المصروف</label>
                <input type="text" className="form-control" placeholder="مثال: وقود شاحنة حي النسيم" value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <div className="form-group">
                <label>المبلغ (ر.س)</label>
                <input type="number" className="form-control" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} />
              </div>
              <div className="modal-footer">
                <button className="btn btn-primary" onClick={handleAddExpense}>تسجيل</button>
                <button className="btn btn-secondary" onClick={() => setShowExpenseModal(false)}>إلغاء</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
