"""
Admin Mixins for Persian (Jalali) Calendar

Provides mixin classes for Django admin to automatically use
Persian (Jalali) date displays and widgets.
"""

from django.contrib import admin
from django import forms
from django.db import models
from Core_Module.admin_widgets import (
    JalaliDateWidget,
    JalaliDateTimeWidget,
    ReadOnlyJalaliDateWidget,
)
from Core_Module.utils import gregorian_to_jalali, PERSIAN_MONTHS


class JalaliDateMixin:
    """
    Mixin to automatically convert date fields to Jalali display in admin.
    
    Usage:
        @admin.register(MyModel)
        class MyModelAdmin(JalaliDateMixin, admin.ModelAdmin):
            ...
    """
    
    # Override this to specify which date fields should use Jalali display
    jalali_date_fields = []
    
    # Override this to specify datetime fields
    jalali_datetime_fields = []
    
    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        
        # Apply Jalali widgets to date fields
        for field_name in self.jalali_date_fields:
            if field_name in form.base_fields:
                form.base_fields[field_name].widget = JalaliDateWidget()
        
        # Apply Jalali datetime widgets
        for field_name in self.jalali_datetime_fields:
            if field_name in form.base_fields:
                form.base_fields[field_name].widget = JalaliDateTimeWidget()
        
        return form


class JalaliReadonlyMixin:
    """
    Mixin to display date fields in Jalali format in admin list views.
    
    Usage:
        @admin.register(MyModel)
        class MyModelAdmin(JalaliReadonlyMixin, admin.ModelAdmin):
            list_display = ('...', 'created_at_jalali', 'updated_at_jalali')
            readonly_fields = ('...', 'created_at_jalali_display', 'updated_at_jalali_display')
    """
    
    # Fields to display as Jalali in list_display
    jalali_list_display_fields = []
    
    # Fields to display as Jalali in readonly_fields
    jalali_readonly_fields = []
    
    @admin.display(description='تاریخ ثبت', ordering='created_at')
    def created_at_jalali(self, obj):
        """Display created_at in Jalali format."""
        if obj.created_at:
            return gregorian_to_jalali(obj.created_at)
        return '—'
    
    @admin.display(description='تاریخ بروزرسانی', ordering='updated_at')
    def updated_at_jalali(self, obj):
        """Display updated_at in Jalali format."""
        if obj.updated_at:
            return gregorian_to_jalali(obj.updated_at)
        return '—'
    
    @admin.display(description='تاریخ ثبت', ordering='created_at')
    def created_at_jalali_display(self, obj):
        """Display created_at in Jalali format for detail view."""
        if obj.created_at:
            return gregorian_to_jalali(obj.created_at, include_time=True)
        return '—'
    created_at_jalali_display.short_description = 'تاریخ ثبت'
    
    @admin.display(description='تاریخ بروزرسانی', ordering='updated_at')
    def updated_at_jalali_display(self, obj):
        """Display updated_at in Jalali format for detail view."""
        if obj.updated_at:
            return gregorian_to_jalali(obj.updated_at, include_time=True)
        return '—'
    updated_at_jalali_display.short_description = 'تاریخ بروزرسانی'


class JalaliDateAdminMixin(JalaliDateMixin, JalaliReadonlyMixin):
    """
    Complete mixin for Jalali date support in admin.
    
    Combines both widget replacement and readonly display.
    
    Usage:
        @admin.register(MyModel)
        class MyModelAdmin(JalaliDateAdminMixin, admin.ModelAdmin):
            jalali_date_fields = ['start_date', 'end_date']
            jalali_list_display_fields = ['created_at', 'updated_at']
    """
    pass


# Utility functions for admin customization
def create_jalali_date_method(field_name, verbose_name=None):
    """
    Factory function to create a Jalali date display method.
    
    Usage:
        class MyModelAdmin(admin.ModelAdmin):
            list_display = ('name', created_at_jalali)
            
            @staticmethod
            def created_at_jalali(obj):
                return create_jalali_date_method('created_at', 'تاریخ ثبت')(obj)
    """
    def jalali_date_display(self, obj):
        value = getattr(obj, field_name, None)
        if value:
            return gregorian_to_jalali(value)
        return '—'
    
    jalali_date_display.short_description = verbose_name or field_name
    jalali_date_display.admin_order_field = field_name
    
    return jalali_date_display


def create_jalali_datetime_method(field_name, verbose_name=None):
    """
    Factory function to create a Jalali datetime display method.
    
    Usage:
        class MyModelAdmin(admin.ModelAdmin):
            list_display = ('name', created_at_jalali)
    """
    def jalali_datetime_display(self, obj):
        value = getattr(obj, field_name, None)
        if value:
            return gregorian_to_jalali(value, include_time=True)
        return '—'
    
    jalali_datetime_display.short_description = verbose_name or field_name
    jalali_datetime_display.admin_order_field = field_name
    
    return jalali_datetime_display


# Persian calendar for admin filter
class JalaliDateFieldListFilter(admin.DateFieldListFilter):
    """
    Custom date filter that shows Jalali month names.
    
    Usage:
        @admin.register(MyModel)
        class MyModelAdmin(admin.ModelAdmin):
            list_filter = (
                ('created_at', JalaliDateFieldListFilter),
            )
    """
    def __init__(self, field, request, params, model, model_admin, field_path):
        super().__init__(field, request, params, model, model_admin, field_path)
        # The choices will be rendered with Persian month names
