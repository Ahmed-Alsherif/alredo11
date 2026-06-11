import { useState, useEffect } from 'react';
import Topbar from '../components/Topbar';
import api from '../api';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiUser, FiX } from 'react-icons/fi';

export default function Staff() {
  const [staffList, setStaffList] = useState([]);
  const [search, setSearch] = useState('');
  const [editStaff, setEditStaff] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [activeTab, setActiveTab] = useState('الكل');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ username: '', password: '', first_name: '', last_name: '', role: 'driver', phone: '' });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const res = await api.get('/users/staff/');
      setStaffList(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = staffList.filter(s => {
    const matchSearch = (s.first_name || '').includes(search) || (s.last_name || '').includes(search) || (s.role_display || '').includes(search) || (s.zone_name || '').includes(search) || (s.phone || '').includes(search);
    const matchTab = activeTab === 'الكل' || 
      (activeTab === 'السائقين' && s.role === 'driver') ||
      (activeTab === 'المناديب' && s.role === 'agent') ||
      (activeTab === 'المحاسبين' && s.role === 'accountant');
    return matchSearch && matchTab;
  });

  const handleAdd = async () => {
    if (!addForm.username || !addForm.password || !addForm.first_name) return alert('يرجى ملء الحقول الأساسية');
    try {
      await api.post('/users/', addForm);
      setShowAddModal(false);
      setAddForm({ username: '', password: '', first_name: '', last_name: '', role: 'driver', phone: '' });
      fetchStaff();
    } catch (e) {
      alert('حدث خطأ أثناء الإضافة');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('⚠️ هل أنت متأكد من حذف هذا الموظف نهائياً؟\nهذا الإجراء لا يمكن التراجع عنه.')) {
      try {
        await api.delete(`/users/${id}/`);
        fetchStaff();
      } catch (e) {
        alert('حدث خطأ أثناء الحذف');
      }
    }
  };

  const openEdit = (s) => {
    setEditStaff(s);
    setEditForm({
      first_name: s.first_name || '',
      last_name: s.last_name || '',
      phone: s.phone || '',
      is_active_employee: s.is_active_employee,
    });
  };

  const handleEdit = async () => {
    try {
      await api.patch(`/users/${editStaff.id}/`, editForm);
      setEditStaff(null);
      fetchStaff();
    } catch (e) {
      alert('حدث خطأ أثناء التحديث');
    }
  };

  return (
    <>
      <Topbar title="إدارة الموظفين" subtitle="السائقين والمناديب والمحاسبين" />
      <div className="page-content">
        <div className="toolbar fade-in">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="ابحث بالاسم أو الدور أو المنطقة أو الهاتف..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['الكل', 'السائقين', 'المناديب', 'المحاسبين'].map(t => (
              <button key={t} className={`btn btn-sm ${activeTab === t ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab(t)}>{t}</button>
            ))}
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddModal(true)}><FiPlus /> إضافة موظف</button>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid fade-in" style={{ animationDelay: '0.05s' }}>
          <div className="stat-card purple">
            <div className="stat-info">
              <h4>إجمالي الموظفين</h4>
              <div className="stat-value">{staffList.length}</div>
            </div>
            <div className="stat-icon"><FiUser /></div>
          </div>
          <div className="stat-card teal">
            <div className="stat-info">
              <h4>السائقين</h4>
              <div className="stat-value">{staffList.filter(s => s.role === 'driver').length}</div>
            </div>
            <div className="stat-icon">🚛</div>
          </div>
          <div className="stat-card green">
            <div className="stat-info">
              <h4>المناديب</h4>
              <div className="stat-value">{staffList.filter(s => s.role === 'agent').length}</div>
            </div>
            <div className="stat-icon">📋</div>
          </div>
          <div className="stat-card blue">
            <div className="stat-info">
              <h4>المحاسبين</h4>
              <div className="stat-value">{staffList.filter(s => s.role === 'accountant').length}</div>
            </div>
            <div className="stat-icon">💰</div>
          </div>
        </div>

        <div className="card fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>الاسم</th>
                  <th>الدور</th>
                  <th>الهاتف</th>
                  <th>المنطقة</th>
                  <th>الحالة</th>
                  <th>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => {
                  const roleColorsEn = {
                    'driver': 'purple',
                    'agent': 'info',
                    'accountant': 'success',
                    'admin': 'red'
                  };
                  return (
                    <tr key={s.id}>
                      <td>{i + 1}</td>
                      <td>{s.first_name} {s.last_name}</td>
                      <td><span className={`badge ${roleColorsEn[s.role] || 'purple'}`}>{s.role_display}</span></td>
                      <td style={{ direction: 'ltr', textAlign: 'right' }}>{s.phone}</td>
                      <td>{s.zone_name || '-'}</td>
                      <td>
                        <span className={`badge ${s.is_active_employee ? 'success' : 'danger'}`}>
                          {s.is_active_employee ? 'نشط' : 'موقوف'}
                        </span>
                      </td>
                      <td>
                        <div className="actions-cell">
                          <button className="action-icon edit" title="تعديل" onClick={() => openEdit(s)}><FiEdit2 /></button>
                          <button className="action-icon delete" title="حذف" onClick={() => handleDelete(s.id)}><FiTrash2 /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Modal - FR-05-03 */}
        {editStaff && (
          <div className="modal-overlay" onClick={() => setEditStaff(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>تعديل بيانات الموظف</h3>
                <button className="modal-close" onClick={() => setEditStaff(null)}><FiX /></button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>الاسم الأول</label>
                  <input type="text" value={editForm.first_name} onChange={e => setEditForm({...editForm, first_name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>الاسم الأخير</label>
                  <input type="text" value={editForm.last_name} onChange={e => setEditForm({...editForm, last_name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>الهاتف</label>
                  <input type="text" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" checked={editForm.is_active_employee} onChange={e => setEditForm({...editForm, is_active_employee: e.target.checked})} />
                    موظف فعّال
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setEditStaff(null)}>إلغاء</button>
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
                <h3>إضافة موظف جديد</h3>
                <button className="modal-close" onClick={() => setShowAddModal(false)}><FiX /></button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>اسم المستخدم للولوج</label>
                  <input type="text" value={addForm.username} onChange={e => setAddForm({...addForm, username: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>كلمة المرور</label>
                  <input type="password" value={addForm.password} onChange={e => setAddForm({...addForm, password: e.target.value})} />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>الاسم الأول</label>
                    <input type="text" value={addForm.first_name} onChange={e => setAddForm({...addForm, first_name: e.target.value})} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>الاسم الأخير</label>
                    <input type="text" value={addForm.last_name} onChange={e => setAddForm({...addForm, last_name: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label>الهاتف</label>
                  <input type="text" value={addForm.phone} onChange={e => setAddForm({...addForm, phone: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>الدور</label>
                  <select value={addForm.role} onChange={e => setAddForm({...addForm, role: e.target.value})} className="form-control" style={{ width: '100%', padding: '10px', background: '#1a1a2e', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <option value="driver">سائق</option>
                    <option value="agent">مندوب تحصيل</option>
                    <option value="accountant">محاسب</option>
                    <option value="admin">مدير</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>وثائق الموظف (الهوية، الرخصة)</label>
                  <input type="file" className="form-control" style={{ paddingTop: 8 }} />
                  <small style={{ color: 'var(--text-muted)' }}>سيتم أرشفة الوثائق في ملف الموظف</small>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>إلغاء</button>
                <button className="btn btn-primary" onClick={handleAdd}>إضافة</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
