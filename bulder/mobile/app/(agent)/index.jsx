import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';
import api from '../../utils/api';

export default function AgentHome() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [debtors, setDebtors] = useState([]);
  const [collectionsToday, setCollectionsToday] = useState(0);
  const [collectionsAmount, setCollectionsAmount] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const u = await AsyncStorage.getItem('user');
      if (u) setUser(JSON.parse(u));
      
      const [subsRes, finRes] = await Promise.all([
        api.get('/subscribers/'),
        api.get('/finance/payments/')
      ]);
      
      const lateSubs = subsRes.data.filter(s => s.status === 'red' || s.color_status === 'red' || s.color_status_display === 'متأخر');
      setDebtors(lateSubs);
      
      const todayStr = new Date().toISOString().split('T')[0];
      const todaysCols = finRes.data.filter(f => f.created_at && f.created_at.startsWith(todayStr));
      setCollectionsToday(todaysCols.length);
      setCollectionsAmount(todaysCols.reduce((sum, c) => sum + parseFloat(c.amount), 0));
      
      const pendings = finRes.data.filter(f => f.status === 'pending');
      setPendingCount(pendings.length);
      setPendingAmount(pendings.reduce((sum, c) => sum + parseFloat(c.amount), 0));
      
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const handleSettlement = () => {
    if (pendingCount === 0) {
      Alert.alert("تنبيه", "لا توجد فواتير معلقة لتسليمها كعهدة.");
      return;
    }
    
    Alert.alert(
      "تسليم العهدة",
      `هل أنت متأكد أنك تريد تسليم عهدة بمبلغ ${pendingAmount} ر.س (${pendingCount} فاتورة) للمحاسب؟`,
      [
        { text: "إلغاء", style: "cancel" },
        { 
          text: "تأكيد التسليم", 
          onPress: async () => {
            try {
              setLoading(true);
              await api.post('/finance/settlements/');
              Alert.alert("نجاح", "تم إنشاء محضر التسليم وهو بانتظار تأكيد المحاسب.");
              fetchData();
            } catch (err) {
              console.error(err);
              Alert.alert("خطأ", "حدث خطأ أثناء محاولة إنشاء محضر التسليم.");
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const totalDebt = debtors.reduce((s, d) => s + (parseFloat(d.balance) || 300), 0); // fallback 300
  const target = 2500;
  const progressPercent = Math.min(Math.round((collectionsAmount / target) * 100), 100);

  if (loading) return <SafeAreaView style={styles.safe}><Text style={{color:'#fff', padding: 20}}>جاري التحميل...</Text></SafeAreaView>;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>مرحباً، {user?.first_name || 'المندوب'} 📋</Text>
            <Text style={styles.subtitle}>{user?.zone_name || 'المنطقة'} — مندوب التحصيل</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.stat, { borderRightColor: Colors.success, borderRightWidth: 3 }]}>
            <Text style={styles.statVal}>{collectionsToday}</Text>
            <Text style={styles.statLabel}>فواتير اليوم</Text>
          </View>
          <View style={[styles.stat, { borderRightColor: Colors.danger, borderRightWidth: 3 }]}>
            <Text style={styles.statVal}>{debtors.length}</Text>
            <Text style={styles.statLabel}>متأخرين</Text>
          </View>
          <View style={[styles.stat, { borderRightColor: Colors.warning, borderRightWidth: 3 }]}>
            <Text style={styles.statVal}>{pendingAmount}</Text>
            <Text style={styles.statLabel}>عهدة (ر.س)</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={{ flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg }}>
          <TouchableOpacity 
            style={[styles.settlementCard, { flex: 1, marginBottom: 0, padding: Spacing.md, borderColor: Colors.secondary }]} 
            onPress={() => router.push('/register')}
            activeOpacity={0.8}
          >
            <View style={{ alignItems: 'center' }}>
              <View style={[styles.settlementIconBg, { backgroundColor: Colors.secondary, marginBottom: 8 }]}>
                <Ionicons name="person-add" size={24} color={Colors.bg} />
              </View>
              <Text style={[styles.settlementTitle, { color: Colors.secondary, fontSize: FontSize.sm, textAlign: 'center' }]}>تسجيل مشترك جديد</Text>
            </View>
          </TouchableOpacity>

          {/* Settlement Action */}
          <TouchableOpacity 
            style={[styles.settlementCard, pendingCount === 0 && { opacity: 0.7 }, { flex: 1, marginBottom: 0, padding: Spacing.md }]} 
            onPress={handleSettlement}
            activeOpacity={0.8}
          >
            <View style={{ alignItems: 'center' }}>
              <View style={[styles.settlementIconBg, { marginBottom: 8 }]}>
                <Ionicons name="document-text" size={24} color={Colors.bg} />
              </View>
              <Text style={[styles.settlementTitle, { fontSize: FontSize.sm, textAlign: 'center' }]}>تسليم العهدة اليومية</Text>
              <Text style={[styles.settlementDesc, { textAlign: 'center' }]}>
                {pendingCount > 0 ? `${pendingAmount} ر.س` : 'لا يوجد عهدة'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Today Target */}
        <View style={styles.targetCard}>
          <View style={styles.targetRow}>
            <Text style={{ fontSize: 28 }}>🎯</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.targetLabel}>هدف التحصيل اليومي</Text>
              <Text style={styles.targetValue}>{target.toLocaleString()} ر.س</Text>
            </View>
            <View>
              <Text style={styles.targetAchieved}>{collectionsAmount}</Text>
              <Text style={styles.targetPercent}>{progressPercent}%</Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
        </View>

        {/* Quick Summary */}
        <Text style={styles.sectionTitle}>ملخص سريع</Text>
        <View style={styles.summaryCard}>
          <SummaryRow icon="people-outline" label="مشتركين جدد اليوم" value="0" />
          <SummaryRow icon="cash-outline" label="إجمالي محصّل اليوم" value={`${collectionsAmount} ر.س`} />
          <SummaryRow icon="receipt-outline" label="إيصالات صادرة" value={String(collectionsToday)} />
          <SummaryRow icon="alert-circle-outline" label="متأخرين بحاجة زيارة" value={String(debtors.length)} last />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryRow({ icon, label, value, last }) {
  return (
    <View style={[styles.summaryRow, !last && { borderBottomWidth: 1, borderBottomColor: Colors.border }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Ionicons name={icon} size={18} color={Colors.textMuted} />
        <Text style={styles.summaryLabel}>{label}</Text>
      </View>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
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
  greeting: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary, textAlign: 'right' },
  subtitle: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'right' },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  stat: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, alignItems: 'center',
  },
  statVal: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 4 },
  settlementCard: {
    backgroundColor: '#fff', borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.lg,
    borderWidth: 2, borderColor: Colors.primary,
  },
  settlementContent: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  settlementTitle: {
    fontSize: FontSize.md, fontWeight: '800', color: Colors.primary, textAlign: 'right', marginBottom: 4,
  },
  settlementDesc: {
    fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'right',
  },
  settlementIconBg: {
    backgroundColor: Colors.primary, width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center',
  },
  targetCard: {
    backgroundColor: Colors.secondary, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.lg,
  },
  targetRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12 },
  targetLabel: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)' },
  targetValue: { fontSize: FontSize.xl, fontWeight: '800', color: '#fff' },
  targetAchieved: { fontSize: FontSize.lg, fontWeight: '800', color: '#fff', textAlign: 'center' },
  targetPercent: { fontSize: FontSize.xs, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
  progressBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 4 },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm, textAlign: 'right' },
  summaryCard: { backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 14 },
  summaryLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  summaryValue: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
});
