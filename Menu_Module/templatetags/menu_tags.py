from django import template
from Menu_Module.models import MenuItem

register = template.Library()


@register.inclusion_tag('menu/render_menu.html')
def render_main_menu():
    menu_items = MenuItem.objects.filter(
        menu_type='main',
        is_active=True,
        parent__isnull=True
    ).prefetch_related('children').order_by('order')

    return {'menu_items': menu_items}


@register.inclusion_tag('menu/render_submenu.html')
def render_submenu(parent_item):
    children = parent_item.get_children()
    return {'children': children}