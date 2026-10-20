/**
 * Retail catalog adapter — honest stub until legal live sources exist (ADR-008).
 * Never invents prices or scrapes store sites.
 */

export class StoreCatalogNotAvailableError extends Error {
  readonly code = 'STORE_CATALOG_NOT_AVAILABLE' as const;

  constructor(message = 'Live store prices are not available') {
    super(message);
    this.name = 'StoreCatalogNotAvailableError';
  }
}

export type StoreCatalogAdapter = {
  /** Always false in v1 — UI must not claim «цена сегодня». */
  readonly supportsLivePrices: false;
  searchProducts(query: string): never;
};

export function createStoreCatalogAdapter(): StoreCatalogAdapter {
  return {
    supportsLivePrices: false,
    searchProducts(_query: string): never {
      throw new StoreCatalogNotAvailableError(
        'Актуальные цены появятся только из разрешённых источников. Сейчас — ваши цены и чеки.',
      );
    },
  };
}
