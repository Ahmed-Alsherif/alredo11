import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, Radius, Shadows } from '../../constants/theme';
import api from '../../utils/api';

const labels = {
  0: 'اختر تقييمك من النجوم',
  1: 'الخدمة تحتاج متابعة عاجلة',
  2: 'التجربة أقل من المتوقع',
  3: 'الخدمة مقبولة',
  4: 'خدمة جيدة',
  5: 'خدمة ممتازة',
};

export default function Rating() {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const submitRating = async () => {
    if (rating === 0) {
      Alert.alert('تنبيه', 'يرجى اختيار تقييم من 1 إلى 5');
      return;
    }

    try {
      await api.post('/complaints/ratings/', {
        rating,
        comment,
        month: new Date().toISOString().slice(0, 10),
      });
      setSubmitted(true);
    } catch (e) {
      Alert.alert('خطأ', 'حدث خطأ أثناء إرسال التقييم');
    }
  };

  if (submitted) {
    return (
      <View style={styles.container}>
        <View style={styles.successCard}>
          <Ionicons name="checkmark-circle" size={74} color={Colors.success} />
          <Text style={styles.successTitle}>تم إرسال تقييمك</Text>
          <Text style={styles.successText}>سيظهر التقييم في تقارير الجودة الشهرية للإدارة.</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.iconBg}>
          <Ionicons name="star-outline" size={34} color={Colors.warning} />
        </View>
        <Text style={styles.title}>تقييم الخدمة الشهري</Text>
        <Text style={styles.subtitle}>رأيك يساعد فريق سلة يعرف جودة الجمع في منطقتك.</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setRating(star)} style={styles.starBtn}>
              <Ionicons
                name={star <= rating ? 'star' : 'star-outline'}
                size={46}
                color={star <= rating ? Colors.warning : Colors.borderStrong}
              />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.ratingLabel}>{labels[rating]}</Text>

        <Text style={styles.label}>تعليق اختياري</Text>
        <TextInput
          style={styles.textArea}
          multiline
          numberOfLines={4}
          placeholder="مثال: السائق وصل في الموعد، أو توجد ملاحظة على النظافة..."
          placeholderTextColor={Colors.textMuted}
          value={comment}
          onChangeText={setComment}
          textAlign="right"
          textAlignVertical="top"
        />

        <TouchableOpacity style={styles.submitBtn} onPress={submitRating}>
          <Ionicons name="send-outline" size={20} color={Colors.white} />
          <Text style={styles.submitText}>إرسال التقييم</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.md, paddingBottom: 36 },
  header: { alignItems: 'center', paddingTop: Spacing.lg, paddingBottom: Spacing.xl },
  iconBg: {
    width: 70,
    height: 70,
    borderRadius: Radius.lg,
    backgroundColor: Colors.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary, marginTop: 14 },
  subtitle: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 6, textAlign: 'center' },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    ...Shadows.card,
  },
  starsRow: { flexDirection: 'row-reverse', justifyContent: 'center', gap: 8, marginBottom: Spacing.sm },
  starBtn: { padding: 3 },
  ratingLabel: { textAlign: 'center', fontSize: FontSize.md, fontWeight: '700', color: Colors.textSecondary, marginBottom: Spacing.lg },
  label: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSecondary, marginBottom: 8, textAlign: 'right' },
  textArea: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: Colors.textPrimary,
    fontSize: FontSize.md,
    minHeight: 120,
    marginBottom: Spacing.lg,
  },
  submitBtn: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.roles.subscriber,
    paddingVertical: 15,
    borderRadius: Radius.md,
    gap: 8,
  },
  submitText: { color: Colors.white, fontSize: FontSize.md, fontWeight: '800' },
  successCard: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  successTitle: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary, marginTop: 18 },
  successText: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 8, textAlign: 'center' },
});
