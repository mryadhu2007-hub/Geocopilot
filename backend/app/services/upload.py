"""
Dataset Upload Service for GeoCopilot (Phase 4A)

Provides secure file ingestion for local vector datasets (.geojson, .json, .csv).
Enforces:
1. 50 MB file size limit
2. Strict directory confinement inside backend/uploads/
3. Filename sanitization preventing path traversal attacks
4. Pre-acceptance structural syntax validation
"""

import io
import json
import os
import re
import uuid
from pathlib import Path
from typing import Tuple
import pandas as pd

from backend.app.models.dataset import UploadResponse

# Root directory for uploaded datasets
BACKEND_ROOT = Path(__file__).resolve().parent.parent.parent
UPLOADS_DIR = (BACKEND_ROOT / "uploads").resolve()
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# 50 MB maximum development upload limit
MAX_UPLOAD_BYTES = 50 * 1024 * 1024

SUPPORTED_EXTENSIONS = {".geojson", ".json", ".csv"}
UNSUPPORTED_REJECTED = {
    ".shp": "Shapefiles are not supported in Phase 4A.",
    ".tif": "GeoTIFF raster datasets are not supported in Phase 4A.",
    ".tiff": "GeoTIFF raster datasets are not supported in Phase 4A.",
    ".zip": "Compressed archive uploads are not supported in Phase 4A.",
}


def sanitize_filename(original_filename: str) -> Tuple[str, str]:
    """
    Sanitizes the client-provided filename.
    Extracts base filename, removes path traversal characters, and verifies extension.
    Returns (safe_filename, detected_extension).
    """
    if not original_filename or not original_filename.strip():
        raise ValueError("Filename cannot be empty.")

    # Strip any directory components from client path
    base_name = Path(original_filename).name

    # Extract extension
    suffix = Path(base_name).suffix.lower()

    if suffix in UNSUPPORTED_REJECTED:
        raise ValueError(
            f"Unsupported format '{suffix}': {UNSUPPORTED_REJECTED[suffix]} "
            "Phase 4A strictly supports GeoJSON (.geojson, .json) and coordinate CSV (.csv)."
        )

    if suffix not in SUPPORTED_EXTENSIONS:
        raise ValueError(
            f"Unsupported file extension '{suffix}'. "
            "Supported formats: .geojson, .json, and .csv (max 50 MB)."
        )

    # Sanitize base stem
    stem = Path(base_name).stem
    clean_stem = re.sub(r"[^a-zA-Z0-9_\-]", "_", stem).strip("_")
    if not clean_stem:
        clean_stem = "dataset"

    # Generate unique collision-resistant filename
    unique_prefix = uuid.uuid4().hex[:8]
    safe_filename = f"{unique_prefix}_{clean_stem}{suffix}"

    return safe_filename, suffix


def validate_file_content(file_path: Path, suffix: str) -> str:
    """
    Validates that the saved file has valid structural syntax.
    Returns detected format ('geojson' or 'csv').
    Raises ValueError on syntax or structural failure.
    """
    if suffix in [".geojson", ".json"]:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
        except json.JSONDecodeError as err:
            raise ValueError(f"Malformed JSON/GeoJSON syntax at line {err.lineno}, column {err.colno}.")
        except UnicodeDecodeError:
            raise ValueError("File is not a valid UTF-8 text document.")

        if not isinstance(data, dict):
            raise ValueError("Invalid GeoJSON: Root element must be a JSON object.")

        geojson_type = data.get("type")
        valid_types = {
            "FeatureCollection",
            "Feature",
            "GeometryCollection",
            "Point",
            "MultiPoint",
            "LineString",
            "MultiLineString",
            "Polygon",
            "MultiPolygon",
        }
        if geojson_type not in valid_types:
            raise ValueError(
                f"Invalid GeoJSON: Root 'type' is '{geojson_type}'. "
                f"Expected one of: {', '.join(sorted(valid_types))}."
            )

        if geojson_type == "FeatureCollection" and not isinstance(data.get("features"), list):
            raise ValueError("Invalid GeoJSON FeatureCollection: 'features' property must be a list.")

        return "geojson"

    elif suffix == ".csv":
        try:
            df_head = pd.read_csv(file_path, nrows=5)
        except Exception as err:
            raise ValueError(f"Unreadable CSV file: {str(err)}")

        if df_head.empty and len(df_head.columns) == 0:
            raise ValueError("CSV dataset is empty and contains no readable columns.")

        return "csv"

    raise ValueError(f"Unsupported format extension '{suffix}'.")


def process_uploaded_bytes(original_filename: str, file_bytes: bytes) -> UploadResponse:
    """
    Validates, securely writes, and verifies uploaded file bytes.
    Enforces size limit, secure path confinement, and content validation.
    """
    # 1. Size check
    file_size = len(file_bytes)
    if file_size > MAX_UPLOAD_BYTES:
        raise ValueError(
            f"File size ({round(file_size / (1024 * 1024), 2)} MB) exceeds "
            f"the maximum allowed limit of 50 MB."
        )

    if file_size == 0:
        raise ValueError("Uploaded file is empty (0 bytes).")

    # 2. Filename check
    safe_filename, suffix = sanitize_filename(original_filename)

    # 3. Path confinement check
    target_path = (UPLOADS_DIR / safe_filename).resolve()
    if not target_path.is_relative_to(UPLOADS_DIR):
        raise ValueError("Security violation: Path escapes upload directory boundary.")

    # 4. Save file
    try:
        with open(target_path, "wb") as f:
            f.write(file_bytes)
    except Exception as err:
        raise IOError(f"Failed to write uploaded file to storage: {str(err)}")

    # 5. Content validation
    try:
        detected_format = validate_file_content(target_path, suffix)
    except Exception:
        # Clean up corrupted/invalid upload immediately
        if target_path.exists():
            try:
                target_path.unlink()
            except OSError:
                pass
        raise

    # Return standard relative path starting with backend/uploads/ for profiler
    relative_path = f"backend/uploads/{safe_filename}"

    return UploadResponse(
        filename=safe_filename,
        original_filename=Path(original_filename).name,
        file_path=relative_path,
        detected_format=detected_format,
        size_bytes=file_size,
        message="File uploaded and verified successfully.",
    )
