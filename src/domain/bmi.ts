/** BMI helpers — informational only, not medical advice or diagnosis. */

export type BmiBandId = 'underweight' | 'normal' | 'overweight' | 'obesity';

export type BmiBand = {
  id: BmiBandId;
  /** Short RU label without shame language */
  labelRu: string;
  /** Neutral WHO-style range note */
  rangeRu: string;
  hintRu: string;
};

const BANDS: BmiBand[] = [
  {
    id: 'underweight',
    labelRu: 'Ниже обычного диапазона',
    rangeRu: 'ИМТ < 18,5',
    hintRu: 'Это справочный диапазон ВОЗ, не диагноз. При вопросах — к врачу.',
  },
  {
    id: 'normal',
    labelRu: 'Обычный диапазон',
    rangeRu: 'ИМТ 18,5–24,9',
    hintRu: 'Ориентир ВОЗ для взрослых. Не заменяет консультацию специалиста.',
  },
  {
    id: 'overweight',
    labelRu: 'Выше обычного диапазона',
    rangeRu: 'ИМТ 25–29,9',
    hintRu: 'Справочная категория ВОЗ. Контекст важнее одной цифры.',
  },
  {
    id: 'obesity',
    labelRu: 'Значительно выше обычного',
    rangeRu: 'ИМТ ≥ 30',
    hintRu: 'Справочная категория ВОЗ. Не оценка личности и не план питания.',
  },
];

export function computeBmi(weightKg: number, heightCm: number): number {
  if (!Number.isFinite(weightKg) || weightKg <= 0) throw new Error('Invalid weightKg');
  if (!Number.isFinite(heightCm) || heightCm <= 0) throw new Error('Invalid heightCm');
  const m = heightCm / 100;
  return weightKg / (m * m);
}

export function bmiBand(bmi: number): BmiBand {
  if (!Number.isFinite(bmi) || bmi <= 0) throw new Error('Invalid bmi');
  if (bmi < 18.5) return BANDS[0];
  if (bmi < 25) return BANDS[1];
  if (bmi < 30) return BANDS[2];
  return BANDS[3];
}

export function formatBmi(bmi: number): string {
  return (Math.round(bmi * 10) / 10).toFixed(1);
}
