# DermIQ — AI Skin Lesion Analysis

> AI-powered skin lesion screening across 7 clinical categories.  
> Built on the HAM10000 dataset · AUC 0.93 · Mobile-first · Vercel-ready

---

## What it does

Upload any photo of a skin lesion — from your phone camera or your gallery — and DermIQ will:

1. **Classify** it across 7 clinical categories (melanoma, basal cell carcinoma, common moles, etc.)
2. **Score confidence** for each class
3. **Assign a risk level** (Low → Moderate → High → Critical)
4. **Give actionable advice**: what to do, how urgently, and why

---

## Architecture

```
Browser / Mobile
     │
     ▼  POST /api/analyze  (base64 image)
Next.js API Route  (Vercel serverless function)
     │
     ▼  POST binary image
HuggingFace Inference API
     │
     ▼  [{ label, score }]  x7 classes
Enriched with clinical data (lib/lesionData.ts)
     │
     ▼  JSON result
Results Page
```

---

## Quick Setup

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/dermiq
cd dermiq
npm install
```

### 2. Get your free HuggingFace API token

1. Go to [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens)
2. Click "New token" → Name it "dermiq" → Role: "Read"
3. Copy the token (starts with `hf_`)

### 3. Set environment variables

```bash
cp .env.example .env.local
# Edit .env.local and add your token
```

```env
HUGGINGFACE_API_TOKEN=hf_your_token_here
HF_MODEL_ID=Anwarkh1/Skin_Lesion-Image_Classification
```

### 4. Run locally

```bash
npm run dev
# Open http://localhost:3000
```

---

## Deploy to Vercel

```bash
npm install -g vercel
vercel

# When prompted, set environment variables:
# HUGGINGFACE_API_TOKEN = hf_your_token_here
# HF_MODEL_ID = Anwarkh1/Skin_Lesion-Image_Classification
```

Or push to GitHub and connect the repo in [vercel.com/new](https://vercel.com/new) — it auto-detects Next.js.

**Set env vars in Vercel Dashboard → Project Settings → Environment Variables.**

---

## The 7 Lesion Classes (HAM10000)

| Class | Name | Risk |
|-------|------|------|
| `nv` | Melanocytic Nevi (Common Mole) | 🟢 Low |
| `mel` | Melanoma | 🔴 Critical |
| `bkl` | Benign Keratosis | 🟢 Low |
| `bcc` | Basal Cell Carcinoma | 🟠 High |
| `akiec` | Actinic Keratosis | 🟡 Moderate |
| `vasc` | Vascular Lesion | 🟢 Low |
| `df` | Dermatofibroma | 🟢 Low |

---

## Swapping to your own trained model

When you train your own model (fine-tuned ResNet-50 / ViT on HAM10000):

1. Push it to HuggingFace Hub
2. Update `HF_MODEL_ID` in your env vars
3. Redeploy — nothing else changes

---

## Phase 2: Mobile App

The `/api/analyze` endpoint is CORS-enabled and accepts:
```json
POST /api/analyze
{ "image": "data:image/jpeg;base64,..." }
```

Your React Native / Flutter app can call this endpoint directly.

---

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **ML**: HuggingFace Inference API (ViT fine-tuned on HAM10000)
- **Deployment**: Vercel
- **Fonts**: Playfair Display + DM Sans

---

## Disclaimer

DermIQ is a screening aid only. It does not provide medical diagnosis or replace professional clinical assessment. Always consult a qualified dermatologist or GP.
