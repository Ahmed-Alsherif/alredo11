import Topbar from '../components/Topbar';
import { useState, useEffect } from 'react';
import api from '../api';
import { FiSearch, FiMessageCircle } from 'react-icons/fi';

export default function Complaints() {
  const [list, setList] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await api.get('/complaints/');
      setList(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = list.filter(c => (c.subscriber_name || '').includes(search) || (c.type_display || '').includes(search));

  const updateStatus = async (id, newStatus) => {
    try {
      await api.patch(`/complaints/${id}/`, { status: newStatus });
      fetchComplaints();
      setSelected(null);
    } catch (e) {
      alert('خطأ');
    }
  };

  return (
    <>
      <Topbar title="الشكاوى والبلاغات" subtitle={`${list.filter(c => c.status !== 'تم الحل').length} شكوى مفتوحة`} />
      <div className="page-content">
        <div className="stats-grid fade-in">
          <div className="stat-card red">
            <div className="stat-info"><h4>جديدة</h4><div className="stat-value">{list.filter(c => c.status === 'new').length}</div></div>
            <div className="stat-icon"><FiMessageCircle /></div>
          </div>
          <div className="stat-card orange">
            <div className="stat-info"><h4>قيد المعالجة</h4><div className="stat-value">{list.filter(c => c.status === 'in_progress').length}</div></div>
            <div className="stat-icon"><FiMessageCircle /></div>
          </div>
          <div className="stat-card green">
            <div className="stat-info"><h4>تم الحل</h4><div className="stat-value">{list.filter(c => c.status === 'resolved').length}</div></div>
            <div className="stat-icon"><FiMessageCircle /></div>
          </div>
        </div>

        <div className="toolbar fade-in" style={{ animationDelay: '0.05s' }}>
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input type="text" placeholder="ابحث عن شكوى..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="card fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th><th>المشترك</th><th>المنطقة</th><th>النوع</th><th>الحالة</th><th>التاريخ</th><th>الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => {
                  const statusColors = { 'new': 'danger', 'in_progress': 'warning', 'resolved': 'success' };
                  return (
                  <tr key={c.id}>
                    <td>{i + 1}</td>
                    <td>{c.subscriber_name}</td>
                    <td>-</td>
                    <td>{c.type_display}</td>
                    <td><span className={`badge ${statusColors[c.status]}`}>{c.status_display}</span></td>
                    <td>{new Date(c.created_at).toLocaleDateString('ar-SA')}</td>
                    <td>
                      <button className="btn btn-sm btn-secondary" onClick={() => setSelected(c)}>عرض</button>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </div>

        {selected && (
          <div className="modal-overlay" onClick={() => setSelected(null)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>تفاصيل الشكوى</h2>
                <button className="close-btn" onClick={() => setSelected(null)}>✕</button>
              </div>
              <div style={{ marginBottom: 15 }}>
                <strong>المشترك:</strong> {selected.subscriber_name}<br />
                <strong>النوع:</strong> {selected.type_display}<br />
                <strong>التاريخ:</strong> {new Date(selected.created_at).toLocaleString('ar-SA')}<br />
                <strong>الوصف:</strong> {selected.description}
              </div>
              <div className="modal-footer">
                {selected.status === 'new' && (
                  <button className="btn btn-primary btn-sm" onClick={() => updateStatus(selected.id, 'in_progress')}>بدء المعالجة</button>
                )}
                {selected.status === 'in_progress' && (
                  <button className="btn btn-primary btn-sm" onClick={() => updateStatus(selected.id, 'resolved')}>تم الحل</button>
                )}
                <button className="btn btn-secondary btn-sm" onClick={() => setSelected(null)}>إغلاق</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
