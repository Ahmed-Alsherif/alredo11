import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import api from '../../utils/api';

const rankEmoji = ['🥇', '🥈', '🥉'];
const categories = [
  { name: 'بلاستيك', key: 'plastic', icon: '🧴', color: Colors.info, pointsPerBag: 30 },
  { name: 'معادن', key: 'metal', icon: '🥫', color: Colors.warning, pointsPerBag: 40 },
  { name: 'ورق', key: 'paper', icon: '📦', color: Colors.success, pointsPerBag: 20 },
  { name: 'خبز', key: 'bread', icon: '🍞', color: Colors.danger, pointsPerBag: 15 },
];

const statusMap = {
  'pending': { text: 'بانتظار الجمع ⏳', color: Colors.warning, bg: Colors.warningLight },
  'collected': { text: 'تم الجمع بنجاح ✅', color: Colors.success, bg: Colors.successLight },
  'cancelled': { text: 'ملغي ❌', color: Colors.danger, bg: Colors.dangerLight },
};

const categoryMap = {
  'plastic': { name: 'بلاستيك', icon: '🧴' },
  'metal': { name: 'معادن', icon: '🥫' },
  'paper': { name: 'ورق', icon: '📦' },
  'bread': { name: 'خبز', icon: '🍞' },
};

export default function RecyclingScreen() {
  const [stats, setStats] = useState({ total_operations: 0, active_participants: 0, total_bags: 0 });
  const [leaderboard, setLeaderboard] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal pickup selection states
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [bagsCount, setBagsCount] = useState(1);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, leadRes, requestsRes] = await Promise.all([
        api.get('/recycling/stats/'),
        api.get('/recycling/leaderboard/'),
        api.get('/recycling/')
      ]);
      setStats(statsRes.data);
      setLeaderboard(leadRes.data);
      setMyRequests(requestsRes.data);
    } catch (e) {
      console.warn(e.message);
    } finally {
      setLoading(false);
    }
  };

  const openRequestDialog = (cat) => {
    setSelectedCategory(cat);
    setBagsCount(1);
    setShowModal(true);
  };

  const submitPickupRequest = async () => {
    if (!selectedCategory) return;
    try {
      await api.post('/recycling/', {
        category: selectedCategory.key,
        bags_count: bagsCount
      });
      setShowModal(false);
      Alert.alert('تم بنجاح! 🎉', `تم تسجيل طلب لجمع ${bagsCount} أكياس مفرزة (${selectedCategory.name}) للسائق.`);
      fetchData();
    } catch (e) {
      console.warn(e.message);
      if (e?.response?.status !== 401) {
        Alert.alert('خطأ', 'حدث خطأ أثناء إرسال طلب التدوير');
      }
    }
  };

  if (loading) return <SafeAreaView style={styles.safe}><Text style={{ color: Colors.textPrimary, padding: 20, textAlign: 'right' }}>جاري التحميل...</Text></SafeAreaView>;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={styles.header}>
          <Text style={styles.title}>التدوير والتحفيز</Text>
          <Text style={styles.subtitle}>ساهم في حماية البيئة واكسب نقاط</Text>
        </View>

        {/* Points Card */}
        <View style={styles.pointsCard}>
          <View style={styles.pointsTop}>
            <Text style={{ fontSize: 36 }}>♻️</Text>
            <View>
              <Text style={styles.pointsValue}>{stats.total_points || (stats.total_operations * 10)}</Text>
              <Text style={styles.pointsLabel}>نقطة بيئية</Text>
            </View>
          </View>
          <View style={styles.badgeRow}>
            <View style={styles.badgePill}>
              <Text style={styles.badgePillText}>{stats.rank || 'مساهم 🌱'}</Text>
            </View>
            <Text style={styles.recycleCount}>{stats.total_operations} عملية جمع ناجحة</Text>
          </View>
        </View>

        {/* Request Pickup */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>طلب جمع أكياس مفرزة</Text>
          <View style={styles.catGrid}>
            {categories.map(c => (
              <TouchableOpacity key={c.name} style={styles.catCard} onPress={() => openRequestDialog(c)}>
                <Text style={{ fontSize: 28 }}>{c.icon}</Text>
                <Text style={styles.catName}>{c.name}</Text>
                <Text style={styles.catPoints}>+{c.pointsPerBag}ن / كيس</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* My Requests History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 سجل طلباتي الحالية والسابقة</Text>
          {myRequests.length === 0 ? (
            <View style={styles.emptyRequests}>
              <Ionicons name="document-text-outline" size={32} color={Colors.textMuted} />
              <Text style={styles.emptyRequestsText}>لم تقم بأي طلبات جمع بعد</Text>
            </View>
          ) : (
            <View style={styles.requestsCard}>
              {myRequests.map((req, index) => {
                const catInfo = categoryMap[req.category] || { name: req.category, icon: '♻️' };
                const statInfo = statusMap[req.status] || { text: req.status, color: Colors.textSecondary, bg: Colors.surface };
                return (
                  <View 
                    key={req.id} 
                    style={[
                      styles.requestRow, 
                      index < myRequests.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.border }
                    ]}
                  >
                    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 12, flex: 1 }}>
                      <Text style={{ fontSize: 24 }}>{catInfo.icon}</Text>
                      <View style={{ alignItems: 'flex-end', flex: 1 }}>
                        <Text style={styles.reqCategoryName}>طلب جمع {catInfo.name}</Text>
                        <Text style={styles.reqBagsCount}>{req.bags_count} أكياس مفرزة</Text>
                        <Text style={styles.reqDate}>
                          {new Date(req.created_at).toLocaleDateString('ar-SA')} {new Date(req.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={[styles.statusBadgePill, { backgroundColor: statInfo.bg }]}>
                      <Text style={[styles.statusBadgeText, { color: statInfo.color }]}>
                        {statInfo.text}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Leaderboard */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏆 لوحة المتصدرين</Text>
          <View style={styles.leaderCard}>
            {leaderboard.length === 0 ? (
              <Text style={{ color: Colors.textSecondary, padding: 20, textAlign: 'center' }}>لا يوجد متصدرين حالياً</Text>
            ) : (
              leaderboard.map((r, i) => (
                <View key={r.rank || i} style={[styles.leaderRow, i < leaderboard.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.border }]}>
                  <Text style={styles.rankText}>{rankEmoji[i] || `#${i+1}`}</Text>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Text style={styles.leaderName}>{r.name}</Text>
                    <Text style={styles.leaderBadge}>{r.badge || 'مساهم'}</Text>
                  </View>
                  <Text style={styles.leaderPoints}>{r.points} ن</Text>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Request Quantity Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {selectedCategory && (
              <>
                <Text style={styles.modalEmoji}>{selectedCategory.icon}</Text>
                <Text style={styles.modalTitle}>طلب جمع أكياس {selectedCategory.name}</Text>
                
                <Text style={styles.modalInfoText}>
                  كل كيس {selectedCategory.name} يمنحك {selectedCategory.pointsPerBag} نقطة عند جمعه!
                </Text>

                {/* Counter Stepper */}
                <View style={styles.stepperContainer}>
                  <TouchableOpacity 
                    style={styles.stepBtn} 
                    onPress={() => setBagsCount(prev => Math.min(10, prev + 1))}
                  >
                    <Ionicons name="add" size={24} color="#fff" />
                  </TouchableOpacity>
                  
                  <Text style={styles.stepValue}>{bagsCount}</Text>
                  
                  <TouchableOpacity 
                    style={styles.stepBtn} 
                    onPress={() => setBagsCount(prev => Math.max(1, prev - 1))}
                  >
                    <Ionicons name="remove" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.stepLabel}>عدد الأكياس المفرزة</Text>

                <View style={styles.pointsPreviewCard}>
                  <Text style={styles.previewPointsVal}>
                    +{bagsCount * selectedCategory.pointsPerBag}
                  </Text>
                  <Text style={styles.previewPointsLabel}>نقاط متوقعة</Text>
                </View>

                {/* Submit Action */}
                <TouchableOpacity style={styles.submitBtn} onPress={submitPickupRequest}>
                  <Text style={styles.submitBtnText}>إرسال الطلب للسائق</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => setShowModal(false)}
                  style={styles.cancelBtn}
                >
                  <Text style={styles.cancelBtnText}>إلغاء</Text>
                </TouchableOpacity>
              </>
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
  pointsCard: {
    backgroundColor: Colors.success, borderRadius: Radius.lg, padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  pointsTop: { flexDirection: 'row-reverse', alignItems: 'center', gap: 16, marginBottom: 12 },
  pointsValue: { fontSize: FontSize.hero, fontWeight: '800', color: '#fff', textAlign: 'right' },
  pointsLabel: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)', textAlign: 'right' },
  badgeRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  badgePill: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 5, borderRadius: Radius.full },
  badgePillText: { color: '#fff', fontSize: FontSize.xs, fontWeight: '700' },
  recycleCount: { color: 'rgba(255,255,255,0.7)', fontSize: FontSize.xs },
  section: { marginBottom: Spacing.lg },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm, textAlign: 'right' },
  catGrid: { flexDirection: 'row-reverse', gap: Spacing.sm },
  catCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, alignItems: 'center', gap: 6,
  },
  catName: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: '700', marginTop: 4 },
  catPoints: { fontSize: 10, color: Colors.secondary, fontWeight: '600' },
  leaderCard: { backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  leaderRow: { flexDirection: 'row-reverse', alignItems: 'center', padding: Spacing.md, gap: 12 },
  rankText: { fontSize: 18, width: 30, textAlign: 'center', color: Colors.textSecondary },
  leaderName: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  leaderBadge: { fontSize: FontSize.xs, color: Colors.textMuted },
  leaderPoints: { fontSize: FontSize.md, fontWeight: '800', color: Colors.secondary },

  // Requests list
  emptyRequests: {
    backgroundColor: Colors.surface, borderRadius: Radius.md, padding: Spacing.xl,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border, gap: 8
  },
  emptyRequestsText: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: '600' },
  requestsCard: { backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  requestRow: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md, gap: 12 },
  reqCategoryName: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  reqBagsCount: { fontSize: FontSize.xs, color: Colors.textSecondary, marginVertical: 2 },
  reqDate: { fontSize: 10, color: Colors.textMuted },
  statusBadgePill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },

  // Modal request quantity
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 32, 29, 0.42)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 24, width: '85%', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  modalEmoji: { fontSize: 48, marginBottom: 12 },
  modalTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center', marginBottom: 6 },
  modalInfoText: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', marginBottom: 20, paddingHorizontal: 10 },
  stepperContainer: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 8 },
  stepBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  stepValue: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, width: 40, textAlign: 'center' },
  stepLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginBottom: 16 },
  pointsPreviewCard: { backgroundColor: Colors.primaryLight, paddingHorizontal: 20, paddingVertical: 10, borderRadius: Radius.md, alignItems: 'center', marginBottom: 24 },
  previewPointsVal: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.primary },
  previewPointsLabel: { fontSize: 10, color: Colors.textSecondary },
  submitBtn: { backgroundColor: Colors.success, width: '100%', paddingVertical: 14, borderRadius: Radius.md, alignItems: 'center', marginBottom: 12 },
  submitBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '800' },
  cancelBtn: { width: '100%', paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: '600' },
});
