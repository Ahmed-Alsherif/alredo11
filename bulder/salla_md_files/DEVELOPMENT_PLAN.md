# Development Plan

## Scope

هذا الملف يقسّم المشروع إلى مراحل تطوير مع حالة التنفيذ لكل مرحلة.

الحالات:

- ✅ مكتمل — تم بناؤه واختباره.
- ⚠️ جزئي — تم بناء جزء منه ويحتاج تكملة.
- ❌ لم يبدأ — مخطط ولم يُنفذ بعد.

---

## المرحلة 1: الأساسيات والمصادقة

**الحالة: ✅ مكتمل**

| المهمة | الحالة | الملفات | المتطلبات |
|---|---|---|---|
| إعداد مشروع Django + DRF | ✅ | `config/settings.py`, `config/urls.py` | — |
| إنشاء User model مع أدوار | ✅ | `accounts/models.py` | STF-05 |
| JWT Authentication | ✅ | `config/urls.py` (SimpleJWT) | STF-05 |
| API تسجيل الدخول | ✅ | `accounts/views.py` | STF-05 |
| تسجيل ذاتي للمشتركين | ✅ | `accounts/views.py` (`register`) | SUB-01 |
| تغيير/إعادة تعيين كلمة المرور | ✅ | `accounts/views.py` | STF-07 |

---

## المرحلة 2: المناطق والمسارات

**الحالة: ✅ مكتمل**

| المهمة | الحالة | الملفات | المتطلبات |
|---|---|---|---|
| Zone CRUD | ✅ | `zones/models.py`, `zones/views.py` | OP-01 إلى OP-04 |
| Route CRUD مع أيام الجمع | ✅ | `zones/models.py`, `zones/views.py` | OP-07, OP-08 |
| ربط السائقين بالمسارات | ✅ | `zones/models.py` | OP-09 |
| تجميد المسارات (حالة) | ✅ | `zones/models.py` (`status=frozen`) | OP-10 |

---

## المرحلة 3: الموظفون وحسابات الدخول

**الحالة: ✅ مكتمل**

| المهمة | الحالة | الملفات | المتطلبات |
|---|---|---|---|
| EmployeeProfile | ✅ | `accounts/models.py` | STF-01 |
| DriverProfile + AgentProfile + AccountantProfile | ✅ | `accounts/models.py` | STF-01, OP-06 |
| EmployeeDocument (رفع وثائق) | ✅ | `accounts/models.py` | STF-03 |
| CRUD كامل للموظفين | ✅ | `accounts/views.py` | STF-01 إلى STF-04 |

---

## المرحلة 4: المشتركون والاشتراكات

**الحالة: ✅ مكتمل**

| المهمة | الحالة | الملفات | المتطلبات |
|---|---|---|---|
| Subscriber model مع GPS | ✅ | `subscribers/models.py` | SUB-01, SUB-05 |
| التصنيف اللوني التلقائي | ✅ | `subscribers/models.py` (`update_color_status`) | SUB-10 |
| SubscriptionPlan (باقات ديناميكية) | ✅ | `subscribers/models.py` | SUB-02 |
| SubscriptionLog (سجل تاريخي) | ✅ | `subscribers/models.py` | SUB-11 |
| إيقاف مؤقت + استئناف + تمديد | ✅ | `subscribers/models.py` | SUB-09 |
| أرشفة المشتركين | ✅ | `subscribers/models.py` | SUB-11 |
| توليد subscription_id فريد | ✅ | `subscribers/models.py` | SUB-07 |
| LatePaymentExcuse كجدول مستقل | ❌ | — | FIN-07 |

---

## المرحلة 5: التحصيل والمالية

**الحالة: ✅ مكتمل**

| المهمة | الحالة | الملفات | المتطلبات |
|---|---|---|---|
| Payment مع إيصال تلقائي | ✅ | `finance/models.py` | FIN-01, NOT-04 |
| تحديث لون المشترك عند الدفع | ✅ | `finance/models.py` (`Payment.save`) | FIN-01 |
| CollectionSettlement (تسليم العهدة) | ✅ | `finance/models.py` | FIN-02 |
| Expense (مصروفات) | ✅ | `finance/models.py` | FIN-03 |
| Advance (سلف) | ✅ | `finance/models.py` | FIN-06 |
| Penalty (جزاءات) | ✅ | `finance/models.py` | FIN-05 |
| StaffReward (مكافآت) | ✅ | `finance/models.py` | — |

ملاحظة: تكلفة التحفيز البيئي (FIN-04) متضمنة في جدول `Reward` ولا تحتاج جدول مستقل.

---

## المرحلة 6: التتبع الجغرافي

**الحالة: ✅ مكتمل**

| المهمة | الحالة | الملفات | المتطلبات |
|---|---|---|---|
| TruckLocation (مواقع الشاحنات) | ✅ | `tracking/models.py` | GEO-01, GEO-02 |
| CollectionVisit (زيارات الجمع) | ✅ | `tracking/models.py` | OP-13 |
| خريطة المشترك (تتبع الشاحنة) | ⚠️ | `(subscriber)/tracking.jsx` | GEO-03 |
| خريطة السائق (Pins المشتركين) | ⚠️ | `(driver)/map.jsx` | GEO-04, GEO-05 |

---

## المرحلة 7: الإشعارات

**الحالة: ⚠️ جزئي**

| المهمة | الحالة | الملفات | المتطلبات |
|---|---|---|---|
| Notification model | ✅ | `notifications/models.py` | NOT-05 |
| مركز الإشعارات | ✅ | `(subscriber)/notifications.jsx`, `(driver)/notifications.jsx`, `(agent)/notifications.jsx` | NOT-05 |
| إشعار إيصال الدفع | ⚠️ | منطق يدوي | NOT-04 |
| إشعار موعد الجمع | ❌ | — | NOT-01 |
| إشعار انتهاء الاشتراك | ❌ | — | NOT-03 |

---

## المرحلة 8: الشكاوى والجودة

**الحالة: ✅ مكتمل**

| المهمة | الحالة | الملفات | المتطلبات |
|---|---|---|---|
| Complaint (شكاوى) | ✅ | `complaints/models.py` | QC-01, QC-02 |
| FieldReport (بلاغات ميدانية) | ✅ | `complaints/models.py` | QC-03 |
| ServiceRating (تقييم شهري) | ✅ | `complaints/models.py` | QC-04 |

---

## المرحلة 9: إعادة التدوير

**الحالة: ✅ مكتمل**

| المهمة | الحالة | الملفات | المتطلبات |
|---|---|---|---|
| RecycleRequest | ✅ | `recycling/models.py` | REC-02, REC-03 |
| PointsTransaction | ✅ | `recycling/models.py` | REC-04 |
| Reward | ✅ | `recycling/models.py` | REC-05 |
| لوحة المتصدرين | ✅ | `recycling/views.py` | REC-05 |
| EnvironmentalImpactRecord | ❌ | — | REC-06 |

---

## المرحلة 10: التقارير والتصدير

**الحالة: ✅ مكتمل**

| المهمة | الحالة | الملفات | المتطلبات |
|---|---|---|---|
| لوحة المؤشرات الإحصائية | ✅ | `reports/views.py` | REP-01 |
| تقارير مالية شهرية | ✅ | `reports/views.py` | REP-03 |
| تقارير تشغيلية يومية | ✅ | `reports/views.py` | REP-02 |
| تقارير النمو | ✅ | `reports/views.py` | REP-04 |
| تصدير PDF/Excel/CSV | ✅ | `reports/views.py` | REP-05 |

---

## المرحلة 11: تطبيق الجوال

**الحالة: ✅ مكتمل**

| المهمة | الحالة | الملفات | المتطلبات |
|---|---|---|---|
| واجهة المشترك | ✅ | `(subscriber)/*.jsx` | — |
| واجهة السائق | ✅ | `(driver)/*.jsx` | — |
| واجهة المندوب | ✅ | `(agent)/*.jsx` | — |
| تسجيل الدخول | ✅ | `login.jsx` | STF-05 |

---

## المرحلة 12: لوحة الإدارة (Dashboard)

**الحالة: ⚠️ جزئي — مبني بـ Vite + React، والهدف هو Next.js + TypeScript + Tailwind CSS**

| المهمة | الحالة | الملفات | المتطلبات |
|---|---|---|---|
| تسجيل الدخول | ✅ | `Login.jsx` | STF-05 |
| لوحة المؤشرات | ✅ | `Dashboard.jsx` | REP-01 |
| المناطق | ✅ | `Zones.jsx` | OP-01 إلى OP-04 |
| المسارات | ✅ | `Routes.jsx` | OP-07 إلى OP-10 |
| الموظفون | ✅ | `Staff.jsx` | STF-01 إلى STF-07 |
| المشتركون | ✅ | `Subscribers.jsx` | SUB-06, SUB-08 |
| الشكاوى | ✅ | `Complaints.jsx` | QC-02 |
| المالية | ✅ | `Finance.jsx` | FIN-01 إلى FIN-06 |
| تسليم العهدة | ✅ | `Settlements.jsx` | FIN-02 |
| التتبع | ✅ | `Tracking.jsx` | GEO-02 |
| إعادة التدوير | ✅ | `Recycling.jsx` | REC-01 إلى REC-06 |
| الإشعارات | ✅ | `Notifications.jsx` | NOT-05 |
| التقارير | ✅ | `Reports.jsx` | REP-01 إلى REP-05 |
| محرر خريطة الحدود | ❌ | — | OP-01, OP-02 |
| لوحة جودة مستقلة | ❌ | — | QC-02, QC-03, QC-04 |

---

## المهام المتبقية (ملخص)

| المهمة | الأولوية | المرحلة |
|---|---|---|
| ⬆️ إشعارات موعد الجمع (NOT-01) | عالية | 7 |
| ⬆️ إشعار انتهاء الاشتراك (NOT-03) | عالية | 7 |
| إعادة بناء Dashboard بـ Next.js + TS + Tailwind | عالية | 12 |
| محرر خريطة الحدود | متوسطة | 12 |
| LatePaymentExcuse كجدول مستقل | متوسطة | 4 |
| EnvironmentalImpactRecord | متوسطة | 9 |
