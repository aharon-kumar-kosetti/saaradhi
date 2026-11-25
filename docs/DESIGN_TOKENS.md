# Saaradhi design tokens & UI references

## References to add (you provide)
Put 3-5 PhonePe screenshots in `/docs/ui-refs/` (home, scan-to-pay, confirmation, history, language select).
Agent: study layout rhythm, button size, spacing, icon+label pattern. Do NOT copy logos or brand assets.

## Principles
- One primary action per screen. Camera/Scan is the hero button on Home.
- Icons always paired with a text label (te/hi/en).
- Never rely on color alone: scam labels = color + icon + word.
- "Read aloud" button on every explanation.
- Disclaimer on key screens: "Document comprehension, not legal advice."

## Tokens (starting point, tune after testing with real elderly users)
| Token | Value |
|---|---|
| Body text | 18sp minimum, line height 1.5 |
| Headings | 24-28sp, bold |
| Touch target | 48dp minimum, primary buttons 56dp high, full width |
| Spacing scale | 4, 8, 12, 16, 24, 32 |
| Corner radius | 12-16dp |
| Contrast | 4.5:1 minimum, aim for 7:1 on body text |
| Primary | #5B2EBF (calm purple; change if it clashes with PhonePe-like feel) |
| Safe | #1B8F4E + check icon |
| Suspicious | #E8A317 + warning icon |
| Dangerous | #D32F2F + stop icon |
| Unsure | #5F6B7A + question icon |
| Background | #FFFFFF, cards #F6F7FB |
| Fonts | Noto Sans Telugu, Noto Sans Devanagari (Hindi), Noto Sans (English) |

## Core screens
1. Language select  2. Home (Scan button, recent notices)  3. Camera / gallery / PDF
4. Confirm fields  5. Explanation (+ Read aloud)  6. Scam label with reasons
7. Form guide (fill-along, one field at a time)  8. Deadlines  9. Send summary (consent)
10. Settings & privacy (delete data)  11. Admin queue (web mockup, v1.5)

## Accessibility checklist
Large fonts respect system scaling; screen-reader labels on all controls; works in portrait only for v1;
loading states say what is happening ("Reading your notice...") in the chosen language.
