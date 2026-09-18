/**
 * Supabase Service Interfaces
 *
 * OWNED BY: Member 4 (Backend, Supabase, PostGIS & GIS Analysis)
 *
 * Schema definitions for PostGIS spatial tables and authentication.
 */

export interface DatabaseGeoRecord {
  id: string;
  name: string;
  geom_type: "Point" | "Polygon" | "MultiPolygon" | "LineString";
  properties: Record<string, unknown>;
  created_at: string;
}

export interface SpatialQueryFilter {
  withinBoundingBox?: [minLng: number, minLat: number, maxLng: number, maxLat: number];
  bufferDistanceMeters?: number;
  tableName?: string;
}
