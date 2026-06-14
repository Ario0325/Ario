import requests

url = 'https://tjnryhbtgvrfdcs.app.n8n.cloud/webhook/django-auth-event'
payload = {
    'event': 'register',
    'email': 'test@test.com',
    'username': 'testuser',
    'code': '123456',
    'reset_link': '',
    'sender_email': 'bardiaabdi1393@gmail.com'
}
headers = {
    'Content-Type': 'application/json',
    'X-Webhook-Secret': 'ario-shop-secret-token'
}

print("=" * 50)
print("Testing n8n webhook connection...")
print("=" * 50)

try:
    r = requests.post(url, json=payload, headers=headers, timeout=15)
    print(f"Status: {r.status_code}")
    print(f"Response: {r.text}")
except requests.exceptions.ConnectionError as e:
    print(f"FAILED: ConnectionError - PythonAnywhere cannot reach n8n")
    print(f"Detail: {e}")
except requests.exceptions.Timeout:
    print(f"FAILED: Timeout - n8n did not respond in 15 seconds")
except Exception as e:
    print(f"FAILED: {type(e).__name__}: {e}")
