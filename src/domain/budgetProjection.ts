/**
 * Combine open shopping basket estimates for budget «projected» metric.
 * Never labels totals as live retailer prices.
 */

export type OpenBasketInput = {
  status: string;
  deletedAt?: string | null;
  totalRub: number | null;
  needLineCount: number;
  pricedNeedCount: number;
  label: string;
};

export type ProjectedShoppingSpend = {
  /** Sum when every open list with needs has a complete total; else null. */
  totalRub: number | null;
  knownSumRub: number | null;
  openListCount: number;
  listsWithNeeds: number;
  incomplete: boolean;
  /** Honest RU label — never «цена сегодня». */
  label: string;
};

export function projectOpenShoppingSpend(baskets: OpenBasketInput[]): ProjectedShoppingSpend {
  const open = baskets.filter((b) => !b.deletedAt && b.status === 'open');
  const withNeeds = open.filter((b) => b.needLineCount > 0);
  if (withNeeds.length === 0) {
    return {
      totalRub: 0,
      knownSumRub: 0,
      openListCount: open.length,
      listsWithNeeds: 0,
      incomplete: false,
      label: 'Открытых корзин с покупками нет',
    };
  }

  let knownSum = 0;
  let knownLists = 0;
  let allComplete = true;
  for (const b of withNeeds) {
    if (b.totalRub != null && Number.isFinite(b.totalRub)) {
      knownSum += b.totalRub;
      knownLists += 1;
    } else {
      allComplete = false;
      // partial label may still embed a known fragment — we only sum complete totals
    }
  }

  if (allComplete && knownLists === withNeeds.length) {
    return {
      totalRub: knownSum,
      knownSumRub: knownSum,
      openListCount: open.length,
      listsWithNeeds: withNeeds.length,
      incomplete: false,
      label: 'Прогноз по вашим ценам в списках · не live',
    };
  }

  return {
    totalRub: null,
    knownSumRub: knownLists > 0 ? knownSum : null,
    openListCount: open.length,
    listsWithNeeds: withNeeds.length,
    incomplete: true,
    label:
      knownLists > 0
        ? `Частично ~${Math.round(knownSum)} ₽ · суммы в списках неполные`
        : 'Прогноз неизвестен · задайте цены в покупках',
  };
}
