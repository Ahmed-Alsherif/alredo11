import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, I18nManager, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../utils/api';
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

export default function StaffLoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) return Alert.alert('خطأ', 'أدخل اسم المستخدم وكلمة المرور');
    setLoading(true);
    try {
      const res = await api.post('/auth/login/', { username, password });
      
      await AsyncStorage.setItem('access_token', res.data.access);
      await AsyncStorage.setItem('refresh_token', res.data.refresh);
      
      const meRes = await api.get('/users/me/');
      const role = meRes.data.role;

      if (role === 'driver') {
        await AsyncStorage.setItem('user', JSON.stringify(meRes.data));
        router.replace('/(driver)');
      } else if (role === 'agent') {
        await AsyncStorage.setItem('user', JSON.stringify(meRes.data));
        router.replace('/(agent)');
      } else {
        // Rollback if subscriber
        await AsyncStorage.removeItem('access_token');
        await AsyncStorage.removeItem('refresh_token');
        Alert.alert('مرفوض', 'هذا الدخول مخصص للموظفين (سائق / مندوب) فقط.');
      }
    } catch (e) {
      Alert.alert('خطأ', 'بيانات الدخول غير صحيحة');
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
        </View>

        <View style={styles.logoBox}>
          <Ionicons name="briefcase" size={32} color="#fff" />
        </View>
        
        <Text style={styles.title}>بوابة الموظفين</Text>
        <Text style={styles.subtitle}>الرجاء إدخال بيانات الدخول المعتمدة من الإدارة</Text>

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
          <Ionicons name="log-in" size={20} color="#fff" />
          <Text style={styles.loginBtnText}>{loading ? 'جاري التحقق...' : 'دخول الموظف'}</Text>
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
    alignItems: 'center',
  },
  header: {
    width: '100%',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  backBtn: {
    padding: Spacing.xs,
  },
  logoBox: {
    width: 70,
    height: 70,
    borderRadius: Radius.md,
    backgroundColor: '#34495e',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
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
  loginBtn: {
    width: '100%',
    backgroundColor: '#34495e',
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
});
