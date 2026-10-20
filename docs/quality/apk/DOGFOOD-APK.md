# Dogfood APK — provenance

| Field | Value |
|-------|--------|
| **main HEAD (tagged)** | `9430f4f436e6528412b5da73f6a94ebd9e0e8514` |
| **Release** | https://github.com/Alexkucepalov/momentum/releases/tag/dogfood-s2-2026-10-20 |
| **Download (phone)** | https://github.com/Alexkucepalov/momentum/releases/download/dogfood-s2-2026-10-20/momentum-dogfood.apk |
| **Local path** | `apps/mobile/dist/momentum-dogfood.apk` |
| **SHA256** | `f71a72abf738777df9ea94b4b0cc56be03bd3197bffc33648fbca79fe2e3faeb` |
| **Bytes** | 140405422 |

## S2 coverage

All of these merges are ancestors of `9430f4f`:

- S2-1 `#43` → `4b1887e`
- S2-2 `#45` → `22b5201`
- S2-3 `#47` → `f29ef45`
- S2-4 `#49` → `721756b`

Commits after `721756b` on main are **docs-only** (#50 status, #51 meta). App JS in this APK = food-path UX through S2-4.

## Prior meta mismatch

Earlier `DOGFOOD-APK.md` listed `git: 6f78d45` while conversation cited `9430f4f`. That was bookkeeping drift: `6f78d45..9430f4f` = docs only. Rebuilt + re-tagged at exact `9430f4f`.

## Device gate

**OPEN** — install via Download link; run `DEVICE-DOGFOOD-15MIN.md`. No agent claim of Android Pass.
