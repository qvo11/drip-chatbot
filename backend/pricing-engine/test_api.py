"""
Drip Chatbot — Pricing API Edge Case Tests
Run with: python test_api.py  (from the pricing-engine directory)
"""

import sys
import os
from datetime import date, timedelta
from io import StringIO

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

# ─── Helpers ────────────────────────────────────────────────────────────────

results = []

def check(name: str, actual, expected_key: str, expected_value, comparator=None):
    """
    Evaluate a single assertion and record the result.
    comparator: optional callable(actual_value, expected_value) -> bool
    """
    actual_value = actual
    for key in expected_key.split("."):
        if isinstance(actual_value, dict):
            actual_value = actual_value.get(key)
        else:
            actual_value = None
            break

    if comparator:
        passed = comparator(actual_value, expected_value)
    else:
        passed = actual_value == expected_value

    status = "PASS" if passed else "FAIL"
    results.append({
        "name": name,
        "status": status,
        "field": expected_key,
        "expected": expected_value,
        "actual": actual_value,
    })
    return passed


def business_days_from_today(n: int) -> str:
    """Return a date string N business days from today (skips weekends only)."""
    current = date.today()
    count = 0
    while count < n:
        current += timedelta(days=1)
        if current.weekday() < 5:  # Mon–Fri
            count += 1
    return current.strftime("%Y-%m-%d")


# ─── Screen Print Tests ──────────────────────────────────────────────────────

def test_sp_quantity_below_minimum():
    """Quantity < 20 → error about minimum quantity"""
    r = client.post("/api/quote/screen-print", json={
        "product_id": "PC54",
        "quantity": 10,
        "num_colors": 2,
    })
    data = r.json()
    check(
        "SP — quantity below 20",
        data, "error",
        expected_value="minimum",
        comparator=lambda actual, exp: isinstance(actual, str) and exp.lower() in actual.lower()
    )


def test_sp_quantity_above_maximum():
    """Quantity >= 4000 → error about custom quote"""
    r = client.post("/api/quote/screen-print", json={
        "product_id": "PC54",
        "quantity": 5000,
        "num_colors": 2,
    })
    data = r.json()
    check(
        "SP — quantity above 4000",
        data, "error",
        expected_value="custom quote",
        comparator=lambda actual, exp: isinstance(actual, str) and exp.lower() in actual.lower()
    )


def test_sp_colors_above_limit():
    """Colors > 7 → error about color limit"""
    r = client.post("/api/quote/screen-print", json={
        "product_id": "PC54",
        "quantity": 50,
        "num_colors": 8,
    })
    data = r.json()
    check(
        "SP — colors above 7",
        data, "error",
        expected_value="7",
        comparator=lambda actual, exp: isinstance(actual, str) and exp in actual
    )


def test_sp_incompatible_product():
    """CP77 (embroidery only) used for screen print → compatibility error"""
    r = client.post("/api/quote/screen-print", json={
        "product_id": "CP77",
        "quantity": 50,
        "num_colors": 2,
    })
    data = r.json()
    check(
        "SP — incompatible product (CP77)",
        data, "error",
        expected_value="screen print",
        comparator=lambda actual, exp: isinstance(actual, str) and exp.lower() in actual.lower()
    )


def test_sp_valid_order():
    """Valid screen print order → successful quote with cost fields"""
    r = client.post("/api/quote/screen-print", json={
        "product_id": "PC54",
        "quantity": 50,
        "num_colors": 2,
        "additional_locations": 0,
    })
    data = r.json()
    check(
        "SP — valid order returns cost_per_unit",
        data, "cost_per_unit",
        expected_value=None,
        comparator=lambda actual, _: isinstance(actual, (int, float)) and actual > 0
    )
    check(
        "SP — valid order returns final_total",
        data, "final_total",
        expected_value=None,
        comparator=lambda actual, _: isinstance(actual, (int, float)) and actual > 0
    )


# ─── DTG Tests ───────────────────────────────────────────────────────────────

def test_dtg_incompatible_product():
    """ST350 (screen_print only) used for DTG → compatibility error"""
    r = client.post("/api/quote/dtg", json={
        "product_id": "ST350",
        "quantity": 5,
        "garment_tone": "light",
        "locations": [{"size": "10x10", "label": "Front"}],
    })
    data = r.json()
    check(
        "DTG — incompatible product (ST350)",
        data, "error",
        expected_value="dtg",
        comparator=lambda actual, exp: isinstance(actual, str) and exp.lower() in actual.lower()
    )


def test_dtg_quantity_above_maximum():
    """Quantity >= 1000 → error about custom quote"""
    r = client.post("/api/quote/dtg", json={
        "product_id": "DT650",
        "quantity": 1500,
        "garment_tone": "light",
        "locations": [{"size": "10x10", "label": "Front"}],
    })
    data = r.json()
    check(
        "DTG — quantity above 1000",
        data, "error",
        expected_value="custom quote",
        comparator=lambda actual, exp: isinstance(actual, str) and exp.lower() in actual.lower()
    )


def test_dtg_invalid_garment_tone():
    """Invalid garment_tone → validation error"""
    r = client.post("/api/quote/dtg", json={
        "product_id": "DT650",
        "quantity": 10,
        "garment_tone": "rainbow",
        "locations": [{"size": "10x10", "label": "Front"}],
    })
    data = r.json()
    check(
        "DTG — invalid garment tone",
        data, "error",
        expected_value="garment tone",
        comparator=lambda actual, exp: isinstance(actual, str) and exp.lower() in actual.lower()
    )


def test_dtg_valid_order_cotton_warning():
    """DT650 (100% ringspun cotton, DTG compatible) → successful quote with cotton warning"""
    r = client.post("/api/quote/dtg", json={
        "product_id": "DT650",
        "quantity": 10,
        "garment_tone": "light",
        "locations": [{"size": "10x10", "label": "Front"}],
    })
    data = r.json()
    check(
        "DTG — valid order returns cost_per_unit",
        data, "cost_per_unit",
        expected_value=None,
        comparator=lambda actual, _: isinstance(actual, (int, float)) and actual > 0
    )
    check(
        "DTG — cotton warning present in warnings array",
        data, "warnings",
        expected_value="cotton",
        comparator=lambda actual, exp: (
            isinstance(actual, list) and
            any(exp.lower() in w.lower() for w in actual)
        )
    )


# ─── Embroidery Tests ─────────────────────────────────────────────────────────

def test_emb_non_hat_product():
    """PC54 (tshirt) → still returns manual_quote_required (no compatibility gate in emb)"""
    r = client.post("/api/quote/embroidery", json={
        "product_id": "PC54",
        "quantity": 12,
    })
    data = r.json()
    check(
        "EMB — non-hat product returns manual_quote_required",
        data, "status",
        expected_value="manual_quote_required"
    )


def test_emb_valid_hat():
    """CP77 (hat) → manual quote response with next_steps"""
    r = client.post("/api/quote/embroidery", json={
        "product_id": "CP77",
        "quantity": 24,
    })
    data = r.json()
    check(
        "EMB — hat product returns manual_quote_required",
        data, "status",
        expected_value="manual_quote_required"
    )
    check(
        "EMB — hat product returns next_steps list",
        data, "next_steps",
        expected_value=None,
        comparator=lambda actual, _: isinstance(actual, list) and len(actual) > 0
    )


# ─── Rush Tests ───────────────────────────────────────────────────────────────

def test_rush_within_3_business_days():
    """Date 3 business days from today → rush fee > 0 and rush message in warnings"""
    rush_date = business_days_from_today(3)
    r = client.post("/api/quote/screen-print", json={
        "product_id": "PC54",
        "quantity": 50,
        "num_colors": 2,
        "needed_by": rush_date,
    })
    data = r.json()
    check(
        f"RUSH — 3-day rush ({rush_date}) applies rush_fee > 0",
        data, "rush_fee",
        expected_value=None,
        comparator=lambda actual, _: isinstance(actual, (int, float)) and actual > 0
    )
    check(
        f"RUSH — 3-day rush ({rush_date}) has rush message in warnings",
        data, "warnings",
        expected_value="rush",
        comparator=lambda actual, exp: (
            isinstance(actual, list) and
            any(exp.lower() in w.lower() for w in actual)
        )
    )


def test_rush_beyond_standard_timeline():
    """Date 20+ calendar days out → no rush fee"""
    safe_date = (date.today() + timedelta(days=20)).strftime("%Y-%m-%d")
    r = client.post("/api/quote/screen-print", json={
        "product_id": "PC54",
        "quantity": 50,
        "num_colors": 2,
        "needed_by": safe_date,
    })
    data = r.json()
    check(
        f"RUSH — beyond standard timeline ({safe_date}) rush_fee is 0",
        data, "rush_fee",
        expected_value=0.0,
        comparator=lambda actual, exp: actual == exp or actual == 0
    )


# ─── Run All Tests & Write Report ────────────────────────────────────────────

def run_all():
    tests = [
        test_sp_quantity_below_minimum,
        test_sp_quantity_above_maximum,
        test_sp_colors_above_limit,
        test_sp_incompatible_product,
        test_sp_valid_order,
        test_dtg_incompatible_product,
        test_dtg_quantity_above_maximum,
        test_dtg_invalid_garment_tone,
        test_dtg_valid_order_cotton_warning,
        test_emb_non_hat_product,
        test_emb_valid_hat,
        test_rush_within_3_business_days,
        test_rush_beyond_standard_timeline,
    ]

    for t in tests:
        try:
            t()
        except Exception as e:
            results.append({
                "name": t.__name__,
                "status": "ERROR",
                "field": "—",
                "expected": "—",
                "actual": f"Exception: {e}",
            })

    # ── Console output ──────────────────────────────────────────────────────
    col_w = [52, 6, 30, 30]
    header = (
        f"{'TEST':<{col_w[0]}} {'STATUS':<{col_w[1]}} {'EXPECTED':<{col_w[2]}} {'ACTUAL'}"
    )
    divider = "-" * (sum(col_w) + 6)

    print("\n" + "=" * len(divider))
    print("  DRIP CHATBOT — PRICING API TEST REPORT")
    print(f"  Run date: {date.today()}")
    print("=" * len(divider))
    print(header)
    print(divider)

    passed = sum(1 for r in results if r["status"] == "PASS")
    failed = sum(1 for r in results if r["status"] == "FAIL")
    errors = sum(1 for r in results if r["status"] == "ERROR")

    name_w = col_w[0] - 2
    for r in results:
        icon = "✓" if r["status"] == "PASS" else "✗"
        exp_str = str(r["expected"])[:28]
        act_str = str(r["actual"])[:28]
        name_col = r["name"]
        status_col = r["status"]
        print(f"{icon} {name_col:<{name_w}} {status_col:<{col_w[1]}} {exp_str:<{col_w[2]}} {act_str}")

    print(divider)
    print(f"\n  PASSED: {passed}  FAILED: {failed}  ERRORS: {errors}  TOTAL: {len(results)}")
    print("=" * len(divider) + "\n")

    # ── Write report file ───────────────────────────────────────────────────
    report_path = os.path.join(os.path.dirname(__file__), "test_report.txt")
    with open(report_path, "w") as f:
        f.write("DRIP CHATBOT — PRICING API TEST REPORT\n")
        f.write(f"Run date: {date.today()}\n")
        f.write("=" * len(divider) + "\n")
        f.write(header + "\n")
        f.write(divider + "\n")
        for r in results:
            icon = "PASS" if r["status"] == "PASS" else "FAIL"
            exp_str = str(r["expected"])[:28]
            act_str = str(r["actual"])[:28]
            f.write(f"[{icon}] {r['name']:<{col_w[0]-2}} {r['status']:<{col_w[1]}} {exp_str:<{col_w[2]}} {act_str}\n")
        f.write(divider + "\n")
        f.write(f"\nPASSED: {passed}  FAILED: {failed}  ERRORS: {errors}  TOTAL: {len(results)}\n")

        if failed or errors:
            f.write("\n--- FAILURES & ERRORS ---\n")
            for r in results:
                if r["status"] in ("FAIL", "ERROR"):
                    f.write(f"\n  [{r['status']}] {r['name']}\n")
                    f.write(f"    Field:    {r['field']}\n")
                    f.write(f"    Expected: {r['expected']}\n")
                    f.write(f"    Actual:   {r['actual']}\n")

    print(f"  Report written to: {report_path}\n")


if __name__ == "__main__":
    run_all()
