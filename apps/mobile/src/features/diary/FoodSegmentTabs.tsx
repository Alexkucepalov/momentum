import { SegmentedControl } from '@/src/ui/SegmentedControl';

export type FoodSegment = 'diary' | 'catalog';

const SEGMENTS: { id: FoodSegment; label: string }[] = [
  { id: 'diary', label: 'Дневник' },
  { id: 'catalog', label: 'Каталог' },
];

/** Primary Food IA: diary vs catalog — mutually exclusive views. */
export function FoodSegmentTabs({
  value,
  onChange,
}: {
  value: FoodSegment;
  onChange: (segment: FoodSegment) => void;
}) {
  return <SegmentedControl value={value} options={SEGMENTS} onChange={onChange} />;
}
