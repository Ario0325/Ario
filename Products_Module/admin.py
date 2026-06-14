from django.contrib import admin
from django.db import models
from django.http import HttpResponse
from django.utils.safestring import mark_safe
import csv

from .models import Category, Brand, Product, ProductImage, ProductColor, ProductSize, ProductReview

from Core_Module.utils import gregorian_to_jalali, gregorian_to_jalali_long
from Core_Module.admin_widgets import JalaliDateWidget, JalaliDateTimeWidget
from Core_Module.admin_filters import DateRangeFilter, StockLevelFilter, PriceRangeFilter


def to_persian_date_admin(value):
    """تبدیل تاریخ به فرمت شمسی برای ادمین پنل"""
    return gregorian_to_jalali_long(value)


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
    # Use Jalali date widgets
    formfield_overrides = {
        models.DateTimeField: {'widget': JalaliDateTimeWidget},
        models.DateField: {'widget': JalaliDateWidget},
    }
    
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
    # Use Jalali date widgets
    formfield_overrides = {
        models.DateTimeField: {'widget': JalaliDateTimeWidget},
        models.DateField: {'widget': JalaliDateWidget},
    }
    
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
    formfield_overrides = {
        models.DateTimeField: {'widget': JalaliDateTimeWidget},
        models.DateField: {'widget': JalaliDateWidget},
    }
    
    list_display = ['thumbnail', 'name', 'category', 'brand', 'price', 'old_price', 'stock_bar', 'is_available', 'is_active', 'label',
                    'views_count']
    list_filter = ['is_active', 'is_available', 'category', 'brand', 'label', StockLevelFilter, PriceRangeFilter, DateRangeFilter]
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}
    list_editable = ['price', 'is_available', 'is_active']
    inlines = [ProductImageInline, ProductColorInline, ProductSizeInline]
    readonly_fields = ['views_count', 'created_at', 'updated_at']
    actions = ['bulk_activate', 'bulk_deactivate', 'export_csv']

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

    @admin.display(description='تصویر')
    def thumbnail(self, obj):
        main_img = obj.images.filter(is_main=True).first()
        if main_img and main_img.image:
            return mark_safe(
                f'<img src="{main_img.image.url}" style="width:40px;height:40px;border-radius:8px;object-fit:cover;border:1px solid var(--ap-border, #333);">'
            )
        return mark_safe(
            '<div style="width:40px;height:40px;border-radius:8px;background:var(--ap-surface-2, #2a2a3e);'
            'display:flex;align-items:center;justify-content:center;font-size:16px;">🖼️</div>'
        )

    @admin.display(description='موجودی')
    def stock_bar(self, obj):
        if obj.stock <= 0:
            color, bg, label = '#c62828', '#ffebee', 'ناموجود'
            pct = 0
        elif obj.stock <= 5:
            color, bg, label = '#e65100', '#fff3e0', f'{obj.stock} عدد'
            pct = min(obj.stock * 5, 100)
        elif obj.stock <= 20:
            color, bg, label = '#f57c00', '#fff8e1', f'{obj.stock} عدد'
            pct = min(obj.stock * 3, 100)
        else:
            color, bg, label = '#2e7d32', '#e8f5e9', f'{obj.stock} عدد'
            pct = min(obj.stock * 2, 100)
        return mark_safe(
            f'<div style="display:flex;align-items:center;gap:8px;">'
            f'<div style="width:60px;height:6px;background:#333;border-radius:3px;overflow:hidden;">'
            f'<div style="width:{pct}%;height:100%;background:{color};border-radius:3px;"></div>'
            f'</div>'
            f'<span style="color:{color};font-size:12px;font-weight:600;">{label}</span></div>'
        )

    @admin.action(description='✅ فعال‌سازی محصولات انتخاب شده')
    def bulk_activate(self, request, queryset):
        count = queryset.update(is_active=True)
        self.message_user(request, f'{count} محصول فعال شد.')

    @admin.action(description='❌ غیرفعال‌سازی محصولات انتخاب شده')
    def bulk_deactivate(self, request, queryset):
        count = queryset.update(is_active=False)
        self.message_user(request, f'{count} محصول غیرفعال شد.')

    @admin.action(description='📥 خروجی CSV محصولات')
    def export_csv(self, request, queryset):
        response = HttpResponse(content_type='text/csv; charset=utf-8-sig')
        response['Content-Disposition'] = 'attachment; filename=products.csv'
        writer = csv.writer(response)
        writer.writerow(['نام', 'دسته‌بندی', 'برند', 'قیمت', 'موجودی', 'وضعیت'])
        for p in queryset.select_related('category', 'brand'):
            writer.writerow([p.name, p.category, p.brand, p.price, p.stock, 'فعال' if p.is_active else 'غیرفعال'])
        return response

    @admin.display(description='تاریخ ایجاد', ordering='created_at')
    def created_at_persian(self, obj):
        return to_persian_date_admin(obj.created_at)

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('category', 'brand').prefetch_related('images')


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    # Use Jalali date widgets
    formfield_overrides = {
        models.DateTimeField: {'widget': JalaliDateTimeWidget},
        models.DateField: {'widget': JalaliDateWidget},
    }
    
    list_display = ['product', 'is_main', 'order', 'created_at_persian']
    list_filter = ['is_main', 'created_at']
    search_fields = ['product__name', 'alt_text']
    list_editable = ['is_main', 'order']

    @admin.display(description='تاریخ ایجاد', ordering='created_at')
    def created_at_persian(self, obj):
        return to_persian_date_admin(obj.created_at)

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('product')


@admin.register(ProductColor)
class ProductColorAdmin(admin.ModelAdmin):
    list_display = ['product', 'name', 'code', 'is_available']
    list_filter = ['is_available']
    search_fields = ['product__name', 'name']
    list_editable = ['is_available']

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('product')


@admin.register(ProductSize)
class ProductSizeAdmin(admin.ModelAdmin):
    list_display = ['product', 'size', 'is_available']
    list_filter = ['size', 'is_available']
    search_fields = ['product__name']
    list_editable = ['is_available']

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('product')


@admin.register(ProductReview)
class ProductReviewAdmin(admin.ModelAdmin):
    formfield_overrides = {
        models.DateTimeField: {'widget': JalaliDateTimeWidget},
        models.DateField: {'widget': JalaliDateWidget},
    }
    
    list_display = ['product', 'name', 'rating', 'approval_badge', 'created_at_persian']
    list_filter = ['is_approved', 'rating', DateRangeFilter]
    search_fields = ['product__name', 'name', 'email', 'comment']
    list_editable = []
    readonly_fields = ['created_at']
    actions = ['bulk_approve', 'bulk_reject']

    @admin.display(description='وضعیت')
    def approval_badge(self, obj):
        if obj.is_approved:
            return mark_safe(
                '<span style="background:#e8f5e9;color:#2e7d32;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600;">✓ تایید شده</span>'
            )
        return mark_safe(
            '<span style="background:#fff3e0;color:#e65100;padding:3px 10px;border-radius:12px;font-size:12px;font-weight:600;">⏳ در انتظار</span>'
        )

    @admin.action(description='✅ تایید نظرات انتخاب شده')
    def bulk_approve(self, request, queryset):
        count = queryset.update(is_approved=True)
        self.message_user(request, f'{count} نظر تایید شد.')

    @admin.action(description='❌ رد نظرات انتخاب شده')
    def bulk_reject(self, request, queryset):
        count = queryset.update(is_approved=False)
        self.message_user(request, f'{count} نظر رد شد.')

    @admin.display(description='تاریخ ایجاد', ordering='created_at')
    def created_at_persian(self, obj):
        return to_persian_date_admin(obj.created_at)

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('product')
