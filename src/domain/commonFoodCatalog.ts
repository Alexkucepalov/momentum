import type { FoodProduct } from '../storage/types';

/**
 * Bundled everyday foods for offline name search (not barcode-only).
 *
 * Nutrition is **reference per 100 g** from public food-composition style tables
 * (USDA FoodData Central / типовые справочники), rounded for logging convenience.
 * Not medical advice. User may edit; edits flip source to `user`.
 * Never invents values at runtime — only this curated list.
 */

export type CommonFoodSeed = {
  /** Stable id — must stay fixed across app versions. */
  id: string;
  name: string;
  /** Extra search tokens (RU synonyms, colloquial). */
  aliases: string[];
  energyKcal: number;
  proteinG: number;
  fatG: number;
  carbG: number;
};

const TS = '2026-10-19T00:00:00.000Z';

/** 200+ базовых продуктов для удобного оффлайн-поиска. */
export const COMMON_FOOD_CATALOG: readonly CommonFoodSeed[] = [
  // ===== МЯСО И ПТИЦА =====
  { id: 'seed:chicken-breast', name: 'Куриная грудка', aliases: ['курица', 'грудка', 'филе куриное'], energyKcal: 165, proteinG: 31, fatG: 3.6, carbG: 0 },
  { id: 'seed:chicken-thigh', name: 'Куриное бедро без кожи', aliases: ['бедро куриное'], energyKcal: 179, proteinG: 24.8, fatG: 8.2, carbG: 0 },
  { id: 'seed:chicken-wings', name: 'Куриные крылышки', aliases: ['крылья куриные'], energyKcal: 203, proteinG: 30.5, fatG: 8.1, carbG: 0 },
  { id: 'seed:turkey', name: 'Индейка филе', aliases: ['индейка'], energyKcal: 135, proteinG: 29, fatG: 2, carbG: 0 },
  { id: 'seed:duck', name: 'Утка без кожи', aliases: ['утка'], energyKcal: 201, proteinG: 23.5, fatG: 11.2, carbG: 0 },
  { id: 'seed:beef', name: 'Говядина постная', aliases: ['говядина', 'мясо'], energyKcal: 171, proteinG: 26, fatG: 7, carbG: 0 },
  { id: 'seed:beef-ground', name: 'Говяжий фарш', aliases: ['фарш говяжий'], energyKcal: 250, proteinG: 19, fatG: 18, carbG: 0 },
  { id: 'seed:pork', name: 'Свинина постная', aliases: ['свинина'], energyKcal: 201, proteinG: 22, fatG: 12, carbG: 0 },
  { id: 'seed:pork-chop', name: 'Свиная отбивная', aliases: ['отбивная'], energyKcal: 242, proteinG: 26, fatG: 14, carbG: 0 },
  { id: 'seed:lamb', name: 'Баранина', aliases: [], energyKcal: 234, proteinG: 25, fatG: 14, carbG: 0 },
  { id: 'seed:rabbit', name: 'Кролик', aliases: [], energyKcal: 173, proteinG: 33, fatG: 3.5, carbG: 0 },
  { id: 'seed:liver-beef', name: 'Печень говяжья', aliases: ['печень'], energyKcal: 135, proteinG: 20, fatG: 3.4, carbG: 5.3 },
  { id: 'seed:sausage', name: 'Сосиски варёные', aliases: ['сосиски'], energyKcal: 266, proteinG: 11, fatG: 23, carbG: 2 },
  { id: 'seed:bacon', name: 'Бекон', aliases: [], energyKcal: 541, proteinG: 37, fatG: 42, carbG: 1 },

  // ===== РЫБА И МОРЕПРОДУКТЫ =====
  { id: 'seed:salmon', name: 'Лосось', aliases: ['сёмга', 'семга', 'рыба'], energyKcal: 208, proteinG: 20, fatG: 13, carbG: 0 },
  { id: 'seed:tuna', name: 'Тунец консервированный в собственном соку', aliases: ['тунец'], energyKcal: 116, proteinG: 26, fatG: 1, carbG: 0 },
  { id: 'seed:cod', name: 'Треска', aliases: ['треска', 'белая рыба'], energyKcal: 82, proteinG: 18, fatG: 0.7, carbG: 0 },
  { id: 'seed:mackerel', name: 'Скумбрия', aliases: [], energyKcal: 205, proteinG: 19, fatG: 14, carbG: 0 },
  { id: 'seed:herring', name: 'Сельдь', aliases: ['селедка'], energyKcal: 158, proteinG: 18, fatG: 9, carbG: 0 },
  { id: 'seed:sardines', name: 'Сардины консервированные', aliases: ['сардины'], energyKcal: 208, proteinG: 25, fatG: 11, carbG: 0 },
  { id: 'seed:trout', name: 'Форель', aliases: [], energyKcal: 148, proteinG: 20, fatG: 7, carbG: 0 },
  { id: 'seed:pike', name: 'Щука', aliases: [], energyKcal: 84, proteinG: 18, fatG: 1, carbG: 0 },
  { id: 'seed:shrimp', name: 'Креветки варёные', aliases: ['креветки'], energyKcal: 99, proteinG: 24, fatG: 0.3, carbG: 0.2 },
  { id: 'seed:squid', name: 'Кальмар', aliases: ['кальмары'], energyKcal: 92, proteinG: 18, fatG: 1.4, carbG: 3 },
  { id: 'seed:mussels', name: 'Мидии', aliases: [], energyKcal: 86, proteinG: 12, fatG: 2.2, carbG: 3.7 },
  { id: 'seed:crab', name: 'Краб', aliases: ['крабовое мясо'], energyKcal: 97, proteinG: 19, fatG: 1.5, carbG: 0 },

  // ===== ЯЙЦА =====
  { id: 'seed:egg', name: 'Яйцо куриное', aliases: ['яйца', 'яйцо'], energyKcal: 157, proteinG: 12.6, fatG: 10.6, carbG: 1.1 },
  { id: 'seed:egg-white', name: 'Яичный белок', aliases: ['белок'], energyKcal: 52, proteinG: 11, fatG: 0.2, carbG: 0.7 },
  { id: 'seed:egg-yolk', name: 'Яичный желток', aliases: ['желток'], energyKcal: 322, proteinG: 16, fatG: 27, carbG: 3.6 },
  { id: 'seed:quail-egg', name: 'Яйцо перепелиное', aliases: ['перепелиное'], energyKcal: 158, proteinG: 13, fatG: 11, carbG: 0.6 },

  // ===== МОЛОЧНЫЕ ПРОДУКТЫ =====
  { id: 'seed:milk-25', name: 'Молоко 2.5%', aliases: ['молоко'], energyKcal: 52, proteinG: 2.9, fatG: 2.5, carbG: 4.8 },
  { id: 'seed:milk-15', name: 'Молоко 1.5%', aliases: ['молоко 1.5'], energyKcal: 44, proteinG: 2.8, fatG: 1.5, carbG: 4.7 },
  { id: 'seed:milk-35', name: 'Молоко 3.5%', aliases: ['молоко жирное'], energyKcal: 61, proteinG: 2.8, fatG: 3.5, carbG: 4.7 },
  { id: 'seed:kefir-25', name: 'Кефир 2.5%', aliases: ['кефир'], energyKcal: 50, proteinG: 3, fatG: 2.5, carbG: 4 },
  { id: 'seed:kefir-1', name: 'Кефир 1%', aliases: ['кефир нежирный'], energyKcal: 40, proteinG: 3, fatG: 1, carbG: 4 },
  { id: 'seed:ryazhenka', name: 'Ряженка', aliases: [], energyKcal: 85, proteinG: 3, fatG: 4, carbG: 4.2 },
  { id: 'seed:cottage-0', name: 'Творог обезжиренный', aliases: ['творог 0', 'творог 0%'], energyKcal: 71, proteinG: 16.5, fatG: 0.2, carbG: 1.3 },
  { id: 'seed:cottage-5', name: 'Творог 5%', aliases: ['творог'], energyKcal: 121, proteinG: 17, fatG: 5, carbG: 1.8 },
  { id: 'seed:cottage-9', name: 'Творог 9%', aliases: ['творог жирный'], energyKcal: 159, proteinG: 16, fatG: 9, carbG: 2 },
  { id: 'seed:greek-yogurt', name: 'Йогурт греческий 2%', aliases: ['йогурт', 'греческий'], energyKcal: 73, proteinG: 10, fatG: 2, carbG: 3.6 },
  { id: 'seed:yogurt-natural', name: 'Йогурт натуральный', aliases: ['йогурт натуральный'], energyKcal: 68, proteinG: 5, fatG: 3.2, carbG: 3.5 },
  { id: 'seed:sour-cream-15', name: 'Сметана 15%', aliases: ['сметана'], energyKcal: 158, proteinG: 2.6, fatG: 15, carbG: 3.6 },
  { id: 'seed:sour-cream-20', name: 'Сметана 20%', aliases: ['сметана жирная'], energyKcal: 206, proteinG: 2.5, fatG: 20, carbG: 3.2 },
  { id: 'seed:cream', name: 'Сливки 10%', aliases: ['сливки'], energyKcal: 118, proteinG: 3, fatG: 10, carbG: 4 },
  { id: 'seed:cheese-russian', name: 'Сыр российский', aliases: ['сыр'], energyKcal: 363, proteinG: 24, fatG: 29, carbG: 0.3 },
  { id: 'seed:cheese-cheddar', name: 'Сыр чеддер', aliases: ['чеддер'], energyKcal: 402, proteinG: 25, fatG: 33, carbG: 1.3 },
  { id: 'seed:cheese-mozzarella', name: 'Сыр моцарелла', aliases: ['моцарелла'], energyKcal: 280, proteinG: 28, fatG: 17, carbG: 3 },
  { id: 'seed:cheese-feta', name: 'Сыр фета', aliases: ['фета'], energyKcal: 264, proteinG: 14, fatG: 21, carbG: 4 },
  { id: 'seed:cheese-parmesan', name: 'Сыр пармезан', aliases: ['пармезан'], energyKcal: 392, proteinG: 36, fatG: 26, carbG: 3 },
  { id: 'seed:cheese-cottage', name: 'Творожный сыр', aliases: ['филадельфия', 'творожный'], energyKcal: 342, proteinG: 6, fatG: 34, carbG: 4 },
  { id: 'seed:butter', name: 'Масло сливочное', aliases: ['масло'], energyKcal: 748, proteinG: 0.5, fatG: 82.5, carbG: 0.8 },

  // ===== КРУПЫ И КАШИ =====
  { id: 'seed:oats', name: 'Овсянка сухая', aliases: ['овсянка', 'геркулес', 'овсяные хлопья'], energyKcal: 389, proteinG: 16.9, fatG: 6.9, carbG: 66.3 },
  { id: 'seed:oats-cooked', name: 'Овсяная каша на воде', aliases: ['каша овсяная'], energyKcal: 88, proteinG: 3, fatG: 1.7, carbG: 15 },
  { id: 'seed:rice-white-dry', name: 'Рис белый сухой', aliases: ['рис сухой'], energyKcal: 365, proteinG: 7, fatG: 0.7, carbG: 80 },
  { id: 'seed:rice-cooked', name: 'Рис варёный', aliases: ['рис'], energyKcal: 130, proteinG: 2.7, fatG: 0.3, carbG: 28 },
  { id: 'seed:rice-brown-cooked', name: 'Рис бурый варёный', aliases: ['бурый рис', 'коричневый рис'], energyKcal: 123, proteinG: 2.7, fatG: 1, carbG: 26 },
  { id: 'seed:buckwheat-dry', name: 'Гречка сухая', aliases: ['греча сухая'], energyKcal: 343, proteinG: 13, fatG: 3.4, carbG: 62 },
  { id: 'seed:buckwheat-cooked', name: 'Гречка варёная', aliases: ['гречка', 'греча'], energyKcal: 110, proteinG: 4.2, fatG: 1.1, carbG: 21 },
  { id: 'seed:millet-cooked', name: 'Пшено варёное', aliases: ['пшено', 'пшённая каша'], energyKcal: 119, proteinG: 3.5, fatG: 1, carbG: 23 },
  { id: 'seed:pearl-barley', name: 'Перловка варёная', aliases: ['перловка', 'перловая крупа'], energyKcal: 109, proteinG: 3.1, fatG: 0.4, carbG: 22 },
  { id: 'seed:semolina', name: 'Манная каша', aliases: ['манка'], energyKcal: 98, proteinG: 3, fatG: 0.5, carbG: 20 },
  { id: 'seed:bulgur-cooked', name: 'Булгур варёный', aliases: ['булгур'], energyKcal: 83, proteinG: 3.1, fatG: 0.2, carbG: 18.6 },
  { id: 'seed:quinoa-cooked', name: 'Киноа варёная', aliases: ['киноа', 'кинва'], energyKcal: 120, proteinG: 4.4, fatG: 1.9, carbG: 21 },
  { id: 'seed:couscous-cooked', name: 'Кускус варёный', aliases: ['кускус'], energyKcal: 112, proteinG: 3.8, fatG: 0.2, carbG: 23 },

  // ===== МАКАРОНЫ И ХЛЕБ =====
  { id: 'seed:pasta-dry', name: 'Макароны сухие', aliases: ['паста сухая'], energyKcal: 371, proteinG: 13, fatG: 1.5, carbG: 75 },
  { id: 'seed:pasta-cooked', name: 'Макароны варёные', aliases: ['паста', 'макароны', 'спагетти'], energyKcal: 131, proteinG: 5, fatG: 1.1, carbG: 25 },
  { id: 'seed:pasta-whole-wheat', name: 'Макароны цельнозерновые варёные', aliases: ['цельнозерновая паста'], energyKcal: 124, proteinG: 5.3, fatG: 0.5, carbG: 26 },
  { id: 'seed:bread-wheat', name: 'Хлеб пшеничный', aliases: ['хлеб', 'батон'], energyKcal: 265, proteinG: 9, fatG: 3.2, carbG: 49 },
  { id: 'seed:bread-rye', name: 'Хлеб ржаной', aliases: ['чёрный хлеб', 'бородинский'], energyKcal: 217, proteinG: 6.6, fatG: 1.2, carbG: 41 },
  { id: 'seed:bread-whole-grain', name: 'Хлеб цельнозерновой', aliases: ['цельнозерновой'], energyKcal: 247, proteinG: 9, fatG: 3, carbG: 47 },
  { id: 'seed:baguette', name: 'Багет', aliases: [], energyKcal: 290, proteinG: 9, fatG: 3, carbG: 55 },
  { id: 'seed:pita', name: 'Лаваш', aliases: ['пита'], energyKcal: 275, proteinG: 9, fatG: 1.2, carbG: 56 },
  { id: 'seed:tortilla', name: 'Тортилья пшеничная', aliases: ['лепёшка', 'тортилья'], energyKcal: 312, proteinG: 8.2, fatG: 7.1, carbG: 52 },
  { id: 'seed:crispbread', name: 'Хлебцы', aliases: ['хлебцы ржаные'], energyKcal: 310, proteinG: 10, fatG: 2.3, carbG: 58 },

  // ===== КАРТОФЕЛЬ =====
  { id: 'seed:potato-boiled', name: 'Картофель варёный', aliases: ['картошка', 'картофель'], energyKcal: 87, proteinG: 1.9, fatG: 0.1, carbG: 20 },
  { id: 'seed:potato-baked', name: 'Картофель запечённый', aliases: ['картофель в духовке'], energyKcal: 93, proteinG: 2, fatG: 0.1, carbG: 21 },
  { id: 'seed:potato-mashed', name: 'Картофельное пюре', aliases: ['пюре'], energyKcal: 105, proteinG: 2, fatG: 4.2, carbG: 15 },
  { id: 'seed:sweet-potato', name: 'Батат', aliases: ['сладкий картофель'], energyKcal: 86, proteinG: 1.6, fatG: 0.1, carbG: 20 },

  // Бобовые
  { id: 'seed:lentils-cooked', name: 'Чечевица варёная', aliases: ['чечевица'], energyKcal: 116, proteinG: 9, fatG: 0.4, carbG: 20 },
  { id: 'seed:chickpeas-cooked', name: 'Нут варёный', aliases: ['нут', 'турецкий горох'], energyKcal: 164, proteinG: 8.9, fatG: 2.6, carbG: 27 },
  { id: 'seed:beans-cooked', name: 'Фасоль варёная', aliases: ['фасоль'], energyKcal: 127, proteinG: 8.7, fatG: 0.5, carbG: 23 },
  { id: 'seed:peas-green', name: 'Горох зелёный', aliases: ['горох', 'горошек'], energyKcal: 81, proteinG: 5.4, fatG: 0.4, carbG: 14 },

  // ===== ОВОЩИ =====
  { id: 'seed:tomato', name: 'Помидор', aliases: ['томат', 'помидоры'], energyKcal: 18, proteinG: 0.9, fatG: 0.2, carbG: 3.9 },
  { id: 'seed:cucumber', name: 'Огурец', aliases: ['огурцы'], energyKcal: 15, proteinG: 0.7, fatG: 0.1, carbG: 3.6 },
  { id: 'seed:pepper', name: 'Перец болгарский', aliases: ['перец', 'паприка'], energyKcal: 27, proteinG: 1, fatG: 0.3, carbG: 6 },
  { id: 'seed:onion', name: 'Лук репчатый', aliases: ['лук'], energyKcal: 40, proteinG: 1.1, fatG: 0.1, carbG: 9.3 },
  { id: 'seed:garlic', name: 'Чеснок', aliases: [], energyKcal: 149, proteinG: 6.5, fatG: 0.5, carbG: 33 },
  { id: 'seed:carrot', name: 'Морковь', aliases: ['морковка'], energyKcal: 41, proteinG: 0.9, fatG: 0.2, carbG: 9.6 },
  { id: 'seed:beet', name: 'Свёкла', aliases: ['свекла'], energyKcal: 43, proteinG: 1.6, fatG: 0.2, carbG: 10 },
  { id: 'seed:cabbage', name: 'Капуста белокочанная', aliases: ['капуста'], energyKcal: 25, proteinG: 1.3, fatG: 0.1, carbG: 5.8 },
  { id: 'seed:cabbage-red', name: 'Капуста краснокочанная', aliases: ['красная капуста'], energyKcal: 31, proteinG: 1.4, fatG: 0.2, carbG: 7.4 },
  { id: 'seed:cauliflower', name: 'Цветная капуста', aliases: [], energyKcal: 25, proteinG: 1.9, fatG: 0.3, carbG: 5 },
  { id: 'seed:broccoli', name: 'Брокколи', aliases: [], energyKcal: 34, proteinG: 2.8, fatG: 0.4, carbG: 7 },
  { id: 'seed:zucchini', name: 'Кабачок', aliases: ['цуккини'], energyKcal: 17, proteinG: 1.2, fatG: 0.3, carbG: 3.1 },
  { id: 'seed:eggplant', name: 'Баклажан', aliases: [], energyKcal: 25, proteinG: 1, fatG: 0.2, carbG: 5.9 },
  { id: 'seed:pumpkin', name: 'Тыква', aliases: [], energyKcal: 26, proteinG: 1, fatG: 0.1, carbG: 6.5 },
  { id: 'seed:radish', name: 'Редис', aliases: [], energyKcal: 16, proteinG: 0.7, fatG: 0.1, carbG: 3.4 },
  { id: 'seed:celery', name: 'Сельдерей стебель', aliases: ['сельдерей'], energyKcal: 16, proteinG: 0.7, fatG: 0.2, carbG: 3 },
  { id: 'seed:asparagus', name: 'Спаржа', aliases: [], energyKcal: 20, proteinG: 2.2, fatG: 0.1, carbG: 3.9 },
  { id: 'seed:corn', name: 'Кукуруза варёная', aliases: ['кукуруза'], energyKcal: 96, proteinG: 3.4, fatG: 1.5, carbG: 21 },
  { id: 'seed:green-beans', name: 'Стручковая фасоль', aliases: ['зелёная фасоль'], energyKcal: 31, proteinG: 1.8, fatG: 0.1, carbG: 7 },
  { id: 'seed:spinach', name: 'Шпинат свежий', aliases: ['шпинат'], energyKcal: 23, proteinG: 2.9, fatG: 0.4, carbG: 3.6 },
  { id: 'seed:lettuce', name: 'Салат листовой', aliases: ['салат', 'латук'], energyKcal: 15, proteinG: 1.4, fatG: 0.2, carbG: 2.9 },
  { id: 'seed:arugula', name: 'Руккола', aliases: [], energyKcal: 25, proteinG: 2.6, fatG: 0.7, carbG: 3.7 },
  { id: 'seed:parsley', name: 'Петрушка', aliases: [], energyKcal: 36, proteinG: 3, fatG: 0.8, carbG: 6.3 },
  { id: 'seed:dill', name: 'Укроп', aliases: [], energyKcal: 43, proteinG: 3.5, fatG: 1.1, carbG: 7 },
  { id: 'seed:avocado', name: 'Авокадо', aliases: [], energyKcal: 160, proteinG: 2, fatG: 15, carbG: 9 },

  // ===== ФРУКТЫ И ЯГОДЫ =====
  { id: 'seed:apple', name: 'Яблоко', aliases: ['яблоки'], energyKcal: 52, proteinG: 0.3, fatG: 0.2, carbG: 14 },
  { id: 'seed:banana', name: 'Банан', aliases: ['бананы'], energyKcal: 89, proteinG: 1.1, fatG: 0.3, carbG: 23 },
  { id: 'seed:orange', name: 'Апельсин', aliases: ['апельсины'], energyKcal: 47, proteinG: 0.9, fatG: 0.1, carbG: 12 },
  { id: 'seed:mandarin', name: 'Мандарин', aliases: ['мандарины'], energyKcal: 53, proteinG: 0.8, fatG: 0.3, carbG: 13 },
  { id: 'seed:grapefruit', name: 'Грейпфрут', aliases: [], energyKcal: 42, proteinG: 0.8, fatG: 0.1, carbG: 11 },
  { id: 'seed:lemon', name: 'Лимон', aliases: [], energyKcal: 29, proteinG: 1.1, fatG: 0.3, carbG: 9 },
  { id: 'seed:pear', name: 'Груша', aliases: ['груши'], energyKcal: 57, proteinG: 0.4, fatG: 0.1, carbG: 15 },
  { id: 'seed:grapes', name: 'Виноград', aliases: [], energyKcal: 69, proteinG: 0.7, fatG: 0.2, carbG: 18 },
  { id: 'seed:peach', name: 'Персик', aliases: [], energyKcal: 39, proteinG: 0.9, fatG: 0.3, carbG: 10 },
  { id: 'seed:plum', name: 'Слива', aliases: ['сливы'], energyKcal: 46, proteinG: 0.7, fatG: 0.3, carbG: 11 },
  { id: 'seed:apricot', name: 'Абрикос', aliases: ['абрикосы'], energyKcal: 48, proteinG: 1.4, fatG: 0.4, carbG: 11 },
  { id: 'seed:cherry', name: 'Вишня', aliases: [], energyKcal: 52, proteinG: 1, fatG: 0.3, carbG: 12 },
  { id: 'seed:kiwi', name: 'Киви', aliases: [], energyKcal: 61, proteinG: 1.1, fatG: 0.5, carbG: 15 },
  { id: 'seed:pineapple', name: 'Ананас', aliases: [], energyKcal: 50, proteinG: 0.5, fatG: 0.1, carbG: 13 },
  { id: 'seed:mango', name: 'Манго', aliases: [], energyKcal: 60, proteinG: 0.8, fatG: 0.4, carbG: 15 },
  { id: 'seed:pomegranate', name: 'Гранат', aliases: [], energyKcal: 83, proteinG: 1.7, fatG: 1.2, carbG: 19 },
  { id: 'seed:watermelon', name: 'Арбуз', aliases: [], energyKcal: 30, proteinG: 0.6, fatG: 0.2, carbG: 7.6 },
  { id: 'seed:melon', name: 'Дыня', aliases: [], energyKcal: 34, proteinG: 0.8, fatG: 0.2, carbG: 8 },
  { id: 'seed:strawberry', name: 'Клубника', aliases: [], energyKcal: 32, proteinG: 0.7, fatG: 0.3, carbG: 7.7 },
  { id: 'seed:blueberry', name: 'Черника', aliases: ['голубика'], energyKcal: 57, proteinG: 0.7, fatG: 0.3, carbG: 14 },
  { id: 'seed:raspberry', name: 'Малина', aliases: [], energyKcal: 52, proteinG: 1.2, fatG: 0.7, carbG: 12 },
  { id: 'seed:blackberry', name: 'Ежевика', aliases: [], energyKcal: 43, proteinG: 1.4, fatG: 0.5, carbG: 10 },
  { id: 'seed:cranberry', name: 'Клюква', aliases: [], energyKcal: 46, proteinG: 0.4, fatG: 0.1, carbG: 12 },
  { id: 'seed:berries-mix', name: 'Ягоды смешанные замороженные', aliases: ['ягоды'], energyKcal: 43, proteinG: 0.7, fatG: 0.3, carbG: 10 },
  { id: 'seed:dried-apricot', name: 'Курага', aliases: ['сушёные абрикосы'], energyKcal: 241, proteinG: 3.4, fatG: 0.5, carbG: 63 },
  { id: 'seed:raisins', name: 'Изюм', aliases: [], energyKcal: 299, proteinG: 3.1, fatG: 0.5, carbG: 79 },
  { id: 'seed:prunes', name: 'Чернослив', aliases: [], energyKcal: 240, proteinG: 2.2, fatG: 0.4, carbG: 64 },
  { id: 'seed:dates', name: 'Финики', aliases: [], energyKcal: 282, proteinG: 2.5, fatG: 0.4, carbG: 75 },

  // ===== ГРИБЫ =====
  { id: 'seed:mushrooms-white', name: 'Шампиньоны', aliases: ['грибы', 'шампиньон'], energyKcal: 22, proteinG: 3.1, fatG: 0.5, carbG: 3.3 },
  { id: 'seed:mushrooms-oyster', name: 'Вешенки', aliases: [], energyKcal: 33, proteinG: 3.3, fatG: 0.4, carbG: 6.5 },
  { id: 'seed:mushrooms-shiitake', name: 'Шиитаке', aliases: [], energyKcal: 34, proteinG: 2.2, fatG: 0.5, carbG: 6.8 },

  // ===== ОРЕХИ И СЕМЕНА =====
  { id: 'seed:almonds', name: 'Миндаль', aliases: [], energyKcal: 579, proteinG: 21, fatG: 49.9, carbG: 21.6 },
  { id: 'seed:walnuts', name: 'Грецкий орех', aliases: ['орехи', 'грецкие'], energyKcal: 654, proteinG: 15.2, fatG: 65.2, carbG: 13.7 },
  { id: 'seed:cashews', name: 'Кешью', aliases: [], energyKcal: 553, proteinG: 18.2, fatG: 43.8, carbG: 30.2 },
  { id: 'seed:hazelnuts', name: 'Фундук', aliases: [], energyKcal: 628, proteinG: 15, fatG: 60.8, carbG: 16.7 },
  { id: 'seed:pistachios', name: 'Фисташки', aliases: [], energyKcal: 562, proteinG: 20.2, fatG: 45.3, carbG: 27.2 },
  { id: 'seed:peanuts', name: 'Арахис', aliases: [], energyKcal: 567, proteinG: 26.3, fatG: 49.2, carbG: 16.1 },
  { id: 'seed:pine-nuts', name: 'Кедровые орехи', aliases: ['кедровые'], energyKcal: 673, proteinG: 13.7, fatG: 68.4, carbG: 13.1 },
  { id: 'seed:brazil-nuts', name: 'Бразильский орех', aliases: [], energyKcal: 656, proteinG: 14.3, fatG: 66.4, carbG: 12.3 },
  { id: 'seed:sunflower-seeds', name: 'Семечки подсолнечника', aliases: ['семечки'], energyKcal: 584, proteinG: 20.8, fatG: 51.5, carbG: 20 },
  { id: 'seed:pumpkin-seeds', name: 'Семена тыквы', aliases: ['тыквенные семечки'], energyKcal: 559, proteinG: 30.2, fatG: 49, carbG: 10.7 },
  { id: 'seed:chia-seeds', name: 'Семена чиа', aliases: ['чиа'], energyKcal: 486, proteinG: 16.5, fatG: 30.7, carbG: 42.1 },
  { id: 'seed:flax-seeds', name: 'Семена льна', aliases: ['лён'], energyKcal: 534, proteinG: 18.3, fatG: 42.2, carbG: 28.9 },
  { id: 'seed:sesame-seeds', name: 'Кунжут', aliases: ['семена кунжута'], energyKcal: 573, proteinG: 17.7, fatG: 49.7, carbG: 23.4 },

  // ===== МАСЛА И ЖИРЫ =====
  { id: 'seed:oil-sunflower', name: 'Масло подсолнечное', aliases: ['растительное масло', 'масло раст'], energyKcal: 884, proteinG: 0, fatG: 100, carbG: 0 },
  { id: 'seed:oil-olive', name: 'Масло оливковое', aliases: ['олива'], energyKcal: 884, proteinG: 0, fatG: 100, carbG: 0 },
  { id: 'seed:oil-coconut', name: 'Масло кокосовое', aliases: ['кокосовое масло'], energyKcal: 862, proteinG: 0, fatG: 100, carbG: 0 },
  { id: 'seed:oil-avocado', name: 'Масло авокадо', aliases: [], energyKcal: 884, proteinG: 0, fatG: 100, carbG: 0 },
  { id: 'seed:mayonnaise', name: 'Майонез', aliases: [], energyKcal: 680, proteinG: 1, fatG: 75, carbG: 2.6 },

  // ===== СЛАДОСТИ И ДЕСЕРТЫ =====
  { id: 'seed:honey', name: 'Мёд', aliases: ['мед'], energyKcal: 304, proteinG: 0.3, fatG: 0, carbG: 82 },
  { id: 'seed:sugar', name: 'Сахар', aliases: [], energyKcal: 387, proteinG: 0, fatG: 0, carbG: 100 },
  { id: 'seed:jam', name: 'Варенье', aliases: ['джем'], energyKcal: 278, proteinG: 0.4, fatG: 0.1, carbG: 70 },
  { id: 'seed:dark-chocolate', name: 'Шоколад тёмный 70%', aliases: ['шоколад'], energyKcal: 598, proteinG: 7.8, fatG: 42.6, carbG: 45.9 },
  { id: 'seed:milk-chocolate', name: 'Шоколад молочный', aliases: ['шоколад молочный'], energyKcal: 535, proteinG: 7.6, fatG: 29.7, carbG: 60 },
  { id: 'seed:cookies', name: 'Печенье сдобное', aliases: ['печенье'], energyKcal: 458, proteinG: 7.5, fatG: 16.4, carbG: 71 },
  { id: 'seed:cake', name: 'Торт бисквитный', aliases: ['торт', 'пирожное'], energyKcal: 344, proteinG: 5.2, fatG: 15.8, carbG: 46 },
  { id: 'seed:ice-cream', name: 'Мороженое пломбир', aliases: ['мороженое'], energyKcal: 227, proteinG: 3.7, fatG: 15, carbG: 20.4 },
  { id: 'seed:peanut-butter', name: 'Арахисовая паста', aliases: ['паста арахисовая'], energyKcal: 588, proteinG: 25, fatG: 50, carbG: 20 },
  { id: 'seed:nutella', name: 'Шоколадная паста', aliases: ['нутелла'], energyKcal: 539, proteinG: 6.3, fatG: 30.9, carbG: 57.5 },

  // ===== ГОТОВЫЕ БЛЮДА =====
  { id: 'seed:pizza-margherita', name: 'Пицца Маргарита', aliases: ['пицца'], energyKcal: 266, proteinG: 11, fatG: 10, carbG: 33 },
  { id: 'seed:pizza-pepperoni', name: 'Пицца Пепперони', aliases: ['пепперони'], energyKcal: 298, proteinG: 12, fatG: 13, carbG: 33 },
  { id: 'seed:burger', name: 'Бургер', aliases: ['гамбургер'], energyKcal: 295, proteinG: 17, fatG: 14, carbG: 24 },
  { id: 'seed:cheeseburger', name: 'Чизбургер', aliases: [], energyKcal: 303, proteinG: 16, fatG: 15, carbG: 25 },
  { id: 'seed:hot-dog', name: 'Хот-дог', aliases: ['хотдог'], energyKcal: 290, proteinG: 11, fatG: 17, carbG: 24 },
  { id: 'seed:french-fries', name: 'Картофель фри', aliases: ['фри', 'картошка фри'], energyKcal: 312, proteinG: 3.4, fatG: 15, carbG: 41 },
  { id: 'seed:chicken-nuggets', name: 'Куриные наггетсы', aliases: ['наггетсы'], energyKcal: 296, proteinG: 15.6, fatG: 18.2, carbG: 18 },
  { id: 'seed:shawarma', name: 'Шаурма', aliases: ['шаверма'], energyKcal: 177, proteinG: 11, fatG: 10, carbG: 12 },
  { id: 'seed:sushi-roll', name: 'Суши ролл', aliases: ['суши', 'роллы'], energyKcal: 143, proteinG: 7, fatG: 3.6, carbG: 20 },
  { id: 'seed:borscht', name: 'Борщ', aliases: [], energyKcal: 49, proteinG: 1.6, fatG: 2.4, carbG: 5.8 },
  { id: 'seed:chicken-soup', name: 'Куриный суп', aliases: ['суп'], energyKcal: 55, proteinG: 3.8, fatG: 2, carbG: 5.5 },
  { id: 'seed:pilaf', name: 'Плов', aliases: [], energyKcal: 151, proteinG: 5.4, fatG: 4.4, carbG: 23 },
  { id: 'seed:dumplings', name: 'Пельмени', aliases: [], energyKcal: 275, proteinG: 11.9, fatG: 12.4, carbG: 29 },

  // ===== СНЕКИ =====
  { id: 'seed:chips', name: 'Чипсы картофельные', aliases: ['чипсы'], energyKcal: 536, proteinG: 6.5, fatG: 37.5, carbG: 49 },
  { id: 'seed:popcorn', name: 'Попкорн', aliases: [], energyKcal: 375, proteinG: 12.9, fatG: 4.2, carbG: 74 },
  { id: 'seed:crackers', name: 'Крекеры', aliases: [], energyKcal: 439, proteinG: 9, fatG: 11, carbG: 71 },
  { id: 'seed:pretzels', name: 'Крендельки', aliases: ['брецель'], energyKcal: 381, proteinG: 10, fatG: 2.6, carbG: 80 },

  // ===== СОУСЫ И ПРИПРАВЫ =====
  { id: 'seed:ketchup', name: 'Кетчуп', aliases: [], energyKcal: 112, proteinG: 1.8, fatG: 0.3, carbG: 27 },
  { id: 'seed:mustard', name: 'Горчица', aliases: [], energyKcal: 66, proteinG: 4.4, fatG: 4, carbG: 5.3 },
  { id: 'seed:soy-sauce', name: 'Соевый соус', aliases: ['соевый'], energyKcal: 53, proteinG: 5.6, fatG: 0, carbG: 4.9 },
  { id: 'seed:vinegar', name: 'Уксус', aliases: [], energyKcal: 21, proteinG: 0, fatG: 0, carbG: 0.3 },

  // ===== НАПИТКИ =====
  { id: 'seed:water', name: 'Вода питьевая', aliases: ['вода'], energyKcal: 0, proteinG: 0, fatG: 0, carbG: 0 },
  { id: 'seed:coffee-black', name: 'Кофе чёрный без сахара', aliases: ['кофе'], energyKcal: 2, proteinG: 0.1, fatG: 0, carbG: 0 },
  { id: 'seed:coffee-latte', name: 'Кофе латте', aliases: ['латте'], energyKcal: 54, proteinG: 2.5, fatG: 2.5, carbG: 5 },
  { id: 'seed:cappuccino', name: 'Капучино', aliases: [], energyKcal: 38, proteinG: 2.1, fatG: 1.5, carbG: 4 },
  { id: 'seed:tea', name: 'Чай без сахара', aliases: ['чай'], energyKcal: 1, proteinG: 0, fatG: 0, carbG: 0 },
  { id: 'seed:green-tea', name: 'Зелёный чай', aliases: ['зелёный'], energyKcal: 1, proteinG: 0, fatG: 0, carbG: 0 },
  { id: 'seed:juice-orange', name: 'Апельсиновый сок', aliases: ['сок апельсиновый'], energyKcal: 45, proteinG: 0.7, fatG: 0.2, carbG: 10 },
  { id: 'seed:juice-apple', name: 'Яблочный сок', aliases: ['сок яблочный'], energyKcal: 46, proteinG: 0.1, fatG: 0.1, carbG: 11 },
  { id: 'seed:cola', name: 'Кола', aliases: ['кока-кола'], energyKcal: 42, proteinG: 0, fatG: 0, carbG: 10.6 },
  { id: 'seed:protein-shake', name: 'Протеиновый коктейль', aliases: ['протеин'], energyKcal: 103, proteinG: 20, fatG: 1.5, carbG: 3 },
  { id: 'seed:smoothie', name: 'Смузи фруктовый', aliases: ['смузи'], energyKcal: 56, proteinG: 0.6, fatG: 0.2, carbG: 13 },
] as const;

const BY_ID = new Map(COMMON_FOOD_CATALOG.map((f) => [f.id, f]));

export function commonFoodAliases(productId: string): string[] {
  return BY_ID.get(productId)?.aliases ?? [];
}

export function seedToFoodProduct(seed: CommonFoodSeed, nowIso = TS): FoodProduct {
  return {
    id: seed.id,
    name: seed.name,
    brand: 'Справочник',
    barcode: null,
    energyKcal: seed.energyKcal,
    proteinG: seed.proteinG,
    fatG: seed.fatG,
    carbG: seed.carbG,
    source: 'catalog',
    isFavorite: false,
    createdAt: nowIso,
    updatedAt: nowIso,
    deletedAt: null,
  };
}

/**
 * Insert missing seed products. Does not revive soft-deleted ids.
 * Does not overwrite existing rows (user edits / OFF cache win).
 */
export function mergeCommonFoodCatalog(
  products: Map<string, FoodProduct>,
  nowIso: string = new Date().toISOString(),
): number {
  let added = 0;
  for (const seed of COMMON_FOOD_CATALOG) {
    if (products.has(seed.id)) continue;
    products.set(seed.id, seedToFoodProduct(seed, nowIso));
    added += 1;
  }
  return added;
}
