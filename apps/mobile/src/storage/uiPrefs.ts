import { Platform } from 'react-native';

/** Mirrors FoodCatalogList filter ids — kept local to avoid RN feature imports in wipe paths. */
export type CatalogFilterPref =
  | 'all'
  | 'favorites'
  | 'frequent'
  | 'recent'
  | 'recipes';

const MEMORY: { catalogFilter: CatalogFilterPref } = { catalogFilter: 'all' };

const FILTERS: CatalogFilterPref[] = [
  'all',
  'favorites',
  'frequent',
  'recent',
  'recipes',
];

function isCatalogFilter(v: unknown): v is CatalogFilterPref {
  return typeof v === 'string' && (FILTERS as string[]).includes(v);
}

async function prefsUri(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  try {
    const FileSystem = await import('expo-file-system/legacy');
    const base = FileSystem.documentDirectory;
    if (!base) return null;
    return `${base}nf-fit-ui-prefs.json`;
  } catch {
    return null;
  }
}

/** Load last catalog filter; defaults to `all`. Never throws. */
export async function loadCatalogFilter(): Promise<CatalogFilterPref> {
  const uri = await prefsUri();
  if (!uri) return MEMORY.catalogFilter;
  try {
    const FileSystem = await import('expo-file-system/legacy');
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) return MEMORY.catalogFilter;
    const raw = await FileSystem.readAsStringAsync(uri);
    const parsed = JSON.parse(raw) as { catalogFilter?: unknown };
    if (isCatalogFilter(parsed.catalogFilter)) {
      MEMORY.catalogFilter = parsed.catalogFilter;
      return parsed.catalogFilter;
    }
  } catch {
    /* keep memory default */
  }
  return MEMORY.catalogFilter;
}

/** Persist catalog filter for next Food → Catalog visit. */
export async function saveCatalogFilter(filter: CatalogFilterPref): Promise<void> {
  MEMORY.catalogFilter = filter;
  const uri = await prefsUri();
  if (!uri) return;
  try {
    const FileSystem = await import('expo-file-system/legacy');
    await FileSystem.writeAsStringAsync(uri, JSON.stringify({ catalogFilter: filter }));
  } catch {
    /* non-fatal */
  }
}

/** Wipe UI prefs (call from delete-all). */
export async function clearUiPrefs(): Promise<void> {
  MEMORY.catalogFilter = 'all';
  const uri = await prefsUri();
  if (!uri) return;
  try {
    const FileSystem = await import('expo-file-system/legacy');
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    /* non-fatal */
  }
}
