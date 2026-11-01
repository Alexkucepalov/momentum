import type { GarminLatLon, MappedGarminPolyline } from './mapPolyline';

export type ProjectedTrackPoint = { x: number; y: number };

/**
 * Project lat/lon polyline into SVG viewBox coordinates (y grows downward).
 * Adds padding so the path is not clipped.
 */
export function projectTrackToViewBox(
  poly: MappedGarminPolyline,
  width: number,
  height: number,
  padding = 12,
): { points: ProjectedTrackPoint[]; pointsAttr: string } | null {
  if (poly.points.length < 2 || width <= 0 || height <= 0) return null;
  const bbox = poly.bbox ?? {
    minLat: Math.min(...poly.points.map((p) => p.lat)),
    maxLat: Math.max(...poly.points.map((p) => p.lat)),
    minLon: Math.min(...poly.points.map((p) => p.lon)),
    maxLon: Math.max(...poly.points.map((p) => p.lon)),
  };
  let latSpan = bbox.maxLat - bbox.minLat;
  let lonSpan = bbox.maxLon - bbox.minLon;
  if (latSpan < 1e-6) latSpan = 1e-6;
  if (lonSpan < 1e-6) lonSpan = 1e-6;

  const innerW = width - padding * 2;
  const innerH = height - padding * 2;
  const scale = Math.min(innerW / lonSpan, innerH / latSpan);

  const usedW = lonSpan * scale;
  const usedH = latSpan * scale;
  const ox = padding + (innerW - usedW) / 2;
  const oy = padding + (innerH - usedH) / 2;

  const points = poly.points.map((p: GarminLatLon) => ({
    x: ox + (p.lon - bbox.minLon) * scale,
    y: oy + (bbox.maxLat - p.lat) * scale,
  }));
  const pointsAttr = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  return { points, pointsAttr };
}
