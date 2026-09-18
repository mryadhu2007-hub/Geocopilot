from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any


class GeometryValidationSummary(BaseModel):
    """Counts and reasons for geometry integrity inspection."""
    valid: int = Field(..., description="Count of topologically valid geometries")
    invalid: int = Field(..., description="Count of invalid geometries (e.g. self-intersections)")
    empty: int = Field(..., description="Count of empty geometries")
    missing: int = Field(..., description="Count of records with null or missing geometry")
    total: int = Field(..., description="Total geometry evaluations conducted")
    invalid_reasons: List[str] = Field(default_factory=list, description="Topological invalidity diagnostic explanations")


class DataReadinessScore(BaseModel):
    """Deterministic rule-based evaluation of dataset readiness for GIS workflows."""
    score: float = Field(..., description="Readiness score on a 0-100 scale")
    status: str = Field(..., description="Readiness status: 'ready', 'needs-review', or 'error'")
    reasons: List[str] = Field(default_factory=list, description="Key factors determining the readiness score")
    warnings: List[str] = Field(default_factory=list, description="Actionable warnings for potential GIS incompatibilities")


class DatasetProfileResponse(BaseModel):
    """Structured JSON-serializable dataset profiling output."""
    dataset_name: str
    file_path: str
    detected_format: str
    primary_geometry_type: str
    geometry_types: List[str]
    feature_count: int
    crs: Optional[str] = None
    crs_detected: bool
    crs_note: Optional[str] = None
    bounding_box: Optional[List[float]] = None  # [minx, miny, maxx, maxy]
    columns: List[str]
    numeric_columns: List[str]
    text_columns: List[str]
    datetime_columns: List[str] = Field(default_factory=list)
    missing_value_counts: Dict[str, int]
    duplicate_row_count: int
    geometry_validation: GeometryValidationSummary
    readiness: DataReadinessScore
    warnings: List[str] = Field(default_factory=list)
    profiled_at: str


class ProfileRequest(BaseModel):
    """Request payload to profile a local file path inside the allowed data repository."""
    file_path: str = Field(..., description="Relative or absolute path inside allowed sample/data directory")


class HealthResponse(BaseModel):
    """Health check response contract."""
    status: str = "ok"
    service: str = "GeoCopilot GIS Engine"
    version: str = "0.1.0"


class UploadResponse(BaseModel):
    """Metadata returned upon successful local dataset upload."""
    filename: str = Field(..., description="Sanitized unique file name in backend/uploads/")
    original_filename: str = Field(..., description="Original client-supplied file name")
    file_path: str = Field(..., description="Relative file path for immediate profiling")
    detected_format: str = Field(..., description="Detected format: 'geojson' or 'csv'")
    size_bytes: int = Field(..., description="Uploaded file size in bytes")
    message: str = "File uploaded and verified successfully."
