import React from "react";
import type { MapComponentProps } from "../types";
import styles from "./MapPlaceholder.module.css";

/**
 * ============================================================================
 * MAPLIBRE INTEGRATION PLACEHOLDER
 * ============================================================================
 * RESPONSIBLE: Member 3 (MapLibre & Geospatial Visualization)
 *
 * HOW TO REPLACE:
 * 1. Install `maplibre-gl` (and optionally `react-map-gl/maplibre` if using React bindings).
 * 2. Replace the JSX in this component with the real MapLibre canvas/map container.
 * 3. Bind viewport updates to `props.onViewportChange` and layer selections to `props.onLayerClick`.
 * ============================================================================
 */
export const MapPlaceholder: React.FC<MapComponentProps> = ({
  viewport = { longitude: -122.4194, latitude: 37.7749, zoom: 12, pitch: 0, bearing: 0 },
  layers = [],
}) => {
  return (
    <div className={styles.container} role="region" aria-label="Geospatial Map Area">
      <div className={styles.badge}>
        <span>🗺️ Map Module</span>
        <span>•</span>
        <span>Assigned: Member 3</span>
      </div>

      <h3 className={styles.title}>MapLibre Canvas Area</h3>
      <p className={styles.description}>
        This is the integration boundary for the 2D/3D geospatial visualization engine.
        Vector tiles, raster basemaps, and GeoJSON layers will render here.
      </p>

      <div className={styles.hud}>
        <div className={styles.hudItem}>
          <span className={styles.hudLabel}>Coordinates</span>
          <span className={styles.hudValue}>
            {viewport.latitude?.toFixed(2)}°, {viewport.longitude?.toFixed(2)}°
          </span>
        </div>
        <div className={styles.hudItem}>
          <span className={styles.hudLabel}>Zoom</span>
          <span className={styles.hudValue}>{viewport.zoom ?? 12}x</span>
        </div>
        <div className={styles.hudItem}>
          <span className={styles.hudLabel}>Active Layers</span>
          <span className={styles.hudValue}>{layers.length} configured</span>
        </div>
      </div>
    </div>
  );
};
