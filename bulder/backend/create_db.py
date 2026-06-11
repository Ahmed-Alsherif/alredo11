import sys
import os

try:
    import MySQLdb
except ImportError:
    print("[ERROR] مكتبة mysqlclient غير مثبتة. يرجى تثبيتها أولاً باستخدام: pip install mysqlclient")
    sys.exit(1)

def main():
    print("=" * 60)
    print(" أداة إنشاء قاعدة بيانات مشروع سلة (Sall DB Creator)")
    print("=" * 60)
    
    password = input("الرجاء إدخال كلمة مرور root التي اخترتها أثناء تثبيت MariaDB (اضغط Enter إذا لم تختر كلمة مرور): ")
    
    try:
        # الاتصال بـ MariaDB
        db = MySQLdb.connect(
            host='localhost',
            user='root',
            passwd=password,
            port=3306
        )
        cursor = db.cursor()
        
        # إنشاء قاعدة البيانات بدعم كامل لترميز utf8mb4 (العربية والرموز التعبيرية)
        cursor.execute("CREATE DATABASE IF NOT EXISTS sall_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
        print("\n[SUCCESS] تم إنشاء قاعدة البيانات 'sall_db' بنجاح وبشكل متوافق مع اللغة العربية!")
        
        # إغلاق الاتصال
        db.close()
        
        print("-" * 60)
        print("الخطوة التالية:")
        print("1. سأقوم بتحديث ملف settings.py بكلمة المرور التي أدخلتها.")
        print("2. سنقوم بتشغيل Migrations لإنشاء الجداول.")
        print("-" * 60)
        
    except Exception as e:
        print(f"\n[ERROR] حدث خطأ أثناء الاتصال بقاعدة البيانات.")
        print(f"التفاصيل: {e}")
        print("\nيرجى التأكد من:")
        print("1. أن خدمة MariaDB تعمل في الخلفية.")
        print("2. أنك قمت بإيقاف MySQL في XAMPP لتجنب تعارض المنافذ (Port 3306).")
        print("3. صحة كلمة المرور التي أدخلتها.")

if __name__ == '__main__':
    main()
