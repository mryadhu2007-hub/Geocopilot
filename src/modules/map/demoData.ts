import type { FeatureCollection } from "geojson";

/**
 * ============================================================================
 * LOCAL DEMO GEOJSON FIXTURES (VISUALIZATION ONLY)
 * ============================================================================
 * IMPORTANT:
 * These geographic features are synthetic test fixtures around Vellore,
 * Tamil Nadu, intended solely for verifying MapLibre layer rendering,
 * hover states, click inspection, and bounding box calculations.
 * They do NOT represent authoritative scientific or cadastral data.
 * ============================================================================
 */

export const DEMO_VELLORE_GEOJSON: FeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "feat-poly-01",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [79.115, 12.905],
            [79.155, 12.905],
            [79.158, 12.935],
            [79.112, 12.935],
            [79.115, 12.905],
          ],
        ],
      },
      properties: {
        id: "demo-poly-01",
        name: "Vellore Central Urban Area (Demo)",
        type: "Polygon",
        category: "Municipal Sector (Sample)",
        zoning: "Mixed Urban / Commercial",
        featureCountEst: 1420,
        notes: "Visualization test boundary for vector polygon rendering.",
      },
    },
    {
      type: "Feature",
      id: "feat-poly-02",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [79.095, 12.932],
            [79.175, 12.946],
            [79.172, 12.936],
            [79.092, 12.922],
            [79.095, 12.932],
          ],
        ],
      },
      properties: {
        id: "demo-poly-02",
        name: "Palar River Basin Buffer (Demo)",
        type: "Polygon",
        category: "Hydrographic Hazard Corridor (Sample)",
        floodRiskTier: "100-Year Inundation Margin",
        bufferDistance: "250 meters",
        notes: "Visualization test boundary for spatial overlay inspection.",
      },
    },
    {
      type: "Feature",
      id: "feat-point-01",
      geometry: {
        type: "Point",
        coordinates: [79.1293, 12.9202],
      },
      properties: {
        id: "demo-pt-01",
        name: "Vellore Fort Landmark (Demo)",
        type: "Point",
        category: "Cultural Heritage Site (Sample)",
        elevationEst: "216m",
        status: "Active Landmark",
        notes: "Point marker test fixture for feature inspection popup.",
      },
    },
    {
      type: "Feature",
      id: "feat-point-02",
      geometry: {
        type: "Point",
        coordinates: [79.1385, 12.9734],
      },
      properties: {
        id: "demo-pt-02",
        name: "Katpadi Transit Hub (Demo)",
        type: "Point",
        category: "Transportation Node (Sample)",
        connectivity: "Major Rail Corridor",
        status: "Active Infrastructure",
        notes: "Point marker test fixture for coordinate HUD tracking.",
      },
    },
    {
      type: "Feature",
      id: "feat-point-03",
      geometry: {
        type: "Point",
        coordinates: [79.135, 12.875],
      },
      properties: {
        id: "demo-pt-03",
        name: "Bagayam Southern Corridor (Demo)",
        type: "Point",
        category: "Peri-Urban Sector (Sample)",
        status: "Survey Station",
        notes: "Perimeter test point for bounding box calculation.",
      },
    },
  ],
};
