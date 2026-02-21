from django.db import models
from django.conf import settings


class UserProfile(models.Model):
    """پروفایل کاربر - نام، تلفن، آدرس برای داشبورد و فاکتور"""
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='profile',
        verbose_name='کاربر',
    )
    full_name = models.CharField(max_length=200, blank=True, verbose_name='نام و نام خانوادگی')
    phone = models.CharField(max_length=20, blank=True, verbose_name='شماره تماس')
    address = models.TextField(blank=True, verbose_name='آدرس')
    postal_code = models.CharField(max_length=20, blank=True, verbose_name='کد پستی')
    city = models.CharField(max_length=100, blank=True, verbose_name='شهر')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='تاریخ به‌روزرسانی')

    class Meta:
        verbose_name = 'پروفایل کاربر'
        verbose_name_plural = 'پروفایل‌های کاربران'
        indexes = [
            # Index for city-based lookups
            models.Index(fields=['city'], name='profile_city_idx'),
        ]

    def __str__(self):
        return self.full_name or self.user.email or str(self.user)

    def get_display_name(self):
        return self.full_name or getattr(self.user, 'email', '') or str(self.user)
