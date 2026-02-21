from django.db import models
from django.conf import settings
from django.utils.text import slugify
from django.urls import reverse


class Category(models.Model):
    """مدل دسته‌بندی محصولات"""
    name = models.CharField(max_length=200, verbose_name='نام دسته‌بندی')
    slug = models.SlugField(max_length=200, unique=True, allow_unicode=True, verbose_name='نامک')
    image = models.ImageField(upload_to='categories/', blank=True, null=True, verbose_name='تصویر')
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children',
                               verbose_name='دسته والد')
    is_active = models.BooleanField(default=True, verbose_name='فعال')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='تاریخ به‌روزرسانی')

    class Meta:
        verbose_name = 'دسته‌بندی'
        verbose_name_plural = 'دسته‌بندی‌ها'
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name, allow_unicode=True)
        super().save(*args, **kwargs)

    def get_absolute_url(self):
        return reverse('products:category', kwargs={'slug': self.slug})

    @property
    def products_count(self):
        """تعداد محصولات در این دسته‌بندی"""
        return self.products.filter(is_active=True, is_available=True).count()


class Brand(models.Model):
    """مدل برند محصولات"""
    name = models.CharField(max_length=200, verbose_name='نام برند')
    slug = models.SlugField(max_length=200, unique=True, allow_unicode=True, verbose_name='نامک')
    logo = models.ImageField(upload_to='brands/', blank=True, null=True, verbose_name='لوگو')
    is_active = models.BooleanField(default=True, verbose_name='فعال')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')

    class Meta:
        verbose_name = 'برند'
        verbose_name_plural = 'برندها'
        ordering = ['name']

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name, allow_unicode=True)
        super().save(*args, **kwargs)


class Product(models.Model):
    """مدل محصول"""

    LABEL_CHOICES = [
        ('new', 'جدید'),
        ('sale', 'تخفیف'),
        ('hot', 'داغ'),
        ('top', 'برتر'),
        ('out', 'ناموجود'),
    ]

    name = models.CharField(max_length=300, verbose_name='نام محصول')
    slug = models.SlugField(max_length=300, unique=True, allow_unicode=True, verbose_name='نامک')
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products', verbose_name='دسته‌بندی')
    brand = models.ForeignKey(Brand, on_delete=models.SET_NULL, null=True, blank=True, related_name='products',
                              verbose_name='برند')

    description = models.TextField(verbose_name='توضیحات کوتاه')
    full_description = models.TextField(verbose_name='توضیحات کامل', blank=True)
    additional_info = models.TextField(verbose_name='اطلاعات بیشتر', blank=True)
    shipping_info = models.TextField(verbose_name='اطلاعات ارسال', blank=True,
                                     default='ارسال رایگان برای سفارشات بالای 50 هزار تومان')

    price = models.DecimalField(max_digits=12, decimal_places=0, verbose_name='قیمت')
    old_price = models.DecimalField(max_digits=12, decimal_places=0, null=True, blank=True, verbose_name='قیمت قبلی')

    stock = models.IntegerField(default=0, verbose_name='موجودی انبار')
    is_available = models.BooleanField(default=True, verbose_name='موجود است')
    is_active = models.BooleanField(default=True, verbose_name='فعال')

    label = models.CharField(max_length=10, choices=LABEL_CHOICES, blank=True, null=True, verbose_name='برچسب')

    views_count = models.IntegerField(default=0, verbose_name='تعداد بازدید')

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='تاریخ به‌روزرسانی')

    class Meta:
        verbose_name = 'محصول'
        verbose_name_plural = 'محصولات'
        ordering = ['-created_at']
        indexes = [
            # Index for filtering by active status and availability
            models.Index(fields=['is_active', 'is_available'], name='product_active_avail_idx'),
            # Index for ordering by views (trending products)
            models.Index(fields=['-views_count'], name='product_views_idx'),
            # Index for category filtering
            models.Index(fields=['category', 'is_active'], name='product_category_idx'),
            # Index for price range filtering
            models.Index(fields=['price'], name='product_price_idx'),
            # Index for created_at ordering
            models.Index(fields=['-created_at'], name='product_created_idx'),
        ]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name, allow_unicode=True)
        super().save(*args, **kwargs)

    def get_absolute_url(self):
        return reverse('products:detail', kwargs={'slug': self.slug})

    @property
    def discount_percentage(self):
        """درصد تخفیف"""
        if self.old_price and self.old_price > self.price:
            return int(((self.old_price - self.price) / self.old_price) * 100)
        return 0

    @property
    def average_rating(self):
        """میانگین امتیاز - با استفاده از aggregation برای عملکرد بهتر"""
        from django.db.models import Avg
        result = self.reviews.filter(is_approved=True).aggregate(avg_rating=Avg('rating'))
        return result['avg_rating'] or 0

    def get_rating_percentage(self):
        """درصد امتیاز برای نمایش ستاره‌ها"""
        return int((self.average_rating / 5) * 100)


class ProductImage(models.Model):
    """مدل تصاویر محصول"""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images', verbose_name='محصول')
    image = models.ImageField(upload_to='products/', verbose_name='تصویر')
    alt_text = models.CharField(max_length=200, blank=True, verbose_name='متن جایگزین')
    is_main = models.BooleanField(default=False, verbose_name='تصویر اصلی')
    order = models.IntegerField(default=0, verbose_name='ترتیب')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')

    class Meta:
        verbose_name = 'تصویر محصول'
        verbose_name_plural = 'تصاویر محصول'
        ordering = ['order', 'created_at']

    def __str__(self):
        return f'{self.product.name} - تصویر {self.order}'


class ProductColor(models.Model):
    """مدل رنگ‌های محصول"""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='colors', verbose_name='محصول')
    name = models.CharField(max_length=50, verbose_name='نام رنگ')
    code = models.CharField(max_length=7, verbose_name='کد رنگ', help_text='مثال: #FF0000')
    is_available = models.BooleanField(default=True, verbose_name='موجود است')

    class Meta:
        verbose_name = 'رنگ محصول'
        verbose_name_plural = 'رنگ‌های محصول'

    def __str__(self):
        return f'{self.product.name} - {self.name}'


class ProductSize(models.Model):
    """مدل سایزهای محصول"""

    SIZE_CHOICES = [
        ('xs', 'XS'),
        ('s', 'S'),
        ('m', 'M'),
        ('l', 'L'),
        ('xl', 'XL'),
        ('xxl', 'XXL'),
    ]

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='sizes', verbose_name='محصول')
    size = models.CharField(max_length=10, choices=SIZE_CHOICES, verbose_name='سایز')
    is_available = models.BooleanField(default=True, verbose_name='موجود است')

    class Meta:
        verbose_name = 'سایز محصول'
        verbose_name_plural = 'سایزهای محصول'
        unique_together = ['product', 'size']

    def __str__(self):
        return f'{self.product.name} - {self.get_size_display()}'


class ProductReview(models.Model):
    """مدل نظرات محصول"""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews', verbose_name='محصول')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='product_reviews',
        verbose_name='کاربر',
    )
    name = models.CharField(max_length=200, verbose_name='نام')
    email = models.EmailField(verbose_name='ایمیل')
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)], verbose_name='امتیاز')
    title = models.CharField(max_length=200, verbose_name='عنوان نظر')
    comment = models.TextField(verbose_name='متن نظر')
    is_approved = models.BooleanField(default=False, verbose_name='تایید شده')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='تاریخ ایجاد')

    class Meta:
        verbose_name = 'نظر محصول'
        verbose_name_plural = 'نظرات محصول'
        ordering = ['-created_at']
        indexes = [
            # Index for approved reviews filtering
            models.Index(fields=['product', 'is_approved'], name='review_product_approved_idx'),
            # Index for user reviews
            models.Index(fields=['user', '-created_at'], name='review_user_date_idx'),
        ]

    def __str__(self):
        return f'{self.name} - {self.product.name}'