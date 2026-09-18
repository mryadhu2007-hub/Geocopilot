/**
 * Dataset Module Interfaces
 *
 * Facilitates geospatial layer management and dataset selection
 * Connected between Member 3 (Map layers) and Member 4 (PostGIS data store)
 */

export type DatasetFormat = "geojson" | "geotiff" | "shapefile" | "csv" | "parquet";

export type DatasetStatus = "ready" | "profiling" | "needs-review" | "error";

export type DatasetSourceType = "sample" | "user_upload" | "remote_catalog";

export interface GeometryValiditySummary {
  valid: number;
  invalid: number;
  empty: number;
  missing: number;
  total?: number;
  invalid_reasons: string[];
}

export type GeometryValidationSummary = GeometryValiditySummary;

export interface DataReadinessResult {
  score: number;
  status: "ready" | "needs-review" | "needs_review" | "error" | "not_ready";
  reasons: string[];
  warnings: string[];
}

export interface DatasetProfileResult {
  dataset_name: string;
  file_path: string;
  detected_format: string;
  primary_geometry_type?: string;
  geometry_type?: string;
  geometry_types?: string[];
  feature_count: number;
  crs: string | null;
  crs_detected?: boolean;
  crs_note?: string | null;
  bounding_box: [number, number, number, number] | null;
  columns?: string[];
  attribute_names?: string[];
  numeric_columns: string[];
  text_columns: string[];
  datetime_columns?: string[];
  missing_value_counts: Record<string, number>;
  duplicate_row_count: number;
  geometry_validation?: GeometryValidationSummary;
  geometry_validity?: GeometryValidationSummary;
  readiness: DataReadinessResult;
  profiled_at?: string;
  warnings: string[];
}

export interface GeospatialDataset {
  id: string;
  name: string;
  format: DatasetFormat;
  status: DatasetStatus;
  isSample?: boolean;
  sourceType?: DatasetSourceType;
  filePath?: string;
  crs?: string;
  geometryType?: "Point" | "Polygon" | "MultiPolygon" | "LineString" | "Raster" | "Table" | "Mixed";
  featureCount?: number;
  sizeBytes?: number;
  boundingBox?: [number, number, number, number];
  isLoadedOnMap: boolean;
  createdAt: string;
  description?: string;
  attributes?: string[];

  // Deterministic GIS Profiling states
  profilingStatus?: "idle" | "profiling" | "success" | "error";
  profileResult?: DatasetProfileResult | null;
  profilingError?: string | null;

  // Ingested GeoJSON representation for MapLibre rendering
  geoJsonData?: unknown;
}

export interface UploadResponse {
  filename: string;
  original_filename: string;
  file_path: string;
  detected_format: "geojson" | "csv";
  size_bytes: number;
  message: string;
}

export interface DatasetComponentProps {
  datasets?: GeospatialDataset[];
  activeDatasetId?: string | null;
  onSelectDataset?: (id: string) => void;
  onToggleLayer?: (id: string) => void;
  onAddDatasetClick?: () => void;
}

