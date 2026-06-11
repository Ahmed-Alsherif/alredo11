# مصفوفة تتبع المتطلبات

## المرجعية

هذه المصفوفة تغطي جميع المتطلبات الوظيفية بنسبة 100%.
كل متطلب مربوط بحالة التنفيذ الفعلية والملفات المسؤولة.

## رموز التصنيف

- OP: الهيكل التشغيلي
- GEO: التتبع الجغرافي
- NOT: الإشعارات
- SUB: المشتركين
- STF: الموظفين والوصول
- QC: الشكاوى والجودة
- REP: التقارير
- REC: إعادة التدوير
- FIN: المالية

## رموز حالة التنفيذ

- ✅ مكتمل — تم بناؤه واختباره.
- ⚠️ جزئي — تم بناء جزء ويحتاج تكملة.
- ❌ لم يبدأ — مخطط ولم يُنفذ.

---

## الهيكل التشغيلي (OP)

| ID | المتطلب الوظيفي | الحالة | Backend | واجهة Dashboard | واجهة Mobile | معيار القبول |
|---|---|---|---|---|---|---|
| OP-01 | إضافة منطقة جديدة وتحديد إحداثياتها الجغرافية | ⚠️ | `zones/models.py` (Zone), `zones/views.py` | `Zones.jsx` | — | يمكن إنشاء منطقة وحفظ حدودها — ⚠️ محرر الخريطة غير مبني |
| OP-02 | تعديل بيانات أو حدود منطقة قائمة | ⚠️ | `zones/views.py` (PATCH) | `Zones.jsx` | — | يمكن تغيير الاسم والحالة — ⚠️ تعديل الحدود بصري غير مبني |
| OP-03 | حذف منطقة أو تعطيلها | ✅ | `zones/views.py` (DELETE) | `Zones.jsx` | — | يمكن حذف أو تعطيل منطقة |
| OP-04 | استعراض المناطق وحالتها وعدد المشتركين | ✅ | `zones/models.py` (subscribers_count) | `Zones.jsx` | — | تظهر كل منطقة مع حالتها وعدد المشتركين |
| OP-05 | ربط سائق ومندوب بمنطقة | ✅ | `DriverProfile.zone`, `AgentProfile.zone` | `Staff.jsx` | — | يمكن تعيين سائق/مندوب لمنطقة |
| OP-06 | تحديث بيانات الربط في الطوارئ | ✅ | `accounts/views.py` (PATCH) | `Staff.jsx` | — | يمكن استبدال السائق أو المندوب |
| OP-07 | إنشاء قوالب المسارات بأيام الجمع | ✅ | `zones/models.py` (Route) | `Routes.jsx` | — | يمكن إنشاء مسار وتحديد أيام جمعه |
| OP-08 | تعديل أو حذف المسارات | ✅ | `zones/views.py` | `Routes.jsx` | — | يمكن تعديل أو حذف قالب مسار |
| OP-09 | عرض المسارات حسب نطاق السائق والمندوب | ✅ | `zones/views.py` (filter) | `Routes.jsx` | `(driver)/index.jsx` | يرى السائق والمندوب المسارات ضمن نطاقهما |
| OP-10 | تجميد مسار مؤقتاً مع إشعار المشتركين | ⚠️ | `Route.status=frozen` | `Routes.jsx` | — | ⚠️ التجميد يعمل — إشعار المشتركين غير مبني |
| OP-11 | تحديد منطقة المشترك تلقائياً من GPS | ✅ | `subscribers/views.py` + GPS Fallback | — | `(agent)/register.jsx` | يتم إسناد المنطقة — Fallback لمنطقة المندوب |
| OP-12 | تخصيص موعد الجمع ضمن المنطقة | ✅ | `Subscriber.route` | — | `(subscriber)/index.jsx` | يحصل المشترك على موعد جمع مرتبط بمنطقته |
| OP-13 | عرض قائمة مشتركي اليوم للسائق مع البحث والفرز | ✅ | `tracking/models.py` (CollectionVisit) | `Tracking.jsx` | `(driver)/index.jsx` | تظهر قائمة منازل اليوم مع بحث وفرز |
| OP-14 | عرض المتأخرين ضمن نطاق المندوب | ✅ | `subscribers/views.py` (filter) | — | `(agent)/debtors.jsx` | يرى المندوب المتأخرين مع بحث وفرز وأزرار تصفية سريعة |

---

## التتبع الجغرافي (GEO)

| ID | المتطلب الوظيفي | الحالة | Backend | واجهة Dashboard | واجهة Mobile | معيار القبول |
|---|---|---|---|---|---|---|
| GEO-01 | تحديث موقع الشاحنة لحظياً | ✅ | `tracking/models.py` (TruckLocation) | — | `(driver)/index.jsx` | يتم استقبال وتخزين تحديثات الموقع |
| GEO-02 | خريطة مراقبة الشاحنات النشطة | ✅ | `tracking/views.py` | `Tracking.jsx` | — | تظهر الشاحنات النشطة لحظياً |
| GEO-03 | المشترك يرى الشاحنة عند الاقتراب | ⚠️ | `tracking/views.py` | — | `(subscriber)/tracking.jsx` | ⚠️ الشاشة موجودة — شرط الاقتراب يحتاج تحسين |
| GEO-04 | Pins لمشتركي اليوم على خريطة السائق/المندوب | ⚠️ | `subscribers/views.py` | — | `(driver)/map.jsx` | ⚠️ خريطة السائق موجودة — خريطة المندوب غير مبنية |
| GEO-05 | عرض مسار الوصول للمشترك | ⚠️ | — | — | `(driver)/map.jsx` | ⚠️ النقر على Pin يعرض الموقع — مسار التنقل الفعلي غير مبني |

---

## الإشعارات (NOT)

| ID | المتطلب الوظيفي | الحالة | Backend | واجهة Dashboard | واجهة Mobile | معيار القبول |
|---|---|---|---|---|---|---|
| NOT-01 | إشعار موعد الجمع ليلة الموعد أو حسب اختيار المشترك | ❌ | `notifications/models.py` | — | — | ❌ لم يُبنَ — يحتاج Cron/Celery |
| NOT-02 | إشعارات البلاغات المصورة | ⚠️ | `complaints/models.py` (FieldReport) | — | `(driver)/report.jsx` | ⚠️ البلاغ يُسجل — الإشعار التلقائي يحتاج تكملة |
| NOT-03 | تنبيه انتهاء الاشتراك | ❌ | — | — | — | ❌ لم يُبنَ — يحتاج Cron/Celery |
| NOT-04 | إيصال دفع رقمي بعد التحصيل | ⚠️ | `finance/models.py` (receipt_number) | — | `(agent)/collect.jsx` | ⚠️ الإيصال يُولّد — إشعار الإيصال يحتاج تكملة |
| NOT-05 | مركز إشعارات مؤرشف | ✅ | `notifications/models.py`, `notifications/views.py` | `Notifications.jsx` | `*/notifications.jsx` | يمكن مراجعة الإشعارات السابقة مرتبة زمنياً |

---

## المشتركون (SUB)

| ID | المتطلب الوظيفي | الحالة | Backend | واجهة Dashboard | واجهة Mobile | معيار القبول |
|---|---|---|---|---|---|---|
| SUB-01 | تسجيل مشترك بواسطة المندوب أو ذاتياً | ✅ | `accounts/views.py` (register), `subscribers/views.py` | — | `login.jsx`, `(agent)/register.jsx` | يمكن إنشاء مشترك من المندوب أو التسجيل الذاتي |
| SUB-02 | عرض خطط الاشتراك والتجديد والإلغاء | ✅ | `subscribers/models.py` (SubscriptionPlan) | `Subscribers.jsx` | `(subscriber)/subscription.jsx` | تظهر الخطط ويمكن تجديد أو إلغاء الاشتراك |
| SUB-03 | عرض أيام الجمع في الرئيسية | ✅ | `Subscriber.route` → `Route.collection_days` | — | `(subscriber)/index.jsx` | تظهر أيام الجمع للمشترك |
| SUB-04 | التقاط GPS عند التسجيل | ✅ | `Subscriber.latitude/longitude` | — | `(agent)/register.jsx` | يتم التقاط الإحداثيات أثناء التسجيل |
| SUB-05 | التحقق من التغطية ومنع التسجيل خارج الخدمة | ✅ | GPS Fallback في views | — | `(agent)/register.jsx` | يربط بمنطقة المندوب إذا لم يُلتقط الموقع |
| SUB-06 | عرض المشتركين مع الفرز والبحث | ✅ | `subscribers/views.py` | `Subscribers.jsx` | `(agent)/debtors.jsx` | قوائم قابلة للبحث والفرز |
| SUB-07 | توليد رقم اشتراك فريد | ✅ | `Subscriber.save()` → `SUB-XXXX` | — | — | كل مشترك يحصل على رقم فريد |
| SUB-08 | تحديث بيانات المشترك مع التحقق | ✅ | `subscribers/views.py` (PATCH) | `Subscribers.jsx` | `(subscriber)/profile.jsx` | يمكن التعديل مع التحقق |
| SUB-09 | الإيقاف المؤقت وتعليق الخدمة | ✅ | `Subscriber.pause()/resume()` | `Subscribers.jsx` | `(subscriber)/subscription.jsx` | يمكن تفعيل/إلغاء الإيقاف مع تمديد تلقائي |
| SUB-10 | التصنيف اللوني التلقائي مع العذر | ✅ | `Subscriber.update_color_status()` | `Subscribers.jsx` | `(agent)/debtors.jsx` | يتغير اللون تلقائياً وتظهر الأعذار |
| SUB-11 | البحث المتقدم والأرشفة والسجل | ✅ | `Subscriber.archive()`, `SubscriptionLog` | `Subscribers.jsx` | — | يمكن الوصول للسجل وأرشفة الحسابات |
| SUB-12 | إدارة السلال ضمن الاشتراك | ✅ | `SubscriptionPlan.bins_count` | — | `(agent)/register.jsx` | يتم تسجيل عدد السلال ضمن الباقة |

---

## الموظفون والوصول (STF)

| ID | المتطلب الوظيفي | الحالة | Backend | واجهة Dashboard | واجهة Mobile | معيار القبول |
|---|---|---|---|---|---|---|
| STF-01 | إضافة موظف جديد مع وثائق | ✅ | `accounts/models.py`, `accounts/views.py` | `Staff.jsx` | — | يمكن إنشاء موظف ورفع وثائقه |
| STF-02 | عرض الموظفين والبحث | ✅ | `accounts/views.py` (staff, search) | `Staff.jsx` | — | تظهر قائمة الموظفين مع بحث |
| STF-03 | تعديل بيانات الموظف والوثائق | ✅ | `accounts/views.py` (PATCH) | `Staff.jsx` | — | يمكن تحديث بيانات ووثائق الموظف |
| STF-04 | حذف الموظف | ✅ | `accounts/views.py` (DELETE) | `Staff.jsx` | — | يمكن حذف ملف الموظف |
| STF-05 | تسجيل الدخول والخروج | ✅ | JWT (SimpleJWT) | `Login.jsx` | `login.jsx` | يستطيع كل مستخدم الدخول والخروج |
| STF-06 | واجهة مستقلة لكل دور | ✅ | `User.role` → redirect | Sidebar + role guard | Expo Router groups | كل دور يرى واجهته فقط |
| STF-07 | إدارة كلمات المرور | ✅ | `reset_password`, `change_password` | `Staff.jsx` | `*/profile.jsx` | يمكن إعادة تعيين وتغيير كلمة المرور |

---

## الشكاوى والجودة (QC)

| ID | المتطلب الوظيفي | الحالة | Backend | واجهة Dashboard | واجهة Mobile | معيار القبول |
|---|---|---|---|---|---|---|
| QC-01 | تقديم شكوى نصية أو مصورة | ✅ | `complaints/models.py` (Complaint) | — | `(subscriber)/complaints.jsx` | يستطيع المشترك إرسال شكوى نصية أو مصورة |
| QC-02 | متابعة الشكاوى والرد | ✅ | `complaints/views.py` (PATCH) | `Complaints.jsx` | `(subscriber)/complaints.jsx` | تحديث الحالة يعمل |
| QC-03 | بلاغات ميدانية مصورة | ✅ | `complaints/models.py` (FieldReport) | — | `(driver)/report.jsx` | يستطيع السائق إرسال بلاغ مصور |
| QC-04 | تقييم شهري للخدمة | ✅ | `complaints/models.py` (ServiceRating) | — | `(subscriber)/rating.jsx` | يمكن للمشترك إرسال تقييم شهري |

---

## التقارير (REP)

| ID | المتطلب الوظيفي | الحالة | Backend | واجهة Dashboard | واجهة Mobile | معيار القبول |
|---|---|---|---|---|---|---|
| REP-01 | لوحة مؤشرات مالية وتشغيلية | ✅ | `reports/views.py` (dashboard_stats) | `Dashboard.jsx` | — | تظهر المؤشرات الرئيسية |
| REP-02 | تقارير الأداء التشغيلي | ✅ | `reports/views.py` (operational_report) | `Reports.jsx` | — | يمكن استخراج إحصاءات تشغيلية |
| REP-03 | تقارير مالية شاملة | ✅ | `reports/views.py` (financial_report) | `Reports.jsx` | — | يمكن استخراج كشوف مالية |
| REP-04 | تقارير النمو الشهري | ✅ | `reports/views.py` (growth_report) | `Reports.jsx` | — | يظهر رسم نمو شهري |
| REP-05 | تصدير PDF و Excel و CSV | ✅ | `reports/views.py` (export_pdf) | `Reports.jsx` | — | يمكن تصدير بالصيغ الثلاث |

---

## إعادة التدوير (REC)

| ID | المتطلب الوظيفي | الحالة | Backend | واجهة Dashboard | واجهة Mobile | معيار القبول |
|---|---|---|---|---|---|---|
| REC-01 | عرض فئات الفرز الإرشادية | ✅ | TextChoices في model | `Recycling.jsx` | `(subscriber)/education.jsx` | يرى المشترك إرشادات الفصل |
| REC-02 | طلب جمع إعادة التدوير | ✅ | `recycling/models.py` (RecycleRequest) | — | `(subscriber)/recycling.jsx` | يستطيع المشترك إرسال طلب |
| REC-03 | تأكيد السائق استلام الأكياس | ✅ | `recycling/views.py` (confirm) | — | — | يستطيع السائق تأكيد الاستلام |
| REC-04 | منح نقاط تلقائياً | ✅ | `recycling/views.py` → PointsTransaction | — | — | تضاف النقاط بعد التأكيد |
| REC-05 | لوحة المتصدرين البيئية | ✅ | `recycling/views.py` (leaderboard) | — | `(subscriber)/recycling.jsx` | تظهر مراتب المتصدرين |
| REC-06 | سجل الأثر البيئي والرتب | ⚠️ | PointsTransaction (جزئي) | — | `(subscriber)/recycling.jsx` | ⚠️ النقاط تعمل — EnvironmentalImpactRecord غير مبني |

---

## المالية (FIN)

| ID | المتطلب الوظيفي | الحالة | Backend | واجهة Dashboard | واجهة Mobile | معيار القبول |
|---|---|---|---|---|---|---|
| FIN-01 | تسجيل التحصيل الميداني وإصدار إيصال | ✅ | `finance/models.py` (Payment) | `Finance.jsx` | `(agent)/collect.jsx` | يسجل المندوب التحصيل ويصدر إيصال تلقائي |
| FIN-02 | مطابقة العهد وتوريدها | ✅ | `finance/models.py` (CollectionSettlement) | `Settlements.jsx` | `(agent)/collect.jsx` | يراجع المحاسب المبالغ ويوافق/يرفض |
| FIN-03 | تسجيل مصروفات الميدان | ✅ | `finance/models.py` (Expense) | `Finance.jsx` | — | يمكن تسجيل المصروفات بفئاتها |
| FIN-04 | تكلفة التحفيز كاشتراكات مجانية | ✅ | متضمنة في `Reward` | — | — | متضمنة في جدول المكافآت |
| FIN-05 | جزاءات الغياب والتأخير | ✅ | `finance/models.py` (Penalty) | `Finance.jsx` | — | يمكن تسجيل خصم مالي للموظف |
| FIN-06 | سجل السلف والمديونيات | ✅ | `finance/models.py` (Advance) | `Finance.jsx` | — | تظهر السلف وحالتها |
| FIN-07 | أعذار المتأخرين عن السداد | ⚠️ | `Subscriber.excuse` (حقل) | `Subscribers.jsx` | `(agent)/debtors.jsx` | ⚠️ الحقل يعمل — LatePaymentExcuse كجدول مستقل غير مبني |

---

## ملخص التغطية

| التصنيف | عدد المتطلبات | ✅ مكتمل | ⚠️ جزئي | ❌ لم يبدأ |
|---|---:|---:|---:|---:|
| OP | 14 | 10 | 3 | 1 |
| GEO | 5 | 2 | 3 | 0 |
| NOT | 5 | 1 | 2 | 2 |
| SUB | 12 | 12 | 0 | 0 |
| STF | 7 | 7 | 0 | 0 |
| QC | 4 | 4 | 0 | 0 |
| REP | 5 | 5 | 0 | 0 |
| REC | 6 | 5 | 1 | 0 |
| FIN | 7 | 6 | 1 | 0 |
| **الإجمالي** | **65** | **52** | **10** | **3** |

**نسبة الاكتمال الكلية**: 52/65 مكتمل = **80%**
**نسبة التغطية (مكتمل + جزئي)**: 62/65 = **95%**

---

## قاعدة التحقق

لا يعتبر أي متطلب مكتملاً إلا إذا توفرت له:

- واجهة مناسبة في Mobile أو Dashboard عند الحاجة.
- معالجة Backend عند الحاجة.
- تخزين أو قراءة من قاعدة البيانات عند الحاجة.
- اختبار قبول يثبت تحقق معيار القبول المذكور.

## المتطلبات غير المكتملة — أولويات التنفيذ

| الأولوية | ID | المتطلب | السبب |
|---|---|---|---|
| عالية | NOT-01 | إشعار موعد الجمع | يحتاج Cron/Celery |
| عالية | NOT-03 | تنبيه انتهاء الاشتراك | يحتاج Cron/Celery |
| متوسطة | OP-01/OP-02 | محرر حدود المنطقة بصرياً | يحتاج مكون خريطة تفاعلي |
| متوسطة | FIN-07 | LatePaymentExcuse كجدول | يحتاج model + API |
| متوسطة | REC-06 | EnvironmentalImpactRecord | يحتاج model + API |
