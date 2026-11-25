# Saaradhi (సారథి)

Voice-first Telugu/Hindi AI copilot that helps people understand notices and forms, spot scams, and know
exactly what to fill and bring. Prepare-only: it never submits anything for you.

> Status: **M0 — repo skeleton.** App and API boot; no pipeline yet. See `/docs/MILESTONES.md`.
> `docs/PRD.md` is still a placeholder — the exported PRD needs to be added.

## Quickstart

```bash
# API (NestJS) — http://localhost:3000/health
cd api && npm install && npm run start:dev

# App (Expo Go) — scan the QR with Expo Go on Android
cd app && npm install && npx expo start
```

Copy the root `.env.example` to `api/.env` and `app/.env` and fill only what you need.
Secrets are never committed.

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
