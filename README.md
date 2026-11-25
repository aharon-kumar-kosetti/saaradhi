# Saaradhi (సారథి)

Voice-first Telugu/Hindi AI copilot that helps people understand notices and forms, spot scams, and know
exactly what to fill and bring. Prepare-only: it never submits anything for you.

> Status: **M5 — form guide, checklist and reminders.** Photo/PDF/text -> fields -> Confirm -> scam
> verdict -> cited what-to-do guidance -> field-by-field form guide, editable document checklist and
> local due-date reminders.
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
| `app/app.json` | `expo.extra.apiUrl` | API base URL, default `http://localhost:3000`. In Expo Go a `localhost` value is rewritten to the bundler's LAN host automatically, so a phone on the same Wi-Fi reaches the computer without editing this. Set it explicitly for a deployed API. |

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

## Scam checking (M3)

`POST /scam/check` takes the fields the user confirmed plus the extraction warnings, and returns a label
(`safe | suspicious | dangerous | unsure`), a score and **machine reason codes**. `GET /scam/status`
reports how many registry departments exist and how many a human has verified — currently **3 and 0**.

| Signal | Points |
|---|---|
| Domain looks like an official one | 50 |
| Link is a raw IP address | 40 |
| Link is shortened (bit.ly and friends) | 40 |
| Domain ends in `.xyz .top .click .icu .buzz .rest` | 30 |
| Urgent or threatening language | 25 |
| QR code shown with a payment request | 25 |
| Reference number does not fit the department format | 25 |
| Unknown domain | 15 |
| Plain `http`, not `https` | 10 |

`>= 60` is **dangerous**, `>= 25` is **suspicious**. **`safe` requires a verified registry entry plus an
official link**, so while every entry is `verified: false` the checker cannot answer `safe` at all: an
official-looking link comes back `unsure` with "no one has confirmed this department's official website
yet". That is the rule from `CLAUDE.md`, enforced in code and in tests.

Shortened links are resolved one hop at a time, and **the destination is never fetched**: only the
shortener is contacted, and only to read its redirect. Reason codes are translated in the app, so the
API never returns notice text.

### Results on the fake set

`npm run scam-report` in `api/`:

| Notice | Expected | Got | Main signals |
|---|---|---|---|
| fake_bill_apspdcl_te | dangerous | **dangerous** | lookalike, `.xyz`, urgency |
| fake_health_shorturl_en | dangerous | **dangerous** | shortened link, urgency |
| fake_insurance_hi | dangerous | **dangerous** | shortened link, urgency |
| fake_ip_payment_te | dangerous | **dangerous** | raw IP, QR payment, urgency |
| fake_no_link_urgency_hi | suspicious | **suspicious** | urgency, no link to check |
| fake_property_http_hi | suspicious | **suspicious** | plain http, unknown domain |
| fake_ration_lookalike_en | dangerous | **dangerous** | buried official domain, `.click`, urgency |
| fake_tgspdcl_lookalike_te | dangerous | **dangerous** | `.top`, urgency, unknown domain |
| real_bill_apspdcl_te | unsure | **unsure** | no link to check |
| real_health_ayushman_hi | unsure | **unsure** | unknown domain |
| real_property_ghmc_en | unsure | **unsure** | unknown domain |

**8/8 fakes labelled correctly, 0/3 real notices wrongly accused, and nothing labelled `safe`.** All 11
files are synthetic text, so this is the rule engine's accuracy — not photo accuracy.

Known gaps, stated plainly:
- Lookalike detection can only recognise `apspdcl.in` today, because every other registry domain is still
  `TODO`. `tgspdcl-power.top` was flagged dangerous on its `.top` ending and threats, not as a lookalike.
- Shortener expansion needs network access from the API; without it the link is still flagged, with
  `expansion_failed: true`.
- QR codes are recognised from notice text (QR + payment words) or from Gemini's `risk_signals` flag.
  There is no camera QR scanning.
- Scores are rule weights, not calibrated probabilities.

## Explanation + knowledge base (M4)

| Endpoint | Purpose |
|---|---|
| `GET /explain/status` | corpus size, verified sources, backend in use |
| `POST /explain` | `{fields, language}` -> advice codes, citations, helpline, `no_answer` |
| `POST /review` | consent-gated review request; refuses without `consent: true` |

**Retrieval** is hybrid, mirroring `match_kb_chunks` from `supabase/schema.sql`: IDF-weighted lexical
overlap (0.6) plus cosine over deterministic hashed 768-dim vectors (0.4). Below **0.18** the answer is
`no_answer` — the service says it does not know instead of stretching a weak match.

**No pgvector yet.** There is no Supabase project or credentials in this repo, so `kb_chunks` is not in
use; chunks load from `/kb/chunks/*.json` through `kb.store.ts`. Swapping in Supabase means one adapter
behind the same `Retriever` interface — the ranking code does not change.

**Answers contain no free text.** The API returns a closed set of 10 advice codes plus citations; the app
translates them (te/hi/en) and reads them aloud. That keeps invented fees, deadlines and penalties
structurally impossible. Citations carry `last_verified`, and the seeded corpus is `placeholder: true`
with `last_verified: null`, so every answer is labelled "not checked against an official source yet".

**No answer path:** when retrieval is weak, the screen says so, shows the helpline, and offers
"Ask a person to check this". The registry ships `helpline: "TODO"`, so until you fill those in the app
says no number is recorded rather than inventing one. The request sends department, category and notice
type only — never the notice or the user's details — and is written to `api/.data/review-queue.json`
(gitignored). That is a stand-in for the Supabase `review_queue` table, not the real queue.

**Read aloud** uses `expo-speech` with `te-IN` / `hi-IN` / `en-IN`. There is no Sarvam integration yet,
and a phone without a Telugu or Hindi TTS voice will not speak those languages.

## Form guide, checklist and reminders (M5)

Open a saved notice -> **What to fill and bring** (`/guide/[id]`). Everything on that screen is
preparation only: Saaradhi never fills, sends or pays anything.

- **Field-by-field guidance** explains how to read and write each detail ("copy the office name exactly
  as printed"). It deliberately states no fee, deadline or penalty — those come only from a cited KB chunk.
- **Document checklist** starts from the notice's `required_documents`, then the user ticks, adds their own
  item, or removes one. It is stored on the notice, so it survives a reload and the 90-day prune.
- **Local reminders** at T-7, T-3, T-1 and the due day, at 09:00 local time, each toggled separately.
  Turning one off cancels its notification; dates already past are skipped. Expo Go does show locally
  scheduled notifications on Android (only remote push needs a development build).
- A refused notification permission is reported on screen; no reminder id is stored, so the app never
  claims a reminder it does not have.
- Reminders are cancelled when the notice is deleted and when **Delete my data** runs. Notices without a
  due date show why no reminder can be set.
- **Unverified:** no device run yet — delivery after a reboot, the Android 13+ permission prompt and the
  Telugu/Hindi speech output have not been observed on hardware.

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
