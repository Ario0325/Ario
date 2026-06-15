from django.db import models


class SiteSetting(models.Model):
    show_newsletter_popup = models.BooleanField(
        default=True,
        verbose_name='نمایش پاپ‌آپ خبرنامه',
        help_text='در صورت غیرفعال بودن، پاپ‌آپ خبرنامه در سایت نمایش داده نمی‌شود.'
    )
    updated_at = models.DateTimeField(auto_now=True, verbose_name='تاریخ بروزرسانی')

    class Meta:
        verbose_name = 'تنظیمات سایت'
        verbose_name_plural = 'تنظیمات سایت'

    def __str__(self):
        return 'تنظیمات سایت'

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj
