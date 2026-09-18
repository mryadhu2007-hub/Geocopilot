from pathlib import Path
from datetime import datetime, timezone
import json
from typing import Tuple, Optional, List, Dict

import pandas as pd
import geopandas as gpd
from shapely.geometry import Point

from backend.app.models.dataset import (
    DatasetProfileResponse,
    GeometryValidationSummary,
    DataReadinessScore,
)
from backend.app.services.geometry import validate_geometries

# Root directory for allowed sample data files
ALLOWED_SAMPLE_DIR = (Path(__file__).resolve().parent.parent.parent / "sample_data").resolve()


def resolve_and_validate_path(requested_path: str) -> Path:
    """
    Security check: Ensures the requested path exists and is strictly
    located within the allowed backend/sample_data directory.
    Rejects path traversal attacks (e.g. '../', absolute system paths).
    """
    path_obj = Path(requested_path)

    # If relative, resolve against ALLOWED_SAMPLE_DIR
    if not path_obj.is_absolute():
        resolved_path = (ALLOWED_SAMPLE_DIR / path_obj).resolve()
        # Alternatively, resolve against current working directory if pointing to backend/sample_data
        if not resolved_path.exists():
            resolved_cwd = (Path.cwd() / path_obj).resolve()
            if resolved_cwd.is_relative_to(ALLOWED_SAMPLE_DIR):
                resolved_path = resolved_cwd
    else:
        resolved_path = path_obj.resolve()

    # Enforce directory confinement
    if not resolved_path.is_relative_to(ALLOWED_SAMPLE_DIR):
        raise PermissionError(
            f"Access denied: Requested path is outside the allowed directory '{ALLOWED_SAMPLE_DIR}'."
        )

    if not resolved_path.exists():
        raise FileNotFoundError(f"File not found: '{requested_path}'")

    if not resolved_path.is_file():
        raise ValueError(f"Path is not a regular file: '{requested_path}'")

    return resolved_path


def detect_format(file_path: Path) -> str:
    """Detects file format and validates geospatial applicability."""
    suffix = file_path.suffix.lower()

    if suffix in [".geojson"]:
        return "geojson"

    if suffix in [".csv"]:
        return "csv"

    if suffix in [".json"]:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            if isinstance(data, dict) and data.get("type") in ["FeatureCollection", "Feature"]:
                return "geojson"
        except Exception:
            pass
        raise ValueError("JSON file does not contain a valid GeoJSON Feature or FeatureCollection.")

    raise ValueError(
        f"Unsupported file format '{suffix}'. Supported formats in Phase 3B: GeoJSON (.geojson, .json) and CSV (.csv)."
    )


def calculate_readiness_score(
    feature_count: int,
    crs_detected: bool,
    crs_str: Optional[str],
    geom_validation: GeometryValidationSummary,
    missing_value_counts: Dict[str, int],
    total_columns: int,
) -> DataReadinessScore:
    """
    Transparent, rule-based deterministic readiness assessment.
    Does not use AI.
    """
    reasons: List[str] = []
    warnings: List[str] = []

    if feature_count == 0:
        return DataReadinessScore(
            score=0.0,
            status="error",
            reasons=["Dataset contains 0 features/records."],
            warnings=["Empty dataset cannot be used in spatial analysis."],
        )

    score = 100.0

    # 1. CRS Checks
    if not crs_detected or not crs_str or crs_str.lower() == "unknown":
        score -= 25.0
        reasons.append("CRS is unknown or missing from dataset headers.")
        warnings.append("Coordinate Reference System (CRS) is undefined; reprojection and distance metrics require human review.")
    else:
        reasons.append(f"Valid CRS identified: {crs_str}.")

    # 2. Geometry Validity Checks
    if geom_validation.invalid > 0:
        penalty = min(35.0, geom_validation.invalid * 15.0)
        score -= penalty
        reasons.append(f"Detected {geom_validation.invalid} topologically invalid geometries.")
        warnings.append(f"{geom_validation.invalid} features failed topological validity checks (e.g. self-intersections).")

    if geom_validation.missing > 0 or geom_validation.empty > 0:
        missing_total = geom_validation.missing + geom_validation.empty
        penalty = min(25.0, missing_total * 10.0)
        score -= penalty
        reasons.append(f"Detected {missing_total} missing or empty geometries.")
        warnings.append(f"{missing_total} records have null or empty geometries and cannot be visualized.")

    # 3. Attribute Null Rate Checks
    high_null_cols = [
        col for col, count in missing_value_counts.items()
        if feature_count > 0 and (count / feature_count) > 0.4
    ]
    if high_null_cols:
        score -= min(15.0, len(high_null_cols) * 5.0)
        reasons.append(f"{len(high_null_cols)} attribute column(s) have >40% missing values.")
        warnings.append(f"High null rate in columns: {', '.join(high_null_cols[:3])}")

    # Clamping
    final_score = max(0.0, min(100.0, round(score, 1)))

    if final_score >= 80.0 and geom_validation.invalid == 0 and crs_detected:
        status = "ready"
        reasons.insert(0, "Dataset passed all automated structural, geometric, and CRS validation gates.")
    elif final_score >= 40.0:
        status = "needs-review"
        reasons.insert(0, "Dataset contains warnings or ambiguities requiring supervisor review.")
    else:
        status = "error"
        reasons.insert(0, "Dataset has critical geometry or schema defects.")

    return DataReadinessScore(
        score=final_score,
        status=status,
        reasons=reasons,
        warnings=warnings,
    )


def profile_dataset(file_path_str: str) -> DatasetProfileResponse:
    """
    Core deterministic profiling function.
    Inspects vector datasets (GeoJSON or CSV) and produces structured metadata.
    """
    resolved_path = resolve_and_validate_path(file_path_str)
    fmt = detect_format(resolved_path)
    dataset_name = resolved_path.name

    crs_str: Optional[str] = None
    crs_detected = False
    crs_note: Optional[str] = None

    if fmt == "geojson":
        gdf = gpd.read_file(resolved_path)

        if gdf.crs is not None:
            crs_str = gdf.crs.to_string()
            crs_detected = True
            crs_note = f"Explicit CRS detected from dataset metadata: {crs_str}"
        else:
            crs_str = "unknown"
            crs_detected = False
            crs_note = "CRS is not declared in dataset header or file metadata."

    elif fmt == "csv":
        df = pd.read_csv(resolved_path)

        # Coordinate column heuristic search
        lat_candidates = ["latitude", "lat", "y", "lat_dd", "point_y", "y_coord"]
        lon_candidates = ["longitude", "lon", "lng", "long", "x", "lon_dd", "point_x", "x_coord"]

        col_lower_map = {c.lower(): c for c in df.columns}
        lat_col = next((col_lower_map[c] for c in lat_candidates if c in col_lower_map), None)
        lon_col = next((col_lower_map[c] for c in lon_candidates if c in col_lower_map), None)

        if lat_col and lon_col:
            # Build geometries from coordinates
            valid_coords = df[lat_col].notna() & df[lon_col].notna()
            geometries = [
                Point(xy) if pd.notna(xy[0]) and pd.notna(xy[1]) else None
                for xy in zip(df[lon_col], df[lat_col])
            ]
            gdf = gpd.GeoDataFrame(df, geometry=geometries, crs="EPSG:4326")
            crs_str = "EPSG:4326"
            crs_detected = True
            crs_note = (
                f"Geographic coordinates detected from columns '{lat_col}' and '{lon_col}'. "
                f"Explicitly assigned standard WGS84 (EPSG:4326) semantic standard."
            )
        else:
            # Tabular dataset with no geometries
            gdf = gpd.GeoDataFrame(df, geometry=[None] * len(df))
            crs_str = "unknown"
            crs_detected = False
            crs_note = "No latitude/longitude coordinate columns detected in CSV."

    # Validate geometries
    geom_validation, geom_types, primary_geom_type = validate_geometries(gdf)

    # Feature count
    feature_count = len(gdf)

    # Bounding box calculation
    bounding_box: Optional[List[float]] = None
    if "geometry" in gdf.columns and geom_validation.valid > 0:
        valid_subset = gdf[gdf.geometry.notna() & ~gdf.geometry.is_empty & gdf.geometry.is_valid]
        if len(valid_subset) > 0:
            minx, miny, maxx, maxy = valid_subset.total_bounds
            bounding_box = [round(float(minx), 6), round(float(miny), 6), round(float(maxx), 6), round(float(maxy), 6)]

    # Attribute and Column profiling (excluding geometry)
    non_geom_cols = [c for c in gdf.columns if c != "geometry"]
    attribute_df = gdf[non_geom_cols]

    numeric_cols = attribute_df.select_dtypes(include=["number"]).columns.tolist()
    text_cols = attribute_df.select_dtypes(include=["object", "string"]).columns.tolist()
    datetime_cols = attribute_df.select_dtypes(include=["datetime"]).columns.tolist()

    missing_counts = {col: int(gdf[col].isna().sum()) for col in non_geom_cols}

    duplicate_rows = int(attribute_df.duplicated().sum()) if non_geom_cols else 0

    # Calculate readiness
    readiness = calculate_readiness_score(
        feature_count=feature_count,
        crs_detected=crs_detected,
        crs_str=crs_str,
        geom_validation=geom_validation,
        missing_value_counts=missing_counts,
        total_columns=len(non_geom_cols),
    )

    return DatasetProfileResponse(
        dataset_name=dataset_name,
        file_path=str(resolved_path),
        detected_format=fmt,
        primary_geometry_type=primary_geom_type,
        geometry_types=geom_types,
        feature_count=feature_count,
        crs=crs_str,
        crs_detected=crs_detected,
        crs_note=crs_note,
        bounding_box=bounding_box,
        columns=non_geom_cols,
        numeric_columns=numeric_cols,
        text_columns=text_cols,
        datetime_columns=datetime_cols,
        missing_value_counts=missing_counts,
        duplicate_row_count=duplicate_rows,
        geometry_validation=geom_validation,
        readiness=readiness,
        profiled_at=datetime.now(timezone.utc).isoformat(),
    )
