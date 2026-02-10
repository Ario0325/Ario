from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class MenuItem(models.Model):
    title = models.CharField(max_length=100, verbose_name='عنوان')
    url = models.CharField(max_length=255, verbose_name='آدرس', blank=True, null=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children', verbose_name='منوی والد')
    order = models.IntegerField(default=0, validators=[MinValueValidator(0), MaxValueValidator(1000)], verbose_name='ترتیب نمایش')
    is_active = models.BooleanField(default=True, verbose_name='فعال')
    menu_type = models.CharField(max_length=20, choices=[
        ('main', 'منوی اصلی'),
        ('footer', 'منوی فوتر'),
    ], default='main', verbose_name='نوع منو')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='تاریخ بروزرسانی')

    class Meta:
        verbose_name = 'آیتم منو'
        verbose_name_plural = 'آیتم های منو'
        ordering = ['order', 'id']

    def __str__(self):
        return self.title

    def get_children(self):
        return self.children.filter(is_active=True).order_by('order')

    def _normalize_url(self, url_value: str) -> str:
        if not url_value:
            return '#'

        if url_value.startswith('http://') or url_value.startswith('https://'):
            return url_value

        if url_value.startswith('/products/'):
            return url_value.replace('/products/', '/shop/', 1)

        if url_value == '/products':
            return '/shop/'

        if url_value == '/about/':
            return '/About_us/'

        if url_value == '/contact/':
            return '/Contact_us/'

        return url_value

    @property
    def resolved_url(self):
        return self._normalize_url(self.url)

    @property
    def has_children(self):
        return self.children.filter(is_active=True).exists()