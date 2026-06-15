import logging
import requests
from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


class EmailService:
    """سرویس ارسال ایمیل مستقیم از طریق Gmail SMTP"""

    @classmethod
    def send_verification_email(cls, email, username, code):
        subject = 'آریو شاپ - کد تایید ثبت‌نام'
        html_message = f'''
        <div dir="rtl" style="font-family: Tahoma, sans-serif; max-width:600px; margin:auto; padding:30px; background:#f9f9f9; border-radius:10px;">
            <h2 style="color:#2c3e50;">🛍️ آریو شاپ</h2>
            <p>کاربر گرامی <strong>{username}</strong>،</p>
            <p>برای تکمیل ثبت‌نام در آریو شاپ از کد زیر استفاده کنید:</p>
            <div style="background:#2c3e50;color:#fff;font-size:28px;font-weight:bold;text-align:center;padding:20px;border-radius:8px;letter-spacing:8px;">{code}</div>
            <p style="color:#888;font-size:13px;">این کد تا ۱۵ دقیقه معتبر است.</p>
            <hr/>
            <p style="color:#aaa;font-size:12px;">اگر شما این درخواست را نداده‌اید، این ایمیل را نادیده بگیرید.</p>
        </div>
        '''
        try:
            send_mail(
                subject=subject,
                message=f'کد تایید شما: {code}',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                html_message=html_message,
                fail_silently=False,
            )
            logger.info(f"ایمیل تایید ارسال شد: {email}")
            return True
        except Exception as e:
            logger.error(f"خطا در ارسال ایمیل تایید: {e}")
            return False

    @classmethod
    def send_password_reset_email(cls, email, username, code):
        subject = 'آریو شاپ - بازیابی رمز عبور'
        html_message = f'''
        <div dir="rtl" style="font-family: Tahoma, sans-serif; max-width:600px; margin:auto; padding:30px; background:#f9f9f9; border-radius:10px;">
            <h2 style="color:#2c3e50;">🛍️ آریو شاپ</h2>
            <p>کاربر گرامی <strong>{username}</strong>،</p>
            <p>درخواست بازیابی رمز عبور برای حساب شما ثبت شد.</p>
            <div style="background:#2c3e50;color:#fff;font-size:28px;font-weight:bold;text-align:center;padding:20px;border-radius:8px;letter-spacing:8px;">{code}</div>
            <p style="color:#888;font-size:13px;">این کد تا ۱۵ دقیقه معتبر است.</p>
            <hr/>
            <p style="color:#aaa;font-size:12px;">اگر شما این درخواست را نداده‌اید، حساب شما امن است.</p>
        </div>
        '''
        try:
            send_mail(
                subject=subject,
                message=f'کد بازیابی رمز عبور: {code}',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                html_message=html_message,
                fail_silently=False,
            )
            logger.info(f"ایمیل بازیابی رمز ارسال شد: {email}")
            return True
        except Exception as e:
            logger.error(f"خطا در ارسال ایمیل بازیابی: {e}")
            return False


class N8nAuthService:
    """سرویس ارسال رویدادهای احراز هویت به n8n"""

    WEBHOOK_URL = settings.N8N_WEBHOOK_URL
    WEBHOOK_SECRET = settings.N8N_WEBHOOK_SECRET
    TIMEOUT_SECONDS = 10

    @classmethod
    def _build_headers(cls):
        headers = {'Content-Type': 'application/json'}
        if cls.WEBHOOK_SECRET:
            headers['X-Webhook-Secret'] = cls.WEBHOOK_SECRET
        return headers

    @classmethod
    def _send_to_n8n(cls, payload):
        try:
            response = requests.post(
                cls.WEBHOOK_URL,
                json=payload,
                headers=cls._build_headers(),
                timeout=cls.TIMEOUT_SECONDS,
            )
            response.raise_for_status()
            logger.info(
                f"n8n webhook موفق: event={payload.get('event')}, email={payload.get('email')}"
            )
            return True
        except requests.exceptions.ConnectionError:
            logger.error(f"اتصال به n8n برقرار نشد: {cls.WEBHOOK_URL}")
            return False
        except requests.exceptions.Timeout:
            logger.error(f"timeout ارسال به n8n (>{cls.TIMEOUT_SECONDS}s)")
            return False
        except requests.exceptions.HTTPError as e:
            logger.error(f"خطای HTTP از n8n: {e.response.status_code}")
            return False
        except Exception as e:
            logger.error(f"خطای ناشناخته در ارسال به n8n: {e}")
            return False

    @classmethod
    def send_verification_email(cls, email, username, code):
        payload = {
            "event": "register",
            "email": email,
            "username": username or "کاربر",
            "code": code,
            "reset_link": "",
            "sender_email": settings.N8N_SENDER_EMAIL,
            "secret_token": cls.WEBHOOK_SECRET,
        }
        return cls._send_to_n8n(payload)

    @classmethod
    def send_password_reset_email(cls, email, username, code):
        payload = {
            "event": "password_reset",
            "email": email,
            "username": username or "کاربر",
            "code": code,
            "reset_link": "",
            "sender_email": settings.N8N_SENDER_EMAIL,
            "secret_token": cls.WEBHOOK_SECRET,
        }
        return cls._send_to_n8n(payload)
