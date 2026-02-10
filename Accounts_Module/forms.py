"""
فرم‌های ماژول کاربران - ورود، ثبت‌نام و بازیابی رمز عبور
"""
from django import forms
from django.contrib.auth.forms import (
    AuthenticationForm,
    UserCreationForm,
    PasswordResetForm,
    SetPasswordForm,
)
from django.contrib.auth import get_user_model

from .models import UserProfile

User = get_user_model()


class LoginForm(AuthenticationForm):
    """فرم ورود با پشتیبانی از مرا به خاطر بسپار"""

    username = forms.CharField(
        label='نام کاربری یا آدرس ایمیل',
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'id': 'singin-email-2',
            'placeholder': 'نام کاربری یا ایمیل',
            'autocomplete': 'username',
        }),
    )
    password = forms.CharField(
        label='رمز عبور',
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'id': 'singin-password-2',
            'placeholder': 'رمز عبور',
            'autocomplete': 'current-password',
        }),
    )
    remember_me = forms.BooleanField(
        required=False,
        initial=True,
        widget=forms.CheckboxInput(attrs={'class': 'custom-control-input', 'id': 'signin-remember-2'}),
    )


class RegisterForm(UserCreationForm):
    """فرم ثبت‌نام با ایمیل و رمز عبور"""

    email = forms.EmailField(
        label='آدرس ایمیل',
        widget=forms.EmailInput(attrs={
            'class': 'form-control',
            'id': 'register-email-2',
            'placeholder': 'example@email.com',
            'autocomplete': 'email',
        }),
    )
    password1 = forms.CharField(
        label='رمز عبور',
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'id': 'register-password-2',
            'placeholder': 'حداقل ۸ کاراکتر',
            'autocomplete': 'new-password',
        }),
    )
    password2 = forms.CharField(
        label='تکرار رمز عبور',
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'id': 'register-password2-2',
            'placeholder': 'تکرار رمز عبور',
            'autocomplete': 'new-password',
        }),
    )
    accept_terms = forms.BooleanField(
        label='قوانین و مقررات',
        required=True,
        widget=forms.CheckboxInput(attrs={'class': 'custom-control-input', 'id': 'register-policy-2'}),
    )

    class Meta:
        model = User
        fields = ('email', 'password1', 'password2')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['password1'].help_text = None
        self.fields['password2'].help_text = None

    def save(self, commit=True):
        user = super().save(commit=False)
        user.username = self.cleaned_data['email']
        user.email = self.cleaned_data['email']
        if commit:
            user.save()
        return user

    def clean_email(self):
        email = self.cleaned_data.get('email')
        if email and User.objects.filter(email=email).exists():
            raise forms.ValidationError('این ایمیل قبلاً ثبت شده است.')
        return email


class CustomPasswordResetForm(PasswordResetForm):
    """فرم درخواست بازیابی رمز عبور"""

    email = forms.EmailField(
        label='آدرس ایمیل',
        max_length=254,
        widget=forms.EmailInput(attrs={
            'class': 'form-control',
            'placeholder': 'ایمیل خود را وارد کنید',
            'autocomplete': 'email',
        }),
    )


class CustomSetPasswordForm(SetPasswordForm):
    """فرم تعیین رمز عبور جدید پس از دریافت لینک"""

    new_password1 = forms.CharField(
        label='رمز عبور جدید',
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'placeholder': 'رمز عبور جدید',
            'autocomplete': 'new-password',
        }),
    )
    new_password2 = forms.CharField(
        label='تکرار رمز عبور جدید',
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'placeholder': 'تکرار رمز عبور جدید',
            'autocomplete': 'new-password',
        }),
    )


class ProfileForm(forms.ModelForm):
    """فرم ویرایش پروفایل در داشبورد"""

    class Meta:
        model = UserProfile
        fields = ('full_name', 'phone', 'address', 'postal_code', 'city')
        widgets = {
            'full_name': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'نام و نام خانوادگی'}),
            'phone': forms.TextInput(attrs={'class': 'form-control', 'placeholder': '۰۹۱۲۳۴۵۶۷۸۹'}),
            'address': forms.Textarea(attrs={'class': 'form-control', 'rows': 3, 'placeholder': 'آدرس کامل پستی'}),
            'postal_code': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'کد پستی ۱۰ رقمی'}),
            'city': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'شهر'}),
        }
        labels = {
            'full_name': 'نام و نام خانوادگی',
            'phone': 'شماره تماس',
            'address': 'آدرس',
            'postal_code': 'کد پستی',
            'city': 'شهر',
        }
