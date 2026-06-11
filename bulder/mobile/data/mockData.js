export const notifications = [
  { id: 1, type: 'truck', title: 'الشاحنة في طريقها إليك!', body: 'ستصل خلال 10 دقائق تقريباً', time: 'منذ 5 دقائق', read: false },
  { id: 2, type: 'payment', title: 'تم تأكيد الدفع', body: 'تم تسجيل دفعة 150 ر.س بنجاح', time: 'منذ ساعة', read: false },
  { id: 3, type: 'recycle', title: 'أحسنت! +25 نقطة', body: 'تم احتساب نقاط التدوير لمشاركتك', time: 'أمس', read: true },
  { id: 4, type: 'system', title: 'تم تحديث مواعيد الجمع', body: 'تم تعديل أيام الجمع لمنطقتك', time: 'منذ يومين', read: true },
  { id: 5, type: 'complaint', title: 'تم حل شكواك', body: 'تم معالجة الشكوى رقم #102 بنجاح', time: 'منذ 3 أيام', read: true },
];

export const subscriberData = {
  id: 'SUB-001',
  name: 'عبدالله العمري',
  zone: 'حي النسيم',
  plan: 'شهري',
  status: 'أخضر',
  expiry: '2026-06-15',
  nextCollection: 'السبت',
  collectionDays: ['السبت', 'الثلاثاء'],
  points: 750,
  badge: 'صديق البيئة',
  totalRecycles: 42,
};

export const todaySubscribers = [
  { id: 'SUB-001', name: 'عبدالله العمري', address: 'شارع الملك فهد، حي النسيم', status: 'pending', lat: 24.7136, lng: 46.6753 },
  { id: 'SUB-002', name: 'نورة الزهراني', address: 'شارع التحلية، حي النسيم', status: 'pending', lat: 24.7141, lng: 46.6760 },
  { id: 'SUB-006', name: 'هند المالكي', address: 'شارع الأمير سلطان، حي النسيم', status: 'collected', lat: 24.7150, lng: 46.6770 },
  { id: 'SUB-010', name: 'محمد الحربي', address: 'شارع العروبة، حي النسيم', status: 'pending', lat: 24.7160, lng: 46.6780 },
  { id: 'SUB-015', name: 'سارة القحطاني', address: 'شارع الشفا، حي النسيم', status: 'issue', lat: 24.7170, lng: 46.6790 },
  { id: 'SUB-020', name: 'فهد الراشد', address: 'شارع الإمام، حي النسيم', status: 'collected', lat: 24.7180, lng: 46.6800 },
];

export const leaderboard = [
  { rank: 1, name: 'ماجد الشهري', points: 1250, badge: 'حامي البيئة' },
  { rank: 2, name: 'هند المالكي', points: 980, badge: 'صديق البيئة' },
  { rank: 3, name: 'عبدالله العمري', points: 750, badge: 'صديق البيئة' },
  { rank: 4, name: 'نورة الزهراني', points: 520, badge: 'مساهم' },
  { rank: 5, name: 'فهد الراشد', points: 310, badge: 'مساهم' },
];

export const debtors = [
  { id: 'SUB-004', name: 'سارة القحطاني', phone: '0504444444', amount: 300, daysLate: 55, color: 'red', excuse: '' },
  { id: 'SUB-003', name: 'فهد الراشد', phone: '0503333333', amount: 150, daysLate: 10, color: 'yellow', excuse: 'سأدفع نهاية الأسبوع' },
  { id: 'SUB-011', name: 'عمر السبيعي', phone: '0507777777', amount: 150, daysLate: 20, color: 'yellow', excuse: '' },
  { id: 'SUB-014', name: 'ريم الخالدي', phone: '0509999999', amount: 450, daysLate: 90, color: 'red', excuse: 'ظروف مادية' },
];

export const complaints = [
  { id: 1, type: 'تأخر الجمع', status: 'تم الحل', date: '2026-04-25', description: 'لم يتم جمع النفايات' },
  { id: 2, type: 'سلة تالفة', status: 'قيد المعالجة', date: '2026-05-01', description: 'السلة مكسورة' },
];
