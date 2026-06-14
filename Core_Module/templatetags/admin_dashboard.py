from django import template
from django.db.models import Sum
from django.utils import timezone
from datetime import timedelta

register = template.Library()


@register.simple_tag
def dashboard_stats():
    from Cart_Module.models import Order
    from Products_Module.models import Product, ProductReview

    now = timezone.now()
    month_ago = now - timedelta(days=30)

    return {
        'total_orders': Order.objects.count(),
        'month_revenue': Order.objects.filter(
            created_at__gte=month_ago,
            status__in=['paid', 'processing', 'shipped', 'delivered']
        ).aggregate(total=Sum('total'))['total'] or 0,
        'total_products': Product.objects.filter(is_active=True).count(),
        'pending_reviews': ProductReview.objects.filter(is_approved=False).count(),
    }


@register.simple_tag
def dashboard_recent_orders():
    from Cart_Module.models import Order
    return Order.objects.select_related('user').order_by('-created_at')[:10]
