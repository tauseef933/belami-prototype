# Belami Virtual Try-On Studio

AI-powered interior visualizer — upload a room photo, pick a product, and see where **Gemini Vision** recommends placing it.

---

## ✨ Features

- **Gemini Vision AI** — analyzes your room and suggests the optimal placement position
- **Excel product catalog** — manage products in `backend/data/products.xlsx`
- **Drag-and-drop room upload** — JPEG / PNG / WebP up to 10 MB
- **Real-time placement dot** — animated marker shows exactly where to place the item
- **Category filters** — Furniture, Lighting, Fans, Decor
- **Professional UI** — Belami brand colors, Framer Motion animations, fully responsive

---

## 🚀 Quick Start

### 1. Clone & install

```bash
# Backend
cd belami-tryon/backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment

```bash
cd belami-tryon/backend
cp .env.example .env
```

Open `.env` and set your **Gemini API key**:

```env
GEMINI_API_KEY=AIzaSy...your_key_here
CORS_ORIGIN=http://localhost:5173
PORT=3001
```

> **Get a free Gemini API key:** https://aistudio.google.com/app/apikey

### 3. Add product images

Place product images in:
```
belami-tryon/frontend/public/products/
```
Image filenames must match the `SKU` or `ImageFile` column in `products.xlsx`.

### 4. Seed the product catalog

```bash
cd belami-tryon/backend
node scripts/seed-excel.js
```

Fill in any `TODO` rows in `backend/data/products.xlsx`.

### 5. Run both servers

**Terminal 1 — Backend:**
```bash
cd belami-tryon/backend
npm run dev
# → http://localhost:3001/api/health
```

**Terminal 2 — Frontend:**
```bash
cd belami-tryon/frontend
npm run dev
# → http://localhost:5173
```

---

## 📁 Project Structure

```
belami-tryon/
├── backend/
│   ├── data/
│   │   ├── products.js       # In-memory catalog for SKU lookups
│   │   └── products.xlsx     # ← Edit this to manage your catalog
│   ├── routes/
│   │   ├── placement.js      # POST /api/placement  (Gemini Vision)
│   │   ├── products.js       # GET  /api/products   (Excel reader)
│   │   └── tryOn.js          # POST /api/tryon      (image optimizer)
│   ├── scripts/
│   │   └── seed-excel.js     # One-time Excel generator
│   ├── utils/
│   │   └── imageProcessor.js # Sharp image optimization
│   ├── uploads/              # Temp upload dir (auto-cleaned)
│   ├── .env.example          # ← Copy to .env and fill in
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── public/
    │   └── products/         # ← Place product images here
    ├── src/
    │   ├── components/
    │   │   ├── ErrorBanner.jsx
    │   │   ├── LoadingSkeleton.jsx
    │   │   ├── PlacementOverlay.jsx
    │   │   ├── PlacementResult.jsx
    │   │   ├── ProductCard.jsx
    │   │   └── RoomUploader.jsx
    │   ├── hooks/
    │   │   ├── useProducts.js
    │   │   └── useTryOn.js
    │   ├── utils/
    │   │   └── api.js
    │   ├── App.jsx
    │   ├── index.css
    │   └── main.jsx
    ├── index.html
    ├── package.json
    ├── postcss.config.js
    ├── tailwind.config.js
    └── vite.config.js
```

---

## 🔌 API Reference

### `GET /api/health`
Returns server status and Gemini readiness.

### `GET /api/products`
Returns all products from `products.xlsx` that have a matching image file.

### `POST /api/placement`
Calls Gemini Vision with the room photo and returns placement advice.

**Body (JSON):**
```json
{
  "roomBase64":   "...",
  "roomMimeType": "image/jpeg",
  "product": {
    "name":      "My Sofa",
    "width":     96,
    "height":    31,
    "depth":     38,
    "placement": "floor"
  }
}
```

**Response:**
```json
{
  "ok": true,
  "placement": {
    "suggestion":   "Place the sofa against the far wall...",
    "x_percent":    45,
    "y_percent":    72,
    "scale_factor": 1.1,
    "reasoning":    "The far wall provides a natural focal point..."
  }
}
```

### `POST /api/tryon`
Accepts a room image upload + product SKU, returns optimized image data.

**Form fields:** `room` (file), `productSku` (string), `prompt` (string, optional)

---

## 🛠 Troubleshooting

| Problem | Solution |
|---|---|
| `Missing required environment variables: GEMINI_API_KEY` | Create `backend/.env` from `.env.example` |
| Gemini returns HTTP 400 | Check your API key is valid and has Vision access |
| Gemini returns HTTP 429 | You've hit the rate limit — wait or upgrade your plan |
| No products shown | Run `seed-excel.js` and add images to `public/products/` |
| CORS errors in browser | Set `CORS_ORIGIN=http://localhost:5173` in `.env` |

---

## 📦 Tech Stack

| Layer | Tech |
|---|---|
| AI Vision | Google Gemini 1.5 Flash |
| Backend | Node.js · Express · Sharp · multer |
| Frontend | React 18 · Vite · Tailwind CSS · Framer Motion |
| Catalog | Excel (xlsx) via SheetJS |
