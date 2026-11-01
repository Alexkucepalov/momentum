import type { MappedGarminPolyline } from './mapPolyline';

export function googleMapsTrackUrl(poly: MappedGarminPolyline): string | null {
  const start = poly.start ?? poly.points[0];
  const end = poly.end ?? poly.points[poly.points.length - 1];
  if (!start || !end) return null;
  const origin = `${start.lat},${start.lon}`;
  const destination = `${end.lat},${end.lon}`;
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=bicycling`;
}

export function yandexMapsTrackUrl(poly: MappedGarminPolyline): string | null {
  const start = poly.start ?? poly.points[0];
  const end = poly.end ?? poly.points[poly.points.length - 1];
  if (!start || !end) return null;
  // Yandex rtext uses lat,lon ~ lat,lon
  return `https://yandex.ru/maps/?rtext=${start.lat},${start.lon}~${end.lat},${end.lon}&rtt=bc`;
}
