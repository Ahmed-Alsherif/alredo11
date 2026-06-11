# API Contract — نظام اللحمدين لإدارة النفايات

> آخر تحديث: 2026-06-10
> Base URL: `/api/`
> Authentication: JWT via `/api/auth/login/` — Header: `Authorization: Bearer <access>`

---

## الأدوار والصلاحيات (Roles & Permissions)

| الدور | الوصف | الوصول |
|---|---|---|
| `admin` | المدير العام | وصول كامل لجميع الموارد والعمليات |
| `accountant` | المحاسب | المالية، التقارير المالية، مطابقة العُهد |
| `driver` | السائق | مساره اليومي، تتبع الموقع، زيارات الجمع، البلاغات الميدانية، تأكيد التدوير |
| `agent` | المندوب | تسجيل المشتركين (مع GPS وباقة ديناميكية)، تحصيل الاشتراكات، تسليم العُهدة النقدية، قائمة المتأخرين وفلترتهم (ضمن منطقته) |
| `subscriber` | المشترك | ملفه الشخصي، اشتراكه، الشكاوى، التدوير، الإشعارات، تتبع الشاحنة |

---

## 1. المصادقة وإدارة المستخدمين (Auth & Users)

| Method | Endpoint | الأدوار | Request Body | Response |
|---|---|---|---|---|
| POST | `/auth/login/` | عام | `{ username, password }` | `{ access, refresh }` |
| POST | `/auth/refresh/` | عام | `{ refresh }` | `{ access }` |
| GET | `/users/me/` | مسجّل دخول | — | بيانات المستخدم + حقول البروفايل حسب الدور |
| POST | `/users/register/` | عام | حقول المشترك (الاسم، الهاتف، البريد، كلمة المرور) | حساب مشترك جديد |
| GET | `/users/staff/` | الطاقم (staff) | `?search=` | قائمة الموظفين |
| GET | `/users/drivers/` | الطاقم | — | قائمة السائقين |
| GET | `/users/agents/` | الطاقم | — | قائمة المناديب |
| POST | `/users/change_password/` | مسجّل دخول | `{ old_password, new_password }` | `{ status }` |
| POST | `/users/{id}/reset_password/` | المدير فقط | `{ new_password }` | `{ status }` |
| CRUD | `/employee-documents/` | المدير | حقول الوثيقة | وثيقة الموظف |

---

## 2. المناطق والمسارات (Zones & Routes)

| Method | Endpoint | الأدوار | Request Body | Response |
|---|---|---|---|---|
| GET | `/zones/` | الطاقم | — | قائمة المناطق (مع عدد المشتركين والسائقين) |
| POST | `/zones/` | المدير | `{ name, status, boundaries }` | منطقة جديدة |
| PUT | `/zones/{id}/` | المدير | حقول المنطقة | تحديث المنطقة |
| DELETE | `/zones/{id}/` | المدير | — | حذف المنطقة |
| GET | `/routes/` | الطاقم | — | قائمة المسارات |
| POST | `/routes/` | المدير | `{ zone, driver, collection_days, status }` | مسار جديد |
| PUT | `/routes/{id}/` | المدير | حقول المسار | تحديث المسار |
| DELETE | `/routes/{id}/` | المدير | — | حذف المسار |

---

## 3. المشتركون والباقات (Subscribers & Plans)

| Method | Endpoint | الأدوار | Request Body / Params | Response |
|---|---|---|---|---|
| GET | `/subscribers/` | مسجّل دخول | `?zone=&color=&paused=&archived=&search=` | قائمة مشتركين (محدودة حسب الدور) — المندوب يرى فقط مشتركي منطقته |
| POST | `/subscribers/` | مسجّل دخول | `{ first_name, last_name, phone, latitude, longitude, plan, zone }` | مشترك جديد + يُستدعى `update_color_status()` تلقائياً |
| POST | `/subscribers/register_with_gps/` | مسجّل دخول | نفس الإنشاء | مشترك جديد + تحقق GPS من التغطية |
| GET | `/subscribers/debtors/` | الطاقم | — | المشتركون المتأخرون (أصفر/أحمر) |
| GET | `/subscribers/daily_list/` | السائق | — | `{ day, date, visits, subscribers }` |
| POST | `/subscribers/{id}/pause/` | صاحب الحساب / المدير | `{ reason }` | `{ status: "paused" }` |
| POST | `/subscribers/{id}/resume/` | صاحب الحساب / المدير | — | `{ status: "resumed" }` |
| POST | `/subscribers/{id}/archive/` | المدير | `{ reason }` | `{ status: "archived" }` |
| POST | `/subscribers/change_plan/` | المشترك | `{ plan_id }` | بيانات الباقة الجديدة |
| POST | `/subscribers/{id}/set_excuse/` | صاحب الحساب / المدير | `{ excuse }` | `{ status }` |
| CRUD | `/plans/` | مسجّل دخول (الكتابة للطاقم) | `{ name, duration_months, price }` | باقة اشتراك |
| GET | `/logs/` | مسجّل دخول | `?subscriber={id}` | سجل اشتراكات المشترك التاريخي |

---

## 4. زيارات الجمع والتتبع (Collection & Tracking)

| Method | Endpoint | الأدوار | Request Body | Response |
|---|---|---|---|---|
| GET | `/collection-visits/` | مسجّل دخول | — | زيارات الجمع (حسب الدور) |
| POST | `/collection-visits/{id}/mark_status/` | السائق المُعيَّن | `{ status, note? }` | زيارة محدّثة |
| GET | `/tracking/live/` | مسجّل دخول | — | آخر مواقع الشاحنات |
| POST | `/tracking/update_location/` | السائق | `{ latitude, longitude }` | موقع مسجّل |

---

## 5. الشؤون المالية (Finance)

> ملاحظة: تتوفر أسماء بديلة (Aliases) للتوافق مع الواجهة الحالية: `/finance/payments/`, `/finance/expenses/`, `/finance/advances/`

| Method | Endpoint | الأدوار | Request Body | Response |
|---|---|---|---|---|
| GET | `/payments/` | مسجّل دخول | — | التحصيلات (حسب الدور — المندوب يرى فقط تحصيلاته) |
| POST | `/payments/` | المدير/المحاسب/المندوب | `{ subscriber, amount }` | تحصيل جديد بإيصال + تحديث `color_status` + إشعار |
| GET | `/finance/payments/reconcile/` | المدير/المحاسب | — | ملخص العُهد حسب المندوب |
| POST | `/finance/payments/{id}/mark_deposited/` | المدير/المحاسب | — | `{ status: "deposited" }` |
| GET | `/finance/settlements/` | المندوب/المدير/المحاسب | — | قائمة محاضر تسليم العُهد |
| POST | `/finance/settlements/` | المندوب | `{ payment_ids[] }` | إنشاء محضر تسليم عُهدة بحالة `pending` |
| POST | `/finance/settlements/{id}/approve/` | المحاسب/المدير | — | اعتماد محضر العُهدة |
| POST | `/finance/settlements/{id}/reject/` | المحاسب/المدير | `{ note }` | رفض محضر العُهدة |
| CRUD | `/expenses/` | المدير/المحاسب (كتابة)، الطاقم (قراءة) | `{ description, amount, category }` | مصروف |
| CRUD | `/finance/advances/` | المدير/المحاسب | `{ employee, amount, note }` | سلفة |
| POST | `/finance/advances/{id}/mark_paid/` | المدير/المحاسب | — | `{ status: "paid" }` |
| CRUD | `/finance/penalties/` | المدير/المحاسب | `{ employee, reason, amount }` | جزاء |
| CRUD | `/finance/staff-rewards/` | المدير/المحاسب | `{ employee, reason, amount }` | مكافأة |

---

## 6. الشكاوى والتقييمات (Complaints & Quality)

| Method | Endpoint | الأدوار | Request Body | Response |
|---|---|---|---|---|
| CRUD | `/complaints/` | مسجّل دخول (محدود حسب الدور) | `{ type, description, image? }` | شكوى |
| CRUD | `/field-reports/` | مسجّل دخول (محدود حسب الدور) | `{ subscriber?, issue_type, note, image? }` | بلاغ ميداني |
| CRUD | `/ratings/` | مسجّل دخول (محدود حسب الدور) | `{ month, rating, comment? }` | تقييم |
| POST | `/complaints/ratings/` | المشترك | نفس التقييم | تقييم (Alias للتطبيق) |

---

## 7. إعادة التدوير (Recycling)

> ملاحظة: تتوفر أسماء بديلة: `/recycling/`, `/recycling/stats/`, `/recycling/leaderboard/`

| Method | Endpoint | الأدوار | Request Body | Response |
|---|---|---|---|---|
| CRUD | `/recycle-requests/` | مسجّل دخول (محدود حسب الدور) | `{ category, bags_count }` | طلب تدوير |
| POST | `/recycling/{id}/confirm/` | السائق | — | `{ status, points_added }` |
| GET | `/recycling/stats/` | مسجّل دخول | — | إحصائيات التدوير |
| GET | `/points/` | مسجّل دخول (محدود حسب الدور) | — | سجل النقاط |
| GET | `/points/leaderboard/` | مسجّل دخول | — | لوحة المتصدرين |
| CRUD | `/rewards/` | الطاقم | حقول المكافأة | مكافأة |
| POST | `/rewards/draw/` | المدير | — | فائز السحب + مكافأة + مصروف تسويق |

---

## 8. الإشعارات (Notifications)

| Method | Endpoint | الأدوار | Request Body | Response |
|---|---|---|---|---|
| GET | `/notifications/` | مسجّل دخول | — | إشعارات المستخدم |
| POST | `/notifications/{id}/mark_read/` | صاحب الإشعار | — | `{ status }` |
| POST | `/notifications/{id}/read/` | صاحب الإشعار | — | `{ status }` (Alias) |
| POST | `/notifications/mark_all_read/` | مسجّل دخول | — | `{ status }` |

---

## 9. التقارير (Reports)

| Method | Endpoint | الأدوار | Params | Response |
|---|---|---|---|---|
| GET | `/reports/dashboard/` | مسجّل دخول | — | مؤشرات الأداء الرئيسية (KPIs) |
| GET | `/reports/financial/` | المدير/المحاسب | — | الإيرادات والمصروفات والديون الشهرية |
| GET | `/reports/operational/` | مسجّل دخول | — | إحصائيات الإنجاز اليومي والمناطق |
| GET | `/reports/growth/` | مسجّل دخول | — | معدل النمو الشهري |
| GET | `/reports/export/` | المدير/المحاسب | `?type=financial&format=pdf|xlsx|csv` | ملف تقرير مُصدَّر |

---

## ملاحظات فنية

1. **JWT Authentication:** يستخدم مكتبة `djangorestframework-simplejwt`. التوكن في Header: `Authorization: Bearer <access_token>`.
2. **RBAC Enforcement:** كل Endpoint محمي بالأدوار. المستخدم يرى فقط البيانات التابعة لدوره ومنطقته.
3. **Aliases:** بعض الـ Endpoints لها أسماء بديلة (`/finance/payments/` = `/payments/`) لضمان التوافق مع واجهات مختلفة (Dashboard vs Mobile).
4. **Pagination:** القوائم تدعم التقسيم إلى صفحات (`?page=1&page_size=20`).
5. **Filtering:** المشتركون يدعمون الفلترة بـ `zone`, `color`, `paused`, `archived`, `search`.
6. **Auto Color Status:** عند إنشاء مشترك جديد أو عند الدفع، يُحدث النظام حالة اللون (`color_status`) تلقائياً عبر `update_color_status()`. المشتركون الجدد يبدؤون بحالة أحمر (مستحق الدفع).
7. **Custody Workflow:** المندوب يحصّل → يُسلم العُهدة عبر محضر تسليم (`CollectionSettlement`) → المحاسب يعتمد المحضر.
