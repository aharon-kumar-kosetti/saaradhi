# Saaradhi (సారథి)

Voice-first Telugu/Hindi AI copilot that helps people understand notices and forms, spot scams, and know
exactly what to fill and bring. Prepare-only: it never submits anything for you.

> Status: **M2 — extraction.** Photo/PDF/text -> JSON fields -> Confirm screen -> saved on the phone.
> Scam checking (M3) is not built yet, so saved notices carry no scam label.
> See `/docs/MILESTONES.md`. `docs/PRD.md` is still a placeholder — the exported PRD needs to be added.

## Quickstart

```bash
# API (NestJS) — http://localhost:3000/health
cd api && npm install && npm run start:dev

# App (Expo Go) — scan the QR with Expo Go on Android
cd app && npm install && npx expo start
```

Copy the root `.env.example` to `api/.env` and `app/.env` and fill only what you need.
Secrets are never committed.

## Configuration

| Where | Variable | Purpose |
|---|---|---|
| `api/.env` | `GEMINI_API_KEY` | Turns on photo and PDF reading. Without it `/extract` answers 503 for photos and the app tells the user photo reading is off (samples still work). |
| `api/.env` | `GEMINI_MODEL` | Optional model override. Defaults to `gemini-2.5-flash`. |
| `api/.env` | `PORT` | Optional. Defaults to `3000`; a value of `0` is ignored. |
| `app/app.json` | `expo.extra.apiUrl` | API base URL, default `http://localhost:3000`. On a real phone `localhost` is the phone, so set this to the computer's LAN address, e.g. `http://192.168.1.10:3000`, and keep both on the same Wi-Fi. |

## Extraction (M2)

The API reads a notice and returns fields only — never OCR text, so notice contents do not sit in logs
or responses beyond the fields the user is about to confirm.

| Endpoint | Purpose |
|---|---|
| `GET /extract/status` | Whether a Gemini key is configured, plus the sample ids. |
| `GET /extract/demo` | All sample extractions. |
| `POST /extract/demo/:id` | One sample (`bill`, `health`, `scam`). |
| `POST /extract` | `{fileName, mimeType, dataBase64}` -> `ExtractionResult`. Photos/PDF need `GEMINI_API_KEY`; `text/plain` is read offline. |

In the app: Home -> photo/gallery/PDF (or "See a sample notice") -> reading screen -> Confirm screen where
the user fixes anything wrong -> saved to AsyncStorage (`saaradhi.notices.v1`, pruned after 90 days).
Nothing is submitted anywhere.

### Accuracy (honest numbers)

`npm run accuracy` in `api/` compares expected vs extracted, field by field:

- **45/45 field checks match across 5 synthetic notices** in `/data/notices/samples` (0 mismatches).
- Those samples are **plain-text files**, so the number measures the deterministic text parser only.
- **Gemini photo/PDF accuracy is unmeasured:** there are no sample notice photos in the repo and no API
  key was available. Do not quote the 45/45 as photo-reading accuracy.
- Missing from the metric so far: real Telugu/Hindi notice photos, PDFs, and any device run.

## README outline (fill as you build)
1. Pitch (one paragraph) + demo GIF/video
2. Problem
3. Screenshots (put images in `/docs/screens`)
4. Features
5. How it works (architecture diagram)
6. Tech stack
7. Setup (app, API, Supabase, env vars)
8. Test set & accuracy results
9. Safety, privacy, limitations
10. Roadmap
11. Disclaimer: Document comprehension, not legal advice.
