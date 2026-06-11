import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';

const issueTypes = [
  { id: 'full', label: 'سلة ممتلئة', icon: '🗑️' },
  { id: 'damaged', label: 'سلة تالفة', icon: '⚠️' },
  { id: 'missing', label: 'سلة مفقودة', icon: '❌' },
  { id: 'empty', label: 'سلة فارغة', icon: '✅' },
];

export default function ReportScreen() {
  const [selected, setSelected] = useState('');
  const [note, setNote] = useState('');

  const submit = () => {
    if (!selected) return Alert.alert('تنبيه', 'اختر نوع البلاغ');
    Alert.alert('تم الإرسال!', 'تم إرسال البلاغ وإشعار المشترك والمدير');
    setSelected('');
    setNote('');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={styles.header}>
          <Text style={styles.title}>بلاغ ميداني</Text>
          <Text style={styles.subtitle}>توثيق حالة السلال الاستثنائية</Text>
        </View>

        <Text style={styles.sectionTitle}>نوع البلاغ</Text>
        <View style={styles.typeGrid}>
          {issueTypes.map(t => (
            <TouchableOpacity key={t.id} style={[styles.typeCard, selected === t.id && styles.typeSelected]} onPress={() => setSelected(t.id)}>
              <Text style={{ fontSize: 28 }}>{t.icon}</Text>
              <Text style={[styles.typeLabel, selected === t.id && { color: Colors.primary }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>ملاحظات</Text>
        <TextInput
          style={styles.textArea}
          placeholder="أضف ملاحظة (اختياري)..."
          placeholderTextColor={Colors.textMuted}
          value={note}
          onChangeText={setNote}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          textAlign="right"
        />

        <TouchableOpacity style={styles.photoBtn}>
          <Ionicons name="camera-outline" size={24} color={Colors.primary} />
          <Text style={styles.photoBtnText}>التقاط صورة</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.submitBtn} onPress={submit}>
          <Ionicons name="send" size={18} color="#fff" />
          <Text style={styles.submitText}>إرسال البلاغ</Text>
        </TouchableOpacity>
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
  sectionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm, marginTop: Spacing.md, textAlign: 'right' },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  typeCard: {
    width: '48%', backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, alignItems: 'center', gap: 8,
  },
  typeSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  typeLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  textArea: {
    backgroundColor: Colors.surface, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, color: Colors.textPrimary, fontSize: FontSize.md, minHeight: 80,
  },
  photoBtn: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    backgroundColor: Colors.primaryLight, borderRadius: Radius.md, paddingVertical: 16, marginTop: Spacing.md,
    borderWidth: 1, borderColor: Colors.primary, borderStyle: 'dashed',
  },
  photoBtnText: { fontSize: FontSize.md, color: Colors.primary, fontWeight: '700' },
  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.sm, paddingVertical: 16,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: Spacing.lg,
  },
  submitText: { color: '#fff', fontSize: FontSize.lg, fontWeight: '700' },
});
