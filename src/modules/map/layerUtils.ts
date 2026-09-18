import type { Map as MapLibreMap, LngLatBoundsLike } from "maplibre-gl";
import type { GeoJSON, Feature, Geometry } from "geojson";

export type BoundingBox = [number, number, number, number];

/**
 * Traverses any standard GeoJSON structure (Point, LineString, Polygon, Feature, FeatureCollection)
 * and computes the exact bounding box [minLng, minLat, maxLng, maxLat] without external dependencies.
 */
export function calculateGeoJsonBounds(geojson: GeoJSON): BoundingBox | null {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  function processCoordinate(coord: number[]) {
    if (coord.length >= 2 && typeof coord[0] === "number" && typeof coord[1] === "number") {
      const [lng, lat] = coord;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }
  }

  function processCoordinates(coords: unknown) {
    if (!Array.isArray(coords)) return;
    if (coords.length > 0 && typeof coords[0] === "number") {
      processCoordinate(coords as number[]);
    } else {
      for (const item of coords) {
        processCoordinates(item);
      }
    }
  }

  function processGeometry(geometry: Geometry | null) {
    if (!geometry) return;
    if ("coordinates" in geometry) {
      processCoordinates(geometry.coordinates);
    } else if (geometry.type === "GeometryCollection") {
      for (const geom of geometry.geometries) {
        processGeometry(geom);
      }
    }
  }

  function processFeature(feature: Feature) {
    processGeometry(feature.geometry);
  }

  if (geojson.type === "FeatureCollection") {
    for (const feat of geojson.features) {
      processFeature(feat);
    }
  } else if (geojson.type === "Feature") {
    processFeature(geojson);
  } else {
    processGeometry(geojson as Geometry);
  }

  if (minLng === Infinity || minLat === Infinity || maxLng === -Infinity || maxLat === -Infinity) {
    return null;
  }

  return [minLng, minLat, maxLng, maxLat];
}

/**
 * Adds or updates a GeoJSON source in the MapLibre map instance.
 */
export function addOrUpdateGeoJsonSource(
  map: MapLibreMap,
  sourceId: string,
  data: GeoJSON
): void {
  const existingSource = map.getSource(sourceId);
  if (existingSource && "setData" in existingSource) {
    (existingSource as { setData: (d: GeoJSON) => void }).setData(data);
  } else {
    map.addSource(sourceId, {
      type: "geojson",
      data,
    });
  }
}

/**
 * Adds fill, line, and circle visualization layers for a given GeoJSON source.
 */
export function addGeoJsonLayers(
  map: MapLibreMap,
  sourceId: string,
  layerBaseId: string
): void {
  // 1. Polygon Fill Layer
  const fillLayerId = `${layerBaseId}-fill`;
  if (!map.getLayer(fillLayerId)) {
    map.addLayer({
      id: fillLayerId,
      type: "fill",
      source: sourceId,
      filter: ["==", "$type", "Polygon"],
      paint: {
        "fill-color": [
          "case",
          ["==", ["get", "id"], "demo-poly-02"],
          "#f59e0b", // Amber for Palar River buffer
          "#38bdf8", // Sky blue for Urban Central boundary
        ],
        "fill-opacity": 0.35,
      },
    });
  }

  // 2. Line Border Layer
  const lineLayerId = `${layerBaseId}-line`;
  if (!map.getLayer(lineLayerId)) {
    map.addLayer({
      id: lineLayerId,
      type: "line",
      source: sourceId,
      paint: {
        "line-color": [
          "case",
          ["==", ["get", "id"], "demo-poly-02"],
          "#fbbf24",
          "#38bdf8",
        ],
        "line-width": 2,
        "line-opacity": 0.85,
      },
    });
  }

  // 3. Point Circle Marker Layer
  const circleLayerId = `${layerBaseId}-circle`;
  if (!map.getLayer(circleLayerId)) {
    map.addLayer({
      id: circleLayerId,
      type: "circle",
      source: sourceId,
      filter: ["==", "$type", "Point"],
      paint: {
        "circle-radius": 7,
        "circle-color": "#10b981", // Emerald for landmark points
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 2,
        "circle-opacity": 0.95,
      },
    });
  }
}

/**
 * Sets visibility ('visible' or 'none') for all sub-layers (fill, line, circle).
 */
export function setGeoJsonLayerVisibility(
  map: MapLibreMap,
  layerBaseId: string,
  visible: boolean
): void {
  const visibility = visible ? "visible" : "none";
  const subLayerIds = [
    `${layerBaseId}-fill`,
    `${layerBaseId}-line`,
    `${layerBaseId}-circle`,
  ];

  for (const id of subLayerIds) {
    if (map.getLayer(id)) {
      map.setLayoutProperty(id, "visibility", visibility);
    }
  }
}

/**
 * Dynamically computes the bounds of the given GeoJSON and animates the map to fit.
 */
export function fitMapToGeoJson(
  map: MapLibreMap,
  geojson: GeoJSON,
  padding = 50
): boolean {
  const bounds = calculateGeoJsonBounds(geojson);
  if (!bounds) return false;

  const [minLng, minLat, maxLng, maxLat] = bounds;
  const lngLatBounds: LngLatBoundsLike = [
    [minLng, minLat],
    [maxLng, maxLat],
  ];

  map.fitBounds(lngLatBounds, {
    padding,
    duration: 800,
    maxZoom: 15,
  });

  return true;
}

/**
 * Safely cleans up layers and source from the map instance.
 */
export function removeGeoJsonLayersAndSource(
  map: MapLibreMap,
  sourceId: string,
  layerBaseId: string
): void {
  const subLayerIds = [
    `${layerBaseId}-fill`,
    `${layerBaseId}-line`,
    `${layerBaseId}-circle`,
  ];

  for (const id of subLayerIds) {
    if (map.getLayer(id)) {
      map.removeLayer(id);
    }
  }

  if (map.getSource(sourceId)) {
    map.removeSource(sourceId);
  }
}
