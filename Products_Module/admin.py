from django.contrib import admin
import jdatetime
from .models import Category, Brand, Product, ProductImage, ProductColor, ProductSize, ProductReview


# نام ماه‌های شمسی به فارسی
PERSIAN_MONTHS = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
]


def to_persian_date_admin(value):
    """تبدیل تاریخ به فرمت شمسی برای ادمین پنل"""
    if not value:
        return ''
    try:
        jdate = jdatetime.datetime.frominstance(value)
        return f'{jdate.day} {PERSIAN_MONTHS[jdate.month - 1]} {jdate.year}'
    except:
        return str(value)


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ['image', 'alt_text', 'is_main', 'order']


class ProductColorInline(admin.TabularInline):
    model = ProductColor
    extra = 1


class ProductSizeInline(admin.TabularInline):
    model = ProductSize
    extra = 1


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'parent', 'is_active', 'products_count', 'created_at_persian']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name']
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ['is_active']

    @admin.display(description='تاریخ ایجاد', ordering='created_at')
    def created_at_persian(self, obj):
        return to_persian_date_admin(obj.created_at)


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active', 'created_at_persian']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name']
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ['is_active']

    @admin.display(description='تاریخ ایجاد', ordering='created_at')
    def created_at_persian(self, obj):
        return to_persian_date_admin(obj.created_at)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'brand', 'price', 'old_price', 'stock', 'is_available', 'is_active', 'label',
                    'views_count']
    list_filter = ['is_active', 'is_available', 'category', 'brand', 'label', 'created_at']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ['price', 'is_available', 'is_active', 'stock']
    inlines = [ProductImageInline, ProductColorInline, ProductSizeInline]
    readonly_fields = ['views_count', 'created_at', 'updated_at']

    fieldsets = (
        ('اطلاعات اصلی', {
            'fields': ('name', 'slug', 'category', 'brand', 'label')
        }),
        ('توضیحات', {
            'fields': ('description', 'full_description', 'additional_info', 'shipping_info')
        }),
        ('قیمت و موجودی', {
            'fields': ('price', 'old_price', 'stock', 'is_available')
        }),
        ('تنظیمات', {
            'fields': ('is_active', 'views_count', 'created_at', 'updated_at')
        }),
    )

    @admin.display(description='تاریخ ایجاد', ordering='created_at')
    def created_at_persian(self, obj):
        return to_persian_date_admin(obj.created_at)


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ['product', 'is_main', 'order', 'created_at_persian']
    list_filter = ['is_main', 'created_at']
    search_fields = ['product__name', 'alt_text']
    list_editable = ['is_main', 'order']

    @admin.display(description='تاریخ ایجاد', ordering='created_at')
    def created_at_persian(self, obj):
        return to_persian_date_admin(obj.created_at)


@admin.register(ProductColor)
class ProductColorAdmin(admin.ModelAdmin):
    list_display = ['product', 'name', 'code', 'is_available']
    list_filter = ['is_available']
    search_fields = ['product__name', 'name']
    list_editable = ['is_available']


@admin.register(ProductSize)
class ProductSizeAdmin(admin.ModelAdmin):
    list_display = ['product', 'size', 'is_available']
    list_filter = ['size', 'is_available']
    search_fields = ['product__name']
    list_editable = ['is_available']


@admin.register(ProductReview)
class ProductReviewAdmin(admin.ModelAdmin):
    list_display = ['product', 'name', 'rating', 'is_approved', 'created_at_persian']
    list_filter = ['is_approved', 'rating', 'created_at']
    search_fields = ['product__name', 'name', 'email', 'comment']
    list_editable = ['is_approved']
    readonly_fields = ['created_at']

    @admin.display(description='تاریخ ایجاد', ordering='created_at')
    def created_at_persian(self, obj):
        return to_persian_date_admin(obj.created_at)