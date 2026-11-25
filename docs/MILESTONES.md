# Milestones & definition of done

**Global DoD (every milestone):** runs without errors in Expo Go / local API; matches `/docs/PRD.md`;
tests on `/data/notices` pass or failures are reported honestly; no secrets committed; short summary of
what changed, what's broken, and what's next. Stop and wait for "go".

| # | Milestone | Done when |
|---|---|---|
| M0 | Repo skeleton | Folders, README outline, `.env.example`, CLAUDE.md in place; app and API boot with a hello screen/endpoint |
| M1 | App shell | Language select, Home, camera/gallery/PDF picker, navigation, mock data; guest mode works; consent screen |
| M2 | Extraction | Photo -> Gemini -> JSON fields -> Confirm screen. Report accuracy on all notices in `/data/notices` (field-level) |
| M3 | Scam checker | Registry match, lookalike domains, shortener expansion, QR decode, ref format, urgency language -> label + reasons. Report results on the fake set; every wrong label listed |
| M4 | Explanation + KB | pgvector hybrid RAG with citations, te/hi/en explanation using glossary, Read aloud, "no answer" path -> helpline + review queue |
| M5 | Form guide + deadlines | Field-by-field guidance, document checklist, local reminders (T-7, T-3, T-1, due day), editable |
| M6 | Stretch | Thin voice commands (te/hi) driving the in-app agent tools; admin review web page |

## Target metrics (from PRD)
Photo -> understanding < 60s; >= 80% key fields correct on real notices; >= 8/10 fake notices labelled
correctly; Telugu understandable on 9/10 per native speaker; >= 3 elderly users complete the flow.
