/**
 * Map Module Interfaces
 *
 * OWNED BY: Member 3 (MapLibre & Geospatial Visualization)
 *
 * When ready to integrate MapLibre:
 * 1. Install `maplibre-gl` or `@types/maplibre-gl` (and optionally `react-map-gl/maplibre`).
 * 2. Implement the MapLibre canvas inside `src/modules/map/components/`.
 * 3. Use these typed contracts to communicate viewport state and layers with the main dashboard.
 */

export interface MapViewportState {
  longitude: number;
  latitude: number;
  zoom: number;
  pitch: number;
  bearing: number;
}

export type LayerType = "raster" | "vector" | "geojson" | "heatmap" | "fill" | "line" | "circle";

export interface MapLayer {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
  opacity: number;
  sourceUrl?: string;
  data?: unknown; // Reserved for GeoJSON object or FeatureCollection
}

export interface MapViewConfig {
  initialViewport: MapViewportState;
  styleUrl: string;
  interactive?: boolean;
}

export type BasemapStyleId = "dark" | "light" | "satellite" | "streets";


export interface InspectedFeatureInfo {
  layerId: string;
  geometryType: string;
  coordinates?: [number, number];
  properties: Record<string, unknown>;
}

export interface MapComponentProps {
  viewport?: Partial<MapViewportState>;
  layers?: MapLayer[];
  onViewportChange?: (viewport: MapViewportState) => void;
  onLayerClick?: (layerId: string, feature: unknown) => void;
  onFeatureInspect?: (feature: InspectedFeatureInfo | null) => void;
}

