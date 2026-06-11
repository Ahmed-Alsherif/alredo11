import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme';
import api from '../../utils/api';
import { useRouter, useNavigation } from 'expo-router';

export default function SubscriptionScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [plans, setPlans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [userRes, plansRes, payRes] = await Promise.all([
        api.get('/users/me/'),
        api.get('/plans/'),
        api.get('/payments/')
      ]);
      setUser(userRes.data);
      setPlans(plansRes.data || []);
      setPayments(payRes.data || []);
    } catch (e) {
      console.warn(e.message);
      if (e?.response?.status !== 401) {
        Alert.alert('خطأ', 'فشل في تحميل بيانات الاشتراك');
      }
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

  const handleRenew = (plan) => {
    const performPlanChange = async () => {
      try {
        const res = await api.post('/subscribers/change_plan/', { plan_id: plan.id });
        Alert.alert(
          'نجاح تم اختيار الباقة 🎉',
          res.data.status || 'تم اختيار باقة الاشتراك بنجاح. يرجى سداد الرسوم للمندوب لتفعيل الاشتراك.'
        );
        fetchData();
      } catch (e) {
        console.error(e);
        const errMsg = e.response?.data?.error || 'حدث خطأ أثناء تغيير الباقة';
        Alert.alert('خطأ', errMsg);
      }
    };

    Alert.alert(
      'تأكيد اختيار الباقة',
      `هل تود الاشتراك أو تجديد اشتراكك في باقة "${plan.name}" بسعر ${plan.price} ر.س؟\n\n(سيتم سداد الرسوم نقداً للمندوب لتنشيط الخدمة)`,
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'تأكيد واختيار الباقة', 
          onPress: performPlanChange 
        }
      ]
    );
  };

  if (loading || !user) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  const isPaused = user.is_paused;
  const hasPlan = !!user.plan_name;
  const isExpired = user.subscription_end ? (new Date(user.subscription_end) < new Date()) : true;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.header}>
          <Text style={styles.title}>إدارة الاشتراك</Text>
          <Text style={styles.subtitle}>تفاصيل اشتراكك الحالي والباقات المتاحة</Text>
        </View>

        {/* Current Subscription Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>اشتراكي الحالي</Text>
          <View style={[styles.card, isExpired ? (hasPlan ? styles.cardPaused : styles.cardExpired) : (isPaused ? styles.cardPaused : {})]}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.planName}>{user.plan_name || 'باقة غير محددة'}</Text>
                <Text style={styles.subId}>{user.subscription_code || user.subscription_id || user.username}</Text>
              </View>
              <View style={[styles.statusBadge, isExpired ? (hasPlan ? styles.bgWarning : styles.bgDanger) : (isPaused ? styles.bgWarning : styles.bgSuccess)]}>
                <Text style={styles.statusText}>
                  {isExpired 
                    ? (hasPlan ? 'بانتظار السداد ⏳' : 'منتهي / غير نشط ❌') 
                    : (isPaused ? 'موقوف مؤقتاً ⏸️' : 'نشط ✅')}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.cardBody}>
              <View style={styles.infoRow}>
                <Ionicons name="calendar-outline" size={20} color={Colors.textMuted} />
                <Text style={styles.infoText}>تاريخ الانتهاء: <Text style={styles.infoBold}>{user.subscription_end || '-'}</Text></Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={20} color={Colors.textMuted} />
                <Text style={styles.infoText}>المنطقة: <Text style={styles.infoBold}>{user.zone_name || '-'}</Text></Text>
              </View>
              {user.excuse && (
                <View style={[styles.infoRow, { marginTop: 10 }]}>
                  <Ionicons name="information-circle-outline" size={20} color={Colors.warning} />
                  <Text style={[styles.infoText, { color: Colors.warning }]}>العذر المسجل: {user.excuse}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Available Plans */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الباقات المتاحة</Text>
          {plans.map(plan => (
            <View key={plan.id} style={styles.planCard}>
              <View style={styles.planHeader}>
                <Text style={styles.planTitle}>{plan.name}</Text>
                <Text style={styles.planPrice}>{plan.price} <Text style={{fontSize: 12}}>ر.س/{plan.duration_months} شهر</Text></Text>
              </View>
              <Text style={styles.planDesc}>{plan.description}</Text>
              <View style={styles.features}>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <Text style={styles.featureText}>عدد أكياس: {plan.bags_provided}</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                  <Text style={styles.featureText}>جمع منتظم حسب المنطقة</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.renewBtn} onPress={() => handleRenew(plan)}>
                <Text style={styles.renewBtnText}>اشتراك / تجديد</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>سجل الاشتراكات والمدفوعات</Text>
          <View style={styles.historyCard}>
            {payments.length === 0 ? (
              <Text style={{padding: 20, textAlign: 'center', color: Colors.textMuted}}>لا توجد سجلات سابقة</Text>
            ) : (
              payments.map((pay, i) => (
                <View key={pay.id} style={[styles.historyRow, i !== payments.length - 1 && styles.historyBorder]}>
                  <View style={styles.historyIcon}>
                    <Ionicons name="receipt" size={20} color={Colors.primary} />
                  </View>
                  <View style={{flex: 1}}>
                    <Text style={styles.historyTitle}>تجديد اشتراك</Text>
                    <Text style={styles.historyDate}>{new Date(pay.created_at || pay.date).toLocaleDateString('ar-SA')}</Text>
                  </View>
                  <Text style={styles.historyAmount}>{pay.amount} ر.س</Text>
                </View>
              ))
            )}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1, paddingHorizontal: Spacing.md },
  header: { paddingVertical: Spacing.lg },
  title: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary, textAlign: 'right' },
  subtitle: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'right' },
  section: { marginBottom: Spacing.xl },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md, textAlign: 'right' },
  
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md,
  },
  cardExpired: { borderColor: Colors.danger, backgroundColor: 'rgba(231, 76, 60, 0.05)' },
  cardPaused: { borderColor: Colors.warning, backgroundColor: 'rgba(243, 156, 18, 0.05)' },
  
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planName: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.primary },
  subId: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 4, fontFamily: 'monospace' },
  
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: Radius.full },
  bgSuccess: { backgroundColor: Colors.successLight },
  bgWarning: { backgroundColor: Colors.warningLight },
  bgDanger: { backgroundColor: Colors.dangerLight },
  statusText: { fontSize: FontSize.xs, fontWeight: '700', color: '#fff' },
  
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },
  
  cardBody: { gap: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  infoBold: { fontWeight: '700', color: Colors.textPrimary },

  planCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  planTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  planPrice: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.secondary },
  planDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 12, textAlign: 'right' },
  features: { marginBottom: Spacing.md, gap: 4 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featureText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  
  renewBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingVertical: 12, alignItems: 'center',
  },
  renewBtnText: { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },

  historyCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  historyRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: 12 },
  historyBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  historyIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center' },
  historyTitle: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  historyDate: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 4 },
  historyAmount: { fontSize: FontSize.md, fontWeight: '800', color: Colors.success }
});
