from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from screen_print import quote_screen_print
from dtg import quote_dtg_print
from emb import quote_embroidery
from rush import calculate_rush
from utils import load_json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# load products at startup
products = load_json("products.json")

# request models

class ScreenPrintRequest(BaseModel):
    product_id: str
    quantity: int
    num_colors: int
    additional_locations: int = 0
    needed_by: Optional[str] = None  # "YYYY-MM-DD"

class DTGPrintRequest(BaseModel):
    product_id: str
    quantity: int
    garment_tone: str
    locations: list  # [{"size": "10x10", "label": "Front"}, ...]
    needed_by: Optional[str] = None

class EmbroideryRequest(BaseModel):
    product_id: str
    quantity: int
    

# helpers

def resolve_product(product_id: str) -> Optional[dict]:
    for p in products:
        if p["id"] == product_id:
            return p
    return None

def resolve_rush(needed_by: str, standard_days: int = 7) -> Optional[tuple]:
    if not needed_by:
        return None, None
    try:
        requested_date = datetime.strptime(needed_by, "%Y-%m-%d").date()
        rush_info = calculate_rush(requested_date, datetime.now(), standard_days)
        rush_days = rush_info["rush_days"] if rush_info["is_rush"] else None
        return rush_days, rush_info["message"]
    except ValueError:
        return None, f"Could not parse date '{needed_by}'. Use format YYYY-MM-DD."

# endpoints

@app.post("/api/quote/screen-print")
def screen_print_quote(request: ScreenPrintRequest):
    product = resolve_product(request.product_id)
    if not product:
        return {"error": f"Product '{request.product_id}' not found."}
    if "screen_print" not in product.get("decoration_compatibility", []):
        return {"error": f"{product['name']} does not support screen printing."}

    rush_days, rush_message = resolve_rush(request.needed_by, standard_days=7)
    result = quote_screen_print(
        quantity=request.quantity,
        num_colors=request.num_colors,
        product_id=request.product_id,
        location_count=1 + request.additional_locations,
        rush_days=rush_days
    )

    if rush_message:
        result["warnings"].append(rush_message)
    return result


@app.post("/api/quote/dtg")
def dtg_print_quote(request: DTGPrintRequest):
    product = resolve_product(request.product_id)
    if not product:
        return {"error": f"Product '{request.product_id}' not found."}
    if "dtg" not in product.get("decoration_compatibility", []):
        return {"error": f"{product['name']} does not support DTG printing."}

    rush_days, rush_message = resolve_rush(request.needed_by, standard_days=5)
    result = quote_dtg_print(
        quantity=request.quantity,
        locations=request.locations,
        garment_tone=request.garment_tone,
        product_id=request.product_id,
        rush_days=rush_days
    )

    if rush_message:
        result["warnings"].append(rush_message)
    return result


@app.post("/api/quote/embroidery")
def embroidery_quote(request: EmbroideryRequest):
    product = resolve_product(request.product_id)
    if not product:
        return {"error": f"Product '{request.product_id}' not found."}

    return quote_embroidery(
        product_id=request.product_id,
        quantity=request.quantity
    )