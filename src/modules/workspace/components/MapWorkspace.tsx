"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useWorkspace } from "../hooks";
import {
  BASEMAP_STYLES,
  DEFAULT_MAP_VIEWPORT,
  DEMO_VELLORE_GEOJSON,
  addOrUpdateGeoJsonSource,
  addGeoJsonLayers,
  setGeoJsonLayerVisibility,
  fitMapToGeoJson,
  type BasemapStyleId,
  type InspectedFeatureInfo,
} from "@/modules/map";
import styles from "./MapWorkspace.module.css";

const DEMO_SOURCE_ID = "demo-vellore-source";
const DEMO_LAYER_BASE_ID = "demo-vellore-layer";

export const MapWorkspace: React.FC = () => {
  const { state, dispatch } = useWorkspace();
  const { map, datasets } = state;
  const { basemap } = map;

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [inspectedFeature, setInspectedFeature] = useState<InspectedFeatureInfo | null>(null);

  // Live viewport state tracked from the real MapLibre instance
  const [liveCoords, setLiveCoords] = useState({
    lng: DEFAULT_MAP_VIEWPORT.longitude,
    lat: DEFAULT_MAP_VIEWPORT.latitude,
    zoom: DEFAULT_MAP_VIEWPORT.zoom,
  });

  // Track previous active dataset to auto-fit upon new user imports
  const prevActiveIdRef = useRef<string | null>(null);

  // Check if any demo dataset is marked as loaded/visible in the workspace state
  const isDemoLayerVisible = datasets.some((d) => d.isSample && d.isLoadedOnMap);

  // Function to attach GeoJSON sources and layers to the active style
  const syncGeoJsonToMap = useCallback((activeMap: maplibregl.Map) => {
    try {
      // 1. Sync static demo layer
      addOrUpdateGeoJsonSource(activeMap, DEMO_SOURCE_ID, DEMO_VELLORE_GEOJSON);
      addGeoJsonLayers(activeMap, DEMO_SOURCE_ID, DEMO_LAYER_BASE_ID);
      setGeoJsonLayerVisibility(activeMap, DEMO_LAYER_BASE_ID, isDemoLayerVisible);

      // 2. Sync dynamic user-imported datasets
      for (const dataset of datasets) {
        if (!dataset.isSample && dataset.geoJsonData) {
          const srcId = `dataset-source-${dataset.id}`;
          const lyrId = `dataset-layer-${dataset.id}`;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          addOrUpdateGeoJsonSource(activeMap, srcId, dataset.geoJsonData as any);
          addGeoJsonLayers(activeMap, srcId, lyrId);
          setGeoJsonLayerVisibility(activeMap, lyrId, Boolean(dataset.isLoadedOnMap));
        }
      }
    } catch (err) {
      console.error("Failed to sync GeoJSON layers to map:", err);
    }
  }, [datasets, isDemoLayerVisible]);

  // Initialize MapLibre instance once on mount
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    let isMounted = true;

    try {
      const activeStyle =
        BASEMAP_STYLES[basemap as BasemapStyleId] || BASEMAP_STYLES.dark;

      const mapInstance = new maplibregl.Map({
        container: mapContainerRef.current,
        style: activeStyle,
        center: [DEFAULT_MAP_VIEWPORT.longitude, DEFAULT_MAP_VIEWPORT.latitude],
        zoom: DEFAULT_MAP_VIEWPORT.zoom,
        pitch: DEFAULT_MAP_VIEWPORT.pitch,
        bearing: DEFAULT_MAP_VIEWPORT.bearing,
        attributionControl: false,
      });

      mapRef.current = mapInstance;

      mapInstance.on("load", () => {
        if (!isMounted) return;
        setMapLoaded(true);
        syncGeoJsonToMap(mapInstance);
      });

      mapInstance.on("style.load", () => {
        if (!isMounted) return;
        syncGeoJsonToMap(mapInstance);
      });

      // Track viewport movements for the HUD
      mapInstance.on("move", () => {
        if (!isMounted) return;
        const center = mapInstance.getCenter();
        setLiveCoords({
          lng: center.lng,
          lat: center.lat,
          zoom: parseFloat(mapInstance.getZoom().toFixed(2)),
        });
      });

      // Unified Feature Click Inspection across all layers
      mapInstance.on("click", (e) => {
        if (!mapInstance.isStyleLoaded()) return;

        const rendered = mapInstance.queryRenderedFeatures(e.point);
        const feat = rendered.find(
          (f) =>
            f.layer.id.startsWith(DEMO_LAYER_BASE_ID) ||
            f.layer.id.startsWith("dataset-layer-")
        );

        if (!feat) return;

        const props = (feat.properties || {}) as Record<string, unknown>;
        const geomType = feat.geometry.type;

        setInspectedFeature({
          layerId: feat.layer.id,
          geometryType: geomType,
          coordinates: [e.lngLat.lng, e.lngLat.lat],
          properties: props,
        });
      });

      // Unified cursor hover states
      mapInstance.on("mousemove", (e) => {
        if (!mapInstance.isStyleLoaded()) return;
        const rendered = mapInstance.queryRenderedFeatures(e.point);
        const hasInteractive = rendered.some(
          (f) =>
            f.layer.id.startsWith(DEMO_LAYER_BASE_ID) ||
            f.layer.id.startsWith("dataset-layer-")
        );
        mapInstance.getCanvas().style.cursor = hasInteractive ? "pointer" : "";
      });

      mapInstance.on("error", (e: unknown) => {
        console.warn("MapLibre internal notice:", e);
      });
    } catch (error) {
      console.error("MapLibre GL initialization error:", error);
      if (isMounted) {
        setMapError("Failed to initialize MapLibre GL. WebGL acceleration may be unavailable.");
      }
    }

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [basemap, syncGeoJsonToMap]);

  // Sync layers when datasets state changes (visibility toggled or new dataset imported)
  useEffect(() => {
    if (mapRef.current && mapLoaded) {
      syncGeoJsonToMap(mapRef.current);
    }
  }, [datasets, mapLoaded, syncGeoJsonToMap]);

  // Automatically zoom and fit bounds when a user-imported dataset is selected
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    if (state.activeDatasetId && state.activeDatasetId !== prevActiveIdRef.current) {
      prevActiveIdRef.current = state.activeDatasetId;
      const activeDataset = datasets.find((d) => d.id === state.activeDatasetId);

      if (!activeDataset?.isSample && activeDataset?.geoJsonData) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fitMapToGeoJson(mapRef.current, activeDataset.geoJsonData as any, 60);
      } else if (!activeDataset?.isSample && activeDataset?.boundingBox) {
        const [minX, minY, maxX, maxY] = activeDataset.boundingBox;
        mapRef.current.fitBounds(
          [
            [minX, minY],
            [maxX, maxY],
          ],
          { padding: 60, duration: 800, maxZoom: 15 }
        );
      }
    }
  }, [state.activeDatasetId, datasets, mapLoaded]);

  // Switch basemap style
  const handleBasemapChange = (newBasemap: BasemapStyleId) => {
    dispatch({ type: "SET_MAP_BASEMAP", payload: newBasemap });
    if (mapRef.current) {
      const styleSpec = BASEMAP_STYLES[newBasemap];
      if (styleSpec) {
        mapRef.current.setStyle(styleSpec);
      }
    }
  };

  // Zoom controls
  const handleZoomIn = () => {
    mapRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapRef.current?.zoomOut();
  };

  // Fit to layer bounds
  const handleFitLayer = () => {
    if (!mapRef.current) return;
    const activeDataset = datasets.find((d) => d.id === state.activeDatasetId);

    if (activeDataset?.geoJsonData) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const success = fitMapToGeoJson(mapRef.current, activeDataset.geoJsonData as any, 60);
      if (success) return;
    }

    if (activeDataset?.boundingBox) {
      const [minX, minY, maxX, maxY] = activeDataset.boundingBox;
      mapRef.current.fitBounds(
        [
          [minX, minY],
          [maxX, maxY],
        ],
        { padding: 60, duration: 800, maxZoom: 15 }
      );
      return;
    }

    const success = fitMapToGeoJson(mapRef.current, DEMO_VELLORE_GEOJSON, 60);
    if (!success) {
      mapRef.current.flyTo({
        center: [DEFAULT_MAP_VIEWPORT.longitude, DEFAULT_MAP_VIEWPORT.latitude],
        zoom: DEFAULT_MAP_VIEWPORT.zoom,
      });
    }
  };

  return (
    <div
      className={styles.mapContainer}
      role="region"
      aria-label="Interactive Geospatial Map Canvas"
    >
      {/* Real MapLibre Canvas Mount Point */}
      <div ref={mapContainerRef} className={styles.mapCanvas} id="maplibre-viewport" />

      {/* Floating HUD: Coordinates, Zoom, Layers, and Fit Button */}
      <div className={styles.hudBar} aria-label="Live Map Coordinates and Status">
        <div className={styles.hudItem}>
          <span className={styles.hudLabel}>Center:</span>
          <span className={styles.hudValue}>
            {liveCoords.lat.toFixed(4)}°N, {liveCoords.lng.toFixed(4)}°E
          </span>
        </div>

        <div className={styles.hudDivider} />

        <div className={styles.hudItem}>
          <span className={styles.hudLabel}>Zoom:</span>
          <span className={styles.hudValue}>{liveCoords.zoom.toFixed(1)}x</span>
        </div>

        <div className={styles.hudDivider} />

        <button
          type="button"
          className={styles.fitBoundsBtn}
          onClick={handleFitLayer}
          title="Fit view to GeoJSON features bounding box"
        >
          <span>🎯</span>
          <span>Fit Layer</span>
        </button>
      </div>

      {/* Floating Controls: Basemap & Zoom */}
      <div className={styles.mapControls}>
        <div className={styles.basemapSelector} aria-label="Basemap Style Selector">
          {(["dark", "light", "streets", "satellite"] as const).map((b) => (
            <button
              key={b}
              type="button"
              className={`${styles.basemapBtn} ${basemap === b ? styles.basemapBtnActive : ""}`}
              onClick={() => handleBasemapChange(b)}
            >
              {b.charAt(0).toUpperCase() + b.slice(1)}
            </button>
          ))}
        </div>

        <div className={styles.controlGroup} aria-label="Zoom Controls">
          <button
            type="button"
            className={styles.zoomBtn}
            onClick={handleZoomIn}
            title="Zoom In"
            aria-label="Zoom in map"
          >
            +
          </button>
          <button
            type="button"
            className={styles.zoomBtn}
            onClick={handleZoomOut}
            title="Zoom Out"
            aria-label="Zoom out map"
          >
            &minus;
          </button>
        </div>
      </div>

      {/* Compact Feature Inspection Card */}
      {inspectedFeature && (
        <div
          className={styles.inspectionCard}
          role="region"
          aria-label="Inspected Feature Details"
        >
          <div className={styles.inspectionHeader}>
            <div className={styles.inspectionTitleGroup}>
              <span aria-hidden="true">📍</span>
              <span className={styles.inspectionTitle}>Feature Details</span>
            </div>
            <button
              type="button"
              className={styles.closeInspectBtn}
              onClick={() => setInspectedFeature(null)}
              aria-label="Close feature inspector"
            >
              &times;
            </button>
          </div>

          <div className={styles.inspectionContent}>
            <div className={styles.inspectField}>
              <span className={styles.fieldKey}>Name:</span>
              <span className={styles.fieldVal}>
                {String(inspectedFeature.properties.name || "Demo Feature")}
              </span>
            </div>

            <div className={styles.inspectField}>
              <span className={styles.fieldKey}>Type:</span>
              <span className={styles.fieldVal}>{inspectedFeature.geometryType}</span>
            </div>

            {Object.entries(inspectedFeature.properties)
              .filter(([k]) => k !== "name" && k !== "id" && k !== "type")
              .map(([key, val]) => (
                <div key={key} className={styles.inspectField}>
                  <span className={styles.fieldKey}>{key}:</span>
                  <span className={styles.fieldVal}>{String(val)}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Active Layer Chips (Clickable to toggle layer visibility) */}
      <div className={styles.layerChips} aria-label="Active Map Layers">
        {datasets.map((layer) => (
          <button
            key={layer.id}
            type="button"
            className={`${styles.layerChip} ${layer.isLoadedOnMap ? styles.layerChipActive : ""}`}
            onClick={() => dispatch({ type: "TOGGLE_DATASET_LAYER", payload: layer.id })}
            title={layer.isLoadedOnMap ? "Click to hide layer" : "Click to show layer"}
          >
            <span
              className={`${styles.chipDot} ${
                layer.isLoadedOnMap ? "" : styles.chipDotInactive
              }`}
            />
            <span>{layer.name}</span>
          </button>
        ))}
      </div>

      {/* Fallback Error Banner if WebGL/MapLibre Fails */}
      {mapError && (
        <div className={styles.errorBanner} role="alert">
          <div className={styles.errorTitle}>Map Unavailable</div>
          <p className={styles.errorDesc}>{mapError}</p>
          <button
            type="button"
            className={styles.retryBtn}
            onClick={() => {
              setMapError(null);
              window.location.reload();
            }}
          >
            Reload Workspace
          </button>
        </div>
      )}
    </div>
  );
};
