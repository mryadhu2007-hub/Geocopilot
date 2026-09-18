"use client";

import React, { useState, useEffect, useRef } from "react";
import { useWorkspace } from "../hooks";
import { profileDataset, uploadDataset, GisApiError } from "@/services/gis/client";
import type { GeospatialDataset } from "@/modules/data/types";
import styles from "./DatasetPanel.module.css";

/**
 * Deterministically parses CSV text into a standard GeoJSON FeatureCollection of Point features.
 * Automatically looks for common latitude and longitude column headers.
 */
function parseCsvToGeoJson(csvText: string): unknown {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return null;

  const rawHeaders = lines[0].split(",").map((h) => h.trim().replace(/^["']|["']$/g, ""));
  const lowerHeaders = rawHeaders.map((h) => h.toLowerCase());

  const lonIdx = lowerHeaders.findIndex((h) =>
    ["lon", "longitude", "lng", "long", "x"].includes(h)
  );
  const latIdx = lowerHeaders.findIndex((h) =>
    ["lat", "latitude", "y"].includes(h)
  );

  if (lonIdx === -1 || latIdx === -1) return null;

  const features = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
    const lon = parseFloat(cols[lonIdx]);
    const lat = parseFloat(cols[latIdx]);
    if (isNaN(lon) || isNaN(lat)) continue;

    const props: Record<string, unknown> = {};
    rawHeaders.forEach((h, idx) => {
      props[h] = cols[idx] !== undefined ? cols[idx] : null;
    });

    features.push({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [lon, lat],
      },
      properties: props,
    });
  }

  return {
    type: "FeatureCollection",
    features,
  };
}

export const DatasetPanel: React.FC = () => {
  const { state, dispatch } = useWorkspace();
  const { datasets, activeDatasetId } = state;
  const [showAddModal, setShowAddModal] = useState(false);
  const [filePathInput, setFilePathInput] = useState("");

  // Upload modal state
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState<"idle" | "uploading" | "profiling" | "rendering" | "done" | "error">("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);

  const activeDataset = datasets.find((d) => d.id === activeDatasetId) || null;

  // Keep input in sync with active dataset selection
  useEffect(() => {
    if (activeDataset?.filePath) {
      setFilePathInput(activeDataset.filePath);
    } else {
      setFilePathInput("backend/sample_data/test_fixture.geojson");
    }
  }, [activeDataset?.id, activeDataset?.filePath]);

  const effectivePath =
    filePathInput.trim() !== ""
      ? filePathInput.trim()
      : activeDataset?.filePath || "backend/sample_data/test_fixture.geojson";

  const handleProfileDataset = async () => {
    if (!activeDataset) return;

    dispatch({
      type: "START_DATASET_PROFILING",
      payload: { datasetId: activeDataset.id },
    });

    try {
      const result = await profileDataset(effectivePath);
      dispatch({
        type: "DATASET_PROFILING_SUCCESS",
        payload: { datasetId: activeDataset.id, result },
      });
    } catch (err: unknown) {
      const message =
        err instanceof GisApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : "GIS Engine unavailable. Start the local FastAPI backend on port 8000.";

      dispatch({
        type: "DATASET_PROFILING_ERROR",
        payload: { datasetId: activeDataset.id, error: message },
      });
    }
  };

  const validateAndSelectFile = (file: File) => {
    const lowerName = file.name.toLowerCase();

    // Friendly explicit rejection of unsupported spatial formats
    if (
      lowerName.endsWith(".shp") ||
      lowerName.endsWith(".zip") ||
      lowerName.endsWith(".tif") ||
      lowerName.endsWith(".tiff")
    ) {
      setUploadError(
        "Shapefile (.shp/.zip) and GeoTIFF (.tif/.tiff) ingestion is not supported in Phase 4A. Please upload a GeoJSON (.geojson, .json) or coordinate-based CSV (.csv) file."
      );
      setSelectedFile(null);
      return;
    }

    const isGeoJson = lowerName.endsWith(".geojson") || lowerName.endsWith(".json");
    const isCsv = lowerName.endsWith(".csv");

    if (!isGeoJson && !isCsv) {
      setUploadError(
        "Unsupported file format. Please upload a GeoJSON (.geojson, .json) or CSV (.csv) file."
      );
      setSelectedFile(null);
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setUploadError(
        `File size exceeds 50 MB limit (${(file.size / 1024 / 1024).toFixed(1)} MB).`
      );
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setUploadError(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSelectFile(e.target.files[0]);
    }
  };

  const handleCloseModal = () => {
    if (uploading) return;
    setShowAddModal(false);
    setSelectedFile(null);
    setUploadError(null);
    setUploadStep("idle");
  };

  const handleImportAndProfile = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadError(null);
    setUploadStep("uploading");

    try {
      // 1. Upload file to backend /api/upload
      const uploadRes = await uploadDataset(selectedFile);

      // 2. Parse GeoJSON data or convert CSV in browser for interactive MapLibre display
      setUploadStep("rendering");
      let geoJsonData: unknown = null;
      const fileText = await selectedFile.text();
      const isCsv = selectedFile.name.toLowerCase().endsWith(".csv");

      if (isCsv) {
        geoJsonData = parseCsvToGeoJson(fileText);
      } else {
        try {
          geoJsonData = JSON.parse(fileText);
        } catch {
          geoJsonData = null;
        }
      }

      // 3. Immediately trigger deterministic profiling via /api/profile
      setUploadStep("profiling");
      const profileRes = await profileDataset(uploadRes.file_path);

      // 4. Construct dataset domain object
      const isReady = profileRes.readiness.status === "ready";
      const geomType = profileRes.primary_geometry_type || (isCsv ? "Point" : "Polygon");

      const newDataset: GeospatialDataset = {
        id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: selectedFile.name,
        format: isCsv ? "csv" : "geojson",
        status: isReady ? "ready" : "needs-review",
        isSample: false,
        sourceType: "user_upload",
        filePath: uploadRes.file_path,
        crs: profileRes.crs || "EPSG:4326",
        geometryType: (["Point", "Polygon", "MultiPolygon", "LineString", "Mixed"].includes(geomType)
          ? (geomType as "Point" | "Polygon" | "MultiPolygon" | "LineString" | "Mixed")
          : (isCsv ? "Point" : "Polygon")),
        featureCount: profileRes.feature_count,
        sizeBytes: uploadRes.size_bytes,
        boundingBox: profileRes.bounding_box || undefined,
        isLoadedOnMap: true,
        createdAt: new Date().toISOString(),
        description: `User-imported ${isCsv ? "CSV tabular" : "GeoJSON vector"} dataset (${uploadRes.filename}).`,
        attributes: profileRes.columns || [],
        profilingStatus: "success",
        profileResult: profileRes,
        profilingError: null,
        geoJsonData,
      };

      // 5. Dispatch REGISTER_IMPORTED_DATASET
      dispatch({
        type: "REGISTER_IMPORTED_DATASET",
        payload: newDataset,
      });

      // Close modal and reset state
      setShowAddModal(false);
      setSelectedFile(null);
      setUploadStep("idle");
    } catch (err: unknown) {
      const msg =
        err instanceof GisApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : "Failed to upload or profile dataset.";
      setUploadError(msg);
      setUploadStep("error");
    } finally {
      setUploading(false);
    }
  };

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
          id="add-dataset-btn"
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

                  {dataset.isSample ? (
                    <span className={styles.sampleBadge} title="Isolated temporary demo data">
                      Sample
                    </span>
                  ) : (
                    <span
                      style={{
                        background: "rgba(56, 189, 248, 0.15)",
                        color: "#38bdf8",
                        fontSize: "0.625rem",
                        padding: "0.1rem 0.35rem",
                        borderRadius: "3px",
                        fontWeight: 600,
                      }}
                      title="User uploaded dataset"
                    >
                      Uploaded
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

          {/* Profiler Action Bar */}
          <div className={styles.profilerSection}>
            <div className={styles.profilerHeaderRow}>
              <span className={styles.profilerTitle}>GIS Profiler (Backend)</span>
              {activeDataset.profilingStatus === "success" && (
                <span style={{ fontSize: "0.65rem", color: "#4ade80", fontWeight: 600 }}>✓ Verified</span>
              )}
            </div>

            <div className={styles.pathInputWrapper}>
              <label htmlFor="profiler-path-input" className={styles.pathInputLabel}>
                Local File Path (backend data area):
              </label>
              <input
                id="profiler-path-input"
                type="text"
                className={styles.pathInput}
                value={filePathInput}
                onChange={(e) => setFilePathInput(e.target.value)}
                placeholder="backend/sample_data/test_fixture.geojson"
                disabled={activeDataset.profilingStatus === "profiling"}
              />
            </div>

            {activeDataset.profilingStatus === "profiling" ? (
              <div className={styles.loadingState}>
                <span className={styles.spinner} aria-hidden="true" />
                <span>Profiling...</span>
              </div>
            ) : (
              <button
                type="button"
                className={styles.profileBtn}
                onClick={handleProfileDataset}
              >
                <span>⚡</span>
                <span>{activeDataset.profileResult ? "Re-Profile Dataset" : "Profile Dataset"}</span>
              </button>
            )}

            {activeDataset.profilingError && (
              <div className={styles.errorBanner} role="alert">
                <div className={styles.errorTitle}>
                  <span>⚠️ Profiling Error</span>
                </div>
                <div>{activeDataset.profilingError}</div>
                <button
                  type="button"
                  className={styles.retryBtn}
                  onClick={handleProfileDataset}
                >
                  Retry Profiling
                </button>
              </div>
            )}
          </div>

          {/* Structured Profiling Results View */}
          {activeDataset.profileResult ? (() => {
            const profile = activeDataset.profileResult;
            const geom = profile.geometry_validation || profile.geometry_validity || {
              valid: 0,
              invalid: 0,
              empty: 0,
              missing: 0,
              invalid_reasons: [],
            };
            const readiness = profile.readiness;
            const isReady = readiness.status === "ready";
            const isReview = readiness.status === "needs-review" || readiness.status === "needs_review";
            const geomType = profile.primary_geometry_type || profile.geometry_type || "Vector";
            const warnings = profile.warnings || readiness.warnings || [];

            return (
              <div className={styles.profileResultsContainer}>
                {/* Readiness Score Card */}
                <div className={styles.readinessCard}>
                  <div className={styles.readinessLeft}>
                    <span className={styles.readinessLabel}>Data Readiness Score</span>
                    <span className={styles.readinessScore}>
                      {readiness.score}
                      <small style={{ fontSize: "0.6875rem", color: "var(--text-muted)", fontWeight: 500 }}>/100</small>
                    </span>
                  </div>
                  <span
                    className={`${styles.readinessBadge} ${
                      isReady
                        ? styles.badgeReady
                        : isReview
                        ? styles.badgeReview
                        : styles.badgeNotReady
                    }`}
                  >
                    {isReady ? "Ready" : isReview ? "Needs Review" : "Not Ready"}
                  </span>
                </div>

                {/* Geometry Validity Grid */}
                <div className={styles.schemaSection}>
                  <span className={styles.detailLabel}>Geometry Validity Breakdown</span>
                  <div className={styles.geomValidityGrid}>
                    <div className={styles.geomStatItem}>
                      <span className={`${styles.geomStatVal} ${styles.geomStatValid}`}>
                        {geom.valid}
                      </span>
                      <span className={styles.geomStatLabel}>Valid</span>
                    </div>
                    <div className={styles.geomStatItem}>
                      <span className={`${styles.geomStatVal} ${styles.geomStatInvalid}`}>
                        {geom.invalid}
                      </span>
                      <span className={styles.geomStatLabel}>Invalid</span>
                    </div>
                    <div className={styles.geomStatItem}>
                      <span className={`${styles.geomStatVal} ${styles.geomStatEmpty}`}>
                        {geom.empty}
                      </span>
                      <span className={styles.geomStatLabel}>Empty</span>
                    </div>
                    <div className={styles.geomStatItem}>
                      <span className={`${styles.geomStatVal} ${styles.geomStatMissing}`}>
                        {geom.missing}
                      </span>
                      <span className={styles.geomStatLabel}>Missing</span>
                    </div>
                  </div>
                  {geom.invalid_reasons && geom.invalid_reasons.length > 0 && (
                    <div style={{ marginTop: "0.25rem", color: "#f87171", fontSize: "0.65rem" }}>
                      Reason: {geom.invalid_reasons.join(", ")}
                    </div>
                  )}
                </div>

                {/* Core Vector Specs */}
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Format</span>
                    <span className={styles.detailVal}>
                      {profile.detected_format.toUpperCase()}
                    </span>
                  </div>

                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Geometry Type</span>
                    <span className={styles.detailVal}>
                      {geomType}
                    </span>
                  </div>

                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Features</span>
                    <span className={styles.detailVal}>
                      {profile.feature_count.toLocaleString()}
                    </span>
                  </div>

                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>CRS</span>
                    <span className={styles.detailVal}>
                      {profile.crs || "unknown"}
                    </span>
                  </div>
                </div>

                {/* CRS Note if any */}
                {profile.crs_note && (
                  <div style={{ fontSize: "0.65rem", color: "#94a3b8", fontStyle: "italic" }}>
                    Note: {profile.crs_note}
                  </div>
                )}

                {/* Bounding Box */}
                {profile.bounding_box && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Bounding Box</span>
                    <span className={styles.detailVal} style={{ fontFamily: "monospace", fontSize: "0.6875rem" }}>
                      [{profile.bounding_box.map((n) => n.toFixed(4)).join(", ")}]
                    </span>
                  </div>
                )}

                {/* Attributes / Columns */}
                {profile.numeric_columns && profile.numeric_columns.length > 0 && (
                  <div className={styles.schemaSection}>
                    <span className={styles.detailLabel}>Numeric Columns</span>
                    <div className={styles.columnsChipRow}>
                      {profile.numeric_columns.map((col) => (
                        <span key={col} className={styles.numericChip}>
                          #{col}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {profile.text_columns && profile.text_columns.length > 0 && (
                  <div className={styles.schemaSection}>
                    <span className={styles.detailLabel}>Text / Categorical Columns</span>
                    <div className={styles.columnsChipRow}>
                      {profile.text_columns.map((col) => (
                        <span key={col} className={styles.textChip}>
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing Values breakdown */}
                {profile.missing_value_counts && Object.keys(profile.missing_value_counts).length > 0 && (
                  <div className={styles.schemaSection}>
                    <span className={styles.detailLabel}>Missing Values</span>
                    <div style={{ fontSize: "0.6875rem", color: "#cbd5e1" }}>
                      {Object.entries(profile.missing_value_counts).filter(([, c]) => c > 0).length === 0
                        ? "None (0 missing across all fields)"
                        : Object.entries(profile.missing_value_counts)
                            .filter(([, count]) => count > 0)
                            .map(([col, count]) => `${col}: ${count}`)
                            .join(", ")}
                    </div>
                  </div>
                )}

                {/* Warnings */}
                {warnings.length > 0 && (
                  <div className={styles.warningsBox}>
                    <span className={styles.warningHeader}>⚠️ Warnings</span>
                    {warnings.map((warn, i) => (
                      <span key={i} className={styles.warningItem}>
                        • {warn}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })() : (
            /* Fallback basic specs before profiling */
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
          )}

          {/* Attributes Schema Tag list if not yet profiled */}
          {!activeDataset.profileResult && activeDataset.attributes && activeDataset.attributes.length > 0 && (
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

      {/* Add Dataset Modal (Phase 4A Real Ingestion) */}
      {showAddModal && (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-dataset-dialog-title"
        >
          <div className={styles.modalContent}>
            <h3 id="add-dataset-dialog-title" className={styles.modalTitle}>
              Import Spatial Dataset
            </h3>
            <p className={styles.modalDesc}>
              Upload local GeoJSON (.geojson, .json) or coordinate-based CSV (.csv) vector files up to 50 MB. Files are stored securely and profiled deterministically.
            </p>

            {/* Error Banner */}
            {uploadError && (
              <div className={styles.modalErrorBanner} role="alert">
                <strong>Error:</strong> {uploadError}
              </div>
            )}

            {/* Ingestion & Progress States */}
            {uploading ? (
              <div className={styles.uploadProgressBox}>
                <span className={styles.spinner} aria-hidden="true" />
                <span>
                  {uploadStep === "uploading" && "Uploading dataset to secure backend..."}
                  {uploadStep === "rendering" && "Parsing vector geometries for map..."}
                  {uploadStep === "profiling" && "Running deterministic GIS profiler..."}
                  {uploadStep === "done" && "Dataset registered successfully!"}
                </span>
              </div>
            ) : selectedFile ? (
              /* Selected File Preview Card */
              <div className={styles.filePreviewCard}>
                <div className={styles.filePreviewLeft}>
                  <span style={{ fontSize: "1.25rem" }}>
                    {selectedFile.name.toLowerCase().endsWith(".csv") ? "📊" : "🌐"}
                  </span>
                  <div>
                    <div className={styles.filePreviewName} title={selectedFile.name}>
                      {selectedFile.name}
                    </div>
                    <div className={styles.filePreviewSize}>
                      {(selectedFile.size / 1024).toFixed(1)} KB •{" "}
                      {selectedFile.name.toLowerCase().endsWith(".csv") ? "CSV Table" : "GeoJSON Vector"}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.removeFileBtn}
                  onClick={() => setSelectedFile(null)}
                  title="Choose a different file"
                  aria-label="Remove selected file"
                >
                  ✕
                </button>
              </div>
            ) : (
              /* Interactive Drop Zone */
              <div
                className={`${styles.modalDropZone} ${isDragging ? styles.modalDropZoneActive : ""}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
              >
                <span className={styles.dropZoneIcon} aria-hidden="true">
                  📥
                </span>
                <span className={styles.dropZoneText}>
                  Drag &amp; drop your GIS vector file here
                </span>
                <span className={styles.dropZoneSubtext}>
                  Supports .geojson, .json, .csv (Max 50 MB)
                </span>
                <button
                  type="button"
                  className={styles.fileSelectBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  Select File from Device
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".geojson,.json,.csv"
                  onChange={handleFileInputChange}
                  style={{ display: "none" }}
                  id="spatial-file-upload-input"
                  aria-label="Upload GeoJSON or CSV file"
                />
              </div>
            )}

            {/* Modal Actions */}
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={handleCloseModal}
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.modalSubmitBtn}
                onClick={handleImportAndProfile}
                disabled={!selectedFile || uploading}
                id="submit-upload-btn"
              >
                {uploading ? (
                  <>
                    <span className={styles.spinner} aria-hidden="true" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <span>⚡</span>
                    <span>Import &amp; Profile</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

