from utils import load_json, find_tier, r2, quote_error, get_rush_fee
from typing import Optional

dtg_data = load_json("dtg-pricing.json")

VALID_PRINT_SIZES = ["5x5", "10x10", "12x14", "16x21"]

def get_garment_cost(qty: int, product: dict) -> float:
    tier = find_tier(dtg_data["garment_markup"], qty)
    if not product or not tier:
        return 0.0
    return r2(product["base_cost"] * (1 + tier["markup_pct"]))

def get_dtg_print_cost(qty: int, print_size: str, garment_tone: str) -> float:
    if garment_tone == "light":
        pricing_block = dtg_data["light_garments"]
    else:
        pricing_block = dtg_data["dark_garments"]

    size_block = next((s for s in pricing_block["print_sizes"] if s["size"] == print_size), None)
    if not size_block:
        return 0.0
    
    tier = find_tier(size_block["tiers"], qty)
    if not tier:
        return 0.0
    return r2(tier["cost"])

def quote_dtg_print(
    quantity: int,
    locations: list,
    garment_tone: str,
    product: dict,
    rush_days: int = None
) -> dict:

    warnings = []
    line_items = []
    
    # validate quantity
    if quantity < 1:
        return quote_error(f"Minimum quantity for DTG printing is 1 piece. You requested {quantity}.")

    if quantity >= 1000:
        return quote_error("Orders of 1,000+ pieces require a custom quote. Please contact us!")
    
    # validate garment tone & print 
    if garment_tone not in ["light", "dark"]:
        return quote_error(f"Invalid garment tone '{garment_tone}'. Must be 'light' or 'dark'.")
    
    if not locations or len(locations) == 0:
        return quote_error("At least one print location is required.")

    for i, loc in enumerate(locations):
        if "size" not in loc:
            return quote_error(f"Location {i + 1} is missing a 'size' field.")
        if loc["size"] not in VALID_PRINT_SIZES:
            return quote_error(
                f"Invalid print size '{loc['size']}' at location {i + 1}. "
                f"Must be one of: {', '.join(VALID_PRINT_SIZES)}."
            )
        if "label" not in loc:
            loc["label"] = f"Location {i + 1}"

    # fabric warning
    warnings.append("DTG printing works best on 100% cotton garments. Blends may result in less vibrant prints and may not be suitable for all designs.")

    # calculate costs
    garment_cost = get_garment_cost(quantity, product)
    line_items.append({
        "item": f"Garment - {product['name']}",
        "cost_per_item": r2(garment_cost)
    })

    # print cost per location and size
    for loc in locations:
        print_cost = get_dtg_print_cost(quantity, loc["size"], garment_tone)
        line_items.append({
            "item": f"DTG Print - {loc['label']} ({loc['size']} on {garment_tone} garment)",
            "cost_per_item": r2(print_cost)
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
        "print_type": "dtg",
        "product": product["name"],
        "product_id": product['id'],
        "quantity": quantity,
        "garment_tone": garment_tone,
        "locations": locations,
        "line_items": line_items,
        "cost_per_unit": cost_per_unit,
        "order_total": order_total,
        "rush_fee": rush_fee,
        "final_total": final_total,
        "warnings": warnings
    }