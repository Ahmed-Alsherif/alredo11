import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import api from '../../utils/api';

const statusColors = { 'جديدة': Colors.danger, 'قيد المعالجة': Colors.warning, 'تم الحل': Colors.success };

export default function ComplaintsScreen() {
  const [desc, setDesc] = useState('');
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchComplaints();
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await api.get('/complaints/');
      setList(res.data);
    } catch (e) {
      console.warn(e.message);
    }
  };

  const submit = async () => {
    if (!desc.trim()) return;
    setLoading(true);
    try {
      await api.post('/complaints/', {
        type: 'other',
        description: desc
      });
      Alert.alert('تم الإرسال', 'سيتم مراجعة شكواك في أقرب وقت');
      setDesc('');
      fetchComplaints();
    } catch (e) {
      if (e?.response?.status !== 401) {
        Alert.alert('خطأ', 'فشل الإرسال');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
        <View style={styles.header}>
          <Text style={styles.title}>الشكاوى</Text>
          <Text style={styles.subtitle}>تقديم ومتابعة الشكاوى</Text>
        </View>

        {/* New Complaint */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>تقديم شكوى جديدة</Text>
          <TextInput
            style={styles.textArea}
            placeholder="اكتب شكواك هنا..."
            placeholderTextColor={Colors.textMuted}
            value={desc}
            onChangeText={setDesc}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            textAlign="right"
          />
          <TouchableOpacity style={styles.submitBtn} onPress={submit}>
            <Ionicons name="send" size={18} color="#fff" />
            <Text style={styles.submitText}>إرسال الشكوى</Text>
          </TouchableOpacity>
        </View>

        {/* History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>سجل الشكاوى</Text>
          {list.length === 0 && <Text style={{ color: Colors.textMuted, textAlign: 'center' }}>لا يوجد شكاوى سابقة</Text>}
          {list.map(c => {
            const statusColors = { 'new': Colors.danger, 'in_progress': Colors.warning, 'resolved': Colors.success };
            return (
              <View key={c.id} style={styles.complaintCard}>
                <View style={styles.complaintHeader}>
                  <Text style={styles.complaintType}>{c.type_display || 'أخرى'}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: (statusColors[c.status] || Colors.primary) + '22' }]}>
                    <Text style={[styles.statusText, { color: statusColors[c.status] || Colors.primary }]}>{c.status_display}</Text>
                  </View>
                </View>
                <Text style={styles.complaintDesc}>{c.description}</Text>
                <Text style={styles.complaintDate}>{new Date(c.created_at).toLocaleDateString('ar-SA')}</Text>
              </View>
            );
          })}
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
  card: { backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, marginBottom: Spacing.lg },
  cardTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm, textAlign: 'right' },
  textArea: {
    backgroundColor: Colors.card, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, color: Colors.textPrimary, fontSize: FontSize.md, minHeight: 100, marginBottom: Spacing.sm,
  },
  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.sm, paddingVertical: 14,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  submitText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },
  section: { marginBottom: Spacing.lg },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm, textAlign: 'right' },
  complaintCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  complaintHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  complaintType: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textPrimary },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: Radius.full },
  statusText: { fontSize: FontSize.xs, fontWeight: '700' },
  complaintDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: 6, textAlign: 'right' },
  complaintDate: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right' },
});
