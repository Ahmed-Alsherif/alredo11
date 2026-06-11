import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Platform, ActivityIndicator } from 'react-native';
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import api from '../../utils/api';

export default function RegisterScreen() {
  const [form, setForm] = useState({ name: '', phone: '' });
  const [dbPlans, setDbPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [gpsLocation, setGpsLocation] = useState(null);
  const [fetchingGps, setFetchingGps] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.get('/plans/');
        setDbPlans(res.data);
        if (res.data.length > 0) {
          // Default to the first plan in list
          setSelectedPlanId(res.data[0].id);
        }
      } catch (e) {
        console.error('Failed to fetch plans', e);
      }
    };
    fetchPlans();
  }, []);

  const captureGps = () => {
    setFetchingGps(true);
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setFetchingGps(false);
          if (Platform.OS === 'web') {
            alert('تم التقاط الموقع الجغرافي بنجاح!');
          } else {
            Alert.alert('نجاح', 'تم التقاط الموقع بنجاح');
          }
        },
        (error) => {
          console.error(error);
          setFetchingGps(false);
          const errorMsg = 'فشل التقاط الموقع. يرجى تفعيل الـ GPS وإعطاء الصلاحيات.';
          if (Platform.OS === 'web') {
            alert(errorMsg);
          } else {
            Alert.alert('خطأ', errorMsg);
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
      );
    } else {
      setFetchingGps(false);
      const notSupportedMsg = 'جهازك لا يدعم نظام تحديد المواقع (GPS)';
      if (Platform.OS === 'web') {
        alert(notSupportedMsg);
      } else {
        Alert.alert('خطأ', notSupportedMsg);
      }
    }
  };

  const clearGps = () => {
    setGpsLocation(null);
  };

  const submit = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      const emptyMsg = 'يرجى ملء جميع الحقول المطلوبة (الاسم الكامل ورقم الهاتف)';
      if (Platform.OS === 'web') alert(emptyMsg);
      else Alert.alert('تنبيه', emptyMsg);
      return;
    }

    setLoading(true);
    try {
      const parts = form.name.trim().split(/\s+/);
      const res = await api.post('/subscribers/', {
        first_name: parts[0],
        last_name: parts.slice(1).join(' '),
        phone: form.phone,
        username: form.phone,
        address: '',
        plan: selectedPlanId,
        latitude: gpsLocation ? gpsLocation.latitude : null,
        longitude: gpsLocation ? gpsLocation.longitude : null,
      });

      const successMsg = `تم تسجيل ${form.name} بنجاح\nرقم الاشتراك: ${res.data.subscription_id || 'SUB-123'}`;
      if (Platform.OS === 'web') {
        alert(successMsg);
      } else {
        Alert.alert('تم التسجيل!', successMsg);
      }
      setForm({ name: '', phone: '' });
      setGpsLocation(null);
    } catch (e) {
      console.error(e);
      let errorMsg = 'فشل في تسجيل المشترك الجديد';
      if (e.response && e.response.data) {
        if (e.response.data.error) {
          errorMsg = e.response.data.error;
        } else if (typeof e.response.data === 'object') {
          const keys = Object.keys(e.response.data);
          if (keys.length > 0) {
            const firstErrVal = e.response.data[keys[0]];
            errorMsg = Array.isArray(firstErrVal) ? firstErrVal[0] : JSON.stringify(firstErrVal);
          }
        }
      }
      if (Platform.OS === 'web') {
        alert(errorMsg);
      } else {
        Alert.alert('خطأ', errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={styles.header}>
          <Text style={styles.title}>تسجيل مشترك جديد</Text>
          <Text style={styles.subtitle}>إدخال بيانات المشترك ميدانياً</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.label}>الاسم الكامل *</Text>
            <TextInput style={styles.input} placeholder="أدخل الاسم الثلاثي" placeholderTextColor={Colors.textMuted} textAlign="right"
              value={form.name} onChangeText={v => setForm(p => ({ ...p, name: v }))} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>رقم الهاتف *</Text>
            <TextInput style={styles.input} placeholder="05XXXXXXXX" placeholderTextColor={Colors.textMuted} textAlign="right"
              keyboardType="phone-pad" value={form.phone} onChangeText={v => setForm(p => ({ ...p, phone: v }))} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>الموقع الجغرافي (GPS)</Text>
            {gpsLocation ? (
              <View style={styles.gpsInfoBox}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                <View style={{ flex: 1, paddingRight: 6 }}>
                  <Text style={styles.gpsLocationText}>خط العرض: {gpsLocation.latitude.toFixed(5)}</Text>
                  <Text style={styles.gpsLocationText}>خط الطول: {gpsLocation.longitude.toFixed(5)}</Text>
                </View>
                <TouchableOpacity style={styles.clearGpsBtn} onPress={clearGps}>
                  <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.gpsBtn} onPress={captureGps} disabled={fetchingGps}>
                {fetchingGps ? (
                  <ActivityIndicator size="small" color={Colors.secondary} />
                ) : (
                  <Ionicons name="location" size={20} color={Colors.secondary} />
                )}
                <Text style={styles.gpsBtnText}>
                  {fetchingGps ? 'جاري تحديد الموقع...' : 'التقاط الموقع تلقائياً (GPS)'}
                </Text>
              </TouchableOpacity>
            )}
            <Text style={styles.gpsNote}>* إذا لم يتم تحديد الموقع، سيتم تعيين المشترك تلقائياً لمنطقتك المعتمدة.</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>خطة الاشتراك *</Text>
            {dbPlans.length === 0 ? (
              <ActivityIndicator size="small" color={Colors.primary} style={{ alignSelf: 'center', margin: 10 }} />
            ) : (
              <View style={styles.planGrid}>
                {dbPlans.map(p => (
                  <TouchableOpacity key={p.id} style={[styles.planOption, selectedPlanId === p.id && styles.planSelected]}
                    onPress={() => setSelectedPlanId(p.id)}>
                    <Text style={[styles.planText, selectedPlanId === p.id && { color: Colors.primary }]}>{p.name}</Text>
                    <Text style={[styles.planPriceText, selectedPlanId === p.id && { color: Colors.primary }]}>
                      {parseFloat(p.price)} ر.س
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={submit} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="person-add" size={20} color="#fff" />
                <Text style={styles.submitText}>تسجيل المشترك</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1, paddingHorizontal: Spacing.md },
  header: { paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  title: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary, textAlign: 'right' },
  subtitle: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'right' },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg },
  field: { marginBottom: Spacing.lg },
  label: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6, textAlign: 'right' },
  input: {
    backgroundColor: Colors.card, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border,
    padding: 14, color: Colors.textPrimary, fontSize: FontSize.md,
  },
  gpsBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.secondaryLight, borderRadius: Radius.sm, paddingVertical: 14,
    borderWidth: 1, borderColor: Colors.secondary, borderStyle: 'dashed',
  },
  gpsBtnText: { fontSize: FontSize.sm, color: Colors.secondary, fontWeight: '700' },
  gpsInfoBox: {
    flexDirection: 'row-reverse', alignItems: 'center',
    backgroundColor: Colors.successLight, borderRadius: Radius.sm, padding: 12,
    borderWidth: 1, borderColor: Colors.success,
  },
  gpsLocationText: { fontSize: FontSize.xs, color: Colors.success, textAlign: 'right', fontWeight: '700' },
  clearGpsBtn: { padding: 4 },
  gpsNote: { fontSize: 10, color: Colors.textMuted, textAlign: 'right', marginTop: 4 },
  planGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  planOption: {
    flex: 1, minWidth: '45%', backgroundColor: Colors.card, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border,
    paddingVertical: 12, alignItems: 'center',
  },
  planSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  planText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textPrimary },
  planPriceText: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.sm, paddingVertical: 16,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  submitText: { color: '#fff', fontSize: FontSize.lg, fontWeight: '700' },
});
