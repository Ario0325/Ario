from django.db import models
from django.conf import settings
from django.utils import timezone


class Order(models.Model):
    """سفارش - برای فاکتور و پرداخت"""

    STATUS_CHOICES = [
        ('pending', 'در انتظار پرداخت'),
        ('paid', 'پرداخت شده'),
        ('processing', 'در حال پردازش'),
        ('shipped', 'ارسال شده'),
        ('delivered', 'تحویل داده شده'),
        ('cancelled', 'لغو شده'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='orders',
        verbose_name='کاربر',
    )
    order_number = models.CharField(max_length=50, unique=True, verbose_name='شماره سفارش')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='وضعیت')

    # اطلاعات تحویل (می‌توان از پروفایل کاربر پر شود)
    full_name = models.CharField(max_length=200, verbose_name='نام مشتری')
    phone = models.CharField(max_length=20, verbose_name='شماره تماس')
    email = models.EmailField(blank=True, verbose_name='ایمیل')
    address = models.TextField(verbose_name='آدرس')
    postal_code = models.CharField(max_length=20, blank=True, verbose_name='کد پستی')
    city = models.CharField(max_length=100, blank=True, verbose_name='شهر')

    total = models.DecimalField(max_digits=14, decimal_places=0, default=0, verbose_name='مبلغ نهایی')
    shipping_cost = models.DecimalField(max_digits=12, decimal_places=0, default=0, verbose_name='هزینه ارسال')
    tax = models.DecimalField(max_digits=12, decimal_places=0, default=0, verbose_name='مالیات')

    created_at = models.DateTimeField(default=timezone.now, verbose_name='تاریخ ثبت')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='تاریخ به‌روزرسانی')

    class Meta:
        verbose_name = 'سفارش'
        verbose_name_plural = 'سفارش‌ها'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.order_number} - {self.full_name}'

    def save(self, *args, **kwargs):
        if not self.order_number:
            import random
            from django.utils import timezone
            date_part = timezone.now().strftime('%Y%m%d')
            self.order_number = f'ORD-{date_part}-{random.randint(1000, 9999)}'
        super().save(*args, **kwargs)


class OrderItem(models.Model):
    """آیتم سفارش - هر محصول در سفارش"""
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name='items',
        verbose_name='سفارش',
    )
    product = models.ForeignKey(
        'Products_Module.Product',
        on_delete=models.SET_NULL,
        null=True,
        related_name='order_items',
        verbose_name='محصول',
    )
    product_name = models.CharField(max_length=300, verbose_name='نام محصول')
    quantity = models.PositiveIntegerField(default=1, verbose_name='تعداد')
    price = models.DecimalField(max_digits=12, decimal_places=0, verbose_name='قیمت واحد')
    total = models.DecimalField(max_digits=14, decimal_places=0, verbose_name='مجموع')

    class Meta:
        verbose_name = 'آیتم سفارش'
        verbose_name_plural = 'آیتم‌های سفارش'

    def __str__(self):
        return f'{self.product_name} x {self.quantity}'

    def save(self, *args, **kwargs):
        if self.price is not None and self.quantity is not None:
            self.total = self.price * self.quantity
        super().save(*args, **kwargs)


class CartItem(models.Model):
    """آیتم سبد خرید پایدار برای هر کاربر"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='cart_items',
        verbose_name='کاربر',
    )
    product = models.ForeignKey(
        'Products_Module.Product',
        on_delete=models.CASCADE,
        related_name='cart_items',
        verbose_name='محصول',
    )
    quantity = models.PositiveIntegerField(default=1, verbose_name='تعداد')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='تاریخ به‌روزرسانی')

    class Meta:
        verbose_name = 'آیتم سبد خرید'
        verbose_name_plural = 'آیتم‌های سبد خرید'
        unique_together = ('user', 'product')

    def __str__(self):
        return f'{self.user} - {self.product} ({self.quantity})'
