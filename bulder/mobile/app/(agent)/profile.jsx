import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal, Platform } from 'react-native';
import { Colors, Spacing, FontSize, Radius, Shadows } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../utils/api';

export default function AgentProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const cached = await AsyncStorage.getItem('user');
      if (cached) setUser(JSON.parse(cached));
      const res = await api.get('/users/me/');
      setUser(res.data);
    } catch (e) {
      console.error(e);
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

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={styles.header}>
          <Text style={styles.title}>حساب المندوب</Text>
          <Text style={styles.subtitle}>إعدادات الحساب ومنطقة التحصيل المسؤولة منك.</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.first_name || user?.username || 'م').charAt(0)}</Text>
          </View>
          <Text style={styles.userName}>{user?.display_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username}</Text>
          <Text style={styles.userMeta}>{user?.phone || 'لا يوجد رقم هاتف'}</Text>
          <View style={styles.statusPill}>
            <Ionicons name="briefcase-outline" size={16} color={Colors.roles.agent} />
            <Text style={styles.statusText}>{user?.zone_name ? `منطقة ${user.zone_name}` : 'مندوب نشط'}</Text>
          </View>
        </View>

        <View style={styles.menuCard}>
          <MenuItem icon="lock-closed-outline" label="تغيير كلمة المرور" onPress={() => setShowPassword(true)} />
          <MenuItem icon="refresh-outline" label="تحديث بيانات الحساب" onPress={fetchUser} />
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
    </SafeAreaView>
  );
}

function MenuItem({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuLeft}>
        <Ionicons name={icon} size={20} color={Colors.roles.agent} />
        <Text style={styles.menuLabel}>{label}</Text>
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1, paddingHorizontal: Spacing.md },
  header: { paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  title: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary, textAlign: 'right' },
  subtitle: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'right', marginTop: 4 },
  profileCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.lg, ...Shadows.card },
  avatar: { width: 78, height: 78, borderRadius: Radius.full, backgroundColor: Colors.roles.agent, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm },
  avatarText: { fontSize: 28, fontWeight: '800', color: Colors.white },
  userName: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  userMeta: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 4 },
  statusPill: { flexDirection: 'row-reverse', alignItems: 'center', gap: 6, backgroundColor: Colors.roles.agentSoft, paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full, marginTop: Spacing.md },
  statusText: { color: Colors.roles.agent, fontSize: FontSize.xs, fontWeight: '800' },
  menuCard: { backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', marginBottom: Spacing.lg },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  menuLeft: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  menuLabel: { fontSize: FontSize.md, color: Colors.textPrimary, fontWeight: '600' },
  logoutBtn: { flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: Colors.dangerLight, borderRadius: Radius.md, paddingVertical: 15 },
  logoutText: { fontSize: FontSize.md, fontWeight: '800', color: Colors.danger },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 32, 29, 0.42)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, width: '86%', borderWidth: 1, borderColor: Colors.border },
  modalTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.md },
  input: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.md, padding: 14, color: Colors.textPrimary, marginBottom: Spacing.sm, fontSize: FontSize.md },
  saveBtn: { backgroundColor: Colors.roles.agent, paddingVertical: 14, borderRadius: Radius.md, alignItems: 'center', marginTop: Spacing.sm },
  saveText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '800' },
  cancelText: { color: Colors.textMuted, textAlign: 'center', marginTop: 14, fontSize: FontSize.sm, fontWeight: '700' },
});
