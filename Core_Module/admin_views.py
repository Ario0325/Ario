from django.contrib.admin.views.decorators import staff_member_required
from django.db.models import Sum, Count
from django.db.models.functions import TruncDate
from django.http import JsonResponse
from django.utils import timezone
from datetime import timedelta


@staff_member_required
def dashboard_stats_api(request):
    from Cart_Module.models import Order, OrderItem
    from Products_Module.models import Product

    today = timezone.now().date()
    thirty_days_ago = today - timedelta(days=30)

    sales_data = (
        Order.objects.filter(
            created_at__date__gte=thirty_days_ago,
            status__in=['paid', 'processing', 'shipped', 'delivered']
        )
        .annotate(date=TruncDate('created_at'))
        .values('date')
        .annotate(total=Sum('total'), count=Count('id'))
        .order_by('date')
    )

    status_data = (
        Order.objects.values('status')
        .annotate(count=Count('id'))
        .order_by('status')
    )

    top_products = (
        OrderItem.objects.filter(
            order__created_at__date__gte=thirty_days_ago,
            order__status__in=['paid', 'processing', 'shipped', 'delivered']
        )
        .values('product_name')
        .annotate(total_sold=Sum('quantity'), revenue=Sum('total'))
        .order_by('-total_sold')[:5]
    )

    return JsonResponse({
        'sales': [
            {'date': str(s['date']), 'total': int(s['total'] or 0), 'count': s['count']}
            for s in sales_data
        ],
        'statuses': [
            {'status': s['status'], 'count': s['count']}
            for s in status_data
        ],
        'top_products': [
            {'name': p['product_name'], 'sold': p['total_sold'], 'revenue': int(p['revenue'] or 0)}
            for p in top_products
        ],
    })
