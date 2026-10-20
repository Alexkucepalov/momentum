import type { PantryUnit } from '../storage/types';

export type ParsedPurchaseLine = {
  rawName: string;
  displayName: string;
  quantity: number | null;
  unit: PantryUnit | null;
  packageSizeText: string | null;
  unitPriceRub: number | null;
  lineTotalRub: number | null;
  discountRub: number | null;
  isFood: boolean;
  excluded: boolean;
};

export type ParsedPurchase = {
  lines: ParsedPurchaseLine[];
  totalRub: number | null;
  storeLabel: string | null;
  purchasedOn: string | null;
  parseConfidence: number;
};

const NON_FOOD_KEYWORDS = [
  'пакет',
  'мешок',
  'губка',
  'мыло',
  'шампунь',
  'туалет',
  'салфетки',
  'бумага',
  'моющее',
  'чистящее',
  'батарейка',
  'зубная',
  'косметика',
];

const UNIT_PATTERNS: Array<{ regex: RegExp; unit: PantryUnit }> = [
  { regex: /(?<!-)(\d+(?:[.,]\d+)?)\s*кг/i, unit: 'g' },
  { regex: /(?<!-)(\d+(?:[.,]\d+)?)\s*г(?:\s|$)/i, unit: 'g' },
  { regex: /(?<!-)(\d+(?:[.,]\d+)?)\s*л(?:\s|$)/i, unit: 'ml' },
  { regex: /(?<!-)(\d+(?:[.,]\d+)?)\s*мл/i, unit: 'ml' },
  { regex: /(?<!-)(\d+)\s*шт/i, unit: 'pcs' },
];

function normalizeNumber(str: string): number | null {
  const normalized = str.replace(',', '.');
  const num = parseFloat(normalized);
  return isNaN(num) || !isFinite(num) || num < 0 ? null : num;
}

function extractQuantity(text: string): { quantity: number | null; unit: PantryUnit | null; packageSizeText: string | null } {
  for (const pattern of UNIT_PATTERNS) {
    const match = text.match(pattern.regex);
    if (match) {
      let quantity = normalizeNumber(match[1]);
      if (quantity !== null && pattern.unit === 'g' && text.toLowerCase().includes('кг')) {
        quantity = quantity * 1000;
      }
      if (quantity !== null && pattern.unit === 'ml' && text.toLowerCase().includes('л') && !text.toLowerCase().includes('мл')) {
        quantity = quantity * 1000;
      }
      return {
        quantity,
        unit: pattern.unit,
        packageSizeText: match[0],
      };
    }
  }
  return { quantity: null, unit: null, packageSizeText: null };
}

function extractPrice(text: string): { unitPrice: number | null; lineTotal: number | null; discount: number | null } {
  const pricePattern = /(?<!-)(\d+(?:[.,]\d{1,2})?)\s*(?:₽|руб|р\.?)/gi;
  const matches = Array.from(text.matchAll(pricePattern));
  
  if (matches.length === 0) {
    return { unitPrice: null, lineTotal: null, discount: null };
  }
  
  const prices = matches.map(m => normalizeNumber(m[1])).filter((p): p is number => p !== null);
  
  if (prices.length === 1) {
    return { unitPrice: null, lineTotal: prices[0], discount: null };
  }
  
  if (prices.length === 2) {
    return { unitPrice: prices[0], lineTotal: prices[1], discount: null };
  }
  
  if (prices.length >= 3) {
    return { unitPrice: prices[0], lineTotal: prices[prices.length - 1], discount: prices[prices.length - 2] };
  }
  
  return { unitPrice: null, lineTotal: null, discount: null };
}

function detectNonFood(name: string): boolean {
  const lowerName = name.toLowerCase();
  return NON_FOOD_KEYWORDS.some(keyword => lowerName.includes(keyword));
}

function cleanProductName(rawName: string): string {
  let cleaned = rawName.trim();
  cleaned = cleaned.replace(/\d+(?:[.,]\d+)?\s*(?:кг|г|л|мл|шт)\.?/gi, '');
  cleaned = cleaned.replace(/\d+(?:[.,]\d{1,2})?\s*(?:₽|руб|р\.?)/gi, '');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned || rawName.trim();
}

export function parsePurchaseText(text: string): ParsedPurchase {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  let totalRub: number | null = null;
  let storeLabel: string | null = null;
  let purchasedOn: string | null = null;
  const parsedLines: ParsedPurchaseLine[] = [];
  
  for (const line of lines) {
    if (/итого|сумма|всего/i.test(line)) {
      const priceMatch = line.match(/(\d+(?:[.,]\d{1,2})?)\s*(?:₽|руб|р\.?)/i);
      if (priceMatch) {
        totalRub = normalizeNumber(priceMatch[1]);
      }
      continue;
    }
    
    const dateMatch = line.match(/\d{2}[./-]\d{2}[./-]\d{4}/);
    if (dateMatch) {
      const dateParts = dateMatch[0].split(/[./-]/);
      if (dateParts.length === 3) {
        purchasedOn = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
      }
      continue;
    }
    
    if (!storeLabel && /пятерочка|перекресток|магнит|лента|дикси|ашан/i.test(line)) {
      storeLabel = line;
      continue;
    }
    
    if (line.length < 3 || /^[0-9.,₽\s]+$/.test(line)) {
      continue;
    }
    
    const { quantity, unit, packageSizeText } = extractQuantity(line);
    const { unitPrice, lineTotal, discount } = extractPrice(line);
    const displayName = cleanProductName(line);
    const isFood = !detectNonFood(line);
    
    parsedLines.push({
      rawName: line,
      displayName,
      quantity,
      unit,
      packageSizeText,
      unitPriceRub: unitPrice,
      lineTotalRub: lineTotal,
      discountRub: discount,
      isFood,
      excluded: !isFood,
    });
  }
  
  const hasQuantities = parsedLines.some(l => l.quantity !== null);
  const hasPrices = parsedLines.some(l => l.lineTotalRub !== null);
  const confidence = parsedLines.length === 0 ? 0 : 
    (hasQuantities && hasPrices ? 0.8 : hasQuantities || hasPrices ? 0.5 : 0.3);
  
  return {
    lines: parsedLines,
    totalRub,
    storeLabel,
    purchasedOn,
    parseConfidence: confidence,
  };
}

export function generatePurchaseFingerprint(params: {
  totalRub: number | null;
  purchasedOn: string | null;
  storeLabel: string | null;
  lineCount: number;
}): string {
  const data = `${params.totalRub ?? ''}|${params.purchasedOn ?? ''}|${params.storeLabel ?? ''}|${params.lineCount}`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(16, '0').substring(0, 16);
}
