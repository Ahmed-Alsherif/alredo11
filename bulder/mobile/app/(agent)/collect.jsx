import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Colors, Spacing, FontSize, Radius } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useLocalSearchParams } from 'expo-router';

export default function CollectScreen() {
  const params = useLocalSearchParams();

  const [subscribers, setSubscribers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubscriber, setSelectedSubscriber] = useState(null);
  const [suggestionsVisible, setSuggestionsVisible] = useState(false);
  
  const [amount, setAmount] = useState('');
  const [recent, setRecent] = useState([]);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSubs, setLoadingSubs] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoadingSubs(true);
      await fetchSubscribers();
      await fetchRecent();
      setLoadingSubs(false);
    };
    loadData();
  }, []);

  const fetchSubscribers = async () => {
    try {
      const res = await api.get('/subscribers/');
      setSubscribers(res.data);
      
      // Check if we came from debtors screen with a subscriber ID
      if (params.subId) {
        const subIdStr = String(params.subId);
        const matched = res.data.find(s => String(s.id) === subIdStr || s.subscription_id === subIdStr);
        if (matched) {
          setSelectedSubscriber(matched);
          setSearchQuery(`${matched.name} (${matched.subscription_id || matched.id})`);
          if (matched.balance > 0) {
            setAmount(String(matched.balance));
          }
        } else if (params.name) {
          // Fallback
          const temp = { id: params.subId, name: params.name, phone: params.phone };
          setSelectedSubscriber(temp);
          setSearchQuery(`${params.name} (${params.subId})`);
        }
      }
    } catch (e) {
      console.error('Error fetching subscribers:', e);
    }
  };

  const fetchRecent = async () => {
    try {
      const res = await api.get('/finance/payments/');
      setRecent(res.data);
    } catch (e) {
      console.error('Error fetching recent payments:', e);
    }
  };

  const submit = async () => {
    if (!selectedSubscriber) {
      return Alert.alert('تنبيه', 'يرجى اختيار مشترك من القائمة أولاً');
    }
    if (!amount.trim() || parseFloat(amount) <= 0) {
      return Alert.alert('تنبيه', 'يرجى إدخال مبلغ صحيح للتحصيل');
    }
    
    setLoading(true);
    try {
      await api.post('/finance/payments/', {
        amount: parseFloat(amount),
        subscriber: selectedSubscriber.id
      });
      Alert.alert(
        '✅ تم التحصيل بنجاح',
        `تم تسجيل تحصيل مبلغ ${amount} ر.س من المشترك: ${selectedSubscriber.name}\nتم إرسال إيصال رقمي لهاتف المشترك عبر النظام.`,
      );
      setSearchQuery('');
      setSelectedSubscriber(null);
      setAmount('');
      setSuggestionsVisible(false);
      fetchRecent();
    } catch (e) {
      console.error(e);
      Alert.alert('خطأ', 'فشل في تسجيل التحصيل. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (text) => {
    setSearchQuery(text);
    setSuggestionsVisible(true);
    
    if (selectedSubscriber) {
      const expectedText = `${selectedSubscriber.name} (${selectedSubscriber.subscription_id || selectedSubscriber.id})`;
      if (text !== expectedText) {
        setSelectedSubscriber(null);
      }
    }
  };

  const handleSelect = (sub) => {
    setSelectedSubscriber(sub);
    setSearchQuery(`${sub.name} (${sub.subscription_id || sub.id})`);
    setSuggestionsVisible(false);
    
    if (sub.balance > 0) {
      setAmount(String(sub.balance));
    } else {
      setAmount('');
    }
  };

  const filteredSubscribers = subscribers.filter(s => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return false;
    
    if (selectedSubscriber && searchQuery === `${selectedSubscriber.name} (${selectedSubscriber.subscription_id || selectedSubscriber.id})`) {
      return false;
    }
    
    const nameMatch = s.name ? s.name.toLowerCase().includes(query) : false;
    const phoneMatch = s.phone ? s.phone.includes(query) : false;
    const idMatch = s.subscription_id ? s.subscription_id.toLowerCase().includes(query) : false;
    const pkMatch = String(s.id).includes(query);
    
    return nameMatch || phoneMatch || idMatch || pkMatch;
  });

  // Calculate statistics
  const getStats = () => {
    const todayStr = new Date().toDateString();
    let todayTotal = 0;
    let overallTotal = 0;

    recent.forEach(p => {
      const amountVal = parseFloat(p.amount) || 0;
      overallTotal += amountVal;
      
      const pDate = new Date(p.created_at || p.date);
      if (pDate.toDateString() === todayStr) {
        todayTotal += amountVal;
      }
    });

    return { todayTotal, overallTotal };
  };

  const { todayTotal, overallTotal } = getStats();

  // Calculate pending custody to handover
  const getPendingStats = () => {
    const pendings = recent.filter(p => p.status === 'pending');
    const count = pendings.length;
    const amountSum = pendings.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    return { pendingCount: count, pendingAmount: amountSum };
  };

  const { pendingCount, pendingAmount } = getPendingStats();

  const handleSettlement = () => {
    if (pendingCount === 0) return;
    
    Alert.alert(
      "تسليم العهدة",
      `هل أنت متأكد أنك تريد تسليم عهدة بمبلغ ${pendingAmount} ر.س (${pendingCount} عملية تحصيل) للمحاسب؟`,
      [
        { text: "إلغاء", style: "cancel" },
        { 
          text: "تأكيد التسليم", 
          onPress: async () => {
            setLoading(true);
            try {
              await api.post('/finance/settlements/');
              Alert.alert("✅ تم التسليم بنجاح", "تم تقديم محضر تسليم العهدة وهو بانتظار تأكيد المحاسب الآن.");
              fetchRecent();
            } catch (err) {
              console.error(err);
              Alert.alert("خطأ", "فشل في إنشاء محضر تسليم العهدة.");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // Filter collections history
  const filteredRecent = recent.filter(p => {
    const query = historySearchQuery.toLowerCase().trim();
    if (!query) return true;
    
    const nameMatch = p.subscriber_name ? p.subscriber_name.toLowerCase().includes(query) : false;
    const receiptMatch = p.receipt_number ? p.receipt_number.toLowerCase().includes(query) : false;
    const amountMatch = String(p.amount).includes(query);
    
    return nameMatch || receiptMatch || amountMatch;
  });

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>تحصيل اشتراك</Text>
          <Text style={styles.subtitle}>تسجيل الدفع وإصدار إيصال رقمي</Text>
        </View>

        {/* Stats Summary */}
        <View style={styles.statsRow}>
          <View style={[styles.statsCard, { borderColor: Colors.successLight, borderWidth: 1 }]}>
            <Text style={styles.statsLabel}>محصلات اليوم</Text>
            <Text style={[styles.statsValue, { color: Colors.success }]}>{todayTotal} ر.س</Text>
          </View>
          <View style={[styles.statsCard, { borderColor: Colors.primaryLight, borderWidth: 1 }]}>
            <Text style={styles.statsLabel}>إجمالي المحصل</Text>
            <Text style={[styles.statsValue, { color: Colors.primary }]}>{overallTotal} ر.س</Text>
          </View>
        </View>

        {/* Daily Custody Handover Card */}
        {pendingCount > 0 && (
          <View style={styles.settlementAlertCard}>
            <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10, flex: 1 }}>
              <View style={styles.settlementIconBg}>
                <Ionicons name="wallet" size={20} color={Colors.warning} />
              </View>
              <View style={{ alignItems: 'flex-end', flex: 1 }}>
                <Text style={styles.settlementAlertTitle}>عهدة نقدية معلّقة</Text>
                <Text style={styles.settlementAlertDesc}>
                  لديك {pendingCount} تحصيلات معلّقة بمبلغ {pendingAmount} ر.س لم يتم إيداعها للمحاسب بعد.
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.settlementAlertBtn} onPress={handleSettlement} disabled={loading}>
              <Text style={styles.settlementAlertBtnText}>تسليم للمحاسب</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.card}>
          <View style={[styles.field, { zIndex: 1000, position: 'relative' }]}>
            <Text style={styles.label}>اسم المشترك أو الهاتف أو الرقم</Text>
            <View style={styles.inputWrapper}>
              <TextInput 
                style={[styles.input, { paddingLeft: 40 }]} 
                placeholder="ابحث بالاسم، الهاتف أو المعرف" 
                placeholderTextColor={Colors.textMuted}
                textAlign="right" 
                value={searchQuery} 
                onChangeText={handleSearchChange}
                onFocus={() => setSuggestionsVisible(true)}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity style={styles.clearBtn} onPress={() => {
                  setSearchQuery('');
                  setSelectedSubscriber(null);
                  setSuggestionsVisible(false);
                }}>
                  <Ionicons name="close-circle" size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {loadingSubs && (
              <ActivityIndicator size="small" color={Colors.primary} style={{ marginTop: 8 }} />
            )}

            {suggestionsVisible && filteredSubscribers.length > 0 && (
              <View style={styles.suggestionsContainer}>
                <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 200 }}>
                  {filteredSubscribers.map((sub, index) => (
                    <TouchableOpacity 
                      key={sub.id} 
                      style={[
                        styles.suggestionItem, 
                        index < filteredSubscribers.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.border }
                      ]} 
                      onPress={() => handleSelect(sub)}
                    >
                      <View style={styles.suggestionRow}>
                        <View style={{ alignItems: 'flex-start' }}>
                          <Text style={[styles.suggestionBalance, { color: sub.balance > 0 ? Colors.danger : Colors.success }]}>
                            {sub.balance > 0 ? `${sub.balance} ر.س` : 'مُسدد'}
                          </Text>
                          <Text style={styles.suggestionSubText}>{sub.plan_name || 'بدون باقة'}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end', flex: 1 }}>
                          <Text style={styles.suggestionName}>{sub.name}</Text>
                          <Text style={styles.suggestionSubText}>
                            {sub.subscription_id || `ID: ${sub.id}`} · {sub.phone}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            
            {suggestionsVisible && searchQuery.length > 0 && filteredSubscribers.length === 0 && !selectedSubscriber && (
              <View style={styles.suggestionsContainer}>
                <Text style={{ padding: 15, color: Colors.textMuted, textAlign: 'center' }}>لا يوجد مشتركين مطابقين للبحث</Text>
              </View>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>المبلغ (ر.س)</Text>
            <TextInput style={styles.input} placeholder="0" placeholderTextColor={Colors.textMuted}
              textAlign="right" keyboardType="numeric" value={amount} onChangeText={setAmount} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>خطط مقترحة</Text>
            <View style={styles.suggestions}>
              {[150, 400, 750, 1400].map(v => (
                <TouchableOpacity key={v} style={styles.sugBtn} onPress={() => setAmount(String(v))}>
                  <Text style={styles.sugText}>{v} ر.س</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.7 }]} onPress={submit} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
            ) : (
              <>
                <Ionicons name="receipt-outline" size={20} color="#fff" />
                <Text style={styles.submitText}>تأكيد التحصيل وإرسال الإيصال</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Recent collections */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>سجل التحصيلات ({filteredRecent.length})</Text>
          <View style={styles.historySearchWrapper}>
            <TextInput
              style={styles.historySearchInput}
              placeholder="البحث في السجل بالاسم أو الإيصال..."
              placeholderTextColor={Colors.textMuted}
              textAlign="right"
              value={historySearchQuery}
              onChangeText={setHistorySearchQuery}
            />
            <Ionicons name="search-outline" size={16} color={Colors.textMuted} style={styles.searchIcon} />
          </View>
        </View>

        <View style={styles.recentCard}>
          {filteredRecent.length === 0 && (
            <Text style={{ padding: 20, color: Colors.textMuted, textAlign: 'center' }}>
              {historySearchQuery ? 'لا توجد نتائج مطابقة للبحث' : 'لا توجد تحصيلات مسجلة بعد'}
            </Text>
          )}
          {filteredRecent.map((r, i) => (
            <RecentRow 
              key={r.id}
              item={r} 
              last={i === filteredRecent.length - 1} 
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function RecentRow({ item, last }) {
  const statusLabels = {
    confirmed: 'مؤكد',
    pending: 'قيد الإيداع',
    deposited: 'تم الإيداع',
  };
  const statusColors = {
    confirmed: Colors.success,
    pending: Colors.warning,
    deposited: Colors.info || '#0ea5e9',
  };
  const statusBgColors = {
    confirmed: Colors.successLight,
    pending: Colors.warningLight || '#fef3c7',
    deposited: '#e0f2fe',
  };

  const status = item.status || 'pending';
  const label = statusLabels[status] || 'قيد الإيداع';
  const color = statusColors[status] || Colors.warning;
  const bgColor = statusBgColors[status] || '#fef3c7';

  let timeStr = '';
  try {
    const d = new Date(item.created_at || item.date);
    timeStr = d.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    timeStr = item.date;
  }

  return (
    <View style={[styles.recentRow, !last && { borderBottomWidth: 1, borderBottomColor: Colors.border }]}>
      <View style={styles.recentLeft}>
        <Text style={styles.recentAmount}>+{parseFloat(item.amount)} ر.س</Text>
        <View style={[styles.statusBadge, { backgroundColor: bgColor }]}>
          <Text style={[styles.statusBadgeText, { color }]}>{label}</Text>
        </View>
      </View>
      <View style={styles.recentRight}>
        <Text style={styles.recentName}>{item.subscriber_name || 'مشترك'}</Text>
        <Text style={styles.recentDetails}>
          {item.receipt_number} · {timeStr}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1, paddingHorizontal: Spacing.md },
  header: { paddingTop: Spacing.lg, paddingBottom: Spacing.md },
  title: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.textPrimary, textAlign: 'right' },
  subtitle: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'right' },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.lg, marginBottom: Spacing.lg },
  field: { marginBottom: Spacing.lg },
  label: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary, marginBottom: 6, textAlign: 'right' },
  input: {
    backgroundColor: Colors.card, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border,
    padding: 14, color: Colors.textPrimary, fontSize: FontSize.md,
  },
  inputWrapper: {
    position: 'relative',
    width: '100%',
  },
  clearBtn: {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: [{ translateY: -10 }],
    zIndex: 10,
  },
  suggestionsContainer: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.sm,
    maxHeight: 200,
    zIndex: 1000,
    marginTop: 4,
    position: 'absolute',
    top: 75,
    left: 0,
    right: 0,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  suggestionItem: {
    padding: Spacing.md,
    backgroundColor: Colors.surface,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  suggestionName: {
    fontSize: FontSize.sm + 1,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  suggestionSubText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  suggestionBalance: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  suggestions: { flexDirection: 'row', gap: 8 },
  sugBtn: {
    flex: 1, backgroundColor: Colors.card, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border,
    paddingVertical: 10, alignItems: 'center',
  },
  sugText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.textSecondary },
  submitBtn: {
    backgroundColor: Colors.success, borderRadius: Radius.sm, paddingVertical: 16,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  submitText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },
  sectionTitle: { fontSize: FontSize.lg - 1, fontWeight: '700', color: Colors.textPrimary, textAlign: 'right' },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  historySearchWrapper: {
    position: 'relative',
    flex: 1,
    marginRight: Spacing.md,
  },
  historySearchInput: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 10,
    paddingRight: 32,
    fontSize: FontSize.xs,
    color: Colors.textPrimary,
    textAlign: 'right',
  },
  searchIcon: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -8 }],
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  statsCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsLabel: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  statsValue: {
    fontSize: FontSize.md + 2,
    fontWeight: '800',
  },
  settlementAlertCard: {
    backgroundColor: Colors.warningLight,
    borderColor: Colors.warning,
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  settlementIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(217, 119, 6, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settlementAlertTitle: {
    fontSize: FontSize.sm,
    fontWeight: '800',
    color: '#78350f',
  },
  settlementAlertDesc: {
    fontSize: FontSize.xs,
    color: '#78350f',
    marginTop: 2,
    textAlign: 'right',
    lineHeight: 16,
  },
  settlementAlertBtn: {
    backgroundColor: Colors.warning,
    borderRadius: Radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  settlementAlertBtnText: {
    color: '#fff',
    fontSize: FontSize.xs + 1,
    fontWeight: '700',
  },
  recentCard: { backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  recentRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: 12 },
  recentLeft: {
    alignItems: 'flex-start',
  },
  recentRight: {
    alignItems: 'flex-end',
    flex: 1,
  },
  recentDetails: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  recentAmount: { fontSize: FontSize.md, fontWeight: '800', color: Colors.success },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
});
