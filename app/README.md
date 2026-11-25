# saaradhi-app

Expo (SDK 58) app for Saaradhi. Runs in **Expo Go** on Android; no custom native modules until a
dev client is approved.

```bash
npm install
npx expo start        # scan the QR code with Expo Go
```

Routes live in `src/app` (expo-router). Design tokens: `src/constants/tokens.ts`
(values come from `/docs/DESIGN_TOKENS.md`). Environment: copy the root `.env.example` to `app/.env`.
Project rules: see the root [CLAUDE.md](../CLAUDE.md).
