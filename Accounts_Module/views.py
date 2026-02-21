"""
ویوهای ماژول کاربران - ورود، ثبت‌نام، خروج و بازیابی رمز عبور
"""
from django.shortcuts import render, redirect
from django.contrib.auth import login, logout, get_user_model
from Cart_Module.services import sync_cart_to_db, load_cart_from_db
from django.contrib.auth.decorators import login_required
from django.contrib.auth.views import (
    PasswordResetView,
    PasswordResetDoneView,
    PasswordResetConfirmView,
    PasswordResetCompleteView,
)
from django.contrib import messages
from django.urls import reverse_lazy
from django.views.generic import View
from django.utils.translation import gettext_lazy as _

from .forms import LoginForm, RegisterForm, CustomPasswordResetForm, CustomSetPasswordForm, ProfileForm
from .models import UserProfile

User = get_user_model()


class LoginRegisterView(View):
    """صفحه ورود و ثبت‌نام با تب‌ها (مطابق قالب login.html)"""

    def get(self, request):
        if request.user.is_authenticated:
            return redirect('index')
        return render(request, 'accounts/login_register.html', {
            'login_form': LoginForm(),
            'register_form': RegisterForm(),
        })

    def post(self, request):
        if request.user.is_authenticated:
            return redirect('index')

        # تشخیص فرم ارسالی
        if 'login' in request.POST:
            form = LoginForm(request, data=request.POST)
            if form.is_valid():
                user = form.get_user()
                remember_me = form.cleaned_data.get('remember_me', True)
                if not remember_me:
                    request.session.set_expiry(0)
                # CRITICAL: Regenerate session to prevent session fixation attacks
                request.session.cycle_key()
                login(request, user, backend='Accounts_Module.backends.EmailOrUsernameBackend')
                load_cart_from_db(request)
                messages.success(request, _('با موفقیت وارد شدید.'))
                next_url = request.GET.get('next', reverse_lazy('index'))
                return redirect(next_url)
            return render(request, 'accounts/login_register.html', {
                'login_form': form,
                'register_form': RegisterForm(),
                'active_tab': 'login',
            })

        if 'register' in request.POST:
            form = RegisterForm(request.POST)
            if form.is_valid():
                user = form.save()
                # CRITICAL: Regenerate session after registration
                request.session.cycle_key()
                login(request, user, backend='Accounts_Module.backends.EmailOrUsernameBackend')
                load_cart_from_db(request)
                messages.success(request, _('ثبت‌نام با موفقیت انجام شد. به فروشگاه خوش آمدید.'))
                return redirect('index')
            return render(request, 'accounts/login_register.html', {
                'login_form': LoginForm(),
                'register_form': form,
                'active_tab': 'register',
            })

        return redirect('accounts:login_register')


class LogoutView(View):
    """خروج از حساب کاربری"""

    def get(self, request):
        sync_cart_to_db(request)
        logout(request)
        messages.info(request, _('از حساب خود خارج شدید.'))
        return redirect('index')


# بازیابی رمز عبور - با استفاده از ویوهای استاندارد جنگو
class ForgetPasswordView(PasswordResetView):
    """درخواست لینک بازیابی رمز - ارسال ایمیل"""
    template_name = 'accounts/forget_password.html'
    form_class = CustomPasswordResetForm
    email_template_name = 'accounts/emails/password_reset_email.html'
    subject_template_name = 'accounts/emails/password_reset_subject.txt'
    success_url = reverse_lazy('accounts:password_reset_done')


class ForgetPasswordDoneView(PasswordResetDoneView):
    """صفحه تأیید ارسال ایمیل"""
    template_name = 'accounts/forget_password_done.html'


class ForgetPasswordConfirmView(PasswordResetConfirmView):
    """صفحه تعیین رمز جدید با توکن"""
    template_name = 'accounts/forget_password_confirm.html'
    form_class = CustomSetPasswordForm
    success_url = reverse_lazy('accounts:password_reset_complete')


class ForgetPasswordCompleteView(PasswordResetCompleteView):
    """صفحه اتمام بازیابی رمز"""
    template_name = 'accounts/forget_password_complete.html'


@login_required
def dashboard_view(request):
    """داشبورد کاربر - ویرایش اطلاعات پروفایل"""
    profile, created = UserProfile.objects.get_or_create(user=request.user)
    if request.method == 'POST':
        form = ProfileForm(request.POST, instance=profile)
        if form.is_valid():
            form.save()
            messages.success(request, _('اطلاعات با موفقیت ذخیره شد.'))
            return redirect('accounts:dashboard')
    else:
        form = ProfileForm(instance=profile)
    return render(request, 'accounts/dashboard.html', {
        'form': form,
        'profile': profile,
    })


@login_required
def user_orders_view(request):
    """لیست سفارشات کاربر"""
    from Cart_Module.models import Order
    orders = Order.objects.filter(user=request.user).prefetch_related('items').order_by('-created_at')
    return render(request, 'accounts/orders.html', {
        'orders': orders,
    })


@login_required
def user_order_detail_view(request, order_id):
    """جزئیات یک سفارش"""
    from Cart_Module.models import Order
    from django.http import Http404
    try:
        order = Order.objects.prefetch_related('items__product').get(id=order_id, user=request.user)
    except Order.DoesNotExist:
        raise Http404("سفارش یافت نشد")
    return render(request, 'accounts/order_detail.html', {
        'order': order,
    })


@login_required
def user_order_cancel_view(request, order_id):
    """لغو سفارش - فقط برای سفارشاتی که ارسال نشده‌اند"""
    from Cart_Module.models import Order
    from django.http import Http404, HttpResponseForbidden
    
    try:
        order = Order.objects.get(id=order_id, user=request.user)
    except Order.DoesNotExist:
        raise Http404("سفارش یافت نشد")
    
    # سفارشات قابل لغو: pending, paid, processing
    cancellable_statuses = ['pending', 'paid', 'processing']
    
    if order.status not in cancellable_statuses:
        messages.error(request, _('این سفارش قابل لغو نیست.'))
        return redirect('accounts:order_detail', order_id=order.id)
    
    if request.method == 'POST':
        order.status = 'cancelled'
        order.save(update_fields=['status', 'updated_at'])
        messages.success(request, _('سفارش با موفقیت لغو شد.'))
        return redirect('accounts:orders')
    
    return redirect('accounts:order_detail', order_id=order.id)


@login_required
def user_comments_view(request):
    """لیست نظرات کاربر"""
    from Products_Module.models import ProductReview
    reviews = ProductReview.objects.filter(user=request.user).select_related('product').order_by('-created_at')
    return render(request, 'accounts/comments.html', {
        'reviews': reviews,
    })
