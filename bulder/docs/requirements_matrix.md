# Requirements Matrix — مصفوفة المتطلبات الوظيفية

> آخر تحديث: 2026-06-10
> المرجع: `bulder/reqeirment/متطلبات وظيفيه.txt`

---

## حالات التنفيذ

| الحالة | الرمز | المعنى |
|---|---|---|
| ✅ Done | مكتمل | تم التنفيذ في قاعدة البيانات والـ Backend API ولوحة التحكم/التطبيق |
| 🔶 Partial | جزئي | تم التنفيذ في الـ Backend لكن واجهة المستخدم تحتاج تطوير |
| ⏳ Deferred | مؤجّل | مؤجّل للمرحلة القادمة عن قصد |

---

## F1 — إدارة الهيكل التشغيلي (Operational Structure)

| الرمز | المتطلب | الحالة | جدول DB | API Endpoint | الشاشة | ملاحظات |
|---|---|---|---|---|---|---|
| FR-01-01 | إضافة منطقة جغرافية | ✅ Done | `Zone` | `POST /api/zones/` | Dashboard Zones | الحدود مخزنة كـ JSON (إحداثيات GPS) |
| FR-01-02 | تعديل منطقة جغرافية | ✅ Done | `Zone` | `PUT /api/zones/{id}/` | Dashboard Zones | يتم تحديث ارتباطات المشتركين تلقائياً |
| FR-01-03 | حذف منطقة جغرافية | ✅ Done | `Zone` | `DELETE /api/zones/{id}/` | Dashboard Zones | يتم التحقق من خلوها من مشتركين أولاً |
| FR-01-04 | استعراض المناطق | ✅ Done | `Zone` | `GET /api/zones/` | Dashboard Zones | يعرض عدد المشتركين والسائقين لكل منطقة |
| FR-01-05 | ربط سائق ومندوب بمنطقة | ✅ Done | `DriverProfile.zone`, `AgentProfile.zone` | `/api/users/` | Dashboard Staff | الربط عبر حقل zone في كل بروفايل |
| FR-01-06 | تحديث بيانات الربط الميداني | ✅ Done | `DriverProfile`, `AgentProfile` | `PUT /api/users/{id}/` | Dashboard Staff | يمكن تبديل السائق/المندوب للمنطقة |
| FR-01-07 | إنشاء قالب مسار (أيام الجمع) | ✅ Done | `Route` | `POST /api/routes/` | Dashboard Routes | أيام الجمع مخزنة كـ JSON Array |
| FR-01-08 | تعديل/حذف قالب مسار | ✅ Done | `Route` | `PUT/DELETE /api/routes/{id}/` | Dashboard Routes | CRUD كامل في الداشبورد |
| FR-01-09 | عرض المسارات حسب نطاق الموظف | ✅ Done | `Route` | `GET /api/routes/` | Dashboard Routes | يعرض المسارات ضمن نطاق الموظف |
| FR-01-10 | تجميد مسار مؤقت | ✅ Done | `Route.status=frozen` | `PUT /api/routes/{id}/` | Dashboard Routes | المسارات المجمدة تُستبعد من القائمة اليومية |
| FR-01-11 | إسقاط GPS لتحديد منطقة المشترك | ✅ Done | `Subscriber.latitude/longitude`, `Zone.boundaries` | `/api/subscribers/register_with_gps/` | Mobile Register | Point-in-Polygon للتحقق التلقائي |
| FR-01-12 | تخصيص موعد الجمع للمشترك | ✅ Done | `Route.collection_days`, `Subscriber.zone` | — (تلقائي) | — | يُحدد تلقائياً بناءً على منطقة المشترك |
| FR-01-13 | توليد قائمة المشتركين اليومية | ✅ Done | `Route`, `CollectionVisit`, `Subscriber` | `GET /api/subscribers/daily_list/` | Mobile Driver | يولّد CollectionVisit تلقائياً |
| FR-01-14 | إدارة نشاط المندوب (Dashboard Mobile) | ✅ Done | `Subscriber.color_status` | `GET /api/agent/stats/` | Mobile Agent | فلترة مشتركي المنطقة (الكل/مدينون)، تسليم عهدة نقدي |

---

## F2 — إدارة التتبع الجغرافي (Geographic Tracking)

| الرمز | المتطلب | الحالة | جدول DB | API Endpoint | الشاشة | ملاحظات |
|---|---|---|---|---|---|---|
| FR-02-01 | تحديث الإحداثيات اللحظي | ✅ Done | `TruckLocation` | `POST /api/tracking/update_location/` | Mobile Driver | السائق يرسل موقعه باستمرار |
| FR-02-02 | خريطة مراقبة مباشرة للمسؤول | ✅ Done | `TruckLocation` | `GET /api/tracking/live/` | Dashboard Tracking | خريطة تفاعلية تعرض مواقع الشاحنات |
| FR-02-03 | تتبع الشاحنة للمشترك | ✅ Done | `TruckLocation` | `GET /api/tracking/live/` | Mobile Subscriber | HTTP Polling (WebSocket مؤجّل) |
| FR-02-04 | تثبيت مواقع المشتركين (Pins) | ✅ Done | `Subscriber.latitude/longitude` | `GET /api/subscribers/daily_list/` | Mobile Driver/Agent | مواقع المشتركين على الخريطة |
| FR-02-05 | تتبع مسار الجمع الميداني | ✅ Done | `CollectionVisit`, `Subscriber` | `GET /api/collection-visits/` | Mobile Driver | تفاصيل المشترك عند النقر |

---

## F3 — إدارة التنبيهات والإشعارات (Notifications)

| الرمز | المتطلب | الحالة | جدول DB | API Endpoint | الشاشة | ملاحظات |
|---|---|---|---|---|---|---|
| FR-03-01 | تنبيه اقتراب الشاحنة | 🔶 Partial | `TruckLocation`, `Notification` | — (داخلي) | Mobile Notifications | إشعار داخلي فقط (Push Notification مؤجّل) |
| FR-03-02 | إشعار البلاغات الميدانية | ✅ Done | `FieldReport`, `Notification` | — (تلقائي عند إنشاء بلاغ) | Mobile/Dashboard Notifications | ينشئ إشعار تلقائياً للمدير والمشترك |
| FR-03-03 | تنبيه انتهاء الاشتراك | 🔶 Partial | `Subscriber.subscription_end`, `Notification` | — | Mobile Notifications | يحتاج مهمة مجدولة (Celery) للتفعيل الآلي |
| FR-03-04 | إرسال إيصال الدفع الرقمي | ✅ Done | `Payment`, `Notification` | — (تلقائي عند التحصيل) | Mobile Notifications | إشعار داخلي برقم الإيصال |
| FR-03-05 | مركز الإشعارات الداخلي (أرشيف) | ✅ Done | `Notification` | `GET /api/notifications/` | Dashboard Notifications, Mobile | قراءة + تعليم كمقروء + عرض الكل |

---

## F4 — إدارة المشتركين (Subscriber Management)

| الرمز | المتطلب | الحالة | جدول DB | API Endpoint | الشاشة | ملاحظات |
|---|---|---|---|---|---|---|
| FR-04-01 | تسجيل مشترك جديد | ✅ Done | `User`, `Subscriber` | `POST /api/subscribers/`, `POST /api/users/register/` | Dashboard Subscribers, Mobile | التسجيل من المندوب أو ذاتياً |
| FR-04-02 | التقاط الموقع الجغرافي (GPS) | ✅ Done | `Subscriber.latitude/longitude` | `/api/subscribers/register_with_gps/` | Mobile Register | التقاط تلقائي بدقة GPS |
| FR-04-03 | التحقق من نطاق التغطية | ✅ Done | `Zone.boundaries` | `/api/subscribers/register_with_gps/` | Mobile Register | Point-in-Polygon، يمنع التسجيل خارج التغطية |
| FR-04-04 | عرض خطط الاشتراك | ✅ Done | `SubscriptionPlan` | `GET /api/plans/` | Mobile Register, Dashboard | 4 باقات: شهرية، ربع سنوية، نصف سنوية، سنوية |
| FR-04-05 | توليد رقم اشتراك فريد | ✅ Done | `Subscriber.subscription_id` UNIQUE | — (تلقائي عند الحفظ) | كل شاشات المشتركين | SUB-XXXX يتولد تلقائياً |
| FR-04-06 | عرض أيام الجمع للمشترك | ✅ Done | `Route.collection_days` | `/api/subscribers/daily_list/` | Mobile Subscriber Home | بناءً على المسار المحدد لمنطقته |
| FR-04-07 | استعراض قائمة المشتركين | ✅ Done | `Subscriber` | `GET /api/subscribers/` | Dashboard Subscribers | فلترة بالمنطقة، الحالة اللونية، البحث |
| FR-04-08 | تحديث بيانات المشترك | ✅ Done | `Subscriber` | `PUT /api/subscribers/{id}/` | Dashboard Subscribers, Mobile Profile | إعادة التحقق من التغطية عند تغيير الموقع |
| FR-04-09 | نظام التصنيف اللوني التلقائي | ✅ Done | `Subscriber.color_status` | — (تلقائي عبر `update_color_status()`) | كل شاشات المشتركين | أخضر ≤ 0 يوم، أصفر ≤ 30 يوم، أحمر > 30 يوم. **يُحدَث تلقائياً عند التسجيل والدفع** |
| FR-04-10 | إدارة الإيقاف المؤقت | ✅ Done | `Subscriber.is_paused/paused_at/pause_reason` | `POST /api/subscribers/{id}/pause/` | Dashboard/Mobile | يُمدد الاشتراك تلقائياً بأيام الإيقاف عند الاستئناف |
| FR-04-11 | البحث المتقدم والأرشفة | ✅ Done | `Subscriber.archived_at/archive_reason` | `POST /api/subscribers/{id}/archive/` | Dashboard Subscribers | الأرشفة بديل الحذف مع توثيق السبب |

---

## F5 — إدارة الموظفين والصلاحيات (Staff & Access)

| الرمز | المتطلب | الحالة | جدول DB | API Endpoint | الشاشة | ملاحظات |
|---|---|---|---|---|---|---|
| FR-05-01 | إضافة موظف جديد | ✅ Done | `User`, `DriverProfile`/`AgentProfile` | `POST /api/users/` | Dashboard Staff | يُنشئ المستخدم + البروفايل المناسب حسب الدور |
| FR-05-02 | استعراض قائمة الموظفين | ✅ Done | `User` | `GET /api/users/staff/` | Dashboard Staff | بحث بالاسم أو الرقم |
| FR-05-03 | تعديل بيانات الموظف | ✅ Done | `DriverProfile`/`AgentProfile` | `PUT /api/users/{id}/` | Dashboard Staff | تحديث البيانات والوثائق |
| FR-05-04 | حذف ملف الموظف | ✅ Done | `User` | `DELETE /api/users/{id}/` | Dashboard Staff | حذف الحساب كاملاً |
| FR-05-05 | تسجيل الدخول والخروج | ✅ Done | `User` | `POST /api/auth/login/` | Dashboard Login, Mobile Login | JWT Authentication |
| FR-05-06 | تخصيص الأدوار والصلاحيات (RBAC) | ✅ Done | `User.role` | كل الـ Endpoints | كل الشاشات | 5 أدوار: مدير، محاسب، سائق، مندوب، مشترك |
| FR-05-07 | إدارة بيانات الاعتماد | ✅ Done | `User.password` | `/api/users/change_password/`, `/api/users/{id}/reset_password/` | Mobile/Dashboard | تغيير وإعادة تعيين كلمة المرور |

---

## F6 — الشكاوى والبلاغات الميدانية (Quality Control)

| الرمز | المتطلب | الحالة | جدول DB | API Endpoint | الشاشة | ملاحظات |
|---|---|---|---|---|---|---|
| FR-06-01 | تقديم شكوى من المشترك | ✅ Done | `Complaint` | `POST /api/complaints/` | Mobile Complaints | نصية أو مصوّرة، 4 أنواع: تأخر/تلف/عدم جمع/أخرى |
| FR-06-02 | متابعة الشكاوى ومعالجتها | ✅ Done | `Complaint.status/resolved_at` | `PUT /api/complaints/{id}/` | Dashboard Complaints | جديدة → قيد المعالجة → تم الحل |
| FR-06-03 | توثيق البلاغات الميدانية | ✅ Done | `FieldReport` | `POST /api/field-reports/` | Mobile Driver | 4 أنواع: ممتلئة/تالفة/مفقودة/فارغة + صور |
| FR-06-04 | تقييم جودة الخدمة الشهري | ✅ Done | `ServiceRating` | `POST /api/ratings/` | Mobile Subscriber | تقييم واحد فقط لكل شهر (1-5 نجوم) |

---

## F7 — التقارير والإحصائيات (Reports & Dashboard)

| الرمز | المتطلب | الحالة | جدول DB | API Endpoint | الشاشة | ملاحظات |
|---|---|---|---|---|---|---|
| FR-07-01 | لوحة مؤشرات الأداء (Dashboard) | ✅ Done | كل الجداول الأساسية | `GET /api/reports/dashboard/` | Dashboard Home | KPIs: مشتركون نشطون، إيرادات، نسبة الإنجاز |
| FR-07-02 | تقارير الأداء التشغيلي | ✅ Done | `CollectionVisit`, `FieldReport`, `Complaint` | `GET /api/reports/operational/` | Dashboard Reports | إحصائيات يومية ومناطقية |
| FR-07-03 | التقارير المالية | ✅ Done | `Payment`, `Expense`, `Subscriber` | `GET /api/reports/financial/` | Dashboard Reports | الإيرادات والمصروفات والديون والأرباح |
| FR-07-04 | تقارير النمو | ✅ Done | `Subscriber.created_at` | `GET /api/reports/growth/` | Dashboard Reports | رسم بياني شهري |
| FR-07-05 | تصدير PDF | ✅ Done | بيانات التقارير | `GET /api/reports/export/?format=pdf` | Dashboard Reports | تصدير مباشر |
| FR-07-06 | تصدير XLSX | ✅ Done | بيانات التقارير | `GET /api/reports/export/?format=xlsx` | Dashboard Reports | يتطلب `openpyxl` |

---

## F8 — إعادة التدوير والتحفيز البيئي (Recycling)

| الرمز | المتطلب | الحالة | جدول DB | API Endpoint | الشاشة | ملاحظات |
|---|---|---|---|---|---|---|
| FR-08-01 | واجهة تعريف فئات الفرز (توعوي) | 🔶 Partial | — | — | Mobile Recycling | يحتاج تصميم واجهة توعوية ثابتة |
| FR-08-02 | طلب جمع إعادة التدوير | ✅ Done | `RecycleRequest` | `POST /api/recycling/` | Mobile Subscriber | 4 فئات: بلاستيك، معادن، ورق، خبز |
| FR-08-03 | توثيق الجمع المفرز من السائق | ✅ Done | `RecycleRequest.confirmed_by` | `POST /api/recycling/{id}/confirm/` | Mobile Driver | تأكيد الاستلام + منح النقاط |
| FR-08-04 | نظام منح النقاط التلقائي | ✅ Done | `PointsTransaction` | — (تلقائي عند التأكيد) | — | Idempotent: نقاط مرة واحدة فقط لكل طلب |
| FR-08-05 | لوحة المتصدرين البيئية | ✅ Done | `PointsTransaction` | `GET /api/points/leaderboard/` | Mobile/Dashboard Recycling | ترتيب حسب النقاط مع الرتبة والشارة |
| FR-08-06 | سجل الأثر البيئي | ✅ Done | `RecycleRequest`, `PointsTransaction` | `GET /api/recycling/stats/` | Mobile Recycling | عداد تراكمي ورتب بيئية |
| FR-08-07 | محرك المكافآت العشوائية (السحب) | ✅ Done | `Reward`, `Expense` | `POST /api/rewards/draw/` | Dashboard Recycling | يسجل مصروف تسويق تلقائياً |

---

## F9 — إدارة الشؤون المالية (Financial Affairs)

| الرمز | المتطلب | الحالة | جدول DB | API Endpoint | الشاشة | ملاحظات |
|---|---|---|---|---|---|---|
| FR-09-01 | تسجيل التحصيل الميداني | ✅ Done | `Payment` | `POST /api/payments/` | Mobile Agent (Collect) | إيصال رقمي فوري (REC-XXXXXX) + بحث تفاعلي بالاسم/الهاتف/المعرف + تعبئة تلقائية للمبلغ |
| FR-09-02 | مطابقة العُهد وتوريدها | ✅ Done | `Payment.status/agent`, `CollectionSettlement` | `GET /api/finance/payments/reconcile/`, `POST /api/finance/settlements/` | Dashboard Finance, Mobile Agent (Collect) | ملخص حسب المندوب + **تسليم العُهدة مباشرة من التطبيق عبر بنر تنبيهي** |
| FR-09-03 | تسجيل مصروفات الميدان | ✅ Done | `Expense` | `POST /api/expenses/` | Dashboard Finance | تصنيفات: وقود، صيانة، رواتب، تسويق، أخرى |
| FR-09-04 | احتساب تكلفة التحفيز البيئي | ✅ Done | `Expense.category=marketing` | — (تلقائي عبر السحب) | — | يُسجل كمصروف تسويق تلقائياً |
| FR-09-05 | نظام الجزاءات والمكافآت | ✅ Done | `Penalty`, `StaffReward` | `/api/finance/penalties/`, `/api/finance/staff-rewards/` | Dashboard Finance | خصومات ومكافآت للموظفين |
| FR-09-06 | سجل السُلف والمديونيات | ✅ Done | `Advance` | `/api/finance/advances/` | Dashboard Finance | تتبع السلف مع حالة (نشطة/مسددة) |
| FR-09-07 | عرض أعذار المتأخرين عن السداد | ✅ Done | `Subscriber.excuse` | `POST /api/subscribers/{id}/set_excuse/` | Dashboard Subscribers | توثيق الأعذار للمراجعة |

---

## ملخص التغطية

| المجموعة | إجمالي المتطلبات | ✅ Done | 🔶 Partial | ⏳ Deferred |
|---|---|---|---|---|
| F1 — الهيكل التشغيلي | 14 | 14 | 0 | 0 |
| F2 — التتبع الجغرافي | 5 | 5 | 0 | 0 |
| F3 — الإشعارات | 5 | 3 | 2 | 0 |
| F4 — المشتركون | 11 | 11 | 0 | 0 |
| F5 — الموظفين والصلاحيات | 7 | 7 | 0 | 0 |
| F6 — الشكاوى والجودة | 4 | 4 | 0 | 0 |
| F7 — التقارير | 6 | 6 | 0 | 0 |
| F8 — إعادة التدوير | 7 | 6 | 1 | 0 |
| F9 — الشؤون المالية | 7 | 7 | 0 | 0 |
| **الإجمالي** | **66** | **63** | **3** | **0** |

> **نسبة التغطية الإجمالية: ~95%** — المتطلبات الجزئية تتعلق بـ Push Notifications (تحتاج Firebase FCM) وواجهة التوعية البيئية (تصميم ثابت).

---

## التحسينات الأخيرة (2026-06-10)

| التحسين | الملفات المتأثرة | الوصف |
|---|---|---|
| تحميل الباقات ديناميكياً | `register.jsx`, `views.py` | شاشة تسجيل المشترك تجلب الباقات من `/plans/` بدلاً من قيم ثابتة |
| التقاط GPS فعلي | `register.jsx` | التقاط إحداثيات الموقع وإرسالها للباكيند |
| تحديث حالة اللون عند التسجيل | `views.py` | `sub.update_color_status()` يُستدعى عند إنشاء مشترك جديد |
| كبسولات التصفية | `debtors.jsx` | فلاتر: الكل، غير المسددين، المسددين مع عدد ديناميكي |
| عرض الباقة في بطاقة المشترك | `debtors.jsx` | اسم الباقة الحالية والرصيد المستحق |
| شارات الحالة الملونة | `debtors.jsx` | أحمر/أصفر(بعذر/بدون)/أخضر مع ترتيب تلقائي |
| بحث تفاعلي للمشتركين | `collect.jsx` | قائمة منسدلة Autocomplete للبحث بالاسم/الهاتف/المعرف |
| بطاقات إحصائية | `collect.jsx` | محصلات اليوم والإجمالي |
| بنر تسليم العُهدة | `collect.jsx` | تنبيه بالمبالغ المعلقة + زر تسليم للمحاسب |
| إصلاح أخطاء 500 | `finance/views.py` | تصحيح استعلامات AgentProfile للمندوب |
