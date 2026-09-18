/**
 * Dataset Module Interfaces
 *
 * Facilitates geospatial layer management and dataset selection
 * Connected between Member 3 (Map layers) and Member 4 (PostGIS data store)
 */

export type DatasetFormat = "geojson" | "geotiff" | "shapefile" | "csv" | "parquet";

export type DatasetStatus = "ready" | "profiling" | "needs-review" | "error";

export type DatasetSourceType = "sample" | "user_upload" | "remote_catalog";

export interface GeospatialDataset {
  id: string;
  name: string;
  format: DatasetFormat;
  status: DatasetStatus;
  isSample?: boolean;
  sourceType?: DatasetSourceType;
  crs?: string;
  geometryType?: "Point" | "Polygon" | "MultiPolygon" | "LineString" | "Raster" | "Table";
  featureCount?: number;
  sizeBytes?: number;
  boundingBox?: [number, number, number, number];
  isLoadedOnMap: boolean;
  createdAt: string;
  description?: string;
  attributes?: string[];
}

export interface DatasetComponentProps {
  datasets?: GeospatialDataset[];
  activeDatasetId?: string | null;
  onSelectDataset?: (id: string) => void;
  onToggleLayer?: (id: string) => void;
  onAddDatasetClick?: () => void;
}

