import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLogIn } from 'react-icons/fi';
import api from '../api';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login/', { username, password });
      localStorage.setItem('access_token', res.data.access);
      localStorage.setItem('refresh_token', res.data.refresh);
      
      const meRes = await api.get('/users/me/');
      onLogin(meRes.data);
      navigate('/');
    } catch (err) {
      setError('بيانات الدخول غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">🗑️</div>
        <h1>نظام سل</h1>
        <p className="subtitle">إدارة النفايات والتدوير الذكي</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>اسم المستخدم</label>
            <input
              type="text"
              className="form-control"
              placeholder="أدخل اسم المستخدم (مثال: admin)"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>كلمة المرور</label>
            <input
              type="password"
              className="form-control"
              placeholder="أدخل كلمة المرور (مثال: admin123)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div style={{ color: '#ef4444', marginBottom: 15, fontSize: 14 }}>{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            <FiLogIn />
            {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>
    </div>
  );
}
