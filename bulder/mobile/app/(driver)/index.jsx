import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import api from '../../utils/api';

const statusInfo = {
  pending: { label: 'بانتظار', color: Colors.warning, icon: 'time-outline' },
  collected: { label: 'تم الجمع', color: Colors.success, icon: 'checkmark-circle' },
  issue: { label: 'مشكلة', color: Colors.danger, icon: 'alert-circle' },
};

export default function DriverHome() {
  const router = useRouter();
  const [subs, setSubs] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const u = await AsyncStorage.getItem('user');
        if (u) setUser(JSON.parse(u));
        
        // FR-01-13: جلب القائمة اليومية
        let subsData = [];
        try {
          const dailyRes = await api.get('/subscribers/daily_list/');
          subsData = dailyRes.data.subscribers || [];
        } catch {
          // fallback to full list
          const res = await api.get('/subscribers/');
          subsData = res.data;
        }
        const subscribersWithStatus = subsData.map(s => ({
          ...s,
          status: 'pending'
        }));
        setSubs(subscribersWithStatus);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const done = subs.filter(s => s.status === 'collected').length;
  const total = subs.length || 1;

  const markCollected = (id) => {
    setSubs(prev => prev.map(s => s.id === id ? { ...s, status: 'collected' } : s));
  };

  // FR-08-03: تأكيد استلام أكياس التدوير
  const confirmRecycle = async (subId) => {
    Alert.alert('تأكيد استلام التدوير', 'هل استلمت أكياس التدوير من هذا المشترك؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'تأكيد', onPress: async () => {
        try {
          // Find pending recycle requests for this subscriber
          const res = await api.get('/recycling/');
          const pendingReqs = (res.data || []).filter(r => r.subscriber === subId && r.status === 'pending');
          for (const req of pendingReqs) {
            await api.post(`/recycling/${req.id}/confirm/`);
          }
          Alert.alert('تم!', `تم تأكيد استلام ${pendingReqs.length} طلب تدوير ومنح النقاط`);
        } catch (e) {
          Alert.alert('خطأ', 'حدث خطأ أثناء التأكيد');
        }
      }},
    ]);
  };

  if (loading) return <SafeAreaView style={styles.safe}><Text style={{color:'#fff', padding: 20}}>جاري التحميل...</Text></SafeAreaView>;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>مرحباً، {user?.first_name || 'السائق'} 🚛</Text>
            <Text style={styles.subtitle}>{user?.zone_name || 'منطقتك'}</Text>
          </View>
        </View>

        {/* Progress */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>إنجاز اليوم</Text>
            <Text style={styles.progressPercent}>{Math.round((done / total) * 100)}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(done / total) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{done} / {subs.length} منزل</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.stat, { borderRightColor: Colors.success, borderRightWidth: 3 }]}>
            <Text style={styles.statVal}>{done}</Text>
            <Text style={styles.statLabel}>تم الجمع</Text>
          </View>
          <View style={[styles.stat, { borderRightColor: Colors.warning, borderRightWidth: 3 }]}>
            <Text style={styles.statVal}>{subs.filter(s => s.status === 'pending').length}</Text>
            <Text style={styles.statLabel}>بانتظار</Text>
          </View>
          <View style={[styles.stat, { borderRightColor: Colors.danger, borderRightWidth: 3 }]}>
            <Text style={styles.statVal}>{subs.filter(s => s.status === 'issue').length}</Text>
            <Text style={styles.statLabel}>مشاكل</Text>
          </View>
        </View>

        {/* List */}
        <Text style={styles.sectionTitle}>قائمة المشتركين</Text>
        {subs.map(sub => {
          const info = statusInfo[sub.status];
          return (
            <View key={sub.id} style={styles.subCard}>
              <View style={[styles.statusDot, { backgroundColor: info.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.subName}>{sub.name}</Text>
                <Text style={styles.subAddr}>{sub.zone_name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: info.color + '22' }]}>
                  <Ionicons name={info.icon} size={12} color={info.color} />
                  <Text style={[styles.statusText, { color: info.color }]}>{info.label}</Text>
                </View>
              </View>
              {sub.status === 'pending' && (
                <View style={{ gap: 6 }}>
                  <TouchableOpacity style={styles.collectBtn} onPress={() => markCollected(sub.id)}>
                    <Ionicons name="checkmark" size={20} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.collectBtn, { backgroundColor: Colors.secondary }]} onPress={() => confirmRecycle(sub.id)}>
                    <Ionicons name="leaf" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1, paddingHorizontal: Spacing.md },
  header: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoutHeaderBtn: {
    padding: 8,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  greeting: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary, textAlign: 'right' },
  subtitle: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'right' },
  progressCard: {
    backgroundColor: Colors.primary, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.lg,
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progressTitle: { color: 'rgba(255,255,255,0.8)', fontSize: FontSize.sm },
  progressPercent: { color: '#fff', fontWeight: '800', fontSize: FontSize.lg },
  progressBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 4 },
  progressText: { color: 'rgba(255,255,255,0.6)', fontSize: FontSize.xs, marginTop: 8, textAlign: 'center' },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  stat: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, alignItems: 'center',
  },
  statVal: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 4 },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm, textAlign: 'right' },
  subCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: Spacing.sm, gap: 12,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  subName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, textAlign: 'right' },
  subAddr: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2, textAlign: 'right' },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.full, alignSelf: 'flex-end', marginTop: 6,
  },
  statusText: { fontSize: FontSize.xs, fontWeight: '700' },
  collectBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.success,
    justifyContent: 'center', alignItems: 'center',
  },
});
