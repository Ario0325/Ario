#!/usr/bin/env python3
"""
اسکریپت تشخیص مشکل اتصال n8n
این فایل را روی PythonAnywhere اجرا کنید:
    cd ~/Ario
    python3 debug_n8n.py
"""

import os
import sys

print("=" * 60)
print("تشخیص مشکل اتصال n8n - آریو شاپ")
print("=" * 60)

# 1. بررسی git
print("\n[1] بررسی Git:")
os.system("git log --oneline -3")
os.system("git remote -v")

# 2. بررسی settings
print("\n[2] بررسی Settings:")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'Ario_Shop.settings')

try:
    import django
    django.setup()
    from django.conf import settings as django_settings

    print(f"  DEBUG = {django_settings.DEBUG}")
    print(f"  N8N_WEBHOOK_URL = {django_settings.N8N_WEBHOOK_URL}")
    print(f"  N8N_ORDER_WEBHOOK_URL = {django_settings.N8N_ORDER_WEBHOOK_URL}")
    print(f"  N8N_WEBHOOK_SECRET = {django_settings.N8N_WEBHOOK_SECRET}")
    print(f"  N8N_SENDER_EMAIL = {django_settings.N8N_SENDER_EMAIL}")
except Exception as e:
    print(f"  خطا در بارگذاری Django: {e}")

# 3. بررسی فایل settings.py مستقیم
print("\n[3] محتوای settings.py (خطوط n8n):")
settings_path = os.path.join(os.path.dirname(__file__), 'Ario_Shop', 'settings.py')
try:
    with open(settings_path, 'r', encoding='utf-8') as f:
        for i, line in enumerate(f, 1):
            if 'N8N_WEBHOOK_URL' in line or 'N8N_ORDER_WEBHOOK_URL' in line:
                print(f"  خط {i}: {line.rstrip()}")
except Exception as e:
    print(f"  خطا در خواندن فایل: {e}")

# 4. تست اتصال مستقیم
print("\n[4] تست اتصال:")
import requests

urls_to_test = [
    ("Cloudflare Worker", "https://quiet-field-a090.mimoomim456.workers.dev/"),
    ("n8n مستقیم", "https://tjnryhbtgvrfdcs.app.n8n.cloud/"),
]

for name, url in urls_to_test:
    try:
        r = requests.get(url, timeout=10)
        print(f"  {name}: {r.status_code} - {r.text[:80]}")
    except Exception as e:
        print(f"  {name}: خطا - {type(e).__name__}: {e}")

# 5. تست ارسال webhook واقعی
print("\n[5] تست ارسال webhook:")
try:
    webhook_url = django_settings.N8N_WEBHOOK_URL
    print(f"  آدرس: {webhook_url}")
    r = requests.post(
        webhook_url,
        json={
            "event": "register",
            "email": "test@test.com",
            "username": "test",
            "code": "999999",
            "secret_token": django_settings.N8N_WEBHOOK_SECRET,
            "sender_email": django_settings.N8N_SENDER_EMAIL,
        },
        headers={"Content-Type": "application/json"},
        timeout=15,
    )
    print(f"  نتیجه: {r.status_code} - {r.text}")
except Exception as e:
    print(f"  خطا: {type(e).__name__}: {e}")

# 6. تست سرویس واقعی
print("\n[6] تست N8nAuthService:")
try:
    from Accounts_Module.services import N8nAuthService
    result = N8nAuthService.send_verification_email("test@test.com", "test", "999999")
    print(f"  نتیجه: {result}")
except Exception as e:
    print(f"  خطا: {type(e).__name__}: {e}")

print("\n" + "=" * 60)
print("پایان تشخیص")
print("=" * 60)
