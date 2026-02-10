"""
Context processors for Products Module
Provides global context data for all templates
"""

from .models import Category


def navbar_categories(request):
    """
    Context processor to provide categories for navbar
    Returns only parent categories (where parent is None) that are active
    """
    categories = Category.objects.filter(
        is_active=True,
        parent__isnull=True
    ).prefetch_related('children').order_by('name')
    
    return {
        'navbar_categories': categories
    }
