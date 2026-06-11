# تصميم قاعدة البيانات

## المرجعية

هذا التصميم مبني على النماذج المنفذة فعلياً في المشروع مع إضافة الجداول والحقول المخطط لها.
الجداول المخطط لها مميزة بعلامة `[مخطط]`.
أسماء الجداول والحقول تطابق أسماء النماذج في Django.

## قواعد التصميم

- كل جدول يخدم متطلباً وظيفياً واحداً أو أكثر.
- العلاقات بين الجداول تستخدم `ForeignKey` مع `on_delete` مناسب.
- الحقول الجغرافية تُحفظ كـ `FloatField` (lat/lng) أو `JSONField` (boundaries).
- الملفات والصور تُحفظ في `MEDIA_ROOT` عبر `FileField/ImageField`.
- التواريخ التلقائية تستخدم `auto_now_add=True` و `auto_now=True`.

---

## وحدة الحسابات والمصادقة (`accounts`)

### User

الغرض: حسابات الدخول لجميع الفئات.

| الحقل | النوع | القيود | الوصف |
|---|---|---|---|
| id | BigAutoField | PK | المعرف |
| username | CharField(150) | unique | اسم المستخدم |
| email | EmailField | unique | البريد الإلكتروني |
| password | hash | — | كلمة المرور (مشفرة) |
| role | CharField(20) | choices: admin, accountant, driver, agent, subscriber | الدور |
| is_active | BooleanField | default=True | نشط |
| is_staff | BooleanField | default=False | صلاحية الدخول للـ Admin |
| date_joined | DateTimeField | auto_now_add | تاريخ الإنشاء |

ملاحظات: يرث من `AbstractBaseUser` + `PermissionsMixin`. خصائص محسوبة: `profile`, `display_name`, `profile_zone`, `profile_phone`.

المتطلبات: STF-05, STF-06, STF-07.

### EmployeeProfile

الغرض: البيانات المشتركة لجميع الموظفين (طبقة وسطى).

| الحقل | النوع | القيود | الوصف |
|---|---|---|---|
| id | BigAutoField | PK | المعرف |
| user_id | FK → User | OneToOne, CASCADE | حساب المستخدم |
| first_name | CharField(100) | required | الاسم الأول |
| last_name | CharField(100) | blank | اسم العائلة |
| phone | CharField(15) | blank | رقم الهاتف |
| is_active | BooleanField | default=True | نشط |

المتطلبات: STF-01, STF-02, STF-03, STF-04.

### DriverProfile

الغرض: البيانات الخاصة بالسائق.

| الحقل | النوع | القيود | الوصف |
|---|---|---|---|
| id | BigAutoField | PK | المعرف |
| employee_id | FK → EmployeeProfile | OneToOne, CASCADE | الموظف |
| zone_id | FK → Zone | SET_NULL, nullable | المنطقة المسؤول عنها |
| license_number | CharField(30) | blank | رقم رخصة القيادة |
| truck_number | CharField(20) | blank | رقم الشاحنة |

المتطلبات: OP-06, OP-09.

### AgentProfile

الغرض: البيانات الخاصة بالمندوب.

| الحقل | النوع | القيود | الوصف |
|---|---|---|---|
| id | BigAutoField | PK | المعرف |
| employee_id | FK → EmployeeProfile | OneToOne, CASCADE | الموظف |
| zone_id | FK → Zone | SET_NULL, nullable | المنطقة المسؤول عنها |
| custody_amount | DecimalField(10,2) | default=0 | رصيد العهدة الحالي |

المتطلبات: OP-06, OP-14, FIN-01.

### AccountantProfile

الغرض: البيانات الخاصة بالمحاسب (جاهز لحقول مستقبلية).

| الحقل | النوع | القيود | الوصف |
|---|---|---|---|
| id | BigAutoField | PK | المعرف |
| employee_id | FK → EmployeeProfile | OneToOne, CASCADE | الموظف |

المتطلبات: FIN-02.

### EmployeeDocument

الغرض: أرشفة وثائق الموظفين الرقمية.

| الحقل | النوع | القيود | الوصف |
|---|---|---|---|
| id | BigAutoField | PK | المعرف |
| employee_id | FK → EmployeeProfile | CASCADE | الموظف |
| document_type | CharField(30) | choices: national_id, driver_license, contract, other | نوع الوثيقة |
| title | CharField(120) | required | عنوان الوثيقة |
| file | FileField | upload_to='employee_documents/' | ملف الوثيقة |
| notes | TextField | blank | ملاحظات |
| expires_at | DateField | nullable | تاريخ انتهاء الصلاحية |
| created_at | DateTimeField | auto_now_add | تاريخ الرفع |

المتطلبات: STF-01, STF-03.

---

## وحدة المناطق والمسارات (`zones`)

### Zone

الغرض: المناطق الجغرافية وحدود الخدمة.

| الحقل | النوع | القيود | الوصف |
|---|---|---|---|
| id | BigAutoField | PK | المعرف |
| name | CharField(100) | unique | اسم المنطقة |
| status | CharField(10) | choices: active, inactive | الحالة |
| boundaries | JSONField | default=[] | حدود المنطقة كقائمة إحداثيات |
| created_at | DateTimeField | auto_now_add | تاريخ الإنشاء |
| updated_at | DateTimeField | auto_now | تاريخ التحديث |

خصائص محسوبة: `subscribers_count`, `drivers_count`, `agents_count`.

المتطلبات: OP-01, OP-02, OP-03, OP-04, SUB-05.

### Route

الغرض: قوالب مسارات الجمع وأيام العمل.

| الحقل | النوع | القيود | الوصف |
|---|---|---|---|
| id | BigAutoField | PK | المعرف |
| zone_id | FK → Zone | CASCADE | المنطقة |
| collection_days | JSONField | default=[] | أيام الجمع مثل ["السبت", "الثلاثاء"] |
| driver_id | FK → DriverProfile | SET_NULL, nullable | السائق المسؤول |
| boundaries | JSONField | default=[] | حدود المسار |
| status | CharField(10) | choices: active, frozen | الحالة |
| created_at | DateTimeField | auto_now_add | تاريخ الإنشاء |

المتطلبات: OP-07, OP-08, OP-09, OP-10, OP-12.


---


## وحدة المشتركين والاشتراكات (`subscribers`)

### SubscriptionPlan

الغرض: خطط الاشتراك المتاحة.

| الحقل | النوع | القيود | الوصف |
|---|---|---|---|
| id | BigAutoField | PK | المعرف |
| name | CharField(50) | required | اسم الباقة |
| duration_months | IntegerField | required | مدة الاشتراك بالأشهر |
| bins_count | IntegerField | default=1 | عدد السلال |
| price | DecimalField(8,2) | required | سعر الباقة |

المتطلبات: SUB-02.

### Subscriber

الغرض: بيانات المشتركين وموقعهم وحالتهم.

| الحقل | النوع | القيود | الوصف |
|---|---|---|---|
| id | BigAutoField | PK | المعرف |
| user_id | FK → User | OneToOne, CASCADE | حساب المستخدم |
| first_name | CharField(100) | required | الاسم الأول |
| last_name | CharField(100) | blank | اسم العائلة |
| phone | CharField(15) | blank | رقم الهاتف |
| subscription_id | CharField(20) | unique, auto-generated | رقم الاشتراك (SUB-XXXX) |
| zone_id | FK → Zone | SET_NULL, nullable | المنطقة |
| route_id | FK → Route | SET_NULL, nullable | المسار |
| plan_id | FK → SubscriptionPlan | SET_NULL, nullable | الباقة الحالية |
| color_status | CharField(10) | choices: green, yellow, red | التصنيف اللوني |
| latitude | FloatField | nullable | خط العرض |
| longitude | FloatField | nullable | خط الطول |
| address | CharField(255) | blank | العنوان |
| subscription_start | DateField | auto_now_add | بداية الاشتراك |
| subscription_end | DateField | nullable | نهاية الاشتراك |
| is_paused | BooleanField | default=False | إيقاف مؤقت |
| paused_at | DateField | nullable | تاريخ الإيقاف |
| excuse | TextField | blank | عذر التأخر |
| archived_at | DateTimeField | nullable | تاريخ الأرشفة |
| archive_reason | CharField(255) | blank | سبب الأرشفة |
| created_at | DateTimeField | auto_now_add | تاريخ الإنشاء |

دوال مهمة: `update_color_status()`, `pause()`, `resume()`, `archive()`.

المتطلبات: SUB-01, SUB-03 إلى SUB-12, OP-11, OP-12.

### SubscriptionLog

الغرض: سجل تاريخي لكل اشتراك/تجديد/تغيير باقة.

| الحقل | النوع | القيود | الوصف |
|---|---|---|---|
| id | BigAutoField | PK | المعرف |
| subscriber_id | FK → Subscriber | CASCADE | المشترك |
| plan_id | FK → SubscriptionPlan | SET_NULL, nullable | الباقة |
| payment_id | FK → Payment | SET_NULL, nullable | الدفعة المرتبطة |
| start_date | DateField | required | بداية الفترة |
| end_date | DateField | required | نهاية الفترة |
| created_at | DateTimeField | auto_now_add | تاريخ الإنشاء |

المتطلبات: SUB-02, SUB-11.

### [مخطط] LatePaymentExcuse

الغرض: توثيق أعذار المتأخرين عن السداد كسجلات مستقلة (بدلاً من حقل `excuse` في `Subscriber`).

| الحقل | النوع | القيود | الوصف |
|---|---|---|---|
| id | BigAutoField | PK | المعرف |
| subscriber_id | FK → Subscriber | CASCADE | المشترك |
| excuse_text | TextField | required | نص العذر |
| recorded_by_id | FK → User | SET_NULL | المسجّل (مندوب/محاسب) |
| created_at | DateTimeField | auto_now_add | تاريخ التسجيل |

المتطلبات: SUB-10, FIN-07.

---

## وحدة التتبع الجغرافي (`tracking`)

### TruckLocation

الغرض: تحديثات موقع الشاحنة لحظياً.

| الحقل | النوع | القيود | الوصف |
|---|---|---|---|
| id | BigAutoField | PK | المعرف |
| driver_id | FK → DriverProfile | CASCADE | السائق |
| latitude | FloatField | required | خط العرض |
| longitude | FloatField | required | خط الطول |
| timestamp | DateTimeField | auto_now_add | وقت التسجيل |

المتطلبات: GEO-01, GEO-02, GEO-03.

### CollectionVisit

الغرض: زيارات الجمع اليومية — ربط المسار بالمشتركين والسائق.

| الحقل | النوع | القيود | الوصف |
|---|---|---|---|
| id | BigAutoField | PK | المعرف |
| route_id | FK → Route | CASCADE | المسار |
| driver_id | FK → DriverProfile | CASCADE | السائق |
| subscriber_id | FK → Subscriber | CASCADE | المشترك |
| visit_date | DateField | required | تاريخ الزيارة |
| status | CharField(15) | choices: pending, collected, skipped, issue | الحالة |
| note | TextField | blank | ملاحظات |
| completed_at | DateTimeField | nullable | وقت الإنجاز |
| created_at | DateTimeField | auto_now_add | تاريخ الإنشاء |

قيد: `unique_together = ['route', 'subscriber', 'visit_date']`.

المتطلبات: OP-13, GEO-04, GEO-05, REP-02.

---

## وحدة الإشعارات (`notifications`)

### Notification

الغرض: مركز الإشعارات الداخلي.

| الحقل | النوع | القيود | الوصف |
|---|---|---|---|
| id | BigAutoField | PK | المعرف |
| recipient_id | FK → User | CASCADE | المستلم |
| type | CharField(15) | choices: truck, payment, complaint, recycle, system | النوع |
| title | CharField(200) | required | العنوان |
| body | TextField | blank | المحتوى |
| is_read | BooleanField | default=False | مقروء |
| created_at | DateTimeField | auto_now_add | التاريخ |

المتطلبات: NOT-01 إلى NOT-05.

---


## وحدة الشكاوى والجودة (`complaints`)

### Complaint

الغرض: شكاوى المشتركين.

| الحقل | النوع | القيود | الوصف |
|---|---|---|---|
| id | BigAutoField | PK | المعرف |
| subscriber_id | FK → Subscriber | CASCADE | المشترك |
| type | CharField(20) | choices: late, damaged, missing, other | نوع الشكوى |
| description | TextField | required | وصف الشكوى |
| status | CharField(15) | choices: new, in_progress, resolved | الحالة |
| image | ImageField | upload_to='complaints/' | صورة مرفقة |
| created_at | DateTimeField | auto_now_add | تاريخ الإنشاء |
| resolved_at | DateTimeField | nullable | تاريخ الحل |

المتطلبات: QC-01, QC-02.


### FieldReport

الغرض: البلاغات الميدانية المصورة عن السلال.

| الحقل | النوع | القيود | الوصف |
|---|---|---|---|
| id | BigAutoField | PK | المعرف |
| driver_id | FK → DriverProfile | CASCADE | السائق |
| subscriber_id | FK → Subscriber | CASCADE, nullable | المشترك |
| issue_type | CharField(20) | choices: full, damaged, missing, empty | نوع المشكلة |
| note | TextField | blank | ملاحظات |
| image | ImageField | upload_to='field_reports/' | صورة البلاغ |
| created_at | DateTimeField | auto_now_add | التاريخ |

المتطلبات: QC-03, NOT-02.

### ServiceRating

الغرض: تقييم جودة الخدمة شهرياً.

| الحقل | النوع | القيود | الوصف |
|---|---|---|---|
| id | BigAutoField | PK | المعرف |
| subscriber_id | FK → Subscriber | CASCADE | المشترك |
| month | DateField | required | الشهر |
| rating | IntegerField | 1-5 | التقييم |
| comment | TextField | blank | تعليق |
| created_at | DateTimeField | auto_now_add | التاريخ |

قيد: `unique_together = ['subscriber', 'month']`.

المتطلبات: QC-04.

---

## وحدة إعادة التدوير (`recycling`)

### RecycleRequest

الغرض: طلبات جمع إعادة التدوير.

| الحقل | النوع | القيود | الوصف |
|---|---|---|---|
| id | BigAutoField | PK | المعرف |
| subscriber_id | FK → Subscriber | CASCADE | المشترك |
| category | CharField(15) | choices: plastic, metal, paper, bread | فئة الفرز |
| bags_count | PositiveIntegerField | default=1 | عدد الأكياس |
| status | CharField(15) | choices: pending, collected, cancelled | الحالة |
| confirmed_by_id | FK → DriverProfile | SET_NULL, nullable | السائق المؤكد |
| created_at | DateTimeField | auto_now_add | التاريخ |

المتطلبات: REC-02, REC-03.

### PointsTransaction

الغرض: حركات نقاط إعادة التدوير.

| الحقل | النوع | القيود | الوصف |
|---|---|---|---|
| id | BigAutoField | PK | المعرف |
| subscriber_id | FK → Subscriber | CASCADE | المشترك |
| recycle_request_id | FK → RecycleRequest | OneToOne, SET_NULL | الطلب المرتبط |
| points | IntegerField | required | النقاط |
| reason | CharField(200) | required | السبب |
| created_at | DateTimeField | auto_now_add | التاريخ |

المتطلبات: REC-04, REC-05.

### Reward

الغرض: مكافآت شهرية لإعادة التدوير.

| الحقل | النوع | القيود | الوصف |
|---|---|---|---|
| id | BigAutoField | PK | المعرف |
| subscriber_id | FK → Subscriber | CASCADE | المشترك |
| title | CharField(200) | required | عنوان المكافأة |
| month | DateField | required | الشهر |
| created_at | DateTimeField | auto_now_add | التاريخ |

المتطلبات: REC-05, REC-06.

### [مخطط] EnvironmentalImpactRecord

الغرض: سجل الأثر البيئي والرتب التلقائية لكل مشترك.

| الحقل | النوع | القيود | الوصف |
|---|---|---|---|
| id | BigAutoField | PK | المعرف |
| subscriber_id | FK → Subscriber | OneToOne | المشترك |
| total_participations | IntegerField | default=0 | إجمالي المشاركات |
| total_points | IntegerField | default=0 | إجمالي النقاط |
| rank_name | CharField(50) | blank | الرتبة البيئية |
| updated_at | DateTimeField | auto_now | آخر تحديث |

المتطلبات: REC-06.

---

## وحدة الشؤون المالية (`finance`)

### Payment

الغرض: تسجيل مبالغ التحصيل النقدي الميداني.

| الحقل | النوع | القيود | الوصف |
|---|---|---|---|
| id | BigAutoField | PK | المعرف |
| subscriber_id | FK → Subscriber | CASCADE | المشترك |
| plan_id | FK → SubscriptionPlan | SET_NULL, nullable | الباقة |
| agent_id | FK → AgentProfile | SET_NULL, nullable | المندوب المحصّل |
| settlement_id | FK → CollectionSettlement | SET_NULL, nullable | محضر التسليم |
| amount | DecimalField(10,2) | required | المبلغ |
| date | DateField | auto_now_add | تاريخ الدفع |
| status | CharField(15) | choices: pending, deposited, confirmed | حالة الإيداع |
| receipt_number | CharField(20) | unique, auto-generated | رقم الإيصال (REC-XXXXXX) |
| created_at | DateTimeField | auto_now_add | التاريخ |

ملاحظة مهمة: `Payment.save()` يولّد `receipt_number` تلقائياً من الـ PK ويستدعي `subscriber.update_color_status()`.

المتطلبات: FIN-01, NOT-04, REP-03.

### CollectionSettlement

الغرض: محاضر تسليم العهدة النقدية من المندوب للمحاسب.

| الحقل | النوع | القيود | الوصف |
|---|---|---|---|
| id | BigAutoField | PK | المعرف |
| agent_id | FK → AgentProfile | CASCADE | المندوب |
| accountant_id | FK → AccountantProfile | SET_NULL, nullable | المحاسب المستلم |
| date | DateField | auto_now_add | التاريخ |
| total_amount | DecimalField(12,2) | required | المبلغ الإجمالي |
| status | CharField(15) | choices: pending, approved, rejected | الحالة |
| note | TextField | blank | ملاحظات |
| created_at | DateTimeField | auto_now_add | التاريخ |

المتطلبات: FIN-02.

### Expense

الغرض: تسجيل المصروفات التشغيلية.

| الحقل | النوع | القيود | الوصف |
|---|---|---|---|
| id | BigAutoField | PK | المعرف |
| description | CharField(255) | required | الوصف |
| amount | DecimalField(10,2) | required | المبلغ |
| category | CharField(15) | choices: fuel, maintenance, salary, marketing, other | الفئة |
| date | DateField | auto_now_add | التاريخ |
| created_at | DateTimeField | auto_now_add | التاريخ |

المتطلبات: FIN-03, REP-03.

### Advance

الغرض: سلف ومديونيات الموظفين.

| الحقل | النوع | القيود | الوصف |
|---|---|---|---|
| id | BigAutoField | PK | المعرف |
| employee_id | FK → EmployeeProfile | CASCADE | الموظف |
| amount | DecimalField(10,2) | required | مبلغ السلفة |
| status | CharField(10) | choices: active, paid | الحالة |
| date | DateField | auto_now_add | التاريخ |
| note | TextField | blank | ملاحظات |

المتطلبات: FIN-06.

### Penalty

الغرض: الجزاءات المالية (غياب، تأخير).

| الحقل | النوع | القيود | الوصف |
|---|---|---|---|
| id | BigAutoField | PK | المعرف |
| employee_id | FK → EmployeeProfile | CASCADE | الموظف |
| reason | CharField(255) | required | السبب |
| amount | DecimalField(8,2) | required | المبلغ |
| date | DateField | auto_now_add | التاريخ |

المتطلبات: FIN-05.

### StaffReward

الغرض: مكافآت الموظفين.

| الحقل | النوع | القيود | الوصف |
|---|---|---|---|
| id | BigAutoField | PK | المعرف |
| employee_id | FK → EmployeeProfile | CASCADE | الموظف |
| reason | CharField(255) | required | السبب |
| amount | DecimalField(8,2) | required | المبلغ |
| date | DateField | auto_now_add | التاريخ |



---

## ربط التصميم بالمتطلبات

| المجال | الجداول الرئيسية | المتطلبات |
|---|---|---|
| الحسابات والمصادقة | User, EmployeeProfile, DriverProfile, AgentProfile, AccountantProfile, EmployeeDocument | STF-01 إلى STF-07 |
| المناطق والمسارات | Zone, Route | OP-01 إلى OP-14 |
| المشتركون والاشتراكات | Subscriber, SubscriptionPlan, SubscriptionLog, [LatePaymentExcuse] | SUB-01 إلى SUB-12 |
| التتبع الجغرافي | TruckLocation, CollectionVisit | GEO-01 إلى GEO-05 |
| الإشعارات | Notification | NOT-01 إلى NOT-05 |
| الشكاوى والجودة | Complaint, FieldReport, ServiceRating | QC-01 إلى QC-04 |
| إعادة التدوير | RecycleRequest, PointsTransaction, Reward, [EnvironmentalImpactRecord] | REC-01 إلى REC-06 |
| المالية | Payment, CollectionSettlement, Expense, Advance, Penalty, StaffReward | FIN-01 إلى FIN-07 |
| التقارير | تجميعات من الجداول الأخرى | REP-01 إلى REP-05 |
