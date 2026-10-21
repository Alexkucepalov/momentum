# Screenshot OCR (on-device, free) — Android notes

**Issue:** #84  
**Engine:** `react-native-executorch` legacy `OCR_RUSSIAN` (Cyrillic CRNN) — free, on-device inference.  
**Not used:** ML Kit Text Recognition v2 (no Cyrillic), cloud Vision/LLM.

## User flow

Plan → Покупка → **Скрин** → галерея/камера → OCR → preview → confirm (`sourceKind: screenshots`) → pantry + catalog (#81).

## Privacy

- Screenshot bytes stay on device.
- First open of «Скрин» may **download OCR model weights** (not the photo) over the network; cached afterwards.
- Web: OCR disabled; paste fallback.

## APK / native size

- Dependency: `react-native-executorch` with `package.json` → `"react-native-executorch": { "features": ["ocr"] }` (XNNPACK/CoreML/Vulkan + OpenCV — smaller than full LLM stack).
- Expect **tens of MB** native + first-run model cache (order of ~10–50 MB depending on device cache). Measure after `expo run:android` / local APK; record Δ in dogfood notes.
- Requires **New Architecture** (already `newArchEnabled=true`) and a **dev/production build** — not Expo Go.

## How to dogfood

1. `cd apps/mobile && npx expo run:android` (or local APK script).
2. Open Plan → Покупка → Скрин; wait for model download if prompted.
3. Import a synthetic Самокат/METRO order screenshot; edit noisy lines; confirm.
4. If OCR fails → «Текст» paste (still primary reliable path).

## Out of scope

Multi-screenshot stitch, cloud OCR, retailer scrape.
