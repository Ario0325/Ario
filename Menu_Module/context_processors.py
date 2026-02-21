from django.core.cache import cache
from .models import MenuItem
from Products_Module.models import Category


def menu_items(request):
    """Context processor for main menu items with caching"""
    
    # Try to get from cache first
    cache_key = 'main_menu_items'
    main_menu = cache.get(cache_key)
    
    if main_menu is None:
        main_menu = list(MenuItem.objects.filter(
            menu_type='main',
            is_active=True,
            parent__isnull=True
        ).prefetch_related('children').order_by('order'))
        # Cache for 15 minutes
        cache.set(cache_key, main_menu, 60 * 15)
    
    # Categories - try cache first
    cat_cache_key = 'parent_categories'
    categories = cache.get(cat_cache_key)
    
    if categories is None:
        categories = list(Category.objects.filter(is_active=True, parent__isnull=True))
        cache.set(cat_cache_key, categories, 60 * 15)
    
    return {
        'main_menu_items': main_menu,
        'categories': categories
    }