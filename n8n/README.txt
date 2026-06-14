============================================================
  راهنمای راه‌اندازی n8n برای آریو شاپ
  ارسال کد تایید و فاکتور خرید به ایمیل مشتریان
============================================================

== اطلاعات فروشگاه ==
ایمیل: bardiaabdi1393@gmail.com
App Password: wokw kyci lswj uqqd

== مرحله 1: ساخت SMTP Credential در n8n ==

1. وارد n8n.cloud بشو
2. از منوی چپ روی "Credentials" کلیک کن
3. روی "Add Credential" کلیک کن
4. "SMTP" رو انتخاب کن
5. اطلاعات زیر رو وارد کن:
   - Name: Gmail SMTP
   - Host: smtp.gmail.com
   - Port: 465
   - User: bardiaabdi1393@gmail.com
   - Password: wokw kyci lswj uqqd
   - SSL/TLS: true
6. روی "Save" کلیک کن

== مرحله 2: ایمپورت Workflow ==

1. از منوی چپ روی "Workflows" کلیک کن
2. روی "Import from File" کلیک کن
3. فایل "Django n8n.json" رو انتخاب کن
4. Workflow ایمپورت میشه

== مرحله 3: تنظیم SMTP در Workflow ==

1. روی نود "Send Verification Email" کلیک کن
2. بخش "Credential" رو روی "Gmail SMTP" تنظیم کن
3. روی نود "Send Password Reset Email" کلیک کن
4. بخش "Credential" رو روی "Gmail SMTP" تنظیم کن
5. روی نود "Send Order Confirmation Email" کلیک کن
6. بخش "Credential" رو روی "Gmail SMTP" تنظیم کن

== مرحله 4: فعال‌سازی Workflow ==

1. مطمئن شو toggle بالای صفحه روی "Active" هست
2. Workflow باید خودکار فعال باشه

== مرحله 5: گرفتن Webhook URLs ==

1. روی نود "Auth Webhook" کلیک کن
2. از بخش "Production URL" URL رو کپی کن
   مثال: https://your-instance.app.n8n.cloud/webhook/django-auth-event
3. روی نود "Order Paid Webhook" کلیک کن
4. از بخش "Production URL" URL رو کپی کن
   مثال: https://your-instance.app.n8n.cloud/webhook/order-paid

== مرحله 6: تنظیم Django روی PythonAnywhere ==

1. وارد کنسول Bash بشو
2. فایل .env بساز:
   nano ~/Ario/.env

3. محتوای زیر رو بذار (URL ها رو از مرحله 5 جایگزین کن):

   DEBUG=False
   DJANGO_SECRET_KEY=your-production-secret-key-here
   ALLOWED_HOSTS=localhost,127.0.0.1,::1,arya0325.pythonanywhere.com,aryaabdi1850325.pythonanywhere.com
   N8N_WEBHOOK_URL=https://YOUR-N8N-URL/webhook/django-auth-event
   N8N_WEBHOOK_SECRET=ario-shop-secret-token
   N8N_ORDER_WEBHOOK_URL=https://YOUR-N8N-URL/webhook/order-paid
   N8N_ORDER_WEBHOOK_SECRET=ario-shop-secret-token
   N8N_SENDER_EMAIL=bardiaabdi1393@gmail.com

4. ذخیره کن (Ctrl+X، Y، Enter)
5. وب‌اپ رو Reload کن (صفحه Web → Reload)

== مرحله 7: تست ==

تست 1: ثبت‌نام کاربر جدید
- یه حساب جدید بساز
- باید ایمیل کد تایید بیاد

تست 2: بازیابی رمز عبور
- روی "فراموشی رمز عبور" کلیک کن
- باید ایمیل بازیابی بیاد

تست 3: خرید
- یه خرید تستی انجام بده
- باید ایمیل فاکتور بیاد

== عیب‌یابی ==

مشکل: ایمیل نمیاد
→ چک کن Workflow توی n8n فعال باشه
→ چک کن SMTP credential درست باشه
→ چک کن URL های webhook توی .env درست باشن
→ توی n8n روی تب "Executions" کلیک کن تا ببینی webhook دریافت شده

مشکل: webhook 404 میده
→ مطمئن شو URL درسته
→ مطمئن شو Workflow فعاله (toggle بالای صفحه)

مشکل: Gmail بلاک میکنه
→ مطمئن شو 2FA فعاله
→ مطمئن شو App Password درسته (نه رمز عبور اصلی)
