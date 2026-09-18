from fastapi import APIRouter, HTTPException, status
from backend.app.models.dataset import (
    HealthResponse,
    ProfileRequest,
    DatasetProfileResponse,
)
from backend.app.services.profiler import profile_dataset

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check endpoint",
    tags=["System"],
)
def health_check():
    """Returns engine health status and service identity."""
    return HealthResponse(
        status="ok",
        service="GeoCopilot GIS Engine",
        version="0.1.0",
    )


@router.get(
    "/",
    summary="Root metadata endpoint",
    tags=["System"],
)
def root_metadata():
    """Returns service information and documentation links."""
    return {
        "service": "GeoCopilot GIS Engine",
        "description": "Deterministic GIS processing and dataset profiling backend.",
        "version": "0.1.0",
        "health": "/health",
        "docs": "/docs",
    }


@router.post(
    "/api/profile",
    response_model=DatasetProfileResponse,
    summary="Profile a local vector dataset",
    tags=["Profiling"],
)
def profile_dataset_endpoint(payload: ProfileRequest):
    """
    Deterministically profiles a local geospatial dataset (GeoJSON or CSV).
    Inspects format, CRS, bounding box, attributes, missing values,
    geometry integrity, and computes a rule-based Data Readiness Score.
    
    Security: Access is strictly restricted to files within backend/sample_data.
    Path traversal or arbitrary filesystem access is rejected.
    """
    try:
        return profile_dataset(payload.file_path)
    except FileNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to profile geospatial dataset: {str(e)}",
        )
