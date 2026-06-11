# Entity Relationship Diagram

## المرجعية

هذا الملف يوضح العلاقات بين كيانات قاعدة البيانات المبنية على النظام الحالي.
الكيانات المخططة مميزة بعلامة `[مخطط]`.

## الرموز

- PK: Primary Key
- FK: Foreign Key
- 1:1 علاقة واحد إلى واحد
- 1:N علاقة واحد إلى متعدد

## الرسم العام للعلاقات

```text
User
  1:1 Subscriber (عبر subscriber_profile)
  1:1 EmployeeProfile (عبر employee_profile)
  1:N Notification (عبر recipient)

EmployeeProfile
  1:1 DriverProfile
  1:1 AgentProfile
  1:1 AccountantProfile
  1:N EmployeeDocument
  1:N Advance
  1:N Penalty
  1:N StaffReward

DriverProfile
  1:N Route (كسائق مسؤول)
  1:N TruckLocation
  1:N CollectionVisit
  1:N FieldReport
  1:N RecycleRequest (confirmed_by)

AgentProfile
  1:N Payment (كمندوب محصّل)
  1:N CollectionSettlement

AccountantProfile
  1:N CollectionSettlement (كمحاسب مستلم)

Zone
  1:N Route
  1:N Subscriber
  1:N DriverProfile (zone)
  1:N AgentProfile (zone)

Route
  1:N Subscriber
  1:N CollectionVisit

Subscriber
  1:N Payment
  1:N SubscriptionLog
  1:N Complaint
  1:N FieldReport
  1:N ServiceRating
  1:N RecycleRequest
  1:N PointsTransaction
  1:N Reward
  1:1 [EnvironmentalImpactRecord]
  1:N [LatePaymentExcuse]

SubscriptionPlan
  1:N Subscriber (plan)
  1:N SubscriptionLog
  1:N Payment (plan)

Payment
  N:1 CollectionSettlement (settlement)

CollectionSettlement
  1:N Payment

RecycleRequest
  1:1 PointsTransaction
```

## علاقات 1:1

| العلاقة | المفتاح الأجنبي |
|---|---|
| User ↔ Subscriber | Subscriber.user_id |
| User ↔ EmployeeProfile | EmployeeProfile.user_id |
| EmployeeProfile ↔ DriverProfile | DriverProfile.employee_id |
| EmployeeProfile ↔ AgentProfile | AgentProfile.employee_id |
| EmployeeProfile ↔ AccountantProfile | AccountantProfile.employee_id |
| RecycleRequest ↔ PointsTransaction | PointsTransaction.recycle_request_id |
| [مخطط] Subscriber ↔ EnvironmentalImpactRecord | EnvironmentalImpactRecord.subscriber_id |

## علاقات 1:N الرئيسية

| الأب | الابن | المفتاح الأجنبي | on_delete |
|---|---|---|---|
| User | Notification | Notification.recipient_id | CASCADE |
| EmployeeProfile | EmployeeDocument | EmployeeDocument.employee_id | CASCADE |
| EmployeeProfile | Advance | Advance.employee_id | CASCADE |
| EmployeeProfile | Penalty | Penalty.employee_id | CASCADE |
| EmployeeProfile | StaffReward | StaffReward.employee_id | CASCADE |
| Zone | Route | Route.zone_id | CASCADE |
| Zone | Subscriber | Subscriber.zone_id | SET_NULL |
| Zone | DriverProfile | DriverProfile.zone_id | SET_NULL |
| Zone | AgentProfile | AgentProfile.zone_id | SET_NULL |
| Route | Subscriber | Subscriber.route_id | SET_NULL |
| Route | CollectionVisit | CollectionVisit.route_id | CASCADE |
| DriverProfile | Route | Route.driver_id | SET_NULL |
| DriverProfile | TruckLocation | TruckLocation.driver_id | CASCADE |
| DriverProfile | CollectionVisit | CollectionVisit.driver_id | CASCADE |
| DriverProfile | FieldReport | FieldReport.driver_id | CASCADE |
| AgentProfile | Payment | Payment.agent_id | SET_NULL |
| AgentProfile | CollectionSettlement | CollectionSettlement.agent_id | CASCADE |
| AccountantProfile | CollectionSettlement | CollectionSettlement.accountant_id | SET_NULL |
| Subscriber | Payment | Payment.subscriber_id | CASCADE |
| Subscriber | SubscriptionLog | SubscriptionLog.subscriber_id | CASCADE |
| Subscriber | Complaint | Complaint.subscriber_id | CASCADE |
| Subscriber | FieldReport | FieldReport.subscriber_id | CASCADE |
| Subscriber | ServiceRating | ServiceRating.subscriber_id | CASCADE |
| Subscriber | RecycleRequest | RecycleRequest.subscriber_id | CASCADE |
| Subscriber | PointsTransaction | PointsTransaction.subscriber_id | CASCADE |
| Subscriber | Reward | Reward.subscriber_id | CASCADE |
| SubscriptionPlan | Subscriber | Subscriber.plan_id | SET_NULL |
| SubscriptionPlan | SubscriptionLog | SubscriptionLog.plan_id | SET_NULL |
| SubscriptionPlan | Payment | Payment.plan_id | SET_NULL |
| CollectionSettlement | Payment | Payment.settlement_id | SET_NULL |
| Payment | SubscriptionLog | SubscriptionLog.payment_id | SET_NULL |

## هيكل وراثة الموظفين

```text
User (حساب الدخول)
  │
  └── EmployeeProfile (بيانات مشتركة: الاسم، الهاتف)
        │
        ├── DriverProfile (المنطقة، رخصة القيادة، رقم الشاحنة)
        │
        ├── AgentProfile (المنطقة، رصيد العهدة)
        │
        └── AccountantProfile (حقول مستقبلية)
```

ملاحظة: المشترك (`Subscriber`) لا يمر عبر `EmployeeProfile` — يرتبط مباشرة بـ `User`.

## تدفق العهدة المالية

```text
Payment (status=pending)
  │  المندوب يحصّل من المشترك
  │
  ▼
CollectionSettlement (status=pending)
  │  المندوب ينشئ محضر تسليم
  │  Payment.settlement_id = settlement
  │  Payment.status → deposited
  │
  ▼
CollectionSettlement (status=approved)
  │  المحاسب يوافق
  │
  ▼
  تم إتمام العملية
```

## القيود الفريدة (Unique Constraints)

| الجدول | القيد | الوصف |
|---|---|---|
| User | username | اسم مستخدم فريد |
| User | email | بريد فريد |
| Subscriber | subscription_id | رقم اشتراك فريد (SUB-XXXX) |
| Payment | receipt_number | رقم إيصال فريد (REC-XXXXXX) |
| Zone | name | اسم منطقة فريد |
| CollectionVisit | (route, subscriber, visit_date) | unique_together |
| ServiceRating | (subscriber, month) | unique_together |
