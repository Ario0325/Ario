from django.db import transaction
from django.db.models import F

from .models import CartItem
CART_SESSION_KEY = 'cart'


def load_cart_from_db(request):
    """وقتی کاربر وارد شد، سبد ذخیره شده را به سشن منتقل می‌کند."""
    if not request.user.is_authenticated:
        return

    session_cart = request.session.get(CART_SESSION_KEY) or {}
    items = CartItem.objects.filter(user=request.user).select_related('product')
    if not items.exists():
        return

    for item in items:
        pid = str(item.product_id)
        session_cart[pid] = max(session_cart.get(pid, 0), item.quantity)

    request.session[CART_SESSION_KEY] = session_cart
    request.session.modified = True


def sync_cart_to_db(request):
    """سبد سشن را در خروج/ورود در دیتابیس ذخیره می‌کند."""
    if not request.user.is_authenticated:
        return

    session_cart = request.session.get(CART_SESSION_KEY) or {}
    if not session_cart:
        CartItem.objects.filter(user=request.user).delete()
        return

    with transaction.atomic():
        for pid, qty in session_cart.items():
            if qty < 1:
                continue
            CartItem.objects.update_or_create(
                user=request.user,
                product_id=int(pid),
                defaults={'quantity': qty},
            )

        CartItem.objects.filter(user=request.user).exclude(product_id__in=list(session_cart.keys())).delete()
