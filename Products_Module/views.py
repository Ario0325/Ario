from django.shortcuts import render, get_object_or_404, redirect
from django.core.paginator import Paginator
from django.db.models import Q, Count, Min, Max
from django.contrib import messages
from django.urls import reverse
from .models import Product, Category, Brand, ProductReview
from .forms import ProductReviewForm


def product_list(request):
    """نمایش لیست محصولات با فیلترینگ"""

    products = Product.objects.filter(is_active=True).select_related('category', 'brand').prefetch_related('images')

    # فیلتر دسته‌بندی
    category_slug = request.GET.get('category')
    selected_category = None
    if category_slug:
        selected_category = get_object_or_404(Category, slug=category_slug, is_active=True)
        products = products.filter(category=selected_category)

    # فیلتر برند
    brand_slugs = request.GET.getlist('brand')
    if brand_slugs:
        products = products.filter(brand__slug__in=brand_slugs)

    # فیلتر سایز
    sizes = request.GET.getlist('size')
    if sizes:
        products = products.filter(sizes__size__in=sizes).distinct()

    # فیلتر رنگ
    colors = request.GET.getlist('color')
    if colors:
        products = products.filter(colors__code__in=colors).distinct()

    # فیلتر قیمت
    min_price = request.GET.get('min_price')
    max_price = request.GET.get('max_price')
    if min_price:
        products = products.filter(price__gte=min_price)
    if max_price:
        products = products.filter(price__lte=max_price)

    # فیلتر موجودی
    only_available = request.GET.get('available')
    if only_available:
        products = products.filter(is_available=True, stock__gt=0)

    # مرتب‌سازی
    sort = request.GET.get('sort', 'popularity')
    if sort == 'popularity':
        products = products.order_by('-views_count')
    elif sort == 'date':
        products = products.order_by('-created_at')
    elif sort == 'price_low':
        products = products.order_by('price')
    elif sort == 'price_high':
        products = products.order_by('-price')
    elif sort == 'rating':
        products = products.order_by('-views_count')  # می‌توانید بعداً با rating واقعی جایگزین کنید

    # Pagination
    paginator = Paginator(products, 12)
    page_number = request.GET.get('page', 1)
    page_obj = paginator.get_page(page_number)

    # دریافت تمام دسته‌بندی‌ها برای سایدبار
    categories = Category.objects.filter(is_active=True).annotate(
        product_count=Count('products', filter=Q(products__is_active=True))
    )

    # دریافت تمام برندها برای سایدبار
    brands = Brand.objects.filter(is_active=True).annotate(
        product_count=Count('products', filter=Q(products__is_active=True))
    )

    # محاسبه محدوده قیمت
    from django.db.models import Min, Max
    price_range = Product.objects.filter(is_active=True).aggregate(
        min_price=Min('price'),
        max_price=Max('price')
    )

    # حفظ پارامترهای GET برای pagination و sort
    get_params = request.GET.copy()
    if 'page' in get_params:
        del get_params['page']
    query_string = get_params.urlencode()

    context = {
        'page_obj': page_obj,
        'products': page_obj.object_list,
        'categories': categories,
        'brands': brands,
        'selected_category': selected_category,
        'price_range': price_range,
        'current_sort': sort,
        'total_products': paginator.count,
        'query_string': query_string,
    }

    return render(request, 'products/product_list.html', context)


def product_detail(request, slug):
    """نمایش جزئیات محصول و ثبت نظر"""

    product = get_object_or_404(
        Product.objects.select_related('category', 'brand').prefetch_related('images', 'colors', 'sizes'),
        slug=slug,
        is_active=True
    )

    # افزایش تعداد بازدید
    product.views_count += 1
    product.save(update_fields=['views_count'])

    # دریافت نظرات تایید شده
    reviews = product.reviews.filter(is_approved=True).order_by('-created_at')

    # فرم نظر و پردازش POST
    initial = {}
    if request.user.is_authenticated:
        initial['name'] = request.user.get_full_name() or request.user.get_username()
        initial['email'] = getattr(request.user, 'email', '') or ''
    review_form = ProductReviewForm(initial=initial)
    if request.method == 'POST' and request.POST.get('submit_review'):
        review_form = ProductReviewForm(request.POST)
        if review_form.is_valid():
            review = review_form.save(commit=False)
            review.product = product
            if request.user.is_authenticated:
                review.name = review.name or request.user.get_full_name() or request.user.get_username()
                review.email = review.email or getattr(request.user, 'email', '') or review.email
            review.is_approved = False
            review.save()
            messages.success(request, 'نظر شما با موفقیت ثبت شد و پس از تأیید نمایش داده می‌شود.')
            return redirect(reverse('products:detail', kwargs={'slug': slug}) + '?review_submitted=1#product-review-tab')

    # محصولات مشابه
    related_products = Product.objects.filter(
        category=product.category,
        is_active=True,
        is_available=True
    ).exclude(id=product.id).select_related('category').prefetch_related('images')[:8]

    # محصول قبلی و بعدی در همان دسته‌بندی (بر اساس تاریخ ایجاد)
    prev_product = Product.objects.filter(
        category=product.category,
        is_active=True,
        created_at__lt=product.created_at
    ).order_by('-created_at').first()

    next_product = Product.objects.filter(
        category=product.category,
        is_active=True,
        created_at__gt=product.created_at
    ).order_by('created_at').first()

    context = {
        'product': product,
        'reviews': reviews,
        'review_form': review_form,
        'related_products': related_products,
        'product_images': product.images.all().order_by('order', 'created_at'),
        'product_colors': product.colors.filter(is_available=True),
        'product_sizes': product.sizes.filter(is_available=True),
        'prev_product': prev_product,
        'next_product': next_product,
    }

    return render(request, 'products/product_detail.html', context)


def category_products(request, slug):
    """نمایش محصولات یک دسته‌بندی"""

    category = get_object_or_404(Category, slug=slug, is_active=True)

    products = Product.objects.filter(
        category=category,
        is_active=True
    ).select_related('category', 'brand').prefetch_related('images')

    # مرتب‌سازی
    sort = request.GET.get('sort', 'popularity')
    if sort == 'popularity':
        products = products.order_by('-views_count')
    elif sort == 'date':
        products = products.order_by('-created_at')
    elif sort == 'price_low':
        products = products.order_by('price')
    elif sort == 'price_high':
        products = products.order_by('-price')

    # Pagination
    paginator = Paginator(products, 12)
    page_number = request.GET.get('page', 1)
    page_obj = paginator.get_page(page_number)

    # دریافت تمام دسته‌بندی‌ها
    categories = Category.objects.filter(is_active=True).annotate(
        product_count=Count('products', filter=Q(products__is_active=True))
    )

    # دریافت برندها
    brands = Brand.objects.filter(is_active=True, products__category=category).distinct().annotate(
        product_count=Count('products', filter=Q(products__is_active=True, products__category=category))
    )

    # حفظ پارامترهای GET برای pagination و sort
    get_params = request.GET.copy()
    if 'page' in get_params:
        del get_params['page']
    query_string = get_params.urlencode()

    context = {
        'category': category,
        'selected_category': category,
        'page_obj': page_obj,
        'products': page_obj.object_list,
        'categories': categories,
        'brands': brands,
        'current_sort': sort,
        'total_products': paginator.count,
        'query_string': query_string,
    }

    return render(request, 'products/product_list.html', context)


def search_products(request):
    """جستجوی محصولات"""

    query = request.GET.get('q', '')

    products = Product.objects.filter(is_active=True)

    if query:
        products = products.filter(
            Q(name__icontains=query) |
            Q(description__icontains=query) |
            Q(category__name__icontains=query) |
            Q(brand__name__icontains=query)
        ).select_related('category', 'brand').prefetch_related('images').distinct()

    # مرتب‌سازی
    sort = request.GET.get('sort', 'popularity')
    if sort == 'popularity':
        products = products.order_by('-views_count')
    elif sort == 'date':
        products = products.order_by('-created_at')
    elif sort == 'price_low':
        products = products.order_by('price')
    elif sort == 'price_high':
        products = products.order_by('-price')

    # Pagination
    paginator = Paginator(products, 12)
    page_number = request.GET.get('page', 1)
    page_obj = paginator.get_page(page_number)

    # دریافت دسته‌بندی‌ها و برندها برای سایدبار
    categories = Category.objects.filter(is_active=True).annotate(
        product_count=Count('products', filter=Q(products__is_active=True))
    )
    brands = Brand.objects.filter(is_active=True).annotate(
        product_count=Count('products', filter=Q(products__is_active=True))
    )

    # حفظ پارامترهای GET برای pagination و sort
    get_params = request.GET.copy()
    if 'page' in get_params:
        del get_params['page']
    query_string = get_params.urlencode()

    context = {
        'query': query,
        'page_obj': page_obj,
        'products': page_obj.object_list,
        'categories': categories,
        'brands': brands,
        'selected_category': None,
        'current_sort': sort,
        'total_products': paginator.count,
        'query_string': query_string,
    }

    return render(request, 'products/product_list.html', context)