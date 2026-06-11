import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, I18nManager, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';
import { Colors, Spacing, FontSize, Radius } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

// Force RTL
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

export default function SubscriberLoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('access_token');
      if (token) {
        try {
          const res = await api.get('/users/me/');
          const role = res.data.role;
          await AsyncStorage.setItem('user', JSON.stringify(res.data));
          if (role === 'subscriber') router.replace('/(subscriber)');
          else if (role === 'driver') router.replace('/(driver)');
          else if (role === 'agent') router.replace('/(agent)');
        } catch (e) {
          // Token expired or invalid
          await AsyncStorage.removeItem('access_token');
          await AsyncStorage.removeItem('refresh_token');
          await AsyncStorage.removeItem('user');
        }
      }
    };
    checkAuth();
  }, []);

  const handleLogin = async () => {
    if (!username || !password) return Alert.alert('خطأ', 'أدخل اسم المستخدم وكلمة المرور');
    setLoading(true);
    try {
      const res = await api.post('/auth/login/', { username, password });
      
      // Temporary save to fetch user info
      await AsyncStorage.setItem('access_token', res.data.access);
      await AsyncStorage.setItem('refresh_token', res.data.refresh);
      
      const meRes = await api.get('/users/me/');
      const role = meRes.data.role;

      if (role !== 'subscriber') {
        // Rollback if not subscriber
        await AsyncStorage.removeItem('access_token');
        await AsyncStorage.removeItem('refresh_token');
        Alert.alert('خطأ', 'هذا الحساب غير مخصص للمشتركين. يرجى استخدام دخول الموظفين.');
        return;
      }

      await AsyncStorage.setItem('user', JSON.stringify(meRes.data));
      router.replace('/(subscriber)');
      
    } catch (e) {
      Alert.alert('خطأ', 'بيانات الدخول غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.glow} />
      <View style={styles.card}>
        <View style={styles.logoBox}>
          <Text style={styles.logoEmoji}>♻️</Text>
        </View>
        <Text style={styles.title}>نظام سل</Text>
        <Text style={styles.subtitle}>بوابة المشتركين - لإدارة التدوير</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>اسم المستخدم</Text>
          <TextInput
            style={styles.input}
            placeholder="أدخل اسم المستخدم"
            placeholderTextColor={Colors.textMuted}
            value={username}
            onChangeText={setUsername}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>كلمة المرور</Text>
          <TextInput
            style={styles.input}
            placeholder="أدخل كلمة المرور"
            placeholderTextColor={Colors.textMuted}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
          <Ionicons name="log-in-outline" size={20} color="#fff" />
          <Text style={styles.loginBtnText}>{loading ? 'جاري التحقق...' : 'تسجيل الدخول'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.registerLink} onPress={() => router.push('/auth/register')}>
          <Text style={styles.registerText}>ليس لديك حساب؟ <Text style={styles.registerTextBold}>سجل الآن</Text></Text>
        </TouchableOpacity>
      </View>

      {/* Hidden/Discreet Staff Login Link */}
      <TouchableOpacity style={styles.staffLink} onPress={() => router.push('/auth/staff-login')}>
        <Text style={styles.staffLinkText}>دخول الموظفين</Text>
      </TouchableOpacity>
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
  glow: {
    position: 'absolute',
    top: -200,
    right: -200,
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: 'rgba(108, 92, 231, 0.08)',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  logoBox: {
    width: 70,
    height: 70,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  logoEmoji: { fontSize: 32 },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: Spacing.xl,
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
  loginBtn: {
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
  loginBtnText: {
    color: '#fff',
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  registerLink: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  registerText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  registerTextBold: {
    color: Colors.primary,
    fontWeight: '700',
  },
  staffLink: {
    marginTop: Spacing.xxl,
    padding: Spacing.sm,
  },
  staffLinkText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  }
});
