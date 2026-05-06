import json
import os
from typing import Optional

rush_rates = {5: 0.15, 4: 0.20, 3: 0.35, 2: 0.50, 1: 0.60}

def load_json(filename):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(base_dir, "data", filename)
    with open(file_path, "r") as file:
        return json.load(file)
    
def find_tier(tiers: list, qty: int) -> Optional[dict]:
    for tier in tiers:
        if qty >= tier["qty_min"] and qty <= tier["qty_max"]:
            return tier
        
def r2(value: float) -> float:
    return round(value, 2)  

def quote_error(message: str) -> dict:
    return {"error": message}

def get_rush_fee(order_cost: float, rush_days: int) -> Optional[float]:
    if not rush_days:
        return 0.0
    return rush_rates.get(rush_days, 0.0) * order_cost
