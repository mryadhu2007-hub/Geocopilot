/**
 * Dataset Module Interfaces
 *
 * Facilitates geospatial layer management and dataset selection
 * Connected between Member 3 (Map layers) and Member 4 (PostGIS data store)
 */

export type DatasetFormat = "geojson" | "geotiff" | "shapefile" | "csv" | "parquet";

export interface GeospatialDataset {
  id: string;
  name: string;
  format: DatasetFormat;
  featureCount?: number;
  sizeBytes?: number;
  boundingBox?: [number, number, number, number];
  isLoadedOnMap: boolean;
  createdAt: string;
}

export interface DatasetComponentProps {
  datasets?: GeospatialDataset[];
  onSelectDataset?: (id: string) => void;
  onToggleLayer?: (id: string) => void;
}
