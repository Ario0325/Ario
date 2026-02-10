from .models import MenuItem
from Products_Module.models import Category


def menu_items(request):
    main_menu = MenuItem.objects.filter(
        menu_type='main',
        is_active=True,
        parent__isnull=True
    ).prefetch_related('children').order_by('order')

    return {
        'main_menu_items': main_menu,
        'categories': Category.objects.filter(is_active=True, parent__isnull=True)
    }