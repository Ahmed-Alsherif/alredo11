import Topbar from '../components/Topbar';
import { FiMapPin } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import api from '../api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function Tracking() {
  const [stats, setStats] = useState({ active_trucks: 0, zones_covered: 0, houses_visited: 0 });
  const [loading, setLoading] = useState(true);

  const [locations, setLocations] = useState([]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/tracking/live/');
      // Res contains array of locations
      if (Array.isArray(res.data)) {
        setLocations(res.data);
        setStats({ 
          active_trucks: res.data.length, 
          zones_covered: new Set(res.data.map(l => l.driver)).size, 
          houses_visited: res.data.length * 15 // estimation
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000); // 10s auto refresh
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div style={{color:'#fff', padding:40}}>جاري تحميل البيانات...</div>;

  return (
    <>
      <Topbar title="التتبع المباشر" subtitle="مراقبة الشاحنات في الوقت الفعلي" />
      <div className="page-content">
        <div className="stats-grid fade-in">
          <div className="stat-card green">
            <div className="stat-info"><h4>شاحنات نشطة</h4><div className="stat-value">{stats.active_trucks}</div></div>
            <div className="stat-icon">🚛</div>
          </div>
          <div className="stat-card purple">
            <div className="stat-info"><h4>مناطق مغطاة اليوم</h4><div className="stat-value">{stats.zones_covered}</div></div>
            <div className="stat-icon"><FiMapPin /></div>
          </div>
          <div className="stat-card teal">
            <div className="stat-info"><h4>منازل تمت زيارتها</h4><div className="stat-value">{stats.houses_visited}</div></div>
            <div className="stat-icon">🏠</div>
          </div>
        </div>

        <div className="card fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="card-header">
            <h3>🗺️ خريطة المراقبة المباشرة</h3>
          </div>
          <div style={{
            height: 500,
            borderRadius: 12,
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <MapContainer center={[24.7136, 46.6753]} zoom={11} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
              />
              {locations.map(loc => (
                <Marker key={loc.id} position={[parseFloat(loc.latitude), parseFloat(loc.longitude)]}>
                  <Popup>
                    <div style={{ textAlign: 'right' }}>
                      <strong>السائق {loc.driver}</strong>
                      <br />آخر تحديث: {new Date(loc.timestamp).toLocaleTimeString('ar-SA')}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>
    </>
  );
}
