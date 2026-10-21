# Анализ: как получить каталог METRO / Самокат / Яндекс Лавка

**Дата:** 2026-10-21  
**Статус:** research only · **`needs-human` BD+legal** для трёх P0 · реализация scrape **запрещена**  
**Связано:** `04-SOURCES.md`, `10-FEASIBILITY-OCR-CATALOG.md`  
**Цель Momentum:** offline SQLite seed (название, фасовка, barcode/SKU, цена с датой наблюдения) → match purchase paste → pantry / shop / Eat Now.

---

## 0. Вердикт в одном абзаце

У **ВкусВилла** есть **официальный MCP** (`https://mcp.vkusvill.ru/mcp`) с поиском, КБЖУ, barcode и корзиной — это эталон «как должно быть». У **METRO / Самоката / Лавки** публичного consumer product API **нет**. В сети есть неофициальные reverse-engineered endpoints и open-source парсеры — для Momentum это **не каналы**, а доказательство, что данные технически существуют за стеной ToS. Путь продукта: **BD → лицензия/API/feed → adapter** + параллельно **ВкусВилл MCP** (если ассортимент нужен уже сейчас) + **OFF + first-party purchases**.

---

## 1. Референс: ВкусВилл MCP (эталон)

| Item | Detail |
|------|--------|
| Endpoint | `https://mcp.vkusvill.ru/mcp` (официальный) |
| Docs / landing | [mcp.vkusvill.ru](https://mcp.vkusvill.ru/), [Habr](https://habr.com/ru/companies/vkusvill/articles/981866/) |
| Legal | [Условия подключения ИИ-агентов](https://vkusvill.ru/legal/usloviya-podklyucheniya-ii-agentov/) |
| Auth | Public tools без логина; полный функционал — **OAuth 2.0 + PKCE** (`vkusvill.ru/oauth/registration/`) |
| Полезные tools | `vkusvill_products_search`, `vkusvill_product_details`, `vkusvill_product_barcode`, `vkusvill_product_analogs`, `vkusvill_products_discount`, `vkusvill_orders_history`, `vkusvill_cart_link_create`, `vkusvill_recipes`, `vkusvill_shops` |
| Поля для Momentum | id / xml_id, name, price, unit, weight, rating, images, category, **состав + КБЖУ**, barcode lookup |
| Ограничения | Экспериментальный; наличие/персональный каталог — с адресом доставки + OAuth; cart link ≤20 позиций |

**Вывод для Momentum:** ВкусВилл — **единственный из крупных RU food-ритейлеров с явным agent-facing API**. Имеет смысл:

1. Зафиксировать в backlog **опциональный P1 adapter** «VkusVill MCP → local catalog cache» (с attribution, rate limits, без секретов в git).  
2. В BD-письмах METRO / Самокат / Лавка **цитировать этот паттерн**: «нужен read-only catalog API или MCP как у ВкусВилла для nutrition/habit app, offline seed, не агрегатор доставки».

**Не путать:** MCP ВкусВилла ≠ разрешение скрейпить остальных.

---

## 2. Сводная матрица P0

| Retailer | Официальный consumer catalog API | Ближайший «легальный» канал | Серый канал (существует, **не используем**) | BD contact / вход | Verdict |
|----------|----------------------------------|-----------------------------|---------------------------------------------|-------------------|---------|
| **ВкусВилл** (референс) | **Да — MCP** | MCP + OAuth | — | oauth registration | **Shipable после spike** |
| **METRO** | Нет | Partner / B2B deal; supplier EDI (не наш профиль) | App/web internal APIs | metro-cc.ru for-business / BD | **needs-human** |
| **Самокат** | Нет | `partner@samokat.ru`, `zakupki@samokat.ru` (поставщики) | `api.samokat.ru/showcase/*` + Frida/Selenium parsers на GitHub | partner@ | **needs-human** |
| **Яндекс Лавка** | Нет | [Поставщикам](https://lavka.yandex.ru/about/postavhik) — форма; **не** Market Partner API | Internal app APIs (как у Go/Еда) | Форма поставщика / BD Яндекс | **needs-human** |

---

## 3. METRO — детальный разбор

### Что есть официально

1. **METRO Markets Seller API** ([developer.metro-selleroffice.com](https://developer.metro-selleroffice.com/docs/product-data/)) — upload product/offer для **маркетплейса продавцов** (EU Markets), **не** каталог METRO Cash & Carry RU для покупателя.  
2. **EDI для поставщиков** RU ([metro-cc.ru/for-business/suppliers/EDI](https://metro-cc.ru/for-business/suppliers/EDI), portal `supplier-support.metro-cc.ru`) — ORDERS/DESADV/…; Momentum **не поставщик**.  
3. Витрина `metro-cc.ru` / приложение — consumer UX без published OpenAPI.

### Как «парсят» в индустрии (факт, не план)

- Коммерческое соглашение + выгрузка XLS/CSV/SFTP.  
- EDI — только если вы поставщик.  
- Серый: reverse-engineer web/app (как у других сетей в [AXIIOM store-apis research](https://axiiom.ru/docs/store-apis-research/)).

### Что просить у METRO (шаблон BD)

- Read-only **assortment feed** по региону/ТЦ: `sku`, `name`, `brand`, `net_weight`/`unit`, `gtin` (если есть), `category`, `price` + `observed_at`, опционально nutrition.  
- Формат: daily CSV/JSON или HTTPS API с client credentials.  
- License: use in personal offline nutrition app; no resale of live prices as competitor shelf.  
- Ссылка на прецедент ВкусВилл MCP.

### Verdict

**P0 need · blocked until deal.** Не путать Markets Seller API с нужным нам фидом.

---

## 4. Самокат — детальный разбор

### Что есть официально

- Сайт бренда / поставщиков: `brand.samokat.ru` — контакты `partner@samokat.ru`, `zakupki@samokat.ru`, `support@samokat.ru`.  
- Публичного developer portal / product catalog API **не найдено** (поиск 2026-10).  
- Внутри компании есть «сервис партнёров» (вакансии Go) — **внутренний**, не публичный.

### Что видно в серой зоне (документируем как **forbidden**)

Публичные репозитории и гайды описывают:

- OAuth к `https://api.samokat.ru/showcase/oauth/token`  
- Поиск `POST .../showcase/search/products` с `showcaseIds`, Bearer, device headers  
- Frida / MitM приложений, Selenium-парсеры (`samokat-parser` и аналоги)

Это **подтверждает наличие JSON-каталога**, но использование = нарушение ToS / риск блокировок / юридический риск. **Агенты Momentum не реализуют и не копируют эти клиенты.**

### Что просить у Самоката

- Partner read API или licensed dump витрины (хотя бы 1–2 geo showcase).  
- Поля те же, что METRO + `showcase_id` / darkstore.  
- Альтернатива MVP: **webhook / export истории заказов пользователя** (user-consented) — сильнее для match, слабее для полного ассортимента.

### Verdict

**P0 need · needs-human.** Технически «легко спарсить» ≠ допустимо.

---

## 5. Яндекс Лавка — детальный разбор

### Что есть официально

- Поставщикам: [lavka.yandex.ru/about/postavhik](https://lavka.yandex.ru/about/postavhik) — договор, описание товара, пробные поставки; **входящий** каталог поставщика, не исходящий consumer dump.  
- **API Яндекс Маркета для продавцов** — управление **своими** offer-mappings; **не** выгрузка ассортимента Лавки для стороннего приложения.  
- Публичные материалы Яндекса про Лавку описывают внутренний каталог ~150k+ SKU, КБЖУ, аллергены — **внутри** Яндекса, не для нас.

### Серая зона

Как у других q-commerce: внутренние JSON API приложения Лавки/Еды; неофициальные клиенты. **Forbidden.**

### Что просить у Яндекса / Лавки

1. **Идеал:** read-only Catalog / MCP по аналогии с ВкусВиллом (search + details + barcode + macros).  
2. **Реализм:** data partnership / research dump по городу; или user-consented order history API.  
3. Не предлагать «мы спарсим витрину» — предлагать product use-case (offline nutrition, privacy-first).

### Verdict

**P0 need · needs-human.** Market Partner API — ложный след.

---

## 6. Архитектура ingest (когда канал появится)

Один adapter per retailer → нормализация → SQLite. Без контракта код adapter **не пишется** (кроме опционального VkusVill).

```
┌─────────────────┐     ┌──────────────────┐     ┌────────────────────┐
│ RetailerChannel │────▶│ normalizeProduct │────▶│ catalog_items      │
│ (API|feed|MCP)  │     │ (unknown≠0)      │     │ + source + as_of   │
└─────────────────┘     └──────────────────┘     └────────────────────┘
                                                          │
                          purchase paste ─────────────────┼──▶ match (GTIN→name)
                                                          ▼
                                                   pantry / shop
```

| Field | Rule |
|-------|------|
| `source` | `metro` \| `samokat` \| `lavka` \| `vkusvill` \| `off` \| `user_purchase` |
| `external_id` | retailer SKU / xml_id |
| `gtin` | null if unknown — **never invent** |
| `nutrition_*` | null if unknown — **never invent** |
| `price` | always with `observed_at`; UI «наблюдение · дата» |
| Snapshot | entry snapshot on confirm; preserve source |

Rate limits / attribution / refresh job — в ADR после подписания канала.

---

## 7. Стратегия без ожидания BD (сейчас)

| # | Действие | Зачем |
|---|----------|--------|
| 1 | **Purchase confirm → catalog upsert** (#81) | **Оптимальный primary seed:** barcode/name match → иначе `createProduct` (nutrition null); price observation с датой |
| 2 | **OFF RU dump** + barcode | Nutrition bridge; ODbL (отдельный issue) |
| 3 | **Spike VkusVill MCP** (read-only cache) | Живой легальный каталог + КБЖУ; учит adapter shape |
| 4 | BD письма ×3 (шаблон §3–5) | Разблокировка P0 full assortment |
| 5 | Не трогать GitHub scrapers / MitM | Compliance |

Покрытие ассортимента до контракта будет **смещённым к заказам пользователя** — это ок для dogfood одного household. Повторный paste того же SKU/имени переиспользует `productId`.

---

## 8. BD checklist (founder)

- [ ] METRO: контакт for-business / digital partnership; запрос assortment feed  
- [ ] Самокат: `partner@samokat.ru` — catalog API / dump / order-export  
- [ ] Лавка: форма postavhik **или** отдельный product-partnership (уточнить у BD Яндекса — поставщик ≠ data partner)  
- [ ] В письмах: ссылка на ВкусВилл MCP как желаемый DX  
- [ ] Legal: ToS review; хранение только локально / anonymized aggregates  
- [ ] После ответа: ADR + issue «Retailer ingest vertical 1» → один PR

---

## 9. Explicit non-goals

- Реализация / форк `samokat-parser`, Frida-скриптов, неофициальных X5/Перекрёсток API.  
- Переписывание `04-SOURCES` в «founder разрешил scrape».  
- Использование METRO Markets Seller API или Yandex Market Partner API как «каталога полки».  
- Выдача серых endpoint’ов в production коде или CI.

---

## 10. Рекомендуемая очередь

1. **Сейчас:** doc (этот файл) + BD outreach.  
2. **Параллельно eng:** OFF seed + улучшение purchase→catalog match.  
3. **Опционально eng:** VkusVill MCP spike → issue + ADR.  
4. **После контракта:** один ритейлер (предложение: Самокат — максимум overlap с dogfood заказами) → adapter → seed → match.

**Hard stop:** агент не начинает scrape METRO / Самокат / Лавка. Статус остаётся `needs-human`, пока нет письменного канала.
