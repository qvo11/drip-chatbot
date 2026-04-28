# Drip Chatbot — Pricing Engine

A pricing engine API for a custom apparel print shop. Supports instant quoting for screen printing and DTG (direct-to-garment) printing, with rush fee calculation and product compatibility validation. Embroidery quotes are routed to a manual workflow.

---

## Project Structure

```
drip-chatbot/
├── lib/
│   └── pricing-engine/
│       ├── main.py             # FastAPI app with /api/quote endpoints
│       ├── pricing.py          # Unified get_quote() dispatcher
│       ├── screen_print.py     # Screen print quoting logic
│       ├── dtg.py              # DTG quoting logic
│       ├── emb.py              # Embroidery placeholder (manual quote)
│       ├── rush.py             # Rush fee & business day calculator
│       ├── utils.py            # Shared helpers (load_json, find_tier, etc.)
│       └── data/
│           ├── products.json           # Product catalog with base costs & decoration compatibility
│           ├── screenprint-pricing.json
│           ├── dtg-pricing.json
│           └── emb-pricing.json
├── test_pricing.py             # Integration tests for all quote types
└── package.json
```

---

## API Endpoints

### `POST /api/quote/screen-print`

Returns a line-item quote for screen printing.

**Request body:**
```json
{
  "product_id": "PC450",
  "quantity": 48,
  "num_colors": 2,
  "additional_locations": 0,
  "needed_by": "2026-05-10"
}
```

**Constraints:**
- Minimum 20 pieces, maximum 3,999 (4,000+ requires custom quote)
- 1–7 colors supported
- `needed_by` triggers rush fee if inside standard 7-business-day window

---

### `POST /api/quote/dtg`

Returns a line-item quote for DTG printing.

**Request body:**
```json
{
  "product_id": "PC450",
  "quantity": 12,
  "garment_tone": "light",
  "locations": [
    { "size": "10x10", "label": "Front" }
  ],
  "needed_by": "2026-05-03"
}
```

**Constraints:**
- Minimum 1 piece, maximum 999
- `garment_tone`: `"light"` or `"dark"`
- Valid print sizes: `5x5`, `10x10`, `12x14`, `16x21`
- Standard production: 5 business days

---

### `POST /api/quote/embroidery`

Routes to a manual quote workflow — returns contact instructions.

**Request body:**
```json
{
  "product_id": "112",
  "quantity": 24
}
```

---

## Rush Fees

Rush fees are calculated based on business days available before the requested date. A 12PM order cutoff applies — orders placed at or after noon count from the next business day.

| Business Days Available | Rush Markup |
|-------------------------|-------------|
| 5 days                  | +20%        |
| 4 days                  | +30%        |
| 3 days                  | +40%        |
| 2 days                  | +50%        |
| 1 day                   | +75%        |
| Same day                | +100%       |

---

## Running the API

```bash
pip install fastapi uvicorn
cd lib/pricing-engine
uvicorn main:app --reload
```

API will be available at `http://localhost:8000`.

---

## Running Tests

```bash
python test_pricing.py
```

Tests cover screen print, DTG, embroidery, rush fees, and edge cases (below-minimum quantity, incompatible products).
