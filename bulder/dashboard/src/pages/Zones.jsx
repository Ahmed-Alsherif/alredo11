import { useState, useEffect } from 'react';
import Topbar from '../components/Topbar';
import api from '../api';
import { FiPlus, FiEdit2, FiTrash2, FiMapPin, FiSearch } from 'react-icons/fi';

export default function Zones() {
  const [zonesList, setZonesList] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', status: 'active' });

  useEffect(() => {
    fetchZones();
  }, []);

  const fetchZones = async () => {
    try {
      const res = await api.get('/zones/');
      setZonesList(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = zonesList.filter(z => z.name.includes(search));

  const openAdd = () => {
    setEditingZone(null);
    setForm({ name: '', status: 'active' });
    setShowModal(true);
  };

  const openEdit = (zone) => {
    setEditingZone(zone);
    setForm({ name: zone.name, status: zone.status });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    try {
      if (editingZone) {
        await api.patch(`/zones/${editingZone.id}/`, { name: form.name, status: form.status });
      } else {
        await api.post('/zones/', { name: form.name, status: form.status });
      }
      fetchZones();
      setShowModal(false);
    } catch (e) {
      alert('حدث خطأ أثناء الحفظ');
    }
  };

  const handleDelete = async (id) => {
    const zone = zonesList.find(z => z.id === id);
    if (zone.subscribers_count > 0) {
      alert('لا يمكن حذف منطقة بها مشتركين نشطين!');
      return;
    }
    try {
      await api.delete(`/zones/${id}/`);
      fetchZones();
    } catch (e) {
      alert('حدث خطأ أثناء الحذف');
    }
  };

  return (
    <>
      <Topbar title="المناطق الجغرافية" subtitle="إدارة المناطق ونطاقات الخدمة" />
      <div className="page-content">
        <div className="toolbar fade-in">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="ابحث عن منطقة..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={openAdd}>
            <FiPlus /> إضافة منطقة
          </button>
        </div>

        <div className="card fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>اسم المنطقة</th>
                  <th>الحالة</th>
                  <th>المشتركين</th>
                  <th>السائقين</th>
                  <th>المناديب</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((zone, i) => (
                  <tr key={zone.id}>
                    <td>{i + 1}</td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FiMapPin style={{ color: 'var(--primary)', flexShrink: 0 }} />
                        {zone.name}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${zone.status === 'active' ? 'success' : 'danger'}`}>
                        {zone.status === 'active' ? 'نشط' : 'موقوف'}
                      </span>
                    </td>
                    <td>{zone.subscribers_count}</td>
                    <td>{zone.drivers_count}</td>
                    <td>{zone.agents_count}</td>
                    <td>
                      <div className="actions-cell">
                        <button className="action-icon" title="تعديل" onClick={() => openEdit(zone)}>
                          <FiEdit2 />
                        </button>
                        <button className="action-icon delete" title="حذف" onClick={() => handleDelete(zone.id)}>
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                      لا توجد نتائج
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingZone ? 'تعديل المنطقة' : 'إضافة منطقة جديدة'}</h2>
                <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
              </div>
              <div className="form-group">
                <label>اسم المنطقة</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="مثال: حي الياسمين"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>الحالة التشغيلية</label>
                <select
                  className="form-control"
                  value={form.status}
                  onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                >
                  <option value="active">نشط</option>
                  <option value="inactive">موقوف</option>
                </select>
              </div>
              <div className="modal-footer">
                <button className="btn btn-primary" onClick={handleSave}>
                  {editingZone ? 'حفظ التعديلات' : 'إضافة'}
                </button>
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>إلغاء</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
