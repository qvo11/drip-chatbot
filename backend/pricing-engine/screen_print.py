from utils import load_json, find_tier, r2, quote_error, get_rush_fee
from typing import Optional

screen_data = load_json("screenprint-pricing.json")

def get_garment_cost(qty: int, product: dict) -> float:
    tier = find_tier(screen_data["garment_markup"], qty)
    if not product or not tier:
        return 0.80 # Default markup if no tier or product found
    return r2(product["base_cost"] * (1 + tier["markup_pct"]))

def get_first_location_cost(qty: int, num_colors: int) -> float:
    tiers = screen_data["first_location"]["tiers"]
    tier = find_tier(tiers, qty) 
    if not tier:
        return 0.0
    color_cost = tier.get("colors", {})
    return color_cost.get(str(num_colors), 0.0)

def get_additional_location_cost(qty: int, num_colors: int) -> float:
    tiers = screen_data["additional_locations"]["tiers"]
    tier = find_tier(tiers, qty)
    color_cost = tier.get("colors", {})
    return color_cost.get(str(num_colors), 0.0)

def get_print_cost(tier: dict, num_colors: int) -> Optional[float]:
    color_cost = tier["color_cost"] * num_colors
    return r2(color_cost)

def quote_screen_print(
    quantity: int,
    num_colors: int,
    product: dict,
    location_count: int = 1,
    rush_days: Optional[int] = None
) -> dict:

    warnings = []
    line_items = []
    
    # validate quantity and colors
    if quantity < 20:
        return quote_error(f"Minimum quantity for screen printing is 20 pieces. You requested {quantity}.")

    if quantity >= 4000:
        return quote_error("Orders of 4,000+ pieces require a custom quote. Please contact us!")

    if num_colors < 1 or num_colors > 7:
        return quote_error("Number of colors must be between 1 and 7.")

    first_location_tiers = screen_data["first_location"]["tiers"]
    tier = find_tier(first_location_tiers, quantity)
    if not tier:
        return quote_error(f"No pricing tier found for quantity {quantity}.")

    # check if num_colors is actually available at quantity ignoring flash (for now)
    available_colors = tier.get("colors", {})
    if str(num_colors) not in available_colors:
        numeric_keys = [int(c) for c in available_colors.keys() if c.isdigit()]
        max_colors = max(numeric_keys) if numeric_keys else 0
        min_qty = tier.get("qty_min", 0)

        return quote_error(
            f"{num_colors} colors is not available at quantity {quantity}. "
            f"Maximum colors at this quantity is {max_colors}. "
            f"To use {num_colors} colors, order at least {min_qty} pieces."
        )
    
    # calculate costs
    additional_locations = location_count - 1

    garment_cost = get_garment_cost(quantity, product)
    line_items.append({
        "label": f"Garment - {product['name']}",
        "cost_per_item": r2(garment_cost)
    })

    first_cost = get_first_location_cost(quantity, num_colors)
    line_items.append(
    {
        "label": f"Screen Print - First Location ({num_colors} colors)",
        "cost_per_item": r2(first_cost)
    })

    if additional_locations > 0:
        add_cost = get_additional_location_cost(quantity, num_colors)
        line_items.append({
            "label": f"Screen Print - Additional Locations ({location_count - 1} locations)",
            "cost_per_item": r2(add_cost)
        })
    
    # totals
    cost_per_unit = r2(sum(li["cost_per_item"] for li in line_items))
    order_total = r2(cost_per_unit * quantity)
    rush_fee = get_rush_fee(order_total, rush_days)
    if rush_fee > 0:
        line_items.append({
            "label": f"Rush Fee ({rush_days} day rush)",
            "total": r2(rush_fee)  
        })

    final_total = r2(order_total + rush_fee)

    return {
        "print_type": "screen_print",
        "product": product["name"],
        "product_id": product['id'],
        "quantity": quantity,
        "num_colors": num_colors,
        "location_count": location_count,
        "line_items": line_items,
        "cost_per_unit": cost_per_unit,
        "order_total": order_total, 
        "rush_fee": rush_fee,
        "final_total": final_total,
        "warnings": warnings
    }