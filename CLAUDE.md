# CLAUDE.md — Saaradhi (read this every session)

**Status: M0 (repo skeleton).** Update this line every milestone. Until `docs/PRD.md` is exported, the
spec is `docs/MILESTONES.md` + `supabase/schema.sql` + `data/*`.

## What we're building
Saaradhi is an Android app (Expo / React Native) that helps elderly and first-gen users in
Andhra Pradesh and Telangana understand notices and forms in Telugu/Hindi, detect scams, and know
exactly what to fill and bring. Full spec: `/docs/PRD.md`. If this file and the PRD conflict, ask me.

## Non-negotiable rules
1. **Prepare-only.** The app never submits forms, payments, or anything on the user's behalf.
2. **The AI never decides what is "official".** Check links/domains/ref formats against
   `/data/trusted_registry.json`. Entries with `"verified": false` must not be treated as official.
3. **Scam output** = `safe | suspicious | dangerous | unsure` + plain-language reasons. Never claim certainty.
   "Safe" means "consistent with official patterns".
4. **No answer in the KB?** Say so, show the helpline, queue for admin review. Never guess or invent rules,
   fees, dates, or penalties.
5. **Cite sources** (KB chunk + `last_verified`) for anything about money, legal consequences, or deadlines.
6. **Privacy:** consent screen before first upload; guests = local storage only, auto-delete after 90 days;
   logged-in = cloud + local; admin sees a case only after user consent. Never log notice contents or PII.
7. **Secrets** live in `.env` only. Never hardcode or commit keys. Keep `.env.example` updated.
8. Show this disclaimer on key screens: "Document comprehension, not legal advice."

## Stack
- App: Expo (Expo Go for now), TypeScript, expo-router, expo-notifications (local scheduled reminders),
  expo-camera, expo-image-picker, expo-document-picker, expo-speech / Sarvam audio playback
- API: NestJS (TypeScript), job queue for OCR/LLM calls
- DB/Auth/Storage: Supabase (Postgres, pgvector, RLS, private bucket)
- AI: Gemini (vision + LLM, structured JSON output), Sarvam AI (Telugu/Hindi STT/TTS), Google TTS fallback
- Hosting: Supabase free tier + Render free tier (API). Mobile builds via Expo EAS.

## Repo layout
/app      Expo app          /api     NestJS API
/docs     PRD, design tokens, milestones   /data   notices, registry, glossary   /kb   source PDFs
/supabase schema.sql

## Repo conventions
- **npm in each package**, no root workspace. `app/` and `api/` are independent: each has its own
  `package.json`, `tsconfig.json` and real `.env`. The root `.env.example` is the only template we commit.
- Node >= 20 (this machine: v24.13.1, npm 11.8.0). TypeScript `strict: true` in both packages.
- **Expo Go only:** no custom native module or config plugin that needs a dev client without my approval.
- Files stay small. One component / service per file where practical. Comments only explain *why*.
- No `any` without a one-line reason. No `console.log` of notice text, images or PII.

## Vocabulary — closed set, do not invent values
Matches `supabase/schema.sql`; change the schema first, then this list.
- scam label: `safe` · `suspicious` · `dangerous` · `unsure`
- notice category: `health_insurance` · `financial_utility` · `community_service` · `scam_fraud` · `other`
- language: `te` · `hi` · `en`
- notice status: `new` · `confirmed` · `explained` · `done` · `escalated`
- review queue reason: `scam_unsure` · `no_kb_answer` · `low_ocr_confidence` · `user_request` · `wrong_translation`

## Registry rules for the agent
- **Never** set `verified: true` or `last_verified` in `data/trusted_registry.json`. Only I do that, after
  checking the department's own site. Unverified entries are treated as unknown, not trusted.
- A "safe" label needs positive evidence (verified registry domain, matching ref format, no urgency
  language). Missing evidence is `unsure`, not `safe`.

## Testing on sample notices
- Report accuracy as a table of expected vs extracted, per field, per file.
- List every mismatch. Never state a pass rate without counting the files in `/data/notices`.

## UI rules (PhonePe-style, elderly-first)
See `/docs/DESIGN_TOKENS.md`. One primary action per screen, min 48dp touch targets, min 18sp body text,
icons + labels, never color alone, camera is the main button on Home.

## Pipeline (per notice)
classify -> extract fields (Gemini JSON) -> user confirms fields -> scam check -> RAG retrieve (cited)
-> explain (te/hi/en) -> checklist + form guide -> schedule local reminders -> optional send-to-admin.
Each step = separate service/function; config-driven per department. No new code per department.

## Agent tools for the in-app voice agent (v1.5)
`navigate(screen)`, `highlight_field(id)`, `fill_field(id, value)`, `read_aloud(text, lang)`, `open_notice(id)`.
Scope: inside Saaradhi only. Never control other apps.

## How to work with me
- Work one milestone at a time (`/docs/MILESTONES.md`). After each: run it, report what works / doesn't,
  then wait for my "go".
- Ask when unclear. Don't invent requirements. If the PRD is silent on a screen or a rule, stop and ask.
- Keep code simple and typed; small files; comments only where the *why* isn't obvious.
- Before big changes, show the plan first.
- Test on `/data/notices` and report accuracy honestly, including failures.
- When a command becomes real, update **Commands** here and the README in the same change.

## Commands
- Install deps: `cd app && npm install` · `cd api && npm install`
- App (Expo Go): `cd app && npx expo start`
- API: `cd api && npm run start:dev`
- API health: `curl http://localhost:3000/health`
- Tests: `npm test` in each package
