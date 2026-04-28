import sys
import os
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), "lib", "pricing-engine"))

from screen_print import quote_screen_print
from dtg import quote_dtg_print
from emb import quote_embroidery
import json

def test_screen_print_basic():
    result = quote_screen_print(
        quantity=48,
        num_colors=2,
        product_id="PC450"
    )
    assert "error" not in result, f"Unexpected error: {result.get('error')}"
    assert result["quantity"] == 48
    assert result["cost_per_unit"] > 0
    print(f"Screen print basic: ${result['cost_per_unit']}/ea, ${result['total']} total")


def test_screen_print_below_minimum():
    result = quote_screen_print(
        quantity=10,
        num_colors=1,
        product_id="PC450"
    )
    assert "error" in result
    assert isinstance(result["error"], str)
    print(f"Below minimum caught: {result['error']}")


def test_screen_print_rush():
    result = quote_screen_print(
        quantity=50,
        num_colors=2,
        product_id="PC450",
        rush_days=3
    )
    assert "error" not in result, f"Unexpected error: {result.get('error')}"
    assert result["rush_fee"] > 0
    print(f"Rush fee for 3-day rush: ${result['rush_fee']}")


def test_dtg_light_garment():
    result = quote_dtg_print(
        quantity=12,
        locations=[{"size": "10x10", "label": "Front"}],
        garment_tone="light",
        product_id="PC450"
    )
    assert "error" not in result, f"Unexpected error: {result.get('error')}"
    assert result["cost_per_unit"] > 0
    print(f"DTG light garment: ${result['cost_per_unit']}/ea, ${result['total']} total")


def test_dtg_dark_garment():
    result = quote_dtg_print(
        quantity=12,
        locations=[{"size": "10x10", "label": "Front"}],
        garment_tone="dark",
        product_id="PC450"
    )
    assert "error" not in result, f"Unexpected error: {result.get('error')}"
    assert result["cost_per_unit"] > 0
    print(f"DTG dark garment: ${result['cost_per_unit']}/ea, ${result['total']} total")


def test_dtg_invalid_product():
    result = quote_dtg_print(
        quantity=12,
        locations=[{"size": "10x10", "label": "Front"}],
        garment_tone="light",
        product_id="112"  # hat — not DTG compatible
    )
    assert "error" in result
    print(f"DTG incompatible product caught: {result['error']}")


def test_embroidery_basic():
    result = quote_embroidery(
        product_id="112",
        quantity=24
    )
    assert "error" not in result
    assert result["status"] == "manual_quote_required"
    print(f"Embroidery placeholder: {result['message']}")


if __name__ == "__main__":
    test_screen_print_basic()
    test_screen_print_below_minimum()
    test_screen_print_rush()
    test_dtg_light_garment()
    test_dtg_dark_garment()
    test_dtg_invalid_product()
    test_embroidery_basic()
    print("\n All tests passed!")