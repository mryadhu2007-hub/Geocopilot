from email.parser import BytesParser
from email.policy import default
from fastapi import APIRouter, HTTPException, Request, status
from backend.app.models.dataset import (
    HealthResponse,
    ProfileRequest,
    DatasetProfileResponse,
    UploadResponse,
)
from backend.app.services.profiler import profile_dataset
from backend.app.services.upload import process_uploaded_bytes

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


@router.post(
    "/api/upload",
    response_model=UploadResponse,
    summary="Upload and validate a local vector dataset",
    tags=["Upload"],
)
async def upload_dataset_endpoint(request: Request):
    """
    Accepts multipart/form-data upload of a local GIS file (.geojson, .json, .csv).
    Enforces 50 MB maximum size, generates collision-resistant server filename,
    confines storage strictly to backend/uploads/, and verifies syntax before accepting.
    """
    content_type = request.headers.get("content-type", "")
    if not content_type.startswith("multipart/form-data"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Content-Type must be 'multipart/form-data'.",
        )

    try:
        body = await request.body()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read upload payload: {str(e)}",
        )

    try:
        msg = BytesParser(policy=default).parsebytes(
            f"Content-Type: {content_type}\r\n\r\n".encode("utf-8") + body
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse multipart form data: {str(e)}",
        )

    file_part = None
    for part in msg.iter_parts():
        if part.get_filename():
            file_part = part
            break

    if not file_part:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file attached in multipart form data.",
        )

    original_filename = file_part.get_filename() or "dataset"
    file_bytes = file_part.get_payload(decode=True) or b""

    try:
        return process_uploaded_bytes(original_filename, file_bytes)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process and store dataset: {str(e)}",
        )

