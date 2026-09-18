import React from "react";
import type { DatasetComponentProps } from "../types";
import styles from "./DatasetPlaceholder.module.css";

/**
 * ============================================================================
 * DATASET & LAYER SELECTION PLACEHOLDER
 * ============================================================================
 * Integration boundary for managing active GIS layers, PostGIS tables,
 * and user-uploaded GeoJSON datasets.
 * ============================================================================
 */
export const DatasetPlaceholder: React.FC<DatasetComponentProps> = () => {
  return (
    <div className={styles.container} role="region" aria-label="Dataset Management Area">
      <div className={styles.badge}>
        <span>📁 Datasets & Layers</span>
        <span>•</span>
        <span>Assigned: Member 4 & 3</span>
      </div>

      <h3 className={styles.title}>Geospatial Catalog</h3>
      <p className={styles.description}>
        Repository for spatial datasets, PostGIS vector layers, and uploaded assets.
      </p>

      <ul className={styles.list}>
        <li className={styles.item}>
          <div className={styles.itemInfo}>
            <span>🌐 urban_parcels_2024</span>
            <span className={styles.itemFormat}>GEOJSON</span>
          </div>
          <span className={styles.itemStatus}>Placeholder</span>
        </li>
        <li className={styles.item}>
          <div className={styles.itemInfo}>
            <span>🌊 flood_zone_boundaries</span>
            <span className={styles.itemFormat}>POSTGIS</span>
          </div>
          <span className={styles.itemStatus}>Placeholder</span>
        </li>
        <li className={styles.item}>
          <div className={styles.itemInfo}>
            <span>🌲 elevation_contours</span>
            <span className={styles.itemFormat}>RASTER</span>
          </div>
          <span className={styles.itemStatus}>Placeholder</span>
        </li>
      </ul>
    </div>
  );
};
