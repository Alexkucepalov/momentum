/**
 * Bundled synthetic 2-week fixture for UI dogfood (not real health data).
 * Kept under src/ so Metro always embeds it as a JS module (not an asset id).
 */
import demo from './dogfood-2weeks.json';

/** Export JSON string compatible with parseExportJson / importAll. */
export function getDemo2WeeksExportJson(): string {
  if (!demo || typeof demo !== 'object' || Array.isArray(demo)) {
    throw new Error('Демо-фикстура не собрана в это приложение — нужен свежий APK');
  }
  const version = (demo as { version?: unknown }).version;
  if (typeof version !== 'number') {
    throw new Error('Демо-фикстура повреждена (нет version)');
  }
  return JSON.stringify(demo);
}
