from django.db.backends.base.base import BaseDatabaseWrapper
from django.db.backends.mysql.features import DatabaseFeatures

# 1. تعطيل فحص إصدار قاعدة البيانات لتجنب مشكلة MariaDB القديمة
BaseDatabaseWrapper.check_database_version_supported = lambda self: None

# 2. تعديل ميزة RETURNING لتتوافق مع إصدارات MariaDB الأقدم من 10.5
# حيث أن Django يفترض خطأً أن جميع نسخ MariaDB تدعمها بدون فحص رقم الإصدار بدقة
DatabaseFeatures.can_return_columns_from_insert = property(
    lambda self: self.connection.mysql_is_mariadb and self.connection.mysql_version >= (10, 5)
)
