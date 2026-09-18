/**
 * Class name joining utility for clean conditional class definitions
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Coordinate formatter for UI display
 */
export function formatCoordinates(lng: number, lat: number): string {
  return `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
}
