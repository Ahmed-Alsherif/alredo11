import { useState, useEffect } from 'react';
import Topbar from '../components/Topbar';
import api from '../api';
import { FiSearch, FiEdit2, FiTrash2, FiX, FiPause, FiPlay, FiPlus } from 'react-icons/fi';

const statusMap = { 'أخضر': 'green', 'أصفر': 'yellow', 'أحمر': 'red' };

export default function Subscribers() {
  const [subs, setSubs] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('الكل');
  const [editSub, setEditSub] = useState(null);
  const [editForm, setEditForm] = useState({});

  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    plan: '',
    zone: ''
  });
  const [zones, setZones] = useState([]);
  const [plans, setPlans] = useState([]);

  useEffect(() => {
    fetchSubs();
    fetchZonesAndPlans();
  }, []);

  const fetchSubs = async () => {
    try {
      const res = await api.get('/subscribers/');
      setSubs(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchZonesAndPlans = async () => {
    try {
      const [zonesRes, plansRes] = await Promise.all([
        api.get('/zones/'),
        api.get('/plans/')
      ]);
      setZones(zonesRes.data);
      setPlans(plansRes.data);
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = subs.filter(s => {
    const matchSearch = (s.name || '').includes(search) || String(s.subscription_id || s.id).includes(search) || (s.zone_name || '').includes(search) || (s.phone || '').includes(search);
    const color = s.color_status === 'green' ? 'أخضر' : s.color_status === 'yellow' ? 'أصفر' : 'أحمر';
    const matchStatus = filterStatus === 'الكل' || color === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleDelete = async (id) => {
    if (window.confirm('هل أنت متأكد من حذف المشترك؟ هذا الإجراء لا يمكن التراجع عنه.')) {
      try {
        await api.post(`/subscribers/${id}/archive/`, { reason: 'Archived from dashboard' });
        fetchSubs();
      } catch (e) {
        alert('حدث خطأ أثناء الحذف');
      }
    }
  };

  const openAdd = () => {
    setAddForm({
      username: '',
      password: '',
      first_name: '',
      last_name: '',
      phone: '',
      address: '',
      plan: plans.length > 0 ? plans[0].id : '',
      zone: zones.length > 0 ? zones[0].id : ''
    });
    setShowAddModal(true);
  };

  const handleAdd = async () => {
    if (!addForm.first_name.trim()) {
      alert('الرجاء إدخال الاسم الأول');
      return;
    }
    if (!addForm.phone.trim()) {
      alert('الرجاء إدخال رقم الهاتف');
      return;
    }
    if (addForm.password && addForm.password.length < 4) {
      alert('كلمة المرور يجب أن لا تقل عن 4 رموز');
      return;
    }

    try {
      const payload = {
        username: addForm.username.trim(),
        password: addForm.password,
        first_name: addForm.first_name.trim(),
        last_name: addForm.last_name.trim(),
        phone: addForm.phone.trim(),
        address: addForm.address.trim(),
        plan: addForm.plan ? Number(addForm.plan) : null,
        zone: addForm.zone ? Number(addForm.zone) : null
      };

      await api.post('/subscribers/', payload);
      setShowAddModal(false);
      fetchSubs();
    } catch (e) {
      console.error(e);
      const errorMsg = e.response?.data?.error || e.response?.data?.phone?.[0] || e.response?.data?.username?.[0] || 'حدث خطأ أثناء إضافة المشترك';
      alert(errorMsg);
    }
  };

  const openEdit = (sub) => {
    setEditSub(sub);
    setEditForm({
      address: sub.address || '',
      excuse: sub.excuse || '',
      is_paused: sub.is_paused || false,
    });
  };

  const handleEdit = async () => {
    try {
      await api.patch(`/subscribers/${editSub.id}/`, editForm);
      setEditSub(null);
      fetchSubs();
    } catch (e) {
      alert('حدث خطأ أثناء التحديث');
    }
  };

  const togglePause = async (sub) => {
    try {
      const endpoint = sub.is_paused ? 'resume' : 'pause';
      await api.post(`/subscribers/${sub.id}/${endpoint}/`);
      fetchSubs();
    } catch (e) {
      alert('حدث خطأ');
    }
  };

  return (
    <>
      <Topbar title="إدارة المشتركين" subtitle={`${subs.length} مشترك مسجّل`} />
      <div className="page-content">
        {/* Stats */}
        <div className="stats-grid fade-in">
          <div className="stat-card green">
            <div className="stat-info">
              <h4>سداد منتظم</h4>
              <div className="stat-value">{subs.filter(s => s.color_status === 'green').length}</div>
            </div>
            <div className="stat-icon">🟢</div>
          </div>
          <div className="stat-card orange">
            <div className="stat-info">
              <h4>تأخير بسيط</h4>
              <div className="stat-value">{subs.filter(s => s.color_status === 'yellow').length}</div>
            </div>
            <div className="stat-icon">🟡</div>
          </div>
          <div className="stat-card red">
            <div className="stat-info">
              <h4>تأخير كبير</h4>
              <div className="stat-value">{subs.filter(s => s.color_status === 'red').length}</div>
            </div>
            <div className="stat-icon">🔴</div>
          </div>
          <div className="stat-card blue">
            <div className="stat-info">
              <h4>إيقاف مؤقت</h4>
              <div className="stat-value">{subs.filter(s => s.is_paused).length}</div>
            </div>
            <div className="stat-icon">⏸️</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="toolbar fade-in" style={{ animationDelay: '0.05s' }}>
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input type="text" placeholder="ابحث بالاسم أو رقم الاشتراك أو المنطقة أو الهاتف..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {['الكل', 'أخضر', 'أصفر', 'أحمر'].map(s => (
              <button key={s}
                className={`btn btn-sm ${filterStatus === s ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilterStatus(s)}
              >
                {s === 'الكل' ? 'الكل' : <><span className={`status-dot ${statusMap[s]}`}></span> {s}</>}
              </button>
            ))}
            <button className="btn btn-primary btn-sm" onClick={openAdd} style={{ marginRight: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
              <FiPlus /> إضافة مشترك
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="card fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>رقم الاشتراك</th>
                  <th>الاسم</th>
                  <th>الهاتف</th>
                  <th>المنطقة</th>
                  <th>الخطة</th>
                  <th>التصنيف</th>
                  <th>الحالة</th>
                  <th>انتهاء الاشتراك</th>
                  <th>العذر</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(sub => {
                  const colorMapAr = { 'green': 'أخضر', 'yellow': 'أصفر', 'red': 'أحمر' };
                  return (
                    <tr key={sub.id} style={sub.is_paused ? { opacity: 0.6 } : {}}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{sub.subscription_id || sub.username}</td>
                      <td>{sub.name}</td>
                      <td style={{ direction: 'ltr', textAlign: 'right' }}>{sub.phone}</td>
                      <td>{sub.zone_name}</td>
                      <td><span className="badge purple">{sub.plan_name}</span></td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className={`status-dot ${statusMap[colorMapAr[sub.color_status]]}`}></span>
                          {sub.color_status_display}
                        </span>
                      </td>
                      <td>
                        {sub.is_paused ? <span className="badge orange">⏸️ متوقف</span> : <span className="badge green">نشط</span>}
                      </td>
                      <td>{sub.subscription_end}</td>
                      <td>{sub.excuse || '-'}</td>
                      <td>
                        <div className="actions-cell">
                          <button className="action-icon edit" title="تعديل" onClick={() => openEdit(sub)}><FiEdit2 /></button>
                          <button className="action-icon" title={sub.is_paused ? 'تفعيل' : 'إيقاف مؤقت'} onClick={() => togglePause(sub)} style={{color: sub.is_paused ? '#27ae60' : '#e67e22'}}>
                            {sub.is_paused ? <FiPlay /> : <FiPause />}
                          </button>
                          <button className="action-icon delete" title="حذف" onClick={() => handleDelete(sub.id)}><FiTrash2 /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Modal - FR-04-08 */}
        {editSub && (
          <div className="modal-overlay" onClick={() => setEditSub(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>تعديل بيانات المشترك</h3>
                <button className="modal-close" onClick={() => setEditSub(null)}><FiX /></button>
              </div>
              <div className="modal-body">
                <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
                  {editSub.name} — {editSub.subscription_id || editSub.username}
                </p>
                <div className="form-group">
                  <label>العنوان</label>
                  <input type="text" value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>عذر التأخر عن السداد</label>
                  <textarea value={editForm.excuse} onChange={e => setEditForm({...editForm, excuse: e.target.value})} rows={3} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setEditSub(null)}>إلغاء</button>
                <button className="btn btn-primary" onClick={handleEdit}>حفظ التعديلات</button>
              </div>
            </div>
          </div>
        )}

        {/* Add Modal */}
        {showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>إضافة مشترك جديد</h3>
                <button className="modal-close" onClick={() => setShowAddModal(false)}><FiX /></button>
              </div>
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <div className="form-group">
                  <label>الاسم الأول <span style={{ color: 'red' }}>*</span></label>
                  <input
                    type="text"
                    value={addForm.first_name}
                    onChange={e => setAddForm({ ...addForm, first_name: e.target.value })}
                    placeholder="مثال: أحمد"
                  />
                </div>
                <div className="form-group">
                  <label>اسم العائلة</label>
                  <input
                    type="text"
                    value={addForm.last_name}
                    onChange={e => setAddForm({ ...addForm, last_name: e.target.value })}
                    placeholder="مثال: محمد"
                  />
                </div>
                <div className="form-group">
                  <label>رقم الهاتف <span style={{ color: 'red' }}>*</span></label>
                  <input
                    type="text"
                    value={addForm.phone}
                    onChange={e => setAddForm({ ...addForm, phone: e.target.value })}
                    placeholder="مثال: 0500000000"
                  />
                </div>
                <div className="form-group">
                  <label>اسم المستخدم (اختياري)</label>
                  <input
                    type="text"
                    value={addForm.username}
                    onChange={e => setAddForm({ ...addForm, username: e.target.value })}
                    placeholder="يستخدم لتسجيل الدخول، افتراضياً رقم الهاتف"
                  />
                </div>
                <div className="form-group">
                  <label>كلمة المرور (اختيارية)</label>
                  <input
                    type="password"
                    value={addForm.password}
                    onChange={e => setAddForm({ ...addForm, password: e.target.value })}
                    placeholder="افتراضياً آخر 6 أرقام من الهاتف"
                  />
                </div>
                <div className="form-group">
                  <label>المنطقة</label>
                  <select
                    className="form-control"
                    value={addForm.zone}
                    onChange={e => setAddForm({ ...addForm, zone: e.target.value })}
                  >
                    <option value="" disabled>اختر المنطقة...</option>
                    {zones.map(z => (
                      <option key={z.id} value={z.id}>{z.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>باقة الاشتراك</label>
                  <select
                    className="form-control"
                    value={addForm.plan}
                    onChange={e => setAddForm({ ...addForm, plan: e.target.value })}
                  >
                    <option value="">بدون باقة</option>
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>{p.name} - {p.price} ر.س ({p.duration_months} أشهر)</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>العنوان</label>
                  <input
                    type="text"
                    value={addForm.address}
                    onChange={e => setAddForm({ ...addForm, address: e.target.value })}
                    placeholder="مثال: حي الياسمين، شارع المطار"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>إلغاء</button>
                <button className="btn btn-primary" onClick={handleAdd}>إضافة المشترك</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
