import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Modal, ActivityIndicator } from 'react-native';
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useRouter } from 'expo-router';

export default function SubscribersScreen() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'unpaid' | 'paid'
  const router = useRouter();

  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedSubscriber, setSelectedSubscriber] = useState(null);
  const [subscriberHistory, setSubscriberHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    const fetchSubscribers = async () => {
      try {
        const res = await api.get('/subscribers/');
        // Sort: red first, then yellow, then green
        const sorted = res.data.sort((a, b) => {
          const weight = { red: 1, yellow: 2, green: 3 };
          return (weight[a.color_status] || 4) - (weight[b.color_status] || 4);
        });
        setSubscribers(sorted);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchSubscribers();
  }, []);

  const handleOpenMap = (lat, lng) => {
    if (lat && lng) {
      Linking.openURL(`https://maps.google.com/?q=${lat},${lng}`);
    } else {
      alert('موقع المشترك غير متوفر');
    }
  };

  const handleCollect = (d) => {
    router.push({
      pathname: '/collect',
      params: { subId: d.id, name: d.name, phone: d.phone }
    });
  };

  const handleOpenHistory = async (d) => {
    setSelectedSubscriber(d);
    setHistoryModalVisible(true);
    setLoadingHistory(true);
    try {
      const res = await api.get(`/logs/?subscriber=${d.id}`);
      setSubscriberHistory(res.data);
    } catch (e) {
      console.error(e);
      alert('فشل في جلب سجل المشترك');
    } finally {
      setLoadingHistory(false);
    }
  };

  if (loading) return <SafeAreaView style={styles.safe}><Text style={{ color: Colors.textPrimary, padding: 20, textAlign: 'right' }}>جاري التحميل...</Text></SafeAreaView>;

  const totalCount = subscribers.length;
  const unpaidCount = subscribers.filter(s => s.color_status === 'red' || s.color_status === 'yellow').length;
  const paidCount = subscribers.filter(s => s.color_status === 'green').length;

  const filteredSubscribers = subscribers.filter(s => {
    if (activeFilter === 'unpaid') return s.color_status === 'red' || s.color_status === 'yellow';
    if (activeFilter === 'paid') return s.color_status === 'green';
    return true;
  });

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={styles.header}>
          <Text style={styles.title}>مشتركي المنطقة</Text>
          <Text style={styles.subtitle}>{subscribers.length} مشترك مسجل لديك</Text>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <TouchableOpacity 
            style={[styles.filterTab, activeFilter === 'all' && styles.filterTabActive]} 
            onPress={() => setActiveFilter('all')}
          >
            <Text style={[styles.filterTabText, activeFilter === 'all' && styles.filterTabTextActive]}>
              الكل ({totalCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.filterTab, activeFilter === 'unpaid' && styles.filterTabActiveUnpaid]} 
            onPress={() => setActiveFilter('unpaid')}
          >
            <Text style={[styles.filterTabText, activeFilter === 'unpaid' && styles.filterTabTextActiveUnpaid]}>
              غير المسددين ({unpaidCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.filterTab, activeFilter === 'paid' && styles.filterTabActivePaid]} 
            onPress={() => setActiveFilter('paid')}
          >
            <Text style={[styles.filterTabText, activeFilter === 'paid' && styles.filterTabTextActivePaid]}>
              المسددين ({paidCount})
            </Text>
          </TouchableOpacity>
        </View>

        {filteredSubscribers.map(d => {
          let statusLabel = 'غير محدد';
          let statusColor = Colors.textMuted;
          let statusBg = Colors.border;

          if (d.color_status === 'green') {
            statusLabel = 'تم الدفع';
            statusColor = Colors.success;
            statusBg = Colors.successLight;
          } else if (d.color_status === 'yellow') {
            statusLabel = d.excuse ? 'متأخر بعذر' : 'مستحق الدفع';
            statusColor = Colors.warning;
            statusBg = 'rgba(217, 119, 6, 0.12)';
          } else if (d.color_status === 'red') {
            statusLabel = 'متأخر جداً (+3 أشهر)';
            statusColor = Colors.danger;
            statusBg = Colors.dangerLight;
          }

          return (
            <View key={d.id} style={styles.debtorCard}>
              <TouchableOpacity style={styles.historyIconBtn} onPress={() => handleOpenHistory(d)}>
                <Ionicons name="time-outline" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
              
              <View style={styles.row}>
                <View style={[styles.colorDot, { backgroundColor: statusColor }]} />
                <View style={{ flex: 1, paddingRight: 4 }}>
                  <Text style={styles.debtorName}>{d.name}</Text>
                  <Text style={styles.debtorId}>{d.subscription_id || `ID: ${d.id}`} · {d.phone}</Text>
                  
                  {/* Display current plan */}
                  <View style={styles.planBadgeContainer}>
                    <Ionicons name="card-outline" size={12} color={Colors.textMuted} />
                    <Text style={styles.planBadgeText}>
                      الباقة الحالية: {d.plan_name || 'بدون باقة'}
                    </Text>
                  </View>
                </View>
                
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.amount, { color: d.color_status === 'green' ? Colors.success : Colors.textPrimary }]}>
                    {d.color_status === 'green' ? '0 ر.س' : `${parseFloat(d.balance) || 300} ر.س`}
                  </Text>
                  
                  {/* Status Badge */}
                  <View style={[styles.statusBadge, { backgroundColor: statusBg, marginTop: 6 }]}>
                    <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                      {statusLabel}
                    </Text>
                  </View>
                </View>
              </View>

              {d.excuse ? (
                <View style={styles.excuseBox}>
                  <Ionicons name="chatbox-outline" size={14} color={Colors.warning} />
                  <Text style={styles.excuseText}>العذر: {d.excuse}</Text>
                </View>
              ) : null}

              <View style={styles.actions}>
                <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${d.phone}`)}>
                  <Ionicons name="call-outline" size={16} color={Colors.success} />
                  <Text style={[styles.actionText, { color: Colors.success }]}>اتصال</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.mapBtn} onPress={() => handleOpenMap(d.latitude, d.longitude)}>
                  <Ionicons name="location-outline" size={16} color={Colors.info || '#0ea5e9'} />
                  <Text style={[styles.actionText, { color: Colors.info || '#0ea5e9' }]}>الموقع</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.collectActionBtn} onPress={() => handleCollect(d)}>
                  <Ionicons name="cash-outline" size={16} color={Colors.primary} />
                  <Text style={[styles.actionText, { color: Colors.primary }]}>تحصيل</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* History Modal */}
      <Modal visible={historyModalVisible} animationType="slide" transparent={true} onRequestClose={() => setHistoryModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>سجل الاشتراكات: {selectedSubscriber?.name}</Text>
              <TouchableOpacity onPress={() => setHistoryModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            
            {loadingHistory ? (
              <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 40 }} />
            ) : subscriberHistory.length === 0 ? (
              <Text style={{ textAlign: 'center', padding: 20, color: Colors.textMuted }}>لا يوجد سجل سابق لهذا المشترك.</Text>
            ) : (
              <ScrollView style={{ maxHeight: 400 }}>
                {subscriberHistory.map(log => (
                  <View key={log.id} style={styles.logCard}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontWeight: '800', color: Colors.textPrimary, fontSize: FontSize.md }}>{log.plan_name || 'اشتراك'}</Text>
                        <View style={[styles.statusBadge, { backgroundColor: log.payment_receipt ? Colors.successLight : Colors.dangerLight }]}>
                          <Text style={[styles.statusBadgeText, { color: log.payment_receipt ? Colors.success : Colors.danger }]}>
                            {log.payment_receipt ? 'مسدد' : 'غير مسدد'}
                          </Text>
                        </View>
                      </View>
                      <Text style={{ fontWeight: '800', color: Colors.primary, fontSize: FontSize.md }}>{log.plan_price} ر.س</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ color: Colors.textSecondary, fontSize: FontSize.sm }}>من: {log.start_date}</Text>
                      <Text style={{ color: Colors.textSecondary, fontSize: FontSize.sm }}>إلى: {log.end_date}</Text>
                    </View>
                    {log.payment_receipt ? (
                      <Text style={{ color: Colors.success, fontSize: FontSize.xs, marginTop: 4, textAlign: 'right' }}>رقم الإيصال: {log.payment_receipt}</Text>
                    ) : null}
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1, paddingHorizontal: Spacing.md },
  header: { paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  title: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary, textAlign: 'right' },
  subtitle: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'right' },
  filterContainer: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
    justifyContent: 'center',
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterTabActiveUnpaid: {
    backgroundColor: Colors.danger,
    borderColor: Colors.danger,
  },
  filterTabActivePaid: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  filterTabText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  filterTabTextActive: {
    color: '#fff',
  },
  filterTabTextActiveUnpaid: {
    color: '#fff',
  },
  filterTabTextActivePaid: {
    color: '#fff',
  },
  planBadgeContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  planBadgeText: {
    fontSize: FontSize.xs - 1,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  debtorCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  colorDot: { width: 12, height: 12, borderRadius: 6 },
  debtorName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, textAlign: 'right' },
  debtorId: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2, textAlign: 'right' },
  amount: { fontSize: FontSize.lg, fontWeight: '800' },
  excuseBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.card, borderRadius: Radius.sm, padding: 10, marginTop: 10,
  },
  excuseText: { fontSize: FontSize.xs, color: Colors.textMuted, flex: 1, textAlign: 'right' },
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: 12 },
  callBtn: {
    flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6,
    backgroundColor: Colors.successLight, borderRadius: Radius.sm, paddingVertical: 10,
  },
  mapBtn: {
    flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6,
    backgroundColor: '#e0f2fe', borderRadius: Radius.sm, paddingVertical: 10,
  },
  collectActionBtn: {
    flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primaryLight, borderRadius: Radius.sm, paddingVertical: 10,
  },
  actionText: { fontSize: FontSize.sm, fontWeight: '700' },
  historyIconBtn: { position: 'absolute', top: 12, left: 12, zIndex: 10, padding: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Colors.bg, borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg, padding: Spacing.lg, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  modalTitle: { fontSize: FontSize.md, fontWeight: '800', color: Colors.textPrimary },
  logCard: { backgroundColor: Colors.surface, borderRadius: Radius.sm, padding: Spacing.md, marginBottom: Spacing.sm, borderWidth: 1, borderColor: Colors.border },
});
