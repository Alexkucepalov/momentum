import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  GARMIN_FIELD_GROUP_RU,
  groupGarminDetailFields,
  type GarminFieldGroup,
} from '../../../../../src/domain/garmin';
import { AppCard, AppText, colors, space } from '@/src/design-system';

export function GarminRawFields({ detailJson }: { detailJson: string | null }) {
  const [open, setOpen] = useState(false);
  const fields = useMemo(() => {
    if (!detailJson) return [];
    try {
      const parsed = JSON.parse(detailJson) as {
        fields?: Record<string, string | number | boolean | null>;
      };
      return groupGarminDetailFields(parsed.fields ?? {});
    } catch {
      return [];
    }
  }, [detailJson]);

  const byGroup = useMemo(() => {
    const map = new Map<GarminFieldGroup, typeof fields>();
    for (const f of fields) {
      const list = map.get(f.group) ?? [];
      list.push(f);
      map.set(f.group, list);
    }
    return map;
  }, [fields]);

  return (
    <AppCard>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={open ? 'Скрыть все поля Garmin' : 'Показать все поля Garmin'}
      >
        <AppText variant="subtitle">Все поля Garmin {open ? '▾' : '▸'}</AppText>
        <AppText variant="caption" tone="muted">
          {fields.length === 0
            ? 'Нет дополнительного payload'
            : `${fields.length} полей · с русскими подписями где известны`}
        </AppText>
      </Pressable>
      {open
        ? ([...byGroup.entries()] as Array<[GarminFieldGroup, typeof fields]>).map(
            ([group, list]) => (
              <View key={group} style={styles.group}>
                <AppText variant="label" tone="secondary">
                  {GARMIN_FIELD_GROUP_RU[group]}
                </AppText>
                {list.map((f) => (
                  <View key={f.key} style={styles.kv}>
                    <AppText variant="caption" tone="secondary">
                      {f.labelRu}
                      {f.labelRu === f.key ? '' : ` · ${f.key}`}
                    </AppText>
                    <AppText variant="caption">{f.value}</AppText>
                  </View>
                ))}
              </View>
            ),
          )
        : null}
    </AppCard>
  );
}

const styles = StyleSheet.create({
  group: { marginTop: space.md, gap: 4 },
  kv: {
    paddingVertical: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    gap: 2,
  },
});
