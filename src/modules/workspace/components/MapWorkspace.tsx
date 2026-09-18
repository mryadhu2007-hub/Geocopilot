"use client";

import React from "react";
import { useWorkspace } from "../hooks";
import styles from "./MapWorkspace.module.css";

export const MapWorkspace: React.FC = () => {
  const { state, dispatch } = useWorkspace();
  const { map, datasets } = state;
  const { viewport, basemap } = map;

  const activeLayers = datasets.filter((d) => d.isLoadedOnMap);

  const handleZoom = (delta: number) => {
    dispatch({
      type: "SET_MAP_VIEWPORT",
      payload: { zoom: Math.min(20, Math.max(1, (viewport.zoom || 12) + delta)) },
    });
  };

  return (
    <div
      className={styles.mapContainer}
      role="region"
      aria-label="Interactive Geospatial Map Canvas"
    >
      {/* Floating HUD: Coordinates, Zoom, Layers */}
      <div className={styles.hudBar} aria-label="Map Viewport Status">
        <div className={styles.hudItem}>
          <span className={styles.hudLabel}>Lat/Lon:</span>
          <span className={styles.hudValue}>
            {viewport.latitude.toFixed(4)}°N, {Math.abs(viewport.longitude).toFixed(4)}°W
          </span>
        </div>

        <div className={styles.hudDivider} />

        <div className={styles.hudItem}>
          <span className={styles.hudLabel}>Zoom:</span>
          <span className={styles.hudValue}>{viewport.zoom}x</span>
        </div>

        <div className={styles.hudDivider} />

        <div className={styles.hudItem}>
          <span className={styles.hudLabel}>Active Layers:</span>
          <span className={styles.hudValue}>{activeLayers.length}</span>
        </div>
      </div>

      {/* Floating Controls: Basemap & Zoom */}
      <div className={styles.mapControls}>
        <div className={styles.basemapSelector} aria-label="Basemap Style Selector">
          {(["dark", "satellite", "streets"] as const).map((b) => (
            <button
              key={b}
              type="button"
              className={`${styles.basemapBtn} ${basemap === b ? styles.basemapBtnActive : ""}`}
              onClick={() => dispatch({ type: "SET_MAP_BASEMAP", payload: b })}
            >
              {b.charAt(0).toUpperCase() + b.slice(1)}
            </button>
          ))}
        </div>

        <div className={styles.controlGroup} aria-label="Zoom Controls">
          <button
            type="button"
            className={styles.zoomBtn}
            onClick={() => handleZoom(1)}
            title="Zoom In"
            aria-label="Zoom in map"
          >
            +
          </button>
          <button
            type="button"
            className={styles.zoomBtn}
            onClick={() => handleZoom(-1)}
            title="Zoom Out"
            aria-label="Zoom out map"
          >
            &minus;
          </button>
        </div>
      </div>

      {/* Center Map Integration Boundary Container (Clean mount target for Phase 2) */}
      <div className={styles.canvasArea} id="maplibre-canvas-boundary">
        <div className={styles.integrationBadge}>
          <span aria-hidden="true">🗺️</span>
          <span>Phase 2 MapLibre Integration Target</span>
        </div>

        <h3 className={styles.canvasTitle}>MapLibre GL Viewport Container</h3>
        <p className={styles.canvasDesc}>
          Primary visualization canvas prepared for vector tiles, raster basemaps, and
          dynamic GeoJSON overlay rendering.
        </p>
      </div>

      {/* Active Layer Chips */}
      {activeLayers.length > 0 && (
        <div className={styles.layerChips} aria-label="Active Map Layers">
          {activeLayers.map((layer) => (
            <div key={layer.id} className={styles.layerChip}>
              <span className={styles.chipDot} />
              <span>{layer.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
