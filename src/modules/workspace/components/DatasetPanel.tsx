"use client";

import React, { useState } from "react";
import { useWorkspace } from "../hooks";
import styles from "./DatasetPanel.module.css";

export const DatasetPanel: React.FC = () => {
  const { state, dispatch } = useWorkspace();
  const { datasets, activeDatasetId } = state;
  const [showAddModal, setShowAddModal] = useState(false);

  const activeDataset = datasets.find((d) => d.id === activeDatasetId) || null;

  return (
    <aside
      className={styles.panel}
      aria-label="Dataset and Spatial Layer Manager"
      role="region"
    >
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <span aria-hidden="true">📁</span>
          <h2 className={styles.title}>Datasets</h2>
          <span className={styles.countBadge}>{datasets.length}</span>
        </div>

        <button
          type="button"
          className={styles.addBtn}
          onClick={() => setShowAddModal(true)}
          aria-label="Add new spatial dataset"
        >
          <span>+</span> Add
        </button>
      </div>

      {/* Dataset List */}
      <div className={styles.scrollArea}>
        {datasets.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📂</span>
            <p className={styles.emptyText}>
              No datasets available. Start by describing what you want to analyze or add a dataset.
            </p>
          </div>
        ) : (
          datasets.map((dataset) => {
            const isSelected = dataset.id === activeDatasetId;

            return (
              <div
                key={dataset.id}
                className={`${styles.datasetCard} ${isSelected ? styles.datasetCardActive : ""}`}
                onClick={() =>
                  dispatch({
                    type: "SELECT_DATASET",
                    payload: isSelected ? null : dataset.id,
                  })
                }
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    dispatch({
                      type: "SELECT_DATASET",
                      payload: isSelected ? null : dataset.id,
                    });
                  }
                }}
                aria-pressed={isSelected}
              >
                <div className={styles.cardTop}>
                  <div className={styles.datasetTitle}>{dataset.name}</div>
                </div>

                <div className={styles.datasetMeta}>
                  <span className={styles.formatBadge}>{dataset.format.toUpperCase()}</span>

                  {dataset.isSample && (
                    <span className={styles.sampleBadge} title="Isolated temporary demo data">
                      Sample Dataset
                    </span>
                  )}

                  <span
                    className={`${styles.statusIndicator} ${
                      dataset.status === "ready"
                        ? styles.statusReady
                        : styles.statusReview
                    }`}
                  >
                    {dataset.status === "ready" ? "Ready" : "Needs Review"}
                  </span>
                </div>

                <div className={styles.cardBottom}>
                  <span>
                    {dataset.featureCount
                      ? `${dataset.featureCount.toLocaleString()} feats`
                      : "Uncounted"}
                  </span>

                  <button
                    type="button"
                    className={`${styles.layerToggleBtn} ${
                      dataset.isLoadedOnMap ? styles.layerToggleBtnActive : ""
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch({
                        type: "TOGGLE_DATASET_LAYER",
                        payload: dataset.id,
                      });
                    }}
                    title={
                      dataset.isLoadedOnMap
                        ? "Layer loaded on map. Click to hide."
                        : "Layer hidden. Click to show on map."
                    }
                    aria-label={`Toggle map layer for ${dataset.name}`}
                  >
                    <span aria-hidden="true">{dataset.isLoadedOnMap ? "👁️" : "👁️‍🗨️"}</span>
                    <span>{dataset.isLoadedOnMap ? "On Map" : "Hidden"}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Selected Dataset Detail Drawer (State B: Dataset Selected) */}
      {activeDataset && (
        <div className={styles.selectedDetailsBox} aria-label="Selected Dataset Details">
          <div className={styles.detailsHeader}>
            <span className={styles.detailsTitle}>Active Layer Inspector</span>
            <button
              type="button"
              className={styles.deselectBtn}
              onClick={() => dispatch({ type: "SELECT_DATASET", payload: null })}
              title="Deselect active dataset"
            >
              Close
            </button>
          </div>

          <div className={styles.detailGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Geometry</span>
              <span className={styles.detailVal}>{activeDataset.geometryType || "Vector"}</span>
            </div>

            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>CRS / Projection</span>
              <span className={styles.detailVal}>{activeDataset.crs || "EPSG:4326"}</span>
            </div>

            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Features</span>
              <span className={styles.detailVal}>
                {activeDataset.featureCount?.toLocaleString() || "N/A"}
              </span>
            </div>

            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Size</span>
              <span className={styles.detailVal}>
                {activeDataset.sizeBytes
                  ? `${(activeDataset.sizeBytes / 1024 / 1024).toFixed(1)} MB`
                  : "N/A"}
              </span>
            </div>
          </div>

          {activeDataset.attributes && activeDataset.attributes.length > 0 && (
            <div>
              <span className={styles.detailLabel}>Attributes Schema</span>
              <div className={styles.attributesRow}>
                {activeDataset.attributes.map((attr) => (
                  <span key={attr} className={styles.attrTag}>
                    {attr}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Dataset Modal Stub */}
      {showAddModal && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-dataset-dialog-title"
        >
          <div className={styles.modalContent}>
            <h3 id="add-dataset-dialog-title" className={styles.modalTitle}>
              Add Spatial Dataset
            </h3>
            <p className={styles.modalDesc}>
              Upload interface boundary for GeoJSON, Shapefile (.zip), GeoTIFF, and tabular CSV files.
            </p>

            <div className={styles.modalStubPill}>
              <span>📤 Drag &amp; Drop Spatial File Here</span>
              <br />
              <small style={{ color: "#64748b" }}>
                (File ingestion parser will be integrated in Phase 3)
              </small>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setShowAddModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
