# API Specification

## Scope

هذا الملف يوثّق واجهات الـ API المبنية على النظام الحالي مع الإضافات المخططة.
الـ Endpoints المخططة مميزة بعلامة `[مخطط]`.

## المصادقة

- المصادقة عبر JWT (`djangorestframework-simplejwt`).
- تسجيل الدخول يعيد `access` token و `refresh` token.
- كل طلب يحتاج `Authorization: Bearer <access_token>` في الـ Header.
- لا توجد شاشة اختيار دور — التوجيه تلقائي بناءً على `user.role`.

### رموز الصلاحيات

- Public: بدون token.
- Authenticated: أي مستخدم مسجل.
- Admin: أدمن فقط.
- Staff: أي موظف (غير مشترك).
- Subscriber: مشترك فقط.
- Driver: سائق فقط.
- Agent: مندوب فقط.
- Accountant: محاسب فقط.

## 1. المصادقة والحسابات

| Endpoint | Method | الوصف | الصلاحية | المتطلبات |
|---|---|---|---|---|
| `/api/auth/login/` | POST | تسجيل الدخول — يعيد `access`, `refresh`, `role` | Public | STF-05 |
| `/api/auth/refresh/` | POST | تجديد الـ access token | Public | STF-05 |
| `/api/users/register/` | POST | التسجيل الذاتي للمشتركين | Public | SUB-01, STF-05 |
| `/api/users/me/` | GET | بيانات المستخدم الحالي مع profile_zone | Authenticated | STF-06 |
| `/api/users/` | GET | قائمة المستخدمين | Staff | STF-02 |
| `/api/users/` | POST | إنشاء مستخدم جديد (موظف) | Admin | STF-01, STF-06 |
| `/api/users/{id}/` | GET | تفاصيل مستخدم | Staff | STF-02 |
| `/api/users/{id}/` | PATCH | تحديث مستخدم | Admin | STF-03 |
| `/api/users/{id}/` | DELETE | حذف مستخدم | Admin | STF-04 |
| `/api/users/staff/` | GET | قائمة الموظفين فقط (مع بحث) | Staff | STF-02 |
| `/api/users/drivers/` | GET | قائمة السائقين | Staff | STF-02 |
| `/api/users/agents/` | GET | قائمة المندوبين | Staff | STF-02 |
| `/api/users/{id}/reset_password/` | POST | إعادة تعيين كلمة مرور موظف | Admin | STF-07 |
| `/api/users/change_password/` | POST | تغيير كلمة المرور (الحساب الشخصي) | Authenticated | STF-07 |
| `/api/employee-documents/` | GET/POST | قائمة/رفع وثائق الموظفين | Admin | STF-01, STF-03 |
| `/api/employee-documents/{id}/` | GET/PATCH/DELETE | تفاصيل/تحديث/حذف وثيقة | Admin | STF-03 |

## 2. المناطق والمسارات

| Endpoint | Method | الوصف | الصلاحية | المتطلبات |
|---|---|---|---|---|
| `/api/zones/` | GET | قائمة المناطق مع subscribers_count, drivers_count, agents_count | Staff | OP-04 |
| `/api/zones/` | POST | إنشاء منطقة جديدة | Admin | OP-01 |
| `/api/zones/{id}/` | GET | تفاصيل منطقة | Staff | OP-04 |
| `/api/zones/{id}/` | PATCH | تحديث منطقة (اسم، حدود، حالة) | Admin | OP-02 |
| `/api/zones/{id}/` | DELETE | حذف منطقة | Admin | OP-03 |
| `/api/routes/` | GET | قائمة المسارات (فلترة بـ zone, driver, status) | Authenticated | OP-09 |
| `/api/routes/` | POST | إنشاء مسار جديد | Admin | OP-07 |
| `/api/routes/{id}/` | PATCH | تحديث مسار (أيام، سائق، حالة) | Admin | OP-08 |
| `/api/routes/{id}/` | DELETE | حذف مسار | Admin | OP-08 |


## 3. المشتركون والاشتراكات

| Endpoint | Method | الوصف | الصلاحية | المتطلبات |
|---|---|---|---|---|
| `/api/subscribers/` | GET | قائمة المشتركين (فلترة بـ zone, color_status, search) | Agent/Admin | SUB-06 |
| `/api/subscribers/` | POST | إنشاء مشترك جديد (ميداني بواسطة المندوب) | Agent/Admin | SUB-01, SUB-04, SUB-07 |
| `/api/subscribers/{id}/` | GET | تفاصيل مشترك كاملة | Owner/Agent/Admin | SUB-03, SUB-06 |
| `/api/subscribers/{id}/` | PATCH | تحديث بيانات مشترك | Owner/Agent/Admin | SUB-08 |
| `/api/subscribers/{id}/` | DELETE | حذف مشترك | Admin | SUB-11 |
| `/api/plans/` | GET | قائمة خطط الاشتراك المتاحة | Public | SUB-02 |
| `/api/plans/` | POST | إنشاء خطة اشتراك | Admin | SUB-02 |
| `/api/plans/{id}/` | PATCH | تحديث خطة اشتراك | Admin | SUB-02 |
| `/api/logs/` | GET | سجل الاشتراكات التاريخي | Agent/Admin | SUB-11 |

## 4. التتبع الجغرافي

| Endpoint | Method | الوصف | الصلاحية | المتطلبات |
|---|---|---|---|---|
| `/api/tracking/` | GET | آخر مواقع الشاحنات | Staff | GEO-02 |
| `/api/tracking/` | POST | تحديث موقع الشاحنة (من تطبيق السائق) | Driver | GEO-01 |
| `/api/collection-visits/` | GET | زيارات الجمع اليومية | Staff | OP-13 |
| `/api/collection-visits/` | POST | إنشاء زيارة جمع | Driver/Admin | OP-13 |
| `/api/collection-visits/{id}/` | PATCH | تحديث حالة الزيارة (collected/skipped/issue) | Driver/Admin | OP-13 |
| [مخطط] `/api/driver/today-subscribers/` | GET | قائمة مشتركي اليوم للسائق | Driver | OP-13, GEO-04 |
| [مخطط] `/api/subscriber/truck-tracking/` | GET | موقع الشاحنة للمشترك عند الاقتراب | Subscriber | GEO-03 |

## 5. الإشعارات

| Endpoint | Method | الوصف | الصلاحية | المتطلبات |
|---|---|---|---|---|
| `/api/notifications/` | GET | قائمة إشعارات المستخدم الحالي | Authenticated | NOT-05 |
| `/api/notifications/{id}/` | GET | تفاصيل إشعار | Owner | NOT-05 |
| `/api/notifications/{id}/` | PATCH | تحديث حالة القراءة | Owner | NOT-05 |
| [مخطط] `/api/notifications/collection-reminders/generate/` | POST | إنشاء إشعارات موعد الجمع | Admin | NOT-01 |
| [مخطط] `/api/notifications/subscription-expiry/generate/` | POST | إنشاء تنبيهات انتهاء الاشتراك | Admin | NOT-03 |

## 6. الشكاوى والجودة

| Endpoint | Method | الوصف | الصلاحية | المتطلبات |
|---|---|---|---|---|
| `/api/complaints/` | GET | قائمة الشكاوى | Subscriber(own)/Admin | QC-02 |
| `/api/complaints/` | POST | تقديم شكوى جديدة (مع صورة اختيارية) | Subscriber | QC-01 |
| `/api/complaints/{id}/` | GET | تفاصيل شكوى | Owner/Admin | QC-02 |
| `/api/complaints/{id}/` | PATCH | تحديث حالة الشكوى | Admin | QC-02 |
| `/api/field-reports/` | GET | قائمة البلاغات الميدانية | Staff | QC-03 |
| `/api/field-reports/` | POST | إرسال بلاغ ميداني مصور | Driver | QC-03, NOT-02 |
| `/api/ratings/` | GET | قائمة التقييمات | Staff | QC-04 |
| `/api/ratings/` | POST | تقييم شهري للخدمة | Subscriber | QC-04 |
| `/api/complaints/ratings/` | GET/POST | Alias لـ `/api/ratings/` | — | QC-04 |

## 7. إعادة التدوير

| Endpoint | Method | الوصف | الصلاحية | المتطلبات |
|---|---|---|---|---|
| `/api/recycling/` | GET | قائمة طلبات إعادة التدوير | Subscriber(own)/Driver/Admin | REC-02 |
| `/api/recycling/` | POST | طلب جمع إعادة تدوير (category, bags_count) | Subscriber | REC-02 |
| `/api/recycling/{id}/` | GET | تفاصيل طلب | Owner/Driver/Admin | REC-02 |
| `/api/recycling/{id}/confirm/` | POST | تأكيد استلام الأكياس → منح النقاط | Driver | REC-03, REC-04 |
| `/api/recycling/stats/` | GET | إحصائيات إعادة التدوير للمشترك | Subscriber | REC-06 |
| `/api/recycling/leaderboard/` | GET | لوحة المتصدرين | Subscriber | REC-05 |
| `/api/recycle-requests/` | GET/POST | CRUD لطلبات إعادة التدوير | Authenticated | REC-02 |
| `/api/points/` | GET | حركات النقاط | Subscriber(own)/Admin | REC-04 |
| `/api/rewards/` | GET | مكافآت إعادة التدوير | Subscriber(own)/Admin | REC-05 |

## 8. الشؤون المالية

| Endpoint | Method | الوصف | الصلاحية | المتطلبات |
|---|---|---|---|---|
| `/api/finance/payments/` | GET | قائمة المدفوعات (فلترة بـ agent, subscriber, date) | Agent(own)/Accountant/Admin | FIN-01 |
| `/api/finance/payments/` | POST | تسجيل دفعة جديدة (تحصيل ميداني) | Agent | FIN-01, NOT-04 |
| `/api/finance/payments/{id}/` | GET | تفاصيل دفعة مع receipt_number | Agent/Accountant/Admin | FIN-01 |
| `/api/finance/settlements/` | GET | قائمة محاضر تسليم العهدة | Agent(own)/Accountant/Admin | FIN-02 |
| `/api/finance/settlements/` | POST | إنشاء محضر تسليم عهدة | Agent | FIN-02 |
| `/api/finance/settlements/{id}/` | PATCH | تحديث حالة محضر (approve/reject) | Accountant/Admin | FIN-02 |
| `/api/finance/expenses/` | GET | قائمة المصروفات | Accountant/Admin | FIN-03 |
| `/api/finance/expenses/` | POST | تسجيل مصروف | Accountant/Admin | FIN-03 |
| `/api/finance/penalties/` | GET/POST | جزاءات الموظفين | Accountant/Admin | FIN-05 |
| `/api/finance/advances/` | GET/POST | سلف الموظفين | Accountant/Admin | FIN-06 |
| `/api/finance/advances/{id}/` | PATCH | تحديث سلفة (status, remaining) | Accountant/Admin | FIN-06 |
| `/api/finance/staff-rewards/` | GET/POST | مكافآت الموظفين | Accountant/Admin | — |


## 9. التقارير

| Endpoint | Method | الوصف | الصلاحية | المتطلبات |
|---|---|---|---|---|
| `/api/reports/dashboard/` | GET | مؤشرات: مناطق، مشتركين، موظفين، شكاوى، إيرادات، مصروفات، ألوان | Accountant/Admin | REP-01 |
| `/api/reports/financial/` | GET | إيرادات ومصروفات شهرية + مدينين | Accountant/Admin | REP-03 |
| `/api/reports/operational/` | GET | نسبة إنجاز يومي + إحصائيات المناطق | Admin | REP-02 |
| `/api/reports/growth/` | GET | مشتركين جدد شهرياً مع إجمالي تراكمي | Admin | REP-04 |
| `/api/reports/export/` | GET | تصدير تقرير (PDF/Excel/CSV) — query: type, format | Accountant/Admin | REP-05 |

## ملخص تغطية المتطلبات

| التصنيف | المتطلبات المغطاة |
|---|---|
| OP | OP-01 إلى OP-14 |
| GEO | GEO-01 إلى GEO-05 |
| NOT | NOT-01 إلى NOT-05 |
| SUB | SUB-01 إلى SUB-12 |
| STF | STF-01 إلى STF-07 |
| QC | QC-01 إلى QC-04 |
| REP | REP-01 إلى REP-05 |
| REC | REC-01 إلى REC-06 |
| FIN | FIN-01 إلى FIN-07 |
