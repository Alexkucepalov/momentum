#!/usr/bin/env node
/**
 * Capture Expo web screenshots into docs/screenshots/.
 * Requires: Expo web on BASE_URL (default http://localhost:8081)
 * Uses system Chrome via puppeteer-core.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer-core');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'docs', 'screenshots');
const base = process.env.BASE_URL ?? 'http://localhost:8081';
const chromePath =
  process.env.CHROME_PATH ??
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const routes = [
  { path: '/', name: '01-today-empty' },
  { path: '/food', name: '02-food-empty' },
  { path: '/activity', name: '03-activity-empty' },
  { path: '/progress', name: '04-progress-empty' },
  { path: '/profile', name: '05-profile' },
  { path: '/recipes', name: '06-recipes-empty' },
];

mkdirSync(outDir, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=390,844'],
  defaultViewport: {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  },
});
const page = await browser.newPage();
await page.setExtraHTTPHeaders({ 'Accept-Language': 'ru-RU,ru;q=0.9' });

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

async function shot(name) {
  const file = join(outDir, `${name}.png`);
  await sleep(600);
  await page.screenshot({ path: file, fullPage: true });
  console.log('saved', file);
  return file;
}

async function goto(path) {
  await page.goto(`${base}${path}`, { waitUntil: 'networkidle0', timeout: 60000 });
  await sleep(1500);
}

/** Click smallest visible control whose text includes/matches pattern (icons ok). */
async function clickByText(patterns) {
  const list = Array.isArray(patterns) ? patterns : [patterns];
  const handle = await page.evaluateHandle((pats) => {
    const reList = pats.map((p) => new RegExp(p, 'i'));
    const candidates = Array.from(
      document.querySelectorAll('button, [role="button"], a, [tabindex]'),
    );
    const scored = [];
    for (const el of candidates) {
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') continue;
      const r = el.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) continue;
      const text = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
      if (!text || text.length > 80) continue;
      for (const re of reList) {
        if (re.test(text)) {
          scored.push({ el, area: r.width * r.height, text });
          break;
        }
      }
    }
    scored.sort((a, b) => a.area - b.area);
    return scored[0]?.el ?? null;
  }, list);

  const el = handle.asElement();
  if (!el) {
    console.log('  click miss:', list.join(' | '));
    return false;
  }
  await el.evaluate((n) => n.scrollIntoView({ block: 'center' }));
  await el.click();
  console.log('  clicked:', list.join(' | '));
  return true;
}

async function scrollTop() {
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    document.querySelectorAll('div').forEach((el) => {
      if (el.scrollTop) el.scrollTop = 0;
    });
  });
}

try {
  for (const r of routes) {
    await goto(r.path);
    await shot(r.name);
  }

  await goto('/');
  if (await clickByText(['^Добавить еду$'])) {
    await sleep(900);
    await shot('07-today-add-food-sheet');
  } else if (await clickByText(['Добавить еду'])) {
    await sleep(900);
    await shot('07-today-add-food-sheet');
  }

  await goto('/progress');
  await shot('04b-progress-summary');
  for (const [label, name] of [
    ['^Тело$', '04d-progress-body'],
    ['^Питание$', '04e-progress-food'],
    ['^Спорт$', '04f-progress-sport'],
    ['^Привычки$', '04c-progress-habits-tab'],
  ]) {
    if (await clickByText([label])) {
      await sleep(500);
      await scrollTop();
      await shot(name);
    }
  }
  if (await clickByText(['^Добавить привычку$', 'Ещё привычка'])) {
    await sleep(700);
    await shot('08-progress-habit-composer');
    // Close composer if cancel exists, then open challenge form
    await clickByText(['^Отмена$']);
    await sleep(400);
  } else if (await clickByText(['Добавить привычку'])) {
    await sleep(700);
    await shot('08-progress-habit-composer');
    await clickByText(['^Отмена$']);
    await sleep(400);
  }
  if (await clickByText(['^Новый челлендж$', 'Ещё челлендж'])) {
    await sleep(700);
    await shot('08b-progress-challenge-composer');
  }

  // Filled states: stay in SPA (web DB is in-memory; full reload wipes entries).
  await goto('/');
  if (await clickByText(['Добавить еду'])) {
    await sleep(800);
    await clickByText(['Быстро']);
    await sleep(500);
    await scrollTop();
    await shot('09-add-food-quick-tab');

    const inputs = await page.$$('input');
    if (inputs[0]) {
      await inputs[0].click({ clickCount: 3 });
      await page.keyboard.type('Овсянка', { delay: 15 });
    }
    for (const [i, v] of [
      [1, '10'],
      [2, '5'],
      [3, '40'],
    ]) {
      if (!inputs[i]) continue;
      await inputs[i].click({ clickCount: 3 });
      await page.keyboard.type(v, { delay: 15 });
    }
    await sleep(300);
    if (await clickByText(['Добавить в дневник'])) {
      await sleep(1200);
    }
  }

  await scrollTop();
  await shot('10-today-with-food');
  await page.click('a[href="/food"]');
  await sleep(1200);
  await scrollTop();
  await shot('11-food-with-entries');
  await page.click('a[href="/progress"]');
  await sleep(1200);
  await scrollTop();
  await shot('12-progress-after-log');

  await page.click('a[href="/activity"]');
  await sleep(1200);
  if (await clickByText(['Тренировка'])) {
    await sleep(800);
    await shot('13-activity-workout-sheet');
  }

  writeFileSync(
    join(outDir, 'README.md'),
    `# UI screenshots (Expo web · iPhone 390×844 @2x)

Снято скриптом \`scripts/capture-screenshots.mjs\` с \`BASE_URL=${base}\`.

| Файл | Экран / состояние |
|------|-------------------|
| 01-today-empty | Сегодня · пустой дневник |
| 02-food-empty | Питание · пусто |
| 03-activity-empty | Активность · пусто |
| 04-progress-empty | Прогресс · пусто |
| 04b-progress-summary | Прогресс · вкладка Итоги |
| 04c-progress-habits-tab | Прогресс · Привычки / челленджи |
| 04d-progress-body | Прогресс · Тело |
| 04e-progress-food | Прогресс · Питание |
| 04f-progress-sport | Прогресс · Спорт |
| 05-profile | Профиль (snapshot v9) |
| 06-recipes-empty | Рецепты · пусто |
| 07-today-add-food-sheet | Сегодня · шит «Добавить еду» |
| 08-progress-habit-composer | Прогресс · создание привычки |
| 08b-progress-challenge-composer | Прогресс · создание челленджа |
| 09-add-food-quick-tab | Быстрый / ручной ввод |
| 10-today-with-food | Сегодня · после лога |
| 11-food-with-entries | Питание · с записями |
| 12-progress-after-log | Прогресс · после лога |
| 13-activity-workout-sheet | Активность · форма тренировки |

Камера / нативный barcode на web не снимаются.

Финальный набор после Sprint 1–4: \`docs/screenshots/final/\`.
`,
  );
  console.log('README written');
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  await browser.close();
}
