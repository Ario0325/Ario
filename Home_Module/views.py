from django.shortcuts import render
from Products_Module.models import Product, Category


def index(request):
    """صفحه اصلی"""

    # محصولات جدید (8 محصول آخر)
    new_products = Product.objects.filter(
        is_active=True,
        is_available=True
    ).select_related('category').prefetch_related('images').order_by('-created_at')[:8]

    # محصولات پرفروش (بر اساس بازدید)
    trending_products = Product.objects.filter(
        is_active=True,
        is_available=True
    ).select_related('category').prefetch_related('images').order_by('-views_count')[:8]

    # دسته‌بندی‌های اصلی (6 دسته اول)
    main_categories = Category.objects.filter(
        is_active=True,
        parent=None
    ).prefetch_related('products')[:6]

    context = {
        'new_products': new_products,
        'trending_products': trending_products,
        'main_categories': main_categories,
    }

    return render(request, 'Home_Module/index.html', context)