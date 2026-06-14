============================================================
  راهنمای راه‌اندازی n8n برای آریو شاپ
============================================================

== اطلاعات ==
ایمیل فروشگاه: bardiaabdi1393@gmail.com
App Password: wokw kyci lswj uqqd
Webhook Auth: https://tjnryhbtgvrfdcs.app.n8n.cloud/webhook/django-auth-event
Webhook Order: https://tjnryhbtgvrfdcs.app.n8n.cloud/webhook/order-paid

== مراحل راه‌اندازی n8n ==

مرحله 1: ساخت SMTP Credential
1. وارد n8n.cloud بشو
2. از منوی چپ روی "Credentials" کلیک کن
3. روی "Add Credential" کلیک کن
4. "SMTP" رو انتخاب کن
5. اطلاعات زیر رو وارد کن:
   Name: Gmail SMTP
   Host: smtp.gmail.com
   Port: 465
   User: bardiaabdi1393@gmail.com
   Password: wokw kyci lswj uqqd
   SSL/TLS: true
6. روی "Save" کلیک کن

مرحله 2: ایمپورت Workflow
1. از منوی چپ روی "Workflows" کلیک کن
2. روی "Import from File" کلیک کن
3. فایل "Django n8n.json" رو انتخاب کن

مرحله 3: تنظیم SMTP در Workflow
1. روی نود "Send Verification Email" کلیک کن
2. بخش "Credential" رو روی "Gmail SMTP" تنظیم کن
3. روی نود "Send Password Reset Email" کلیک کن
4. بخش "Credential" رو روی "Gmail SMTP" تنظیم کن
5. روی نود "Send Order Confirmation Email" کلیک کن
6. بخش "Credential" رو روی "Gmail SMTP" تنظیم کن

مرحله 4: فعال‌سازی
1. toggle بالای صفحه روی "Active" باشه
2. تمام شد!

== تست ==
1. ثبت‌نام کاربر جدید → باید ایمیل کد تایید بیاد
2. فراموشی رمز عبور → باید ایمیل بازیابی بیاد
3. خرید → باید ایمیل فاکتور بیاد

== عیب‌یابی ==
- ایمیل نمیاد → Workflow فعاله؟ SMTP credential درسته؟
- webhook 404 → Workflow فعاله؟ URL درسته؟
- تب Executions توی n8n رو چک کن تا ببینی webhook دریافت شده

== نکته ==
Django روی PythonAnywhere نیازی به تنظیمات اضافی نداره.
URL های webhook توی کد هستن. فقط git pull + Reload کافیه.
