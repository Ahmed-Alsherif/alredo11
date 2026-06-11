import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, Radius, Shadows } from '../../constants/theme';

const categories = [
  { icon: 'water-outline', color: Colors.info, name: 'بلاستيك', tips: 'الزجاجات، الأكياس، عبوات المنظفات، وأغطية العبوات.' },
  { icon: 'construct-outline', color: Colors.warning, name: 'معادن', tips: 'علب المشروبات، علب الطعام المعدنية، والقطع المعدنية الصغيرة.' },
  { icon: 'newspaper-outline', color: Colors.success, name: 'ورق وكرتون', tips: 'الصحف، الكراتين المطوية، أوراق الطباعة، وأكياس الورق.' },
  { icon: 'fast-food-outline', color: Colors.danger, name: 'بقايا الخبز', tips: 'اجمع الخبز الجاف في كيس مستقل وتجنب خلطه بالسوائل.' },
];

const tips = [
  'اغسل العبوات البلاستيكية والمعدنية قبل وضعها في كيس الفرز.',
  'اطو الكراتين لتوفير المساحة داخل الكيس.',
  'اترك بقايا الخبز حتى تجف قبل تسليمها.',
  'لا تخلط الورق مع المواد المبللة حتى يبقى صالحًا للتدوير.',
  'ضع كل نوع في كيس واضح لتسريع تأكيد السائق ومنح النقاط.',
];

export default function Education() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.iconBg}>
          <Ionicons name="leaf-outline" size={34} color={Colors.roles.subscriber} />
        </View>
        <Text style={styles.title}>دليل الفرز البيئي</Text>
        <Text style={styles.subtitle}>تعليمات مختصرة تساعدك تجهز الأكياس بطريقة يقبلها السائق مباشرة.</Text>
      </View>

      <Text style={styles.sectionTitle}>فئات الفرز</Text>
      {categories.map((cat) => (
        <View key={cat.name} style={[styles.categoryCard, { borderRightColor: cat.color }]}>
          <View style={[styles.catIcon, { backgroundColor: `${cat.color}18` }]}>
            <Ionicons name={cat.icon} size={26} color={cat.color} />
          </View>
          <View style={styles.catInfo}>
            <Text style={styles.catName}>{cat.name}</Text>
            <Text style={styles.catTips}>{cat.tips}</Text>
          </View>
        </View>
      ))}

      <Text style={styles.sectionTitle}>نصائح قبل التسليم</Text>
      {tips.map((tip, index) => (
        <View key={tip} style={styles.tipCard}>
          <Text style={styles.tipIndex}>{index + 1}</Text>
          <Text style={styles.tipText}>{tip}</Text>
        </View>
      ))}

      <View style={styles.impactCard}>
        <Ionicons name="earth-outline" size={34} color={Colors.secondary} />
        <Text style={styles.impactTitle}>أثر مشاركتك</Text>
        <Text style={styles.impactText}>
          كل طلب تدوير مؤكد يضيف نقاطًا لحسابك، ويظهر في سجل التدوير حتى تتمكن الإدارة من قياس الأثر البيئي الحقيقي.
        </Text>
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
    backgroundColor: Colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary, marginTop: 14 },
  subtitle: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 6, textAlign: 'center', lineHeight: 22 },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.sm, textAlign: 'right' },
  categoryCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderRightWidth: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
    ...Shadows.card,
  },
  catIcon: { width: 50, height: 50, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  catInfo: { flex: 1, alignItems: 'flex-end' },
  catName: { fontSize: FontSize.md, fontWeight: '800', color: Colors.textPrimary, marginBottom: 4 },
  catTips: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20, textAlign: 'right' },
  tipCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  tipIndex: {
    width: 30,
    height: 30,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryLight,
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 30,
  },
  tipText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 21, textAlign: 'right' },
  impactCard: {
    backgroundColor: Colors.secondaryLight,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: '#99f6e4',
  },
  impactTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.secondary, marginTop: 10 },
  impactText: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, marginTop: 8 },
});
