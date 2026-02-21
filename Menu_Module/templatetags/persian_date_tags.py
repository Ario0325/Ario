# -*- coding: utf-8 -*-
"""
تگ‌های قالب برای تاریخ شمسی
"""

from django import template
import jdatetime

register = template.Library()

# نام ماه‌های شمسی به فارسی
PERSIAN_MONTHS = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
]

# نام روزهای هفته به فارسی
PERSIAN_DAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه']


def _convert_to_jdatetime(value):
    """کمکی برای تبدیل به datetime شمسی"""
    if not value:
        return None
    
    try:
        if isinstance(value, str):
            from django.utils.dateparse import parse_datetime
            value = parse_datetime(value)
        
        if value:
            return jdatetime.datetime.frominstance(value)
    except:
        pass
    
    return None


@register.filter
def to_persian_date(value, format_string='%d %B %Y'):
    """
    تبدیل تاریخ میلادی به شمسی با نام ماه فارسی
    
    استفاده: {{ date_value|to_persian_date }}
    یا: {{ date_value|to_persian_date:"%d %B %Y" }}
    
    فرمت‌های قابل استفاده:
    - %d: روز (01-31)
    - %B: نام ماه فارسی
    - %Y: سال شمسی (1404)
    - %y: سال شمسی دو رقمی (04)
    """
    if not value:
        return ''
    
    jdate = _convert_to_jdatetime(value)
    if not jdate:
        return ''
    
    # جایگزینی نام ماه فارسی
    day = jdate.day
    month = PERSIAN_MONTHS[jdate.month - 1]
    year = jdate.year
    
    # پردازش فرمت
    result = format_string
    result = result.replace('%d', str(day))
    result = result.replace('%B', month)
    result = result.replace('%Y', str(year))
    result = result.replace('%y', str(year)[-2:])
    
    return result


@register.filter
def to_persian_datetime(value, format_string='%d %B %Y - %H:%M'):
    """
    تبدیل تاریخ و زمان میلادی به شمسی
    
    استفاده: {{ datetime_value|to_persian_datetime }}
    """
    if not value:
        return ''
    
    jdate = _convert_to_jdatetime(value)
    if not jdate:
        return ''
    
    day = jdate.day
    month = PERSIAN_MONTHS[jdate.month - 1]
    year = jdate.year
    hour = jdate.hour
    minute = jdate.minute
    
    result = format_string
    result = result.replace('%d', str(day))
    result = result.replace('%B', month)
    result = result.replace('%Y', str(year))
    result = result.replace('%y', str(year)[-2:])
    result = result.replace('%H', f'{hour:02d}')
    result = result.replace('%M', f'{minute:02d}')
    
    return result


@register.filter
def to_persian_date_only(value):
    """
    تبدیل فقط تاریخ (بدون زمان) به شمسی
    
    استفاده: {{ date_value|to_persian_date_only }}
    خروجی: 2 اسفند 1404
    """
    return to_persian_date(value, '%d %B %Y')


@register.simple_tag
def get_persian_year():
    """
    دریافت سال جاری شمسی
    
    استفاده: {% get_persian_year %}
    """
    return jdatetime.datetime.now().year


@register.filter
def to_persian_time(value):
    """
    تبدیل زمان به فرمت فارسی
    
    استفاده: {{ time_value|to_persian_time }}
    """
    if not value:
        return ''
    
    jdate = _convert_to_jdatetime(value)
    if not jdate:
        return ''
    
    return f'{jdate.hour:02d}:{jdate.minute:02d}'


@register.filter
def to_persian_day_name(value):
    """
    دریافت نام روز هفته
    
    استفاده: {{ date_value|to_persian_day_name }}
    """
    if not value:
        return ''
    
    jdate = _convert_to_jdatetime(value)
    if not jdate:
        return ''
    
    # در jdatetime شنبه = 0
    return PERSIAN_DAYS[jdate.weekday()]
