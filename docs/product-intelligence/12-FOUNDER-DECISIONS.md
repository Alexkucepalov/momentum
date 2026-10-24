# Founder Decisions

**Updated:** 2026-10-24 · Source: [`15-MOMENTUM-2.0-VISION-AND-ROADMAP.md`](./15-MOMENTUM-2.0-VISION-AND-ROADMAP.md)  
Agents must not override **Approved** rows without a new founder note.

| Status | Meaning |
|--------|---------|
| **Approved** | Strategy locked for 12-week horizon |
| **Propose approve** | Recommended; confirm before tab cutover PR |
| **Standing policy** | Default unless founder changes |

---

## Decision log

| ID | Topic | Decision | Status | Date |
|----|-------|----------|--------|------|
| **D1** | Product focus | **Food Intelligence** — not MFP clone, not recipe encyclopedia, not delivery competitor | **Approved** | 2026-10-24 |
| **D2** | Navigation | Five tabs: Today · Food · **Plan** · Progress · Profile. Activity leaves tab bar → Progress + quick actions. No 6th tab. | **Propose approve** | 2026-10-24 |
| **D3** | Store catalogs | Own data from purchases + allowed sources; partner/BD research separate; **no scrape** | **Approved** | 2026-10-24 |
| **D4** | OCR | Keep **on-device**; Android accuracy before user-facing promises | **Approved** | 2026-10-24 |
| **D5** | Analytics | **Local diagnostics only**; no off-device telemetry SDK | **Approved** | 2026-10-24 |
| **D6** | Persistence | **No** snapshot→relational migration without measurements + new decision | **Approved** | 2026-10-24 |
| **D7** | Production | **No** Play/EAS production until Android quality gate | **Approved** | 2026-10-24 |
| **D8** | Dispatcher | Quality automation may be considered separately; **no auto-merge** | **Approved** | 2026-10-24 |
| **D9** | Challenges | Keep data; **lower visual priority** | **Approved** | 2026-10-24 |
| **D10** | Budget honesty | Show incomplete prices **explicitly**; never treat unknown as zero | **Approved** | 2026-10-24 |

---

## Open for explicit confirm

1. **D2** — Approve Plan-tab cutover before UX-04 implementation ([`16-TARGET-IA.md`](./16-TARGET-IA.md)).  
2. Wireframe sign-off for Today fold + Plan landing (Phase 1).

---

## Historical context

Pre-strategy open questions lived in audit-only form; superseded by §10 of vision doc. Audit evidence unchanged in `00`–`14`.
