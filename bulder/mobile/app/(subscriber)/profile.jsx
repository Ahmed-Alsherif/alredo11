import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal, Platform } from 'react-native';
import { Colors, Spacing, FontSize, Radius, Shadows } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../utils/api';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [zones, setZones] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    zone: null,
    latitude: null,
    longitude: null,
  });

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const cached = await AsyncStorage.getItem('user');
      if (cached) setUser(JSON.parse(cached));
      const res = await api.get('/users/me/');
      const userData = res.data;

      if (userData.role === 'subscriber' && userData.subscriber_id) {
        const subRes = await api.get(`/subscribers/${userData.subscriber_id}/`);
        Object.assign(userData, {
          address: subRes.data.address,
          zone_id: subRes.data.zone,
          latitude: subRes.data.latitude,
          longitude: subRes.data.longitude,
          is_paused: subRes.data.is_paused,
          subscription_id: subRes.data.subscription_id,
          subscription_end: subRes.data.subscription_end,
        });
      }

      setUser(userData);
    } catch (e) {
      console.warn(e.message);
    }
  };

  const openEdit = async () => {
    if (!user) return;
    setForm({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone: user.phone || '',
      address: user.address || '',
      zone: user.zone_id || null,
      latitude: user.latitude || null,
      longitude: user.longitude || null,
    });

    try {
      const res = await api.get('/zones/');
      setZones(res.data);
    } catch (e) {
      console.warn(e.message);
    }

    setShowEdit(true);
  };

  const getCurrentLocation = () => {
    if (!navigator?.geolocation) {
      Alert.alert('تنبيه', 'الجهاز لا يدعم تحديد الموقع');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setForm((prev) => ({ ...prev, latitude: coords.latitude, longitude: coords.longitude }));
        Alert.alert('تم', 'تم تحديد موقعك الحالي');
      },
      () => Alert.alert('تعذر تحديد الموقع', 'تأكد من تفعيل صلاحية الموقع في الجهاز.'),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
    );
  };

  const saveProfile = async () => {
    if (!user?.subscriber_id) {
      Alert.alert('خطأ', 'لم يتم العثور على معرف المشترك');
      return;
    }

    if (!form.first_name || !form.phone) {
      Alert.alert('تنبيه', 'الاسم ورقم الهاتف مطلوبان');
      return;
    }

    setSaving(true);
    try {
      await api.patch(`/subscribers/${user.subscriber_id}/`, form);
      Alert.alert('تم', 'تم تحديث بيانات الحساب');
      setShowEdit(false);
      fetchUser();
    } catch (e) {
      Alert.alert('خطأ', 'تعذر حفظ البيانات');
    } finally {
      setSaving(false);
    }
  };

  const togglePauseService = async () => {
    if (!user?.subscriber_id) return;
    const paused = Boolean(user.is_paused);
    const endpoint = paused ? `/subscribers/${user.subscriber_id}/resume/` : `/subscribers/${user.subscriber_id}/pause/`;

    try {
      await api.post(endpoint);
      setUser((prev) => ({ ...prev, is_paused: !paused }));
      Alert.alert('تم', paused ? 'تم تفعيل الاشتراك' : 'تم إيقاف الخدمة مؤقتًا');
    } catch (e) {
      Alert.alert('خطأ', 'تعذر تنفيذ الطلب');
    }
  };

  const changePassword = async () => {
    if (!oldPass || !newPass) {
      Alert.alert('تنبيه', 'يرجى تعبئة كلمة المرور الحالية والجديدة');
      return;
    }

    try {
      await api.post('/users/change_password/', { old_password: oldPass, new_password: newPass });
      Alert.alert('تم', 'تم تغيير كلمة المرور بنجاح');
      setShowPassword(false);
      setOldPass('');
      setNewPass('');
    } catch (e) {
      Alert.alert('خطأ', e.response?.data?.error || 'تعذر تغيير كلمة المرور');
    }
  };

  const logout = async () => {
    const performLogout = async () => {
      await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
      setTimeout(() => {
        router.replace('/login');
      }, 200);
    };

    if (Platform.OS === 'web') {
      if (window.confirm('هل تريد تسجيل الخروج؟')) performLogout();
      return;
    }

    Alert.alert('تسجيل الخروج', 'هل تريد تسجيل الخروج؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'خروج', onPress: performLogout },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={styles.header}>
          <Text style={styles.title}>حسابي</Text>
          <Text style={styles.subtitle}>بيانات الاشتراك، الموقع، وإعدادات الدخول.</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.first_name || user?.username || 'م').charAt(0)}</Text>
          </View>
          <Text style={styles.userName}>{user?.display_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username}</Text>
          <Text style={styles.userMeta}>{user?.phone || 'لا يوجد رقم هاتف'}</Text>
          {user?.subscription_id && <Text style={styles.subscriptionId}>رقم الاشتراك: {user.subscription_id}</Text>}

          <View style={[styles.statusPill, user?.is_paused ? styles.pausePill : styles.activePill]}>
            <Ionicons name={user?.is_paused ? 'pause-circle-outline' : 'checkmark-circle-outline'} size={16} color={user?.is_paused ? Colors.warning : Colors.success} />
            <Text style={[styles.statusText, { color: user?.is_paused ? Colors.warning : Colors.success }]}>
              {user?.is_paused ? 'الخدمة موقفة مؤقتًا' : 'اشتراك فعّال'}
            </Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <InfoCard icon="calendar-outline" label="نهاية الاشتراك" value={user?.subscription_end || 'غير محدد'} />
          <InfoCard icon="location-outline" label="الموقع" value={user?.latitude && user?.longitude ? `${Number(user.latitude).toFixed(4)}, ${Number(user.longitude).toFixed(4)}` : 'غير محدد'} />
        </View>

        <View style={styles.menuCard}>
          <MenuItem icon="create-outline" label="تعديل البيانات والموقع" onPress={openEdit} />
          <MenuItem icon="lock-closed-outline" label="تغيير كلمة المرور" onPress={() => setShowPassword(true)} />
          <MenuItem icon={user?.is_paused ? 'play-circle-outline' : 'pause-circle-outline'} label={user?.is_paused ? 'تفعيل الاشتراك' : 'إيقاف مؤقت للسفر'} onPress={togglePauseService} accent={user?.is_paused ? Colors.success : Colors.warning} />
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
          <Text style={styles.logoutText}>تسجيل الخروج</Text>
        </TouchableOpacity>
      </ScrollView>

      <PasswordModal
        visible={showPassword}
        onClose={() => setShowPassword(false)}
        oldPass={oldPass}
        newPass={newPass}
        setOldPass={setOldPass}
        setNewPass={setNewPass}
        onSave={changePassword}
      />

      <EditProfileModal
        visible={showEdit}
        onClose={() => setShowEdit(false)}
        form={form}
        setForm={setForm}
        zones={zones}
        onLocate={getCurrentLocation}
        onSave={saveProfile}
        saving={saving}
      />
    </SafeAreaView>
  );
}

function InfoCard({ icon, label, value }) {
  return (
    <View style={styles.infoCard}>
      <Ionicons name={icon} size={20} color={Colors.roles.subscriber} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function MenuItem({ icon, label, onPress, accent = Colors.roles.subscriber }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuLeft}>
        <Ionicons name={icon} size={20} color={accent} />
        <Text style={[styles.menuLabel, accent !== Colors.roles.subscriber && { color: accent }]}>{label}</Text>
      </View>
      <Ionicons name="chevron-back" size={18} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

function PasswordModal({ visible, onClose, oldPass, newPass, setOldPass, setNewPass, onSave }) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>تغيير كلمة المرور</Text>
          <TextInput style={styles.input} placeholder="كلمة المرور الحالية" placeholderTextColor={Colors.textMuted} secureTextEntry value={oldPass} onChangeText={setOldPass} textAlign="right" />
          <TextInput style={styles.input} placeholder="كلمة المرور الجديدة" placeholderTextColor={Colors.textMuted} secureTextEntry value={newPass} onChangeText={setNewPass} textAlign="right" />
          <TouchableOpacity style={styles.saveBtn} onPress={onSave}>
            <Text style={styles.saveText}>حفظ التغيير</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelText}>إلغاء</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function EditProfileModal({ visible, onClose, form, setForm, zones, onLocate, onSave, saving }) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <ScrollView contentContainerStyle={styles.editScroll}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>تعديل بيانات المشترك</Text>

            <Field label="الاسم الأول" value={form.first_name} onChangeText={(text) => setForm({ ...form, first_name: text })} />
            <Field label="الاسم الأخير" value={form.last_name} onChangeText={(text) => setForm({ ...form, last_name: text })} />
            <Field label="رقم الهاتف" value={form.phone} onChangeText={(text) => setForm({ ...form, phone: text })} keyboardType="phone-pad" />
            <Field label="العنوان التفصيلي" value={form.address} onChangeText={(text) => setForm({ ...form, address: text })} />

            <Text style={styles.fieldLabel}>المنطقة</Text>
            <View style={styles.zonesWrap}>
              {zones.map((zone) => (
                <TouchableOpacity key={zone.id} style={[styles.zoneChip, form.zone === zone.id && styles.zoneChipActive]} onPress={() => setForm({ ...form, zone: zone.id })}>
                  <Text style={[styles.zoneText, form.zone === zone.id && styles.zoneTextActive]}>{zone.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.locationBtn} onPress={onLocate}>
              <Ionicons name="location-outline" size={18} color={Colors.white} />
              <Text style={styles.locationText}>
                {form.latitude && form.longitude ? `تم تحديد الموقع: ${Number(form.latitude).toFixed(4)}, ${Number(form.longitude).toFixed(4)}` : 'تحديد موقعي الحالي'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={onSave} disabled={saving}>
              <Text style={styles.saveText}>{saving ? 'جاري الحفظ...' : 'حفظ البيانات'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.cancelText}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function Field({ label, ...props }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput style={styles.input} placeholder={label} placeholderTextColor={Colors.textMuted} textAlign="right" {...props} />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1, paddingHorizontal: Spacing.md },
  header: { paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  title: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary, textAlign: 'right' },
  subtitle: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'right', marginTop: 4 },
  profileCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.md, ...Shadows.card },
  avatar: { width: 78, height: 78, borderRadius: Radius.full, backgroundColor: Colors.roles.subscriber, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm },
  avatarText: { fontSize: 28, fontWeight: '800', color: Colors.white },
  userName: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  userMeta: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 4 },
  subscriptionId: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '800', marginTop: 6 },
  statusPill: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full, marginTop: Spacing.md },
  activePill: { backgroundColor: Colors.successLight },
  pausePill: { backgroundColor: Colors.warningLight },
  statusText: { fontSize: FontSize.xs, fontWeight: '800' },
  infoGrid: { flexDirection: 'row-reverse', gap: Spacing.sm, marginBottom: Spacing.lg },
  infoCard: { flex: 1, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: Spacing.md, alignItems: 'flex-end' },
  infoLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 8 },
  infoValue: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: '800', marginTop: 3 },
  menuCard: { backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', marginBottom: Spacing.lg },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  menuLeft: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  menuLabel: { fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: '600' },
  logoutBtn: { flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: Colors.dangerLight, borderRadius: Radius.md, paddingVertical: 15 },
  logoutText: { fontSize: FontSize.md, fontWeight: '800', color: Colors.danger },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 32, 29, 0.42)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, width: '88%', borderWidth: 1, borderColor: Colors.border },
  modalTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.md },
  input: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: 14, color: Colors.textPrimary, marginBottom: Spacing.sm, fontSize: FontSize.md },
  saveBtn: { backgroundColor: Colors.roles.subscriber, paddingVertical: 14, borderRadius: Radius.md, alignItems: 'center', marginTop: Spacing.sm },
  saveText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '800' },
  cancelText: { color: Colors.textMuted, textAlign: 'center', marginTop: 14, fontSize: FontSize.sm, fontWeight: '700' },
  editScroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 30, width: '100%' },
  field: { width: '100%' },
  fieldLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '700', marginBottom: 6, textAlign: 'right' },
  zonesWrap: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8, marginBottom: Spacing.sm },
  zoneChip: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.full },
  zoneChipActive: { backgroundColor: Colors.successLight, borderColor: Colors.roles.subscriber },
  zoneText: { color: Colors.textSecondary, fontSize: FontSize.xs, fontWeight: '700' },
  zoneTextActive: { color: Colors.roles.subscriber },
  locationBtn: { flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: Colors.primary, paddingVertical: 12, borderRadius: Radius.md, marginTop: Spacing.sm },
  locationText: { color: Colors.white, fontSize: FontSize.sm, fontWeight: '800' },
});
