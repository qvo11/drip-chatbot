from datetime import date, datetime, timedelta

HOLIDAYS_2026 = [
    "2026-01-01",  # New Year's Day
    "2026-05-25",  # Memorial Day
    "2026-07-04",  # Independence Day
    "2026-09-07",  # Labor Day
    "2026-11-26",  # Thanksgiving
    "2026-11-27",  # Day after Thanksgiving
    "2026-12-25",  # Christmas
]

def is_holiday(check_date: date) -> bool:
    return check_date.strftime("%Y-%m-%d") in HOLIDAYS_2026

def is_weekend(check_date: date) -> bool:
    return check_date.weekday() >= 5

def is_business_day(check_date: date) -> bool:
    return not is_weekend(check_date) and not is_holiday(check_date)

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
    standard_delivery_date = effective_start + timedelta(days=standard_days)

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
        rush_rates = {5: 0.20, 4: 0.30, 3: 0.40, 2: 0.50, 1: 0.75}
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
    
