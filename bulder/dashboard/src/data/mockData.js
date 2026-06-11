// بيانات تجريبية لنظام سل

export const zones = [
  { id: 1, name: "حي النسيم", status: "نشط", subscribers: 145, drivers: 2, agents: 1, lat: 24.7136, lng: 46.6753 },
  { id: 2, name: "حي الملقا", status: "نشط", subscribers: 230, drivers: 3, agents: 2, lat: 24.7741, lng: 46.6346 },
  { id: 3, name: "حي العليا", status: "نشط", subscribers: 312, drivers: 4, agents: 2, lat: 24.6908, lng: 46.6854 },
  { id: 4, name: "حي الروضة", status: "موقوف", subscribers: 0, drivers: 0, agents: 0, lat: 24.7255, lng: 46.7150 },
  { id: 5, name: "حي السلام", status: "نشط", subscribers: 189, drivers: 2, agents: 1, lat: 24.7500, lng: 46.7000 },
  { id: 6, name: "حي الياسمين", status: "نشط", subscribers: 267, drivers: 3, agents: 2, lat: 24.8100, lng: 46.6200 },
];

export const staff = [
  { id: 1, name: "أحمد محمد العتيبي", role: "سائق", phone: "0501234567", zone: "حي النسيم", status: "نشط", joinDate: "2024-01-15" },
  { id: 2, name: "خالد عبدالله القحطاني", role: "مندوب", phone: "0559876543", zone: "حي الملقا", status: "نشط", joinDate: "2024-02-20" },
  { id: 3, name: "سعد فهد الشمري", role: "سائق", phone: "0533456789", zone: "حي العليا", status: "نشط", joinDate: "2024-03-10" },
  { id: 4, name: "محمد ناصر الدوسري", role: "محاسب", phone: "0541112233", zone: "—", status: "نشط", joinDate: "2024-01-01" },
  { id: 5, name: "عبدالرحمن سالم الحربي", role: "سائق", phone: "0567778899", zone: "حي السلام", status: "إجازة", joinDate: "2024-04-05" },
  { id: 6, name: "فيصل إبراهيم المطيري", role: "مندوب", phone: "0522334455", zone: "حي الياسمين", status: "نشط", joinDate: "2024-05-12" },
  { id: 7, name: "ياسر حمد الغامدي", role: "سائق", phone: "0588990011", zone: "حي الملقا", status: "نشط", joinDate: "2024-06-01" },
  { id: 8, name: "تركي سعود العنزي", role: "مندوب", phone: "0511223344", zone: "حي العليا", status: "نشط", joinDate: "2024-03-25" },
];

export const subscribers = [
  { id: "SUB-001", name: "عبدالله العمري", phone: "0501111111", zone: "حي النسيم", plan: "شهري", status: "أخضر", expiry: "2026-06-15" },
  { id: "SUB-002", name: "نورة الزهراني", phone: "0502222222", zone: "حي الملقا", plan: "3 أشهر", status: "أخضر", expiry: "2026-08-20" },
  { id: "SUB-003", name: "فهد الراشد", phone: "0503333333", zone: "حي العليا", plan: "شهري", status: "أصفر", expiry: "2026-05-01" },
  { id: "SUB-004", name: "سارة القحطاني", phone: "0504444444", zone: "حي النسيم", plan: "شهري", status: "أحمر", expiry: "2026-03-10" },
  { id: "SUB-005", name: "ماجد الشهري", phone: "0505555555", zone: "حي السلام", plan: "6 أشهر", status: "أخضر", expiry: "2026-12-01" },
  { id: "SUB-006", name: "هند المالكي", phone: "0506666666", zone: "حي الياسمين", plan: "شهري", status: "أخضر", expiry: "2026-06-30" },
];

export const complaints = [
  { id: 1, subscriber: "عبدالله العمري", zone: "حي النسيم", type: "تأخر الجمع", status: "جديدة", date: "2026-05-01", description: "لم يتم جمع النفايات في الموعد المحدد" },
  { id: 2, subscriber: "نورة الزهراني", zone: "حي الملقا", type: "سلوك السائق", status: "قيد المعالجة", date: "2026-04-28", description: "السائق لم يعيد السلة لمكانها" },
  { id: 3, subscriber: "فهد الراشد", zone: "حي العليا", type: "سلة تالفة", status: "تم الحل", date: "2026-04-25", description: "السلة مكسورة وتحتاج استبدال" },
];

export const monthlyRevenue = [
  { month: "يناير", revenue: 45000, expenses: 18000 },
  { month: "فبراير", revenue: 52000, expenses: 20000 },
  { month: "مارس", revenue: 58000, expenses: 22000 },
  { month: "أبريل", revenue: 63000, expenses: 19000 },
  { month: "مايو", revenue: 71000, expenses: 24000 },
  { month: "يونيو", revenue: 68000, expenses: 21000 },
];

export const subscriberGrowth = [
  { month: "يناير", count: 580 },
  { month: "فبراير", count: 650 },
  { month: "مارس", count: 720 },
  { month: "أبريل", count: 830 },
  { month: "مايو", count: 950 },
  { month: "يونيو", count: 1143 },
];

export const dailyCompletion = [
  { day: "السبت", completed: 85, total: 100 },
  { day: "الأحد", completed: 92, total: 100 },
  { day: "الإثنين", completed: 78, total: 100 },
  { day: "الثلاثاء", completed: 95, total: 100 },
  { day: "الأربعاء", completed: 88, total: 100 },
  { day: "الخميس", completed: 70, total: 100 },
];

export const notifications = [
  { id: 1, type: "alert", title: "شاحنة حي النسيم متأخرة", time: "منذ 5 دقائق", read: false },
  { id: 2, type: "complaint", title: "شكوى جديدة من المشترك SUB-004", time: "منذ 15 دقيقة", read: false },
  { id: 3, type: "payment", title: "تم تحصيل 3,500 ر.س من حي الملقا", time: "منذ ساعة", read: true },
  { id: 4, type: "system", title: "تم تحديث مسار حي العليا بنجاح", time: "منذ ساعتين", read: true },
  { id: 5, type: "alert", title: "اشتراك 12 مشترك سينتهي خلال أسبوع", time: "منذ 3 ساعات", read: true },
];

export const recyclingLeaderboard = [
  { rank: 1, name: "ماجد الشهري", zone: "حي السلام", points: 1250, badge: "حامي البيئة" },
  { rank: 2, name: "هند المالكي", zone: "حي الياسمين", points: 980, badge: "صديق البيئة" },
  { rank: 3, name: "عبدالله العمري", zone: "حي النسيم", points: 750, badge: "صديق البيئة" },
  { rank: 4, name: "نورة الزهراني", zone: "حي الملقا", points: 520, badge: "مساهم" },
  { rank: 5, name: "فهد الراشد", zone: "حي العليا", points: 310, badge: "مساهم" },
];
