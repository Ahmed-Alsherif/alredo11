import Topbar from '../components/Topbar';
import { FiCalendar, FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import api from '../api';

const daysOfWeek = [
  { value: 'saturday', label: 'السبت' },
  { value: 'sunday', label: 'الأحد' },
  { value: 'monday', label: 'الإثنين' },
  { value: 'tuesday', label: 'الثلاثاء' },
  { value: 'wednesday', label: 'الأربعاء' },
  { value: 'thursday', label: 'الخميس' },
  { value: 'friday', label: 'الجمعة' }
];

const daysAr = {
  'saturday': 'السبت',
  'sunday': 'الأحد',
  'monday': 'الإثنين',
  'tuesday': 'الثلاثاء',
  'wednesday': 'الأربعاء',
  'thursday': 'الخميس',
  'friday': 'الجمعة'
};

export default function Routes() {
  const [routes, setRoutes] = useState([]);
  const [zones, setZones] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);

  const [form, setForm] = useState({
    zone: '',
    driver: '',
    collection_days: [],
    status: 'active'
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [routesRes, zonesRes, driversRes] = await Promise.all([
        api.get('/routes/'),
        api.get('/zones/'),
        api.get('/users/drivers/')
      ]);
      setRoutes(routesRes.data);
      setZones(zonesRes.data);
      setDrivers(driversRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoutes = async () => {
    try {
      const res = await api.get('/routes/');
      setRoutes(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = routes.filter(r => {
    const zoneMatch = r.zone_name && r.zone_name.includes(search);
    const driverMatch = r.driver_name && r.driver_name.includes(search);
    return zoneMatch || driverMatch;
  });

  const openAdd = () => {
    setEditingRoute(null);
    setForm({
      zone: zones.length > 0 ? zones[0].id : '',
      driver: '',
      collection_days: [],
      status: 'active'
    });
    setShowModal(true);
  };

  const openEdit = (route) => {
    setEditingRoute(route);
    setForm({
      zone: route.zone,
      driver: route.driver || '',
      collection_days: route.collection_days || [],
      status: route.status
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.zone) {
      alert('الرجاء اختيار المنطقة');
      return;
    }
    if (form.collection_days.length === 0) {
      alert('الرجاء اختيار يوم واحد على الأقل للجمع');
      return;
    }

    try {
      const payload = {
        zone: form.zone,
        driver: form.driver || null,
        collection_days: form.collection_days,
        status: form.status
      };

      if (editingRoute) {
        await api.patch(`/routes/${editingRoute.id}/`, payload);
      } else {
        await api.post('/routes/', payload);
      }
      fetchRoutes();
      setShowModal(false);
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء الحفظ');
    }
  };

  const handleDelete = async (id) => {
    const route = routes.find(r => r.id === id);
    if (route && route.subscribers_count > 0) {
      alert('لا يمكن حذف مسار به مشتركين نشطين!');
      return;
    }
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذا المسار؟')) {
      return;
    }
    try {
      await api.delete(`/routes/${id}/`);
      fetchRoutes();
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء الحذف');
    }
  };

  const getDriverLabel = (d) => {
    if (d.first_name || d.last_name) {
      return `${d.first_name} ${d.last_name}`.trim();
    }
    return d.username;
  };

  if (loading) return <div style={{ color: '#fff', padding: 40 }}>جاري تحميل البيانات...</div>;

  return (
    <>
      <Topbar title="إدارة المسارات" subtitle="قوالب الجمع ومواعيد المسارات" />
      <div className="page-content">
        <div className="toolbar fade-in">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="ابحث عن مسار بالمنطقة أو السائق..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={openAdd}>
            <FiPlus /> إضافة مسار
          </button>
        </div>

        <div className="card fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>المنطقة</th>
                  <th>أيام الجمع</th>
                  <th>السائق</th>
                  <th>المشتركين</th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => {
                  const daysList = r.collection_days.map(d => daysAr[d] || d).join(' - ');
                  return (
                    <tr key={r.id}>
                      <td>{i + 1}</td>
                      <td>{r.zone_name}</td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <FiCalendar style={{ color: 'var(--primary)', flexShrink: 0 }} />
                          {daysList || 'لم يتم تحديد أيام'}
                        </span>
                      </td>
                      <td>{r.driver_name || 'غير محدد'}</td>
                      <td>{r.subscribers_count}</td>
                      <td>
                        <span className={`badge ${r.status === 'active' ? 'success' : 'warning'}`}>
                          {r.status === 'active' ? 'نشط' : 'موقوف'}
                        </span>
                      </td>
                      <td>
                        <div className="actions-cell">
                          <button className="action-icon" title="تعديل" onClick={() => openEdit(r)}>
                            <FiEdit2 />
                          </button>
                          <button className="action-icon delete" title="حذف" onClick={() => handleDelete(r.id)}>
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
                <h2>{editingRoute ? 'تعديل المسار' : 'إضافة مسار جديد'}</h2>
                <button className="close-btn" onClick={() => setShowModal(false)}>✕</button>
              </div>

              <div className="form-group">
                <label>المنطقة</label>
                <select
                  className="form-control"
                  value={form.zone}
                  onChange={e => setForm(p => ({ ...p, zone: e.target.value }))}
                >
                  <option value="" disabled>اختر المنطقة...</option>
                  {zones.map(z => (
                    <option key={z.id} value={z.id}>{z.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>السائق المسؤول</label>
                <select
                  className="form-control"
                  value={form.driver}
                  onChange={e => setForm(p => ({ ...p, driver: e.target.value }))}
                >
                  <option value="">غير محدد</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>{getDriverLabel(d)}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>أيام الجمع</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                  {daysOfWeek.map(day => {
                    const isSelected = form.collection_days.includes(day.value);
                    return (
                      <button
                        key={day.value}
                        type="button"
                        className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                        style={{
                          padding: '6px 12px',
                          fontSize: '0.85rem',
                          borderRadius: 20,
                          border: isSelected ? 'none' : '1px solid var(--border-color)',
                          background: isSelected ? 'var(--primary)' : 'transparent',
                          color: isSelected ? '#fff' : 'var(--text-muted)',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          setForm(prev => {
                            const days = prev.collection_days.includes(day.value)
                              ? prev.collection_days.filter(d => d !== day.value)
                              : [...prev.collection_days, day.value];
                            return { ...prev, collection_days: days };
                          });
                        }}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="form-group">
                <label>الحالة التشغيلية</label>
                <select
                  className="form-control"
                  value={form.status}
                  onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                >
                  <option value="active">نشط</option>
                  <option value="frozen">موقوف</option>
                </select>
              </div>

              <div className="modal-footer">
                <button className="btn btn-primary" onClick={handleSave}>
                  {editingRoute ? 'حفظ التعديلات' : 'إضافة'}
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
