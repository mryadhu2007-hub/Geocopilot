# GeoCopilot — Deterministic Python GIS Backend

The GeoCopilot backend provides deterministic geospatial dataset profiling, CRS inspection, topological geometry validation, and readiness scoring. It serves as the authoritative GIS engine while the Next.js frontend handles human-in-the-loop interaction and visualization.

---

## 🚀 Quickstart

### 1. Requirements

Verify that Python 3.10+ and the core GIS packages are available:

```bash
python -c "import geopandas, shapely, pyproj, fastapi, uvicorn; print('GIS environment OK')"
```

Or install from `requirements.txt`:

```bash
pip install -r requirements.txt
```

### 2. Start the Development Server

From the project root:

```bash
python -m uvicorn backend.app.main:app --reload --port 8000
```

Or from the `backend/` directory:

```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

- **Base URL**: `http://localhost:8000`
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)
- **Interactive OpenAPI Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Alternative ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 📡 API Endpoints

### `GET /health`
Returns system heartbeat and engine identity.

**Sample Response:**
```json
{
  "status": "ok",
  "service": "GeoCopilot GIS Engine",
  "version": "0.1.0"
}
```

---

### `POST /api/profile`
Profiles a local geospatial vector dataset and outputs structured metadata, topological validation, and readiness scores.

**Request Body:**
```json
{
  "file_path": "test_fixture.geojson"
}
```
*(Accepts paths relative to `backend/sample_data` or within the sample repository).*

**Sample Response:**
```json
{
  "dataset_name": "test_fixture.geojson",
  "file_path": "C:\\...\\backend\\sample_data\\test_fixture.geojson",
  "detected_format": "geojson",
  "primary_geometry_type": "Mixed (Point, Polygon)",
  "geometry_types": ["Point", "Polygon"],
  "feature_count": 4,
  "crs": "OGC:CRS84",
  "crs_detected": true,
  "crs_note": "Explicit CRS detected from dataset metadata: OGC:CRS84",
  "bounding_box": [79.092, 12.905, 79.175, 12.9734],
  "columns": ["name", "zone_code", "assessed_value", "is_residential", "notes"],
  "numeric_columns": ["assessed_value"],
  "text_columns": ["name", "zone_code", "notes"],
  "missing_value_counts": {
    "name": 0,
    "zone_code": 0,
    "assessed_value": 1,
    "is_residential": 0,
    "notes": 0
  },
  "duplicate_row_count": 0,
  "geometry_validation": {
    "valid": 4,
    "invalid": 0,
    "empty": 0,
    "missing": 0,
    "total": 4,
    "invalid_reasons": []
  },
  "readiness": {
    "score": 100.0,
    "status": "ready",
    "reasons": [
      "Dataset passed all automated structural, geometric, and CRS validation gates.",
      "Valid CRS identified: OGC:CRS84."
    ],
    "warnings": []
  },
  "profiled_at": "2026-09-18T18:15:00.000000+00:00"
}
```

---

## 🔒 Security: Path Confinement

The profiler strictly enforces that requested file paths resolve inside `backend/sample_data/`. Path traversal attempts (e.g., `../../package.json`, absolute root drives, system directories) are rejected immediately with **HTTP 403 Forbidden**.

---

## 📐 Deterministic Data Readiness Score Rules

The readiness score is calculated transparently using an objective deduction rubric:

| Rule Check | Score Adjustment | Note |
| :--- | :--- | :--- |
| **Base Score** | `100.0` | Pristine dataset starting baseline |
| **Missing / Unknown CRS** | `-25.0` | CRS missing or undeclared; warning issued |
| **Invalid Geometries** | `-15.0` per invalid feature (max `-35.0`) | Self-intersections, bowties, open rings |
| **Missing / Empty Geometries** | `-10.0` per missing feature (max `-25.0`) | Null geometry records |
| **High Attribute Null Rate** | `-5.0` per column with >40% nulls (max `-15.0`) | Sparsely populated attributes |
| **Empty Dataset (0 features)** | Score set to `0.0` | Empty dataset cannot proceed |

**Readiness Status Bands:**
- `ready`: Score ≥ 80.0, 0 invalid geometries, and CRS detected.
- `needs-review`: Score between 40.0 and 79.9, or missing CRS requiring supervisor confirmation.
- `error`: Score < 40.0, or 0 features.

---

## 🧪 Running Automated Tests

Run the test suite via Python's standard library `unittest`:

```bash
python -m unittest discover backend/tests
```

Or via `pytest` (if installed in your environment):

```bash
python -m pytest backend/tests
```
