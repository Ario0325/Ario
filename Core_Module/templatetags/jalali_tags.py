"""
Persian (Jalali) Calendar Template Tags

Template filters for displaying dates in Persian (Jalali) format
across the Ario Shop frontend and admin interface.
"""

from django import template
from datetime import datetime, date
from Core_Module.utils import (
    gregorian_to_jalali,
    gregorian_to_jalali_long,
    format_jalali_datetime,
    time_ago_in_persian,
    PERSIAN_MONTHS,
    PERSIAN_WEEKDAYS,
)

register = template.Library()


@register.filter
def to_jalali(value):
    """
    Convert a datetime or date to Persian short date format (YYYY/MM/DD).
    
    Usage:
        {{ order.created_at|to_jalali }}
        {{ product.created_at|to_jalali }}
    
    Output:
        1403/12/04
    """
    return gregorian_to_jalali(value)


@register.filter
def to_jalali_datetime(value):
    """
    Convert a datetime to Persian format with time (YYYY/MM/DD HH:MM).
    
    Usage:
        {{ order.created_at|to_jalali_datetime }}
    
    Output:
        1403/12/04 14:30
    """
    return gregorian_to_jalali(value, include_time=True)


@register.filter
def to_jalali_long(value):
    """
    Convert a datetime or date to Persian long format (DD Month YYYY).
    
    Usage:
        {{ order.created_at|to_jalali_long }}
    
    Output:
        04 اسفند 1403
    """
    return gregorian_to_jalali_long(value)


@register.filter
def to_jalali_full(value):
    """
    Convert a datetime to Persian full format with weekday, date, and time.
    
    Usage:
        {{ order.created_at|to_jalali_full }}
    
    Output:
        شنبه 04 اسفند 1403 - ساعت 14:30
    """
    if not value:
        return ''
    
    # Get weekday
    if isinstance(value, datetime):
        jd = value
    elif isinstance(value, date):
        from jdatetime import datetime as jdatetime
        jd = jdatetime.fromgregorian(datetime=datetime.combine(value, datetime.min.time()))
    else:
        return str(value)
    
    weekday = PERSIAN_WEEKDAYS[jd.weekday()]
    date_part = gregorian_to_jalali_long(value)
    time_part = f'{jd.hour:02d}:{jd.minute:02d}'
    
    return f'{weekday} {date_part} - ساعت {time_part}'


@register.filter
def to_jalali_with_weekday(value):
    """
    Convert a datetime or date to Persian format with weekday name.
    
    Usage:
        {{ order.created_at|to_jalali_with_weekday }}
    
    Output:
        شنبه 1403/12/04
    """
    return gregorian_to_jalali(value, include_weekday=True)


@register.filter
def time_ago(value):
    """
    Convert a datetime to Persian "time ago" format.
    
    Usage:
        {{ order.created_at|time_ago }}
    
    Output:
        2 ساعت پیش
        5 روز پیش
        2 هفته پیش
    """
    return time_ago_in_persian(value)


@register.filter
def jalali_date(value, format_type='short'):
    """
    Format a datetime/date to Persian format with different styles.
    
    Usage:
        {{ order.created_at|jalali_date:'short' }}
        {{ order.created_at|jalali_date:'long' }}
        {{ order.created_at|jalali_date:'with_time' }}
        {{ order.created_at|jalali_date:'full' }}
    
    Formats:
        - 'short': YYYY/MM/DD (default)
        - 'long': DD Month YYYY
        - 'with_time': YYYY/MM/DD - HH:MM
        - 'full': Weekday, DD Month YYYY - HH:MM
    """
    return format_jalali_datetime(value, format_type)


@register.simple_tag
def persian_month_name(month_number):
    """
    Get Persian month name from month number.
    
    Usage:
        {% persian_month_name 1 %}  {# Output: فروردین #}
        {% persian_month_name 6 %}  {# Output: شهریور #}
    """
    if 1 <= month_number <= 12:
        return PERSIAN_MONTHS[month_number - 1]
    return ''


@register.simple_tag
def persian_weekday_name(weekday_number):
    """
    Get Persian weekday name from weekday number.
    
    Note: In Persian calendar, Saturday (0) is the first day of week.
    
    Usage:
        {% persian_weekday_name 0 %}  {# Output: شنبه #}
        {% persian_weekday_name 6 %}  {# Output: جمعه #}
    """
    if 0 <= weekday_number <= 6:
        return PERSIAN_WEEKDAYS[weekday_number]
    return ''


@register.inclusion_tag('Core_Module/date_picker.html')
def jalali_date_picker(id, name, value=None, required=False):
    """
    Render a Persian date picker input field.
    
    Usage:
        {% jalali_date_picker 'start_date' order.start_date %}
        {% jalali_date_picker 'end_date' '' required=True %}
    """
    return {
        'id': id,
        'name': name,
        'value': value,
        'required': required,
    }
