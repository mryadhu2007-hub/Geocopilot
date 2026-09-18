/**
 * GIS Engine Backend Client Service
 *
 * Provides typed HTTP communication with the Python FastAPI GIS backend.
 * Default URL: http://localhost:8000 (configurable via NEXT_PUBLIC_GIS_API_URL).
 */

import type { DatasetProfileResult } from "@/modules/data/types";

// Base API URL with fallback
export const GIS_API_BASE_URL =
  process.env.NEXT_PUBLIC_GIS_API_URL || "http://localhost:8000";

export interface HealthResponse {
  status: string;
  service: string;
  version?: string;
}

export interface ProfileRequest {
  file_path: string;
}

export class GisApiError extends Error {
  statusCode?: number;
  isBackendUnavailable: boolean;

  constructor(message: string, statusCode?: number, isBackendUnavailable = false) {
    super(message);
    this.name = "GisApiError";
    this.statusCode = statusCode;
    this.isBackendUnavailable = isBackendUnavailable;
  }
}

/**
 * Checks connectivity and health of the Python GIS Engine.
 */
export async function checkGisHealth(): Promise<HealthResponse> {
  try {
    const res = await fetch(`${GIS_API_BASE_URL}/health`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new GisApiError(
        `GIS Engine returned status ${res.status}`,
        res.status
      );
    }

    return await res.json();
  } catch (err: unknown) {
    if (err instanceof GisApiError) throw err;
    throw new GisApiError(
      "GIS Engine unavailable. Start the local FastAPI backend on port 8000.",
      undefined,
      true
    );
  }
}

/**
 * Deterministically profiles a local vector dataset via POST /api/profile.
 */
export async function profileDataset(filePath: string): Promise<DatasetProfileResult> {
  try {
    const res = await fetch(`${GIS_API_BASE_URL}/api/profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ file_path: filePath }),
    });

    if (!res.ok) {
      let detailMsg = `Profiling failed with status ${res.status}`;
      try {
        const errorJson = await res.json();
        if (errorJson.detail) {
          detailMsg = typeof errorJson.detail === "string" ? errorJson.detail : JSON.stringify(errorJson.detail);
        }
      } catch {
        // use default detail message
      }
      throw new GisApiError(detailMsg, res.status);
    }

    const rawData = await res.json();
    const geomValidation = rawData.geometry_validation || rawData.geometry_validity || {
      valid: 0,
      invalid: 0,
      empty: 0,
      missing: 0,
      invalid_reasons: [],
    };
    const data: DatasetProfileResult = {
      ...rawData,
      geometry_validation: geomValidation,
      geometry_validity: geomValidation,
      geometry_type: rawData.primary_geometry_type || rawData.geometry_type || "Vector",
      attribute_names: rawData.columns || rawData.attribute_names || [],
      warnings: rawData.warnings || rawData.readiness?.warnings || [],
    };
    return data;
  } catch (err: unknown) {
    if (err instanceof GisApiError) throw err;

    // Check if network fetch error (e.g. Failed to fetch / connection refused)
    throw new GisApiError(
      "GIS Engine unavailable. Start the local FastAPI backend on port 8000.",
      undefined,
      true
    );
  }
}

export interface UploadResponse {
  filename: string;
  original_filename: string;
  file_path: string;
  detected_format: "geojson" | "csv";
  size_bytes: number;
  message: string;
}

/**
 * Uploads a local vector dataset (.geojson, .json, .csv) to the Python GIS backend.
 */
export async function uploadDataset(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file, file.name);

  try {
    const res = await fetch(`${GIS_API_BASE_URL}/api/upload`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      let detailMsg = `Upload failed with status ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson.detail) {
          detailMsg = typeof errJson.detail === "string" ? errJson.detail : JSON.stringify(errJson.detail);
        }
      } catch {
        // default message
      }
      throw new GisApiError(detailMsg, res.status);
    }

    return await res.json();
  } catch (err: unknown) {
    if (err instanceof GisApiError) throw err;
    throw new GisApiError(
      "GIS Engine unavailable. Start the local FastAPI backend on port 8000.",
      undefined,
      true
    );
  }
}
