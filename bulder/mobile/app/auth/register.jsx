import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, I18nManager, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme';
import api from '../../utils/api';

I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

export default function RegisterScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'subscriber' // Force role to subscriber
  });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!form.username || !form.password || !form.first_name || !form.phone) {
      return Alert.alert('تنبيه', 'يرجى تعبئة جميع الحقول التي تحتوي على علامة (*)');
    }

    setLoading(true);
    try {
      await api.post('/users/register/', form);
      if (Platform.OS === 'web') {
        alert('تم إنشاء الحساب بنجاح، يمكنك تسجيل الدخول الآن');
        router.replace('/');
      } else {
        Alert.alert('نجاح', 'تم إنشاء الحساب بنجاح، يمكنك تسجيل الدخول الآن', [
          { text: 'حسناً', onPress: () => router.replace('/') }
        ]);
      }
    } catch (e) {
      console.error(e);
      let errorMsg = 'حدث خطأ أثناء التسجيل. يرجى المحاولة لاحقاً.';
      
      // Parse specific backend errors
      if (e.response && e.response.data) {
        const errors = e.response.data;
        if (typeof errors === 'object') {
          const messages = [];
          if (errors.username) messages.push(`اسم المستخدم: ${errors.username[0]}`);
          if (errors.password) messages.push(`كلمة المرور: ${errors.password[0]}`);
          if (errors.first_name) messages.push(`الاسم الأول: ${errors.first_name[0]}`);
          if (errors.phone) messages.push(`رقم الهاتف: ${errors.phone[0]}`);
          
          if (messages.length > 0) {
            errorMsg = messages.join('\n');
          } else if (errors.detail) {
            errorMsg = errors.detail;
          }
        }
      }
      
      Alert.alert('خطأ في البيانات', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>حساب جديد</Text>
          <View style={{ width: 24 }} />
        </View>

        <Text style={styles.subtitle}>انضم إلينا كمشترك لإدارة التدوير</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>اسم المستخدم *</Text>
          <TextInput
            style={styles.input}
            placeholder="أدخل اسم المستخدم (باللغة الإنجليزية)"
            placeholderTextColor={Colors.textMuted}
            value={form.username}
            onChangeText={(text) => setForm({ ...form, username: text })}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>الاسم الأول *</Text>
          <TextInput
            style={styles.input}
            placeholder="أدخل اسمك الأول"
            placeholderTextColor={Colors.textMuted}
            value={form.first_name}
            onChangeText={(text) => setForm({ ...form, first_name: text })}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>الاسم الأخير</Text>
          <TextInput
            style={styles.input}
            placeholder="أدخل اسمك الأخير"
            placeholderTextColor={Colors.textMuted}
            value={form.last_name}
            onChangeText={(text) => setForm({ ...form, last_name: text })}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>رقم الهاتف *</Text>
          <TextInput
            style={styles.input}
            placeholder="أدخل رقم هاتفك"
            placeholderTextColor={Colors.textMuted}
            keyboardType="phone-pad"
            value={form.phone}
            onChangeText={(text) => setForm({ ...form, phone: text })}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>كلمة المرور *</Text>
          <TextInput
            style={styles.input}
            placeholder="أدخل كلمة مرور قوية"
            placeholderTextColor={Colors.textMuted}
            secureTextEntry
            value={form.password}
            onChangeText={(text) => setForm({ ...form, password: text })}
          />
        </View>

        <TouchableOpacity style={styles.registerBtn} onPress={handleRegister} disabled={loading}>
          <Ionicons name="person-add" size={20} color="#fff" />
          <Text style={styles.registerBtnText}>{loading ? 'جاري التسجيل...' : 'إنشاء الحساب'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bg,
    padding: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  inputGroup: { width: '100%', marginBottom: Spacing.md },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
    textAlign: 'right',
  },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.sm,
    padding: 14,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    textAlign: 'right',
  },
  registerBtn: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.sm,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: Spacing.md,
  },
  registerBtnText: {
    color: '#fff',
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
});
