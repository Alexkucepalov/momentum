export type GarminLatLon = { lat: number; lon: number };

export type MappedGarminPolyline = {
  points: GarminLatLon[];
  start: GarminLatLon | null;
  end: GarminLatLon | null;
  bbox: { minLat: number; maxLat: number; minLon: number; maxLon: number } | null;
};

function asRecord(v: unknown): Record<string, unknown> | null {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return null;
  return v as Record<string, unknown>;
}

function finiteNumber(v: unknown): number | null {
  if (typeof v !== 'number' || !Number.isFinite(v)) return null;
  return v;
}

function pointFrom(raw: unknown): GarminLatLon | null {
  const row = asRecord(raw);
  if (!row) return null;
  const lat = finiteNumber(row.lat) ?? finiteNumber(row.latitude);
  const lon = finiteNumber(row.lon) ?? finiteNumber(row.longitude) ?? finiteNumber(row.lng);
  if (lat == null || lon == null) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
  return { lat, lon };
}

/** Keep storage small — evenly sample up to maxPoints. */
export function downsamplePolyline(points: GarminLatLon[], maxPoints = 500): GarminLatLon[] {
  if (maxPoints < 2) return points.slice(0, Math.max(0, maxPoints));
  if (points.length <= maxPoints) return points;
  const out: GarminLatLon[] = [];
  const last = points.length - 1;
  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.round((i * last) / (maxPoints - 1));
    out.push(points[idx]!);
  }
  return out;
}

function bboxOf(points: GarminLatLon[]): MappedGarminPolyline['bbox'] {
  if (points.length === 0) return null;
  let minLat = points[0]!.lat;
  let maxLat = points[0]!.lat;
  let minLon = points[0]!.lon;
  let maxLon = points[0]!.lon;
  for (const p of points) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lon < minLon) minLon = p.lon;
    if (p.lon > maxLon) maxLon = p.lon;
  }
  return { minLat, maxLat, minLon, maxLon };
}

/**
 * Extract GPS track from Garmin activity details / mapdetails payload.
 */
export function mapGarminPolyline(payload: unknown, maxPoints = 500): MappedGarminPolyline | null {
  const root = asRecord(payload);
  if (!root) return null;

  const geo =
    asRecord(root.geoPolylineDTO) ??
    asRecord(root.geoPolyline) ??
    asRecord(asRecord(root.mapDTO)?.geoPolylineDTO);

  const rawList = geo
    ? Array.isArray(geo.polyline)
      ? geo.polyline
      : Array.isArray(geo.points)
        ? geo.points
        : []
    : Array.isArray(root.polyline)
      ? root.polyline
      : [];

  const points: GarminLatLon[] = [];
  for (const item of rawList) {
    const p = pointFrom(item);
    if (p) points.push(p);
  }
  if (points.length === 0) return null;

  const sampled = downsamplePolyline(points, maxPoints);
  const start = pointFrom(geo?.startPoint) ?? sampled[0] ?? null;
  const end = pointFrom(geo?.endPoint) ?? sampled[sampled.length - 1] ?? null;
  return {
    points: sampled,
    start,
    end,
    bbox: bboxOf(sampled),
  };
}

export function polylineToJson(poly: MappedGarminPolyline | null): string | null {
  if (!poly || poly.points.length === 0) return null;
  try {
    return JSON.stringify(poly);
  } catch {
    return null;
  }
}

export function parsePolylineJson(raw: string | null | undefined): MappedGarminPolyline | null {
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw) as MappedGarminPolyline;
    if (!obj || !Array.isArray(obj.points) || obj.points.length === 0) return null;
    return obj;
  } catch {
    return null;
  }
}
