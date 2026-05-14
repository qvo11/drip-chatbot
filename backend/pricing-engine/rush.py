from datetime import date, datetime, timedelta
import holidays
from functools import lru_cache
from utils import rush_rates

# Holidays include: New Year's Day, MLK Day, Presidents' Day, Memorial Day, Juneteenth, Independence Day, Labor Day, Columbus Day, Veterans Day, Thanksgiving and Christmas 

@lru_cache(maxsize=None)
def get_us_holidays(year: int):
    return holidays.US(year=year)

def is_holiday(check_date: date) -> bool:
    return check_date in get_us_holidays(check_date.year)

def is_weekend(check_date: date) -> bool:
    return check_date.weekday() >= 5

def is_business_day(check_date: date) -> bool:
    return not is_weekend(check_date) and not is_holiday(check_date)

def add_business_day(start: date, days: int) -> date:
    current= start
    added = 0
    while added < days:
        current += timedelta(days=1)
        if is_business_day(current):
            added += 1
    return current

def count_business_days(start_date: date, end_date: date) -> int:
    business_days = 0
    current = start_date + timedelta(days=1)
    while current <= end_date:
        if is_business_day(current):
            business_days += 1
        current += timedelta(days=1)
    return business_days

def calculate_rush(requested_date: date, order_time: datetime = None, standard_days: int = 7) -> dict:
    if order_time is None:
        order_time = datetime.now()

    # apply 12PM cutoff
    effective_start = order_time.date()
    if order_time.hour >= 12:
        effective_start += timedelta(days=1)

    business_days = count_business_days(effective_start, requested_date)
    standard_delivery_date = add_business_day(effective_start, standard_days)

    if requested_date >= standard_delivery_date:
        return {
            "is_rush": False,
            "rush_days": None,
            "rush_markup_pct": 0.0,
            "business_days_available": business_days,
            "message": "Standard production timeline."
        }

    # same day rush
    if business_days < 1:
        return {
            "is_rush": True,
            "rush_days": 0,
            "rush_markup_pct": 1.00,
            "business_days_available": 0,
            "message": "Same day rush — please contact us to confirm availability!"
        }

    # 1-5 day rush
    if business_days <= 5:
        return {
            "is_rush": True,
            "rush_days": business_days,
            "rush_markup_pct": rush_rates[business_days],
            "business_days_available": business_days,
            "message": f"{business_days}-day rush applies. Please contact us to confirm availability!"
        }
    
    # 6+ days but before standard — no rush
    return {
        "is_rush": False,
        "rush_days": None,
        "rush_markup_pct": 0.0,
        "business_days_available": business_days,
        "message": "Standard production timeline."
    }
    
