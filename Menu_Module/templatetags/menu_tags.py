from django import template
from django.core.cache import cache
from Menu_Module.models import MenuItem

register = template.Library()


@register.inclusion_tag('menu/render_menu.html')
def render_main_menu():
    cache_key = 'render_main_menu_items'
    menu_items = cache.get(cache_key)
    if menu_items is None:
        menu_items = list(MenuItem.objects.filter(
            menu_type='main',
            is_active=True,
            parent__isnull=True
        ).prefetch_related('children').order_by('order'))
        cache.set(cache_key, menu_items, 60 * 15)
    return {'menu_items': menu_items}


@register.inclusion_tag('menu/render_submenu.html')
def render_submenu(parent_item):
    children = parent_item.children.filter(is_active=True).order_by('order')
    return {'children': children}