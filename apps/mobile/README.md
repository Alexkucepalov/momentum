# Momentum mobile (Expo)

Android-first offline food diary. Design-preview placeholders remain on Activity; Food/Today/Progress export are functional against local SQLite.

## Requirements

- Node 20+ (24 recommended)
- **Expo Go with SDK 57** (client ~57.0.x) — this app targets Expo SDK 57
- Android emulator / device for SQLite durability

### Expo Go version mismatch

Project SDK must match Expo Go. This app is on **SDK 57**. Restart after changes:

```bash
npx expo start -c
```

Web preview (`npx expo start --web`) does not need Expo Go.

## Start

```bash
cd apps/mobile
npm install
npx expo start -c
```

Press **`a`** for Android (dogfood / SQLite). Web (`w`) is a UI preview: demo import works (Профиль → «Загрузить демо 2 недели»); snapshot persists in `localStorage` (not SQLite).

If the browser shows only a spinner or a blank page, restart with a clean cache:

```bash
npx expo start -c --web
```

`app.json` uses `"web": { "output": "single" }` so the JS bundle loads (required for styles and tabs).

## Checks

From repo root:

```bash
npm run typecheck && npm test && npm run security:scan
cd apps/mobile && npx tsc --noEmit
```

## Notes

- Package id: `app.momentum.dogfood`
- Expo SDK 58 (confirm Play target API with EAS when configuring release builds)
- No fake cloud backend; AI not used for logging
