============================================================
  راهنمای راه‌اندازی n8n برای آریو شاپ
  ارسال کد تایید و فاکتور خرید به ایمیل مشتریان
============================================================

== پیش‌نیازها ==
1. حساب n8n.cloud (https://n8n.cloud)
2. حساب Gmail با App Password
3. پروژه Django روی PythonAnywhere

== مرحله 1: ساخت App Password در Gmail ==

1. برو به https://myaccount.google.com
2. از منوی چپ روی "Security" کلیک کن
3. بخش "2-Step Verification" رو فعال کن (اگه فعال نیست)
4. برو به https://myaccount.google.com/apppasswords
5. یه اسم بذار مثلاً "n8n-ario"
6. روی "Create" کلیک کن
7. رمز 16 حرفی رو کپی کن (این رمز رو نگه دار)

== مرحله 2: ساخت SMTP Credential در n8n ==

1. وارد n8n.cloud بشو
2. از منوی چپ روی "Credentials" کلیک کن
3. روی "Add Credential" کلیک کن
4. "SMTP" رو انتخاب کن
5. اطلاعات زیر رو وارد کن:
   - Name: Gmail SMTP
   - Host: smtp.gmail.com
   - Port: 465
   - User: bardiaabdi1393@gmail.com
   - Password: (رمز App Password که مرحله 1 ساختی)
   - SSL/TLS: true
6. روی "Save" کلیک کن

== مرحله 3: ایمپورت Workflow ==

1. از منوی چپ روی "Workflows" کلیک کن
2. روی "Import from File" کلیک کن
3. فایل "Django n8n.json" رو انتخاب کن
4. Workflow ایمپورت میشه

== مرحله 4: تنظیم SMTP در Workflow ==

1. روی نود "Send Verification Email" کلیک کن
2. بخش "Credential" رو روی "Gmail SMTP" تنظیم کن
3. روی نود "Send Password Reset Email" کلیک کن
4. بخش "Credential" رو روی "Gmail SMTP" تنظیم کن
5. روی نود "Send Order Confirmation Email" کلیک کن
6. بخش "Credential" رو روی "Gmail SMTP" تنظیم کن

== مرحله 5: فعال‌سازی Workflow ==

1. مطمئن شو toggle بالای صفحه روی "Active" هست
2. Workflow باید خودکار فعال باشه (در JSON تنظیم شده)

== مرحله 6: گرفتن Webhook URLs ==

1. روی نود "Auth Webhook" کلیک کن
2. URL نمایش داده شده رو کپی کن
   مثال: https://your-instance.app.n8n.cloud/webhook/django-auth-event
3. روی نود "Order Paid Webhook" کلیک کن
4. URL نمایش داده شده رو کپی کن
   مثال: https://your-instance.app.n8n.cloud/webhook/order-paid

== مرحله 7: تنظیم Django روی PythonAnywhere ==

1. وارد کنسول Bash بشو
2. فایل .env رو ویرایش کن:
   nano ~/Ario/.env

3. این خطوط رو uncomment کن و URL ها رو جایگزین کن:

   N8N_WEBHOOK_URL=https://your-instance.app.n8n.cloud/webhook/django-auth-event
   N8N_WEBHOOK_SECRET=ario-shop-secret-token
   N8N_ORDER_WEBHOOK_URL=https://your-instance.app.n8n.cloud/webhook/order-paid
   N8N_ORDER_WEBHOOK_SECRET=ario-shop-secret-token
   N8N_SENDER_EMAIL=bardiaabdi1393@gmail.com

4. ذخیره کن (Ctrl+X، Y، Enter)
5. وب‌اپ رو Reload کن (صفحه Web → Reload)

== مرحله 8: تست ==

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
→ ممکنه Gmail اولش بلاک کنه، صبر کن یا "Less secure apps" رو فعال کن

مشکل: ارور timeout در Django
→ ممکنه n8n کنده، صبر کن
→ چک کن n8n.cloud سرویسش فعاله

== ساختار Webhook Payload ==

Auth Webhook (POST /webhook/django-auth-event):
{
  "event": "register" | "password_reset",
  "email": "user@example.com",
  "username": "arya",
  "code": "123456",
  "reset_link": "",
  "sender_email": "bardiaabdi1393@gmail.com"
}

Order Webhook (POST /webhook/order-paid):
{
  "secret_token": "ario-shop-secret-token",
  "order_id": 1,
  "order_number": "ORD-20250101-XXXX",
  "customer_name": "آریو",
  "customer_email": "user@example.com",
  "payment_status": "paid",
  "total_price": 1500000,
  "shipping_cost": 50000,
  "discount": 0,
  "created_at": "2025-01-01T12:00:00+03:30",
  "shipping_address": "تهران، خیابان...",
  "items": [
    {
      "name": "محصول 1",
      "quantity": 2,
      "unit_price": 500000,
      "total_price": 1000000
    }
  ],
  "sender_email": "bardiaabdi1393@gmail.com"
}
