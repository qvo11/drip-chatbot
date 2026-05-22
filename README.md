# Drip

A guided chatbot for instant custom apparel quotes. Drip walks customers through product selection, print type, quantity, and turnaround — then returns a real-time price via a backend pricing engine.

---

## Overview

Drip is a two-layer monorepo:

- **Frontend** — Next.js chatbot UI with a step-by-step quote flow, typewriter animations, and product browsing
- **Backend** — FastAPI pricing engine that calculates quotes for screen printing, DTG, and embroidery, with rush fee support

---

## Project Structure

```
drip-chatbot/
├── frontend/                        # Next.js app
│   ├── app/                         # App router (layout, page, globals)
│   ├── components/                  # UI components (Drip mascot, buttons, scroll area)
│   ├── hooks/                       # useTypewriter hook
│   ├── lib/                         # Quote flow logic, product catalog, utilities
│   └── public/                      # Static assets (SVGs)
│
└── backend/
    └── pricing-engine/              # FastAPI app
        ├── main.py                  # App entry point with /api/quote endpoints
        ├── screen_print.py          # Screen print quoting logic
        ├── dtg.py                   # DTG quoting logic
        ├── emb.py                   # Embroidery (routes to manual workflow)
        ├── rush.py                  # Rush fee & business day calculator
        ├── utils.py                 # Shared helpers
        ├── data/                    # Pricing and product JSON data
        └── requirements.txt
```

---

## Frontend

Built with Next.js (App Router), Tailwind CSS, and GSAP for animations.

The chatbot guides users through a fixed quote flow:

1. Choose a product category and specific product
2. Select print type (screen print, DTG, or embroidery)
3. Enter quantity, print locations, and needed-by date
4. Receive an itemized quote

**Tech:** Next.js · TypeScript · Tailwind CSS · GSAP · Lucide React

### Setup

```bash
cd frontend
npm install
cp .env.local.save .env.local   # fill in values (see Environment Variables)
npm run dev
```

App runs at `http://localhost:3000`.

---

## Backend — Pricing Engine

Built with FastAPI and Python. All endpoints require an `X-API-Key` header.

### Endpoints

#### `POST /api/quote/screen-print`
Returns a line-item quote for screen printing. Accepts product ID, quantity, number of colors, additional print locations, and an optional needed-by date.

#### `POST /api/quote/dtg`
Returns a line-item quote for DTG (direct-to-garment) printing. Accepts product ID, quantity, garment tone, print locations with sizes, and an optional needed-by date.

#### `POST /api/quote/embroidery`
Routes embroidery requests to a manual quote workflow — returns contact instructions rather than an automated price.

### Rush Fees
If a needed-by date is provided and falls within the standard production window, a rush fee is applied. The fee scales with how many business days are available. A 12PM order cutoff applies.

### Setup

```bash
cd backend/pricing-engine
pip install -r requirements.txt
cp ../../.env .env               # or set env vars manually
uvicorn main:app --reload
```

API runs at `http://localhost:8000`.

### Tests

```bash
python test_api.py
```

---

## Environment Variables

### Frontend (`frontend/.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the pricing engine (e.g. `http://localhost:8000`) |
| `NEXT_PUBLIC_API_KEY` | API key sent as `X-API-Key` header |

### Backend

| Variable | Description |
|---|---|
| `API_SECRET_KEY` | Secret key used to authenticate incoming requests |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins |

---

## Deployment

### Backend — Railway

The backend is configured for Railway via `backend/railway.toml`. Set `API_SECRET_KEY` and `ALLOWED_ORIGINS` in Railway's environment variable settings.

### Frontend — Vercel

Deploy the `frontend/` directory. Set `NEXT_PUBLIC_API_URL` to the Railway backend URL and `NEXT_PUBLIC_API_KEY` to match the backend secret.
