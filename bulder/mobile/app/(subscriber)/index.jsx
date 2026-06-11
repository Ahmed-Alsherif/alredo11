import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useRouter, useNavigation } from 'expo-router';
import api from '../../utils/api';

export default function SubscriberHome() {
  const router = useRouter();
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ total_operations: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [meRes, statsRes] = await Promise.all([
        api.get('/users/me/'),
        api.get('/recycle-requests/stats/')
      ]);
      setUser(meRes.data);
      setStats(statsRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchData();
    });
    return unsubscribe;
  }, [navigation]);

  const togglePause = async () => {
    if (!user) return;
    const isCurrentlyPaused = user.is_paused;
    const actionText = isCurrentlyPaused ? 'تفعيل الاشتراك' : 'إيقاف مؤقت';
    const alertMsg = isCurrentlyPaused 
      ? 'هل تود إعادة تفعيل اشتراكك لاستئناف خدمة الاستلام؟'
      : 'هل تود إيقاف اشتراكك مؤقتاً لتعليق خدمة استلام النفايات؟';

    const performAction = async () => {
      try {
        const subId = user.subscriber_id;
        if (!subId) {
          Alert.alert('خطأ', 'لم يتم العثور على معرف المشترك');
          return;
        }
        const endpoint = isCurrentlyPaused 
          ? `/subscribers/${subId}/resume/`
          : `/subscribers/${subId}/pause/`;

        await api.post(endpoint);
        
        setUser(prev => ({
          ...prev,
          is_paused: !isCurrentlyPaused
        }));

        Alert.alert('تم بنجاح', isCurrentlyPaused ? 'تم إعادة تفعيل اشتراكك بنجاح' : 'تم إيقاف اشتراكك مؤقتاً');
      } catch (e) {
        console.error(e);
        Alert.alert('خطأ', 'حدث خطأ أثناء معالجة الطلب');
      }
    };

    if (Platform.OS === 'web') {
      const ok = window.confirm(`${actionText}\n\n${alertMsg}`);
      if (ok) performAction();
    } else {
      Alert.alert(actionText, alertMsg, [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'تأكيد', style: isCurrentlyPaused ? 'default' : 'destructive', onPress: performAction }
      ]);
    }
  };

  if (loading || !user) return <SafeAreaView style={styles.safe}><Text style={{color:'#fff', padding: 20}}>جاري التحميل...</Text></SafeAreaView>;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>أهلاً 👋</Text>
            <Text style={styles.name}>{user.first_name || user.username}</Text>
          </View>
          <TouchableOpacity style={styles.notifBadge} onPress={() => router.push('/notifications')}>
            <Ionicons name="notifications-outline" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Next Collection */}
        <View style={[styles.collectionCard, user.is_paused && { backgroundColor: Colors.warning }]}>
          <View style={styles.collectionGradient}>
            <View style={styles.collectionIcon}>
              <Text style={{ fontSize: 28 }}>{user.is_paused ? '⏸️' : '🚛'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.collectionLabel, user.is_paused && { color: '#1a1a2e' }]}>
                {user.is_paused ? 'حالة الاشتراك' : 'المنطقة'}
              </Text>
              <Text style={[styles.collectionDay, user.is_paused && { color: '#1a1a2e' }]}>
                {user.is_paused ? 'الاشتراك موقوف مؤقتاً' : (user.zone_name || 'غير محدد')}
              </Text>
              <Text style={[styles.collectionDays, user.is_paused && { color: 'rgba(26,26,46,0.8)', fontWeight: '600' }]}>
                {user.is_paused 
                  ? 'تم تعليق الخدمة والاستلام مؤقتاً. اضغط على تفعيل لتنشيطها.' 
                  : (user.collection_days && user.collection_days.length > 0
                    ? `🗓️ أيام الجمع: ${user.collection_days.join(' - ')}`
                    : 'تتبع جدول منطقتك لمعرفة أيام الجمع')}
              </Text>
            </View>
            {!user.is_paused && <Ionicons name="chevron-back" size={20} color="rgba(255,255,255,0.5)" />}
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderRightColor: Colors.primary, borderRightWidth: 3 }]}>
            <Text style={styles.statValue}>{stats.total_operations * 10}</Text>
            <Text style={styles.statLabel}>نقاط التدوير</Text>
          </View>
          <View style={[styles.statCard, { borderRightColor: Colors.secondary, borderRightWidth: 3 }]}>
            <Text style={styles.statValue}>{stats.total_operations}</Text>
            <Text style={styles.statLabel}>عملية تدوير</Text>
          </View>
          <View style={[styles.statCard, { borderRightColor: Colors.success, borderRightWidth: 3 }]}>
            <Text style={[styles.statValue, { fontSize: FontSize.md }]}>مساهم</Text>
            <Text style={styles.statLabel}>الرتبة البيئية</Text>
          </View>
        </View>

        {/* Subscription Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>معلومات الاشتراك</Text>
          <View style={styles.infoCard}>
            <InfoRow icon="id-card-outline" label="الهاتف" value={user.phone || '-'} />
            <InfoRow icon="location-outline" label="المنطقة" value={user.zone_name || '-'} />
            <InfoRow icon="ellipse" label="حساب الموظف" value={user.is_active_employee ? 'نعم' : 'لا'} valueColor={Colors.success} last />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>إجراءات سريعة</Text>
          <View style={styles.actionsRow}>
            <ActionBtn icon="leaf-outline" label="طلب تدوير" color={Colors.success} onPress={() => router.push('/recycling')} />
            <ActionBtn icon="location-outline" label="تتبع الشاحنة" color={Colors.secondary} onPress={() => router.push('/tracking')} />
            <ActionBtn icon="chatbubble-outline" label="شكوى" color={Colors.warning} onPress={() => router.push('/complaints')} />
            <ActionBtn 
              icon={user.is_paused ? "play-circle-outline" : "pause-circle-outline"} 
              label={user.is_paused ? "تفعيل الاشتراك" : "إيقاف مؤقت"} 
              color={user.is_paused ? Colors.success : Colors.danger} 
              onPress={togglePause} 
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value, valueColor, last }) {
  return (
    <View style={[styles.infoRow, !last && { borderBottomWidth: 1, borderBottomColor: Colors.border }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Ionicons name={icon} size={18} color={Colors.textMuted} />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={[styles.infoValue, valueColor && { color: valueColor }]}>{value}</Text>
    </View>
  );
}

function ActionBtn({ icon, label, color, onPress }) {
  return (
    <TouchableOpacity style={styles.actionBtn} onPress={onPress}>
      <View style={[styles.actionIcon, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1, paddingHorizontal: Spacing.md },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  greeting: { fontSize: FontSize.md, color: Colors.textSecondary },
  name: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  notifBadge: { position: 'relative' },
  dot: {
    position: 'absolute', top: -4, right: -4, width: 18, height: 18,
    borderRadius: 9, backgroundColor: Colors.danger, justifyContent: 'center', alignItems: 'center',
  },
  dotText: { fontSize: 10, color: '#fff', fontWeight: '700' },
  collectionCard: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  collectionGradient: {
    flexDirection: 'row', alignItems: 'center',
    padding: Spacing.lg, gap: Spacing.md,
  },
  collectionIcon: {
    width: 56, height: 56, borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center',
  },
  collectionLabel: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)' },
  collectionDay: { fontSize: FontSize.xl, fontWeight: '800', color: '#fff', marginVertical: 2 },
  collectionDays: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.6)' },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  statCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, alignItems: 'center',
  },
  statValue: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 4 },
  section: { marginBottom: Spacing.lg },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm, textAlign: 'right' },
  infoCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: 14,
  },
  infoLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  infoValue: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  actionsRow: { flexDirection: 'row', gap: Spacing.sm },
  actionBtn: { flex: 1, alignItems: 'center', gap: 8 },
  actionIcon: {
    width: 52, height: 52, borderRadius: Radius.md,
    justifyContent: 'center', alignItems: 'center',
  },
  actionLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600' },
});
