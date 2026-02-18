"""
سرویس‌های سبد خرید و کد تخفیف
"""
from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from .models import CartItem

CART_SESSION_KEY = 'cart'
DISCOUNT_SESSION_KEY = 'discount_code'


# ─────────────────────────────────────────────────────────────────────────────
# سرویس‌های سبد خرید (DB sync)
# ─────────────────────────────────────────────────────────────────────────────

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

        CartItem.objects.filter(user=request.user).exclude(
            product_id__in=list(session_cart.keys())
        ).delete()


# ─────────────────────────────────────────────────────────────────────────────
# سرویس‌های کد تخفیف
# ─────────────────────────────────────────────────────────────────────────────

def get_active_discount_code(request):
    """
    کد تخفیف فعال در سشن را برمی‌گرداند.
    اگر کدی در سشن نباشد یا کد دیگر معتبر نباشد، None برمی‌گرداند.
    """
    from .models import DiscountCode

    code_str = request.session.get(DISCOUNT_SESSION_KEY)
    if not code_str:
        return None

    try:
        code = DiscountCode.objects.select_related('product').get(
            code=code_str.upper(),
            is_active=True,
        )
    except DiscountCode.DoesNotExist:
        # کد دیگر وجود ندارد یا غیرفعال شده - از سشن پاک کن
        request.session.pop(DISCOUNT_SESSION_KEY, None)
        request.session.modified = True
        return None

    return code


def validate_discount_code(code_str, cart_items, user, request=None):
    """
    اعتبارسنجی کامل یک کد تخفیف.

    پارامترها:
        code_str: رشته کد تخفیف
        cart_items: لیست آیتم‌های سبد (از _cart_item_list)
        user: شیء کاربر
        request: درخواست HTTP (اختیاری)

    برمی‌گرداند:
        (discount_code_obj, error_message)
        اگر معتبر باشد: (DiscountCode, None)
        اگر نامعتبر باشد: (None, 'پیام خطا')
    """
    from .models import DiscountCode

    if not code_str:
        return None, 'کد تخفیف وارد نشده است.'

    code_str = code_str.strip().upper()

    try:
        code = DiscountCode.objects.select_related('product').get(code=code_str)
    except DiscountCode.DoesNotExist:
        return None, 'کد تخفیف وارد شده معتبر نیست.'

    # بررسی فعال بودن
    if not code.is_active:
        return None, 'این کد تخفیف فعال نیست.'

    # بررسی تاریخ شروع
    now = timezone.now()
    if code.starts_at and now < code.starts_at:
        return None, 'این کد تخفیف هنوز فعال نشده است.'

    # بررسی تاریخ انقضا
    if code.ends_at and now > code.ends_at:
        return None, 'این کد تخفیف منقضی شده است.'

    # بررسی سقف کل استفاده
    if not code.has_usage_remaining():
        return None, 'ظرفیت استفاده از این کد تخفیف تمام شده است.'

    # بررسی سقف استفاده هر کاربر
    if not code.user_can_use(user):
        return None, 'شما قبلاً از این کد تخفیف استفاده کرده‌اید.'

    # بررسی حداقل مبلغ سفارش
    cart_total = sum(item['total'] for item in cart_items)
    if code.min_order_amount and cart_total < code.min_order_amount:
        return None, (
            f'حداقل مبلغ سفارش برای استفاده از این کد '
            f'{code.min_order_amount:,.0f} تومان است.'
        )

    # بررسی وجود محصول در سبد (برای scope=product)
    if code.scope == DiscountCode.SCOPE_PRODUCT:
        product_ids_in_cart = {item['product'].id for item in cart_items}
        if code.product_id not in product_ids_in_cart:
            product_name = code.product.name if code.product else 'محصول مورد نظر'
            return None, f'این کد تخفیف فقط برای «{product_name}» معتبر است و آن محصول در سبد شما نیست.'

    return code, None


def apply_discount_to_session(request, code_str):
    """کد تخفیف را در سشن ذخیره می‌کند."""
    request.session[DISCOUNT_SESSION_KEY] = code_str.strip().upper()
    request.session.modified = True


def remove_discount_from_session(request):
    """کد تخفیف را از سشن حذف می‌کند."""
    request.session.pop(DISCOUNT_SESSION_KEY, None)
    request.session.modified = True


def calculate_cart_with_discount(cart_items, discount_code):
    """
    محاسبه مبالغ سبد خرید با احتساب تخفیف.

    برمی‌گرداند:
        dict با کلیدهای:
            subtotal: جمع قبل از تخفیف
            discount_amount: مبلغ تخفیف
            total_payable: مبلغ قابل پرداخت
            discounted_product_id: شناسه محصول تخفیف‌خورده (یا None)
    """
    subtotal = sum(item['total'] for item in cart_items)

    if discount_code:
        discount_amount, base_amount, discounted_product_id = discount_code.get_discount_for_cart(cart_items)
    else:
        discount_amount = Decimal('0')
        discounted_product_id = None

    total_payable = max(subtotal - discount_amount, Decimal('0'))

    return {
        'subtotal': subtotal,
        'discount_amount': discount_amount,
        'total_payable': total_payable,
        'discounted_product_id': discounted_product_id,
    }
