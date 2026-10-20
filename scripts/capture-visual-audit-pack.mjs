#!/usr/bin/env node
/**
 * Visual Audit Pack — Expo web mobile viewport (390×844 @2x).
 * NOT a physical Android Pass: label evidence as Expo-web until device capture exists.
 *
 * Requires: Expo web on BASE_URL (default http://localhost:8081)
 */
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const puppeteer = require('puppeteer-core');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'docs', 'quality', 'visual-audit-pack');
const base = process.env.BASE_URL ?? 'http://localhost:8081';
const chromePath =
  process.env.CHROME_PATH ??
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const WEB_KEY = 'momentum.web.store_snapshot.v1';

const purchasePaste = JSON.parse(
  readFileSync(join(root, 'docs/fixtures/synthetic-purchases.json'), 'utf8'),
).pyaterochka.paste;

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
    /* already handled */
  }
});

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

async function shot(name, note) {
  const file = join(outDir, `${name}.png`);
  await sleep(700);
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
  await page.goto(`${base}${path}`, { waitUntil: 'networkidle0', timeout: 90000 });
  await sleep(1200);
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
          const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
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

async function typeFirstVisibleInput(value) {
  const inputs = await page.$$('input, textarea');
  for (const input of inputs) {
    const box = await input.boundingBox();
    if (!box || box.height < 8) continue;
    await input.click({ clickCount: 3 });
    await page.keyboard.type(value, { delay: 8 });
    return true;
  }
  return false;
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
  // ─── EMPTY ───────────────────────────────────────────────
  await goto('/');
  await clearStore();
  await goto('/');

  const emptyRoutes = [
    ['/', '01-today-empty', 'Сегодня · пусто'],
    ['/food', '02-food-empty', 'Питание · пусто'],
    ['/activity', '03-activity-empty', 'Активность · пусто'],
    ['/progress', '04-progress-empty', 'Прогресс · пусто'],
    ['/profile', '05-profile', 'Профиль'],
    ['/recipes', '10-recipes-empty', 'Рецепты · пусто'],
    ['/recipes/new', '11-recipe-form-empty', 'Форма нового рецепта'],
    ['/recipes/import-text', '12-recipe-import-text-empty', 'Импорт рецепта из текста · пусто'],
    ['/recipes/import-personal', '13-recipe-import-personal', 'Архив личных рецептов'],
    ['/plan', '20-plan-hub', 'План питания · хаб'],
    ['/plan/eat-now', '21-eat-now-empty', 'Что съесть сейчас · пусто'],
    ['/plan/pantry', '22-pantry-empty', 'Запасы · пусто + форма'],
    ['/plan/week', '23-week-menu-empty', 'Меню на неделю · композер'],
    ['/plan/shop', '24-shop-empty', 'Покупки · пусто'],
    ['/plan/budget', '25-budget-empty', 'Бюджет · пусто + формы'],
    ['/plan/stores', '26-stores', 'Магазины'],
    ['/plan/receipt', '27-purchase-import-empty', 'Импорт покупки · ввод'],
  ];

  for (const [path, name, note] of emptyRoutes) {
    await goto(path);
    await scrollTop();
    await shot(name, note);
  }

  // Purchase manual mode form
  await goto('/plan/receipt');
  if (await clickByText(['^Вручную$', 'Вручную'])) {
    await sleep(500);
    await shot('27b-purchase-manual-form', 'Импорт покупки · ручной ввод');
  }

  // Food search empty + add sheet
  await goto('/food');
  if (await clickByText(['^Каталог$'])) {
    await sleep(400);
    await fillByLabel('Поиск продукта или рецепта', 'xyz-нет-такого');
    await sleep(400);
    await shot('02b-food-search-no-results', 'Питание · каталог · поиск без результатов');
  }

  await goto('/');
  if (await clickByText(['Добавить еду'])) {
    await sleep(800);
    await shot('30-modal-add-food', 'Модалка · Добавить еду');
    if (await clickByText(['Быстро'])) {
      await sleep(400);
      await shot('30b-modal-add-food-quick', 'Модалка · быстрый ввод');
    }
  }

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
      await shot('31-modal-habit-composer', 'Модалка · привычка');
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
      await shot('31b-modal-challenge-composer', 'Модалка · челлендж');
    }
  }

  await goto('/activity');
  if (await clickByText(['Тренировка', 'Добавить'])) {
    await sleep(700);
    await shot('32-modal-workout', 'Модалка · тренировка');
  }

  // ─── SEED FILLED ─────────────────────────────────────────
  console.log('--- seeding filled data ---');
  await goto('/profile');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await sleep(400);
  if (await clickByText(['Загрузить демо 2 недели'])) {
    await sleep(2000);
  }

  await goto('/recipes/import-personal');
  await sleep(800);
  await shot('13b-recipe-import-personal-ready', 'Архив · готово к импорту');
  if (await clickByText(['Добавить в библиотеку'])) {
    await sleep(2000);
  }

  await goto('/recipes');
  await scrollTop();
  await shot('40-recipes-filled', 'Рецепты · заполненные');
  await fillByLabel('Поиск рецепта', 'борщ');
  await sleep(500);
  await shot('40b-recipes-search', 'Рецепты · поиск');

  // Open recipe by id from web snapshot (FlatList cards are not <a href>)
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
    await shot('41-recipe-detail', 'Рецепт · деталь');
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
      await shot('41b-recipe-recook-modal', 'Рецепт · Приготовить снова');
      await clickByText(['^Закрыть$']);
      await sleep(400);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(200);
    if (await clickByText(['Добавить порцию в дневник'])) {
      await sleep(800);
      await shot('41c-recipe-portion-modal', 'Рецепт · порция в дневник');
    }
  }

  await goto('/recipes/new');
  await shot('42-recipe-form', 'Форма рецепта (после импорта контекст)');

  await goto('/recipes/import-text');
  await fillByLabel('Текст рецепта', 'Омлет\nЯйца 120 г\nМолоко 50 мл\nСоль');
  await sleep(300);
  await shot('43-recipe-import-text-filled', 'Импорт из текста · заполнено');
  if (await clickByText(['Открыть в редакторе'])) {
    await sleep(1000);
    await shot('43b-recipe-import-text-preview', 'Импорт из текста · превью/редактор');
  }

  // Purchase import
  await goto('/plan/receipt');
  await fillByLabel('Текст заказа', purchasePaste);
  await sleep(300);
  await shot('50-purchase-paste-filled', 'Импорт покупки · вставленный текст');
  if (await clickByText(['^К проверке$'])) {
    await sleep(900);
    await shot('51-purchase-preview', 'Импорт покупки · превью');
    if (await clickByText(['Подтвердить покупку'])) {
      await sleep(1500);
    }
  }

  await goto('/plan/pantry');
  await scrollTop();
  await shot('52-pantry-after-purchase', 'Запасы · после покупки');
  await fillByLabel('назван|продукт|запас', 'Гречка');
  await fillByLabel('количест|грамм|Кол', '500');
  await sleep(300);
  await shot('52b-pantry-add-form-filled', 'Запасы · форма добавления');
  if (await clickByText(['Сохранить в запасы'])) {
    await sleep(800);
    await scrollTop();
    await shot('52c-pantry-filled', 'Запасы · заполненные');
  }

  await goto('/plan/week');
  await scrollTop();
  await shot('53-week-composer', 'Меню · композер');
  if (await clickByText(['Спроектировать план'])) {
    await sleep(1500);
    await scrollTop();
    await shot('54-week-menu-filled', 'Меню на неделю · заполненное');
  }

  await goto('/plan/shop');
  await sleep(800);
  // Build from plan if card present
  if (await clickByText(['Собрать список', '→'])) {
    await sleep(1200);
  } else {
    // try clicking first plan card
    await page.evaluate(() => {
      const el = Array.from(document.querySelectorAll('[role="button"], button')).find((e) =>
        /Собрать|draft|active|\d{4}-\d{2}-\d{2}/i.test(e.innerText || ''),
      );
      el?.click();
    });
    await sleep(1200);
  }
  await scrollTop();
  await shot('55-shop-filled', 'Покупки · список');

  await goto('/plan/budget');
  await fillByLabel('лимит|План', '30000');
  if (await clickByText(['Сохранить лимит', 'Задать лимит', 'Сохранить'])) {
    await sleep(600);
  }
  await fillByLabel('Сумма|расход', '450');
  if (await clickByText(['Добавить расход', 'Записать'])) {
    await sleep(600);
  }
  await scrollTop();
  await shot('56-budget-filled', 'Бюджет · заполненный');

  await goto('/plan/eat-now');
  await sleep(1000);
  await shot('57-eat-now-filled', 'Что съесть сейчас · с данными');

  await goto('/plan');
  await shot('58-plan-hub-after', 'План · хаб после наполнения');

  await goto('/food');
  await scrollTop();
  await shot('60-food-filled', 'Питание · с демо-данными');
  if (await clickByText(['^Каталог$'])) {
    await sleep(400);
    await fillByLabel('Поиск продукта или рецепта', 'яйц');
    await sleep(500);
    await shot('60b-food-search-results', 'Питание · поиск с результатами');
  }

  await goto('/');
  await scrollTop();
  await shot('61-today-filled', 'Сегодня · с демо-данными');

  // README
  const rows = manifest
    .map((m) => `| \`${m.file}\` | ${m.note} |`)
    .join('\n');

  writeFileSync(
    join(outDir, 'README.md'),
    `# Visual Audit Pack

**Среда:** Expo web · viewport 390×844 @2x (iPhone-like).  
**Не** физический Android Pass — для device-Pass нужны скрины с телефона/эмулятора + APK dogfood.

**Снято:** \`scripts/capture-visual-audit-pack.mjs\` · \`BASE_URL=${base}\`  
**Синтетика:** демо 2 недели + \`docs/fixtures/synthetic-purchases.json\` (Пятёрочка).

## Каталог

| Файл | Состояние |
|------|-----------|
${rows}

## Как переснять

\`\`\`bash
# Expo web на 8081
cd apps/mobile && npx expo start --web --port 8081
# другой терминал
node scripts/capture-visual-audit-pack.mjs
\`\`\`

## Android device (обязательно для Pass)

1. Установить dogfood APK из \`docs/quality/apk/\`.
2. Пройти чеклист в \`../VISUAL-AUDIT-PACK.md\`.
3. Сложить PNG в \`android-device/\` с теми же именами файлов.
`,
  );

  writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log('done', manifest.length, 'shots');
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  await browser.close();
}
