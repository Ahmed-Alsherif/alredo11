import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import api from '../../utils/api';
export default function TrackingScreen() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await api.get('/tracking/live/');
        setLocations(res.data);
      } catch (e) {
        console.warn('Tracking error:', e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLocations();
    const interval = setInterval(fetchLocations, 10000);
    return () => clearInterval(interval);
  }, []);

  const hasTrucks = locations.length > 0;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>تتبع الشاحنة</Text>
        <Text style={styles.subtitle}>الموقع اللحظي للشاحنة</Text>
      </View>
      <View style={styles.mapPlaceholder}>
        <Ionicons name="location" size={48} color={hasTrucks ? Colors.success : Colors.textMuted} />
        {hasTrucks ? (
          <>
            <Text style={styles.mapText}>يتم عرض موقع الشاحنة الحي</Text>
            <Text style={{color: Colors.success, fontFamily: 'monospace', marginVertical: 10}}>
              {parseFloat(locations[0].latitude).toFixed(5)}, {parseFloat(locations[0].longitude).toFixed(5)}
            </Text>
          </>
        ) : (
          <Text style={styles.mapText}>خريطة التتبع المباشر</Text>
        )}
        <View style={[styles.badge, hasTrucks && { backgroundColor: Colors.successLight }]}>
          <Text style={[styles.badgeText, hasTrucks && { color: Colors.success }]}>
            {hasTrucks ? `${locations.length} شاحنة نشطة الآن` : 'لا توجد شاحنات نشطة حالياً'}
          </Text>
        </View>
      </View>
      <View style={styles.infoBar}>
        <View style={styles.infoItem}>
          <Text style={styles.infoEmoji}>🚛</Text>
          <Text style={styles.infoLabel}>الشاحنة</Text>
          <Text style={styles.infoValue}>{hasTrucks ? 'في الطريق' : 'متوقفة'}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoItem}>
          <Text style={styles.infoEmoji}>📍</Text>
          <Text style={styles.infoLabel}>المسافة</Text>
          <Text style={styles.infoValue}>{hasTrucks ? '~2.5 كم' : '-'}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoItem}>
          <Text style={styles.infoEmoji}>⏱️</Text>
          <Text style={styles.infoLabel}>الوصول</Text>
          <Text style={styles.infoValue}>{hasTrucks ? '~10 دقائق' : '-'}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: { paddingHorizontal: Spacing.md, paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  title: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary, textAlign: 'right' },
  subtitle: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'right' },
  mapPlaceholder: {
    flex: 1, margin: Spacing.md, borderRadius: Radius.lg,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center', gap: 12,
    borderStyle: 'dashed',
  },
  mapText: { fontSize: FontSize.md, color: Colors.textMuted },
  badge: { backgroundColor: Colors.primaryLight, paddingHorizontal: 16, paddingVertical: 6, borderRadius: Radius.full },
  badgeText: { color: Colors.primary, fontSize: FontSize.xs, fontWeight: '700' },
  infoBar: {
    flexDirection: 'row', backgroundColor: Colors.surface,
    borderTopWidth: 1, borderTopColor: Colors.border, padding: Spacing.md,
  },
  infoItem: { flex: 1, alignItems: 'center', gap: 4 },
  divider: { width: 1, backgroundColor: Colors.border },
  infoEmoji: { fontSize: 20 },
  infoLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  infoValue: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
});
