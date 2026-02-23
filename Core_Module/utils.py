"""
Persian (Jalali) Calendar Utilities for Ario Shop

This module provides utility functions for converting between Gregorian
and Persian (Jalali) dates. All dates in the database remain in Gregorian
format, and conversion happens only at the presentation layer.
"""

import jdatetime
from datetime import datetime, date, time
from typing import Union, Optional
from django.utils import timezone


# Persian month names
PERSIAN_MONTHS = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
]

# Persian day names
PERSIAN_WEEKDAYS = [
    'شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'
]


def gregorian_to_jalali(
    dt: Union[datetime, date],
    include_time: bool = False,
    include_weekday: bool = False
) -> str:
    """
    Convert a Gregorian datetime/date to Persian (Jalali) string.
    
    Args:
        dt: Gregorian datetime or date object
        include_time: Whether to include time in the output
        include_weekday: Whether to include weekday name
        
    Returns:
        Persian formatted date string
        
    Examples:
        >>> gregorian_to_jalali(datetime(2025, 2, 23))
        '1403/12/04'
        >>> gregorian_to_jalali(datetime(2025, 2, 23), include_time=True)
        '1403/12/04 14:30'
        >>> gregorian_to_jalali(datetime(2025, 2, 23), include_weekday=True)
        'شنبه 1403/12/04'
    """
    if not dt:
        return ''
    
    # Handle datetime vs date
    if isinstance(dt, datetime):
        # Convert to jdatetime
        jd = jdatetime.datetime.fromgregorian(datetime=dt)
        date_str = f'{jd.year}/{jd.month:02d}/{jd.day:02d}'
        
        if include_time:
            date_str += f' {jd.hour:02d}:{jd.minute:02d}'
            
        if include_weekday:
            # jdatetime weekday: 6 = Saturday (first day of week in Persian), 0 = Thursday
            # Convert to Persian weekday format
            weekday = PERSIAN_WEEKDAYS[jd.weekday()]
            date_str = f'{weekday} {date_str}'
            
    elif isinstance(dt, date):
        jd = jdatetime.date.fromgregorian(date=dt)
        date_str = f'{jd.year}/{jd.month:02d}/{jd.day:02d}'
        
        if include_weekday:
            weekday = PERSIAN_WEEKDAYS[jd.weekday()]
            date_str = f'{weekday} {date_str}'
    else:
        return str(dt)
    
    return date_str


def gregorian_to_jalali_long(
    dt: Union[datetime, date],
    include_time: bool = False
) -> str:
    """
    Convert a Gregorian datetime/date to long Persian format.
    
    Args:
        dt: Gregorian datetime or date object
        include_time: Whether to include time in the output
        
    Returns:
        Long Persian formatted date string
        
    Examples:
        >>> gregorian_to_jalali_long(datetime(2025, 2, 23))
        '04 اسفند 1403'
        >>> gregorian_to_jalali_long(datetime(2025, 2, 23, 14, 30))
        '04 اسفند 1403 - ساعت 14:30'
    """
    if not dt:
        return ''
    
    if isinstance(dt, datetime):
        jd = jdatetime.datetime.fromgregorian(datetime=dt)
        date_str = f'{jd.day} {PERSIAN_MONTHS[jd.month - 1]} {jd.year}'
        
        if include_time:
            date_str += f' - ساعت {jd.hour:02d}:{jd.minute:02d}'
            
    elif isinstance(dt, date):
        jd = jdatetime.date.fromgregorian(date=dt)
        date_str = f'{jd.day} {PERSIAN_MONTHS[jd.month - 1]} {jd.year}'
    else:
        return str(dt)
    
    return date_str


def jalali_to_gregorian(
    date_str: str,
    time_str: Optional[str] = None
) -> Optional[datetime]:
    """
    Convert a Persian date string to Gregorian datetime.
    
    Args:
        date_str: Persian date string (formats: YYYY/MM/DD, YYYY-MM-DD, YYYYMMDD)
        time_str: Optional time string (format: HH:MM)
        
    Returns:
        Gregorian datetime object or None if invalid
        
    Examples:
        >>> jalali_to_gregorian('1403/12/04')
        datetime.datetime(2025, 2, 23, 0, 0)
        >>> jalali_to_gregorian('1403/12/04', '14:30')
        datetime.datetime(2025, 2, 23, 14, 30)
    """
    if not date_str:
        return None
    
    # Clean the string
    date_str = date_str.strip().replace('-', '/')
    
    # Try different formats
    try:
        # Format: YYYY/MM/DD
        if '/' in date_str:
            parts = date_str.split('/')
            if len(parts) == 3:
                year, month, day = int(parts[0]), int(parts[1]), int(parts[2])
                jd = jdatetime.date(year, month, day)
                greg_date = jd.togregorian()
                
                if time_str:
                    time_parts = time_str.split(':')
                    hour = int(time_parts[0]) if len(time_parts) > 0 else 0
                    minute = int(time_parts[1]) if len(time_parts) > 1 else 0
                    return datetime(
                        greg_date.year, greg_date.month, greg_date.day,
                        hour, minute
                    )
                return datetime(greg_date.year, greg_date.month, greg_date.day)
    except (ValueError, IndexError):
        pass
    
    return None


def get_current_jalali_date() -> jdatetime.date:
    """
    Get the current date in Jalali calendar.
    
    Returns:
        Current jdatetime date object
    """
    return jdatetime.datetime.now().date()


def get_jalali_year_range(start_year: int = None, end_year: int = None) -> list:
    """
    Get a range of Jalali years for dropdowns, etc.
    
    Args:
        start_year: Start year (defaults to current year - 10)
        end_year: End year (defaults to current year + 10)
        
    Returns:
        List of year tuples (year, year) for form choices
    """
    current_year = jdatetime.datetime.now().year
    
    if start_year is None:
        start_year = current_year - 10
    if end_year is None:
        end_year = current_year + 10
    
    return [(year, str(year)) for year in range(start_year, end_year + 1)]


def get_persian_months() -> list:
    """
    Get Persian month names for form choices.
    
    Returns:
        List of month tuples (month_number, month_name)
    """
    return [(i + 1, name) for i, name in enumerate(PERSIAN_MONTHS)]


def get_persian_month_name(month: int) -> str:
    """
    Get Persian month name for a given month number.
    
    Args:
        month: Month number (1-12)
        
    Returns:
        Persian month name
    """
    if 1 <= month <= 12:
        return PERSIAN_MONTHS[month - 1]
    return ''


def format_jalali_datetime(
    dt: Union[datetime, date],
    format_type: str = 'short'
) -> str:
    """
    Format a datetime/date to Persian format with different styles.
    
    Args:
        dt: Gregorian datetime or date object
        format_type: Format type ('short', 'long', 'with_time', 'full')
        
    Returns:
        Formatted Persian date string
    """
    if not dt:
        return ''
    
    formats = {
        'short': '%Y/%m/%d',
        'long': '%d %B %Y',
        'with_time': '%Y/%m/%d - %H:%M',
        'full': '%A, %d %B %Y - %H:%M',
    }
    
    fmt = formats.get(format_type, formats['short'])
    
    if isinstance(dt, datetime):
        jd = jdatetime.datetime.fromgregorian(datetime=dt)
        
        # Map format codes
        fmt = fmt.replace('%Y', str(jd.year))
        fmt = fmt.replace('%m', f'{jd.month:02d}')
        fmt = fmt.replace('%d', f'{jd.day:02d}')
        fmt = fmt.replace('%B', PERSIAN_MONTHS[jd.month - 1])
        fmt = fmt.replace('%H', f'{jd.hour:02d}')
        fmt = fmt.replace('%M', f'{jd.minute:02d}')
        fmt = fmt.replace('%A', PERSIAN_WEEKDAYS[jd.weekday()])
        
    elif isinstance(dt, date):
        jd = jdatetime.date.fromgregorian(date=dt)
        
        fmt = fmt.replace('%Y', str(jd.year))
        fmt = fmt.replace('%m', f'{jd.month:02d}')
        fmt = fmt.replace('%d', f'{jd.day:02d}')
        fmt = fmt.replace('%B', PERSIAN_MONTHS[jd.month - 1])
        fmt = fmt.replace('%A', PERSIAN_WEEKDAYS[jd.weekday()])
    
    return fmt


def time_ago_in_persian(dt: Union[datetime, date]) -> str:
    """
    Convert a datetime to Persian "time ago" format.
    
    Args:
        dt: Gregorian datetime or date object
        
    Returns:
        Persian time ago string
        
    Examples:
        >>> time_ago_in_persian(datetime.now() - timedelta(hours=2))
        '2 ساعت پیش'
        >>> time_ago_in_persian(datetime.now() - timedelta(days=5))
        '5 روز پیش'
    """
    if not dt:
        return ''
    
    # Make timezone-aware if needed
    if timezone.is_naive(dt):
        dt = timezone.make_aware(dt)
    
    now = timezone.now()
    delta = now - dt
    
    seconds = delta.total_seconds()
    
    if seconds < 60:
        return 'همین الان'
    elif seconds < 3600:
        minutes = int(seconds / 60)
        return f'{minutes} دقیقه پیش'
    elif seconds < 86400:
        hours = int(seconds / 3600)
        return f'{hours} ساعت پیش'
    elif seconds < 604800:
        days = int(seconds / 86400)
        return f'{days} روز پیش'
    elif seconds < 2592000:
        weeks = int(seconds / 604800)
        return f'{weeks} هفته پیش'
    elif seconds < 31536000:
        months = int(seconds / 2592000)
        return f'{months} ماه پیش'
    else:
        years = int(seconds / 31536000)
        return f'{years} سال پیش'
