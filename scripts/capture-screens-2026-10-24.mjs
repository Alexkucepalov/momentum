#!/usr/bin/env node
/**
 * Full-screen visual pack (Nutrition Soft Light / Design Reset #148).
 * Expo web · 390×844 @2x. NOT physical Android Pass.
 * Output: docs/quality/visual-audit-pack/2026-10-29-screens/
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer-core');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'docs', 'quality', 'visual-audit-pack', '2026-10-29-screens');
const base = process.env.BASE_URL ?? 'http://localhost:8081';
const chromePath =
  process.env.CHROME_PATH ??
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const WEB_KEY = 'momentum.web.store_snapshot.v1';

mkdirSync(outDir, { recursive: true });
const manifest = [];

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
page.on('dialog', async (d) => {
  try {
    await d.accept();
  } catch {
    /* ignore */
  }
});

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

async function shot(name, note) {
  const file = join(outDir, `${name}.png`);
  await sleep(600);
  await page.screenshot({ path: file, fullPage: true });
  manifest.push({ file: `${name}.png`, note: note ?? name });
  console.log('saved', name);
}

async function clearStore() {
  await page.evaluate((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }, WEB_KEY);
}

async function goto(path) {
  await page.goto(`${base}${path}`, { waitUntil: 'networkidle0', timeout: 180000 });
  await sleep(1100);
}

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
      if (!text || text.length > 120) continue;
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

async function fillByLabel(labelRe, value) {
  const ok = await page.evaluate(
    (reSrc, val) => {
      const re = new RegExp(reSrc, 'i');
      const inputs = Array.from(document.querySelectorAll('input, textarea'));
      for (const el of inputs) {
        const al = el.getAttribute('aria-label') || '';
        const ph = el.getAttribute('placeholder') || '';
        if (re.test(al) || re.test(ph)) {
          el.focus();
          el.value = '';
          const proto =
            el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
          const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
          setter?.call(el, val);
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
      }
      return false;
    },
    labelRe,
    value,
  );
  console.log(ok ? '  filled' : '  fill miss', labelRe);
  return ok;
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
  await goto('/');
  await clearStore();
  await goto('/');

  // ─── EMPTY / BASE ROUTES ─────────────────────────────────
  const emptyRoutes = [
    ['/', '01-today-empty', 'Сегодня · пусто · CTA «Что съесть сейчас»'],
    ['/food', '02-food-empty', 'Питание · пусто'],
    ['/plan', '03-plan-hub', 'План · хаб (вкладка)'],
    ['/progress', '04-progress-empty', 'Прогресс · пусто'],
    ['/profile', '05-profile', 'Профиль · ссылки План/Активность'],
    ['/activity', '06-activity-hidden-tab', 'Активность · экран без вкладки'],
    ['/recipes', '10-recipes-empty', 'Рецепты · пусто'],
    ['/recipes/new', '11-recipe-form-empty', 'Новый рецепт · форма'],
    ['/recipes/import-text', '12-recipe-import-text-empty', 'Импорт из текста · пусто'],
    ['/recipes/import-personal', '13-recipe-import-personal', 'Архив личных рецептов'],
    ['/plan/eat-now', '20-eat-now-empty', 'Что съесть сейчас · пусто'],
    ['/plan/my-products', '21-my-products-empty', 'Мои продукты · пусто'],
    ['/plan/week', '22-week-empty', 'Меню на неделю'],
    // ADR-009 redirects — capture destination UX
    ['/plan/pantry', '23-redirect-pantry', 'Deep link /plan/pantry → хаб'],
    ['/plan/shop', '24-redirect-shop', 'Deep link /plan/shop → хаб'],
    ['/plan/budget', '25-redirect-budget', 'Deep link /plan/budget → хаб'],
    ['/plan/receipt', '26-redirect-receipt', 'Deep link /plan/receipt → Мои продукты'],
    ['/plan/stores', '27-redirect-stores', 'Deep link /plan/stores → хаб'],
  ];

  for (const [path, name, note] of emptyRoutes) {
    await goto(path);
    await scrollTop();
    await shot(name, note);
  }

  // Food catalog empty search
  await goto('/food');
  if (await clickByText(['^Каталог$'])) {
    await sleep(400);
    await fillByLabel('Поиск продукта или рецепта', 'xyz-нет-такого');
    await sleep(400);
    await shot('02b-food-search-no-results', 'Питание · каталог · поиск без результатов');
  }

  // Today → secondary «Добавить еду» sheet
  await goto('/');
  if (await clickByText(['Добавить еду'])) {
    await sleep(800);
    await shot('30-modal-add-food', 'Модалка · Добавить еду (Недавние)');
    if (await clickByText(['^Мои$'])) {
      await sleep(400);
      await shot('30b-modal-add-food-mine', 'Модалка · таб Мои');
    }
    if (await clickByText(['Быстро'])) {
      await sleep(400);
      await shot('30c-modal-add-food-quick', 'Модалка · быстрый ввод');
    }
  }

  // Today primary CTA
  await goto('/');
  if (await clickByText(['Что съесть сейчас'])) {
    await sleep(900);
    await shot('31-today-cta-eat-now', 'Сегодня · primary CTA → Eat Now');
  }

  // Progress habits / challenges
  await goto('/progress');
  if (await clickByText(['^Привычки$'])) {
    await sleep(500);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await sleep(300);
    const openedHabit = await page.evaluate(() => {
      for (const el of document.querySelectorAll('button, [role="button"]')) {
        if ((el.innerText || '').replace(/\s+/g, ' ').trim() === 'Добавить привычку') {
          el.click();
          return true;
        }
      }
      return false;
    });
    if (openedHabit) {
      await sleep(700);
      await shot('32-modal-habit-composer', 'Модалка · привычка');
      await clickByText(['^Отмена$']);
      await sleep(300);
    }
    const openedCh = await page.evaluate(() => {
      for (const el of document.querySelectorAll('button, [role="button"]')) {
        if ((el.innerText || '').replace(/\s+/g, ' ').trim() === 'Новый челлендж') {
          el.click();
          return true;
        }
      }
      return false;
    });
    if (openedCh) {
      await sleep(700);
      await shot('32b-modal-challenge-composer', 'Модалка · челлендж');
    }
  }

  await goto('/progress');
  if (await clickByText(['^Спорт$'])) {
    await sleep(500);
    await shot('33-progress-sport', 'Прогресс · Спорт → вход в Активность');
  }

  await goto('/activity');
  if (await clickByText(['Тренировка', 'Добавить'])) {
    await sleep(700);
    await shot('34-modal-workout', 'Модалка · тренировка');
  }

  // My products import empty → paste preview
  await goto('/plan/my-products');
  if (await clickByText(['Добавить списком'])) {
    await sleep(400);
    await fillByLabel(
      'Список продуктов',
      'Творог 5%\nКуриная грудка\nОвсянка\nГреческий йогурт — 59 ккал /100г · Б 10 · Ж 0.4 · У 3.6',
    );
    await sleep(400);
    await shot('35-my-products-import-preview', 'Мои продукты · предпросмотр импорта');
  }

  // ─── FILLED ──────────────────────────────────────────────
  console.log('--- seeding filled data ---');
  await goto('/profile');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await sleep(400);
  if (await clickByText(['Загрузить демо 2 недели'])) {
    await sleep(2000);
  }

  await goto('/recipes/import-personal');
  await sleep(800);
  await shot('40-recipe-import-personal-ready', 'Архив · готово к импорту');
  if (await clickByText(['Добавить в библиотеку'])) {
    await sleep(2000);
  }

  await goto('/recipes');
  await scrollTop();
  await shot('41-recipes-filled', 'Рецепты · заполненные');
  if (await clickByText(['Добавить рецепт'])) {
    await sleep(400);
    await shot('41b-recipes-add-funnel', 'Рецепты · воронка Добавить');
  }
  await fillByLabel('Поиск рецепта', 'борщ');
  await sleep(500);
  await shot('41c-recipes-search', 'Рецепты · поиск');

  const recipeId = await page.evaluate((key) => {
    try {
      const snap = JSON.parse(localStorage.getItem(key) || 'null');
      const list = snap?.recipes ?? [];
      return list.find((r) => !r.deletedAt)?.id ?? null;
    } catch {
      return null;
    }
  }, WEB_KEY);
  if (recipeId) {
    await goto(`/recipes/${encodeURIComponent(recipeId)}`);
    await shot('42-recipe-detail', 'Рецепт · деталь');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await sleep(400);
    const recook = await page.evaluate(() => {
      for (const el of document.querySelectorAll('button, [role="button"], *')) {
        if ((el.innerText || '').trim() === 'Приготовить снова') {
          el.click();
          return true;
        }
      }
      return false;
    });
    if (recook) {
      await sleep(800);
      await shot('42b-recipe-recook-modal', 'Рецепт · Приготовить снова');
      await clickByText(['^Закрыть$']);
      await sleep(400);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(200);
    if (await clickByText(['Добавить порцию в дневник'])) {
      await sleep(800);
      await shot('42c-recipe-portion-modal', 'Рецепт · порция в дневник');
    }
  }

  await goto('/recipes/import-text');
  await fillByLabel('Текст рецепта', 'Омлет\nЯйца 120 г\nМолоко 50 мл\nСоль');
  await sleep(300);
  await shot('43-recipe-import-text-filled', 'Импорт из текста · заполнено');
  if (await clickByText(['Открыть в редакторе'])) {
    await sleep(1000);
    await shot('43b-recipe-import-text-editor', 'Импорт из текста · редактор');
  }

  // Confirm my products import (after demo seed)
  await goto('/plan/my-products');
  if (await clickByText(['Добавить списком'])) {
    await sleep(300);
    await fillByLabel('Список продуктов', 'Мой творог\nМоя курица');
    await sleep(300);
    if (await clickByText(['Добавить в каталог'])) {
      await sleep(800);
    }
  }
  await scrollTop();
  await shot('50-my-products-filled', 'Мои продукты · после импорта');

  await goto('/plan/week');
  await scrollTop();
  await shot('51-week-composer', 'Меню · композер / доска');
  if (await clickByText(['Спроектировать план', 'Собрать меню', 'Новый черновик'])) {
    await sleep(400);
    if (await clickByText(['Спроектировать', 'Собрать'])) {
      await sleep(1500);
    }
    await scrollTop();
    await shot('51b-week-filled', 'Меню на неделю · после генерации');
  }

  await goto('/plan/eat-now');
  await sleep(1000);
  await shot('52-eat-now-filled', 'Что съесть сейчас · с данными');
  await fillByLabel('Поиск|Найти', 'творог');
  await sleep(500);
  await shot('52b-eat-now-search', 'Что съесть сейчас · поиск');

  await goto('/plan');
  await shot('53-plan-hub-filled', 'План · хаб после наполнения');

  await goto('/food');
  await scrollTop();
  await shot('60-food-filled', 'Питание · с демо');
  if (await clickByText(['^Каталог$'])) {
    await sleep(400);
    await shot('60b-food-catalog', 'Питание · каталог');
    if (await clickByText(['^Мои$'])) {
      await sleep(400);
      await shot('60c-food-catalog-mine', 'Питание · каталог · Мои');
    }
    await fillByLabel('Поиск продукта или рецепта', 'яйц');
    await sleep(500);
    await shot('60d-food-search-results', 'Питание · поиск с результатами');
  }

  await goto('/');
  await scrollTop();
  await shot('61-today-filled', 'Сегодня · с демо · primary Eat Now');

  await goto('/progress');
  await scrollTop();
  await shot('62-progress-filled', 'Прогресс · с демо');

  await goto('/profile');
  await scrollTop();
  await shot('63-profile-filled', 'Профиль · после демо');

  const rows = manifest.map((m) => `| \`${m.file}\` | ${m.note} |`).join('\n');
  writeFileSync(
    join(outDir, 'README.md'),
    `# Visual screens — 2026-10-24

**Среда:** Expo web · 390×844 @2x · \`BASE_URL=${base}\`  
**HEAD:** после merge #117 / #115 (Plan tab, My products, ADR-009 cut).  
**Не** physical Android Pass — для Pass: dogfood APK + device.

**Скрипт:** \`scripts/capture-screens-2026-10-24.mjs\`

## Каталог (${manifest.length} PNG)

| Файл | Состояние |
|------|-----------|
${rows}

## Как переснять

\`\`\`bash
cd apps/mobile && npx expo start --web --port 8081
node scripts/capture-screens-2026-10-24.mjs
\`\`\`
`,
  );
  writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log('done', manifest.length, 'shots →', outDir);
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  await browser.close();
}
