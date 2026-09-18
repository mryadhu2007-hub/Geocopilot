import unittest
from fastapi import HTTPException
from backend.app.services.profiler import profile_dataset, resolve_and_validate_path
from backend.app.api.routes import profile_dataset_endpoint
from backend.app.models.dataset import ProfileRequest, DatasetProfileResponse


class TestDatasetProfiler(unittest.TestCase):
    """Thorough tests for deterministic geospatial profiling, validation, and security."""

    def test_geojson_profiling_detects_metadata(self):
        """B. Verify GeoJSON profiling detects format, geometry types, feature count, CRS, and attributes."""
        response: DatasetProfileResponse = profile_dataset_endpoint(
            ProfileRequest(file_path="test_fixture.geojson")
        )

        self.assertEqual(response.dataset_name, "test_fixture.geojson")
        self.assertEqual(response.detected_format, "geojson")
        self.assertEqual(response.feature_count, 4)
        self.assertTrue(response.crs_detected)
        self.assertIsNotNone(response.crs)
        self.assertIn("Point", response.geometry_types)
        self.assertIn("Polygon", response.geometry_types)

        # Bounding box presence
        self.assertIsNotNone(response.bounding_box)
        self.assertEqual(len(response.bounding_box), 4)

        # Column attributes
        self.assertIn("name", response.columns)
        self.assertIn("zone_code", response.columns)
        self.assertIn("assessed_value", response.numeric_columns)
        self.assertIn("name", response.text_columns)

        # Geometry validation
        self.assertEqual(response.geometry_validation.valid, 4)
        self.assertEqual(response.geometry_validation.invalid, 0)
        self.assertEqual(response.geometry_validation.empty, 0)
        self.assertEqual(response.geometry_validation.missing, 0)

        # Readiness score
        self.assertEqual(response.readiness.status, "ready")
        self.assertGreaterEqual(response.readiness.score, 80.0)

    def test_csv_profiling_detects_coordinates(self):
        """Verify CSV profiling detects latitude and longitude and assigns EPSG:4326."""
        response: DatasetProfileResponse = profile_dataset_endpoint(
            ProfileRequest(file_path="test_fixture.csv")
        )

        self.assertEqual(response.detected_format, "csv")
        self.assertEqual(response.feature_count, 4)
        self.assertTrue(response.crs_detected)
        self.assertEqual(response.crs, "EPSG:4326")
        self.assertIn("Point", response.geometry_types)
        self.assertEqual(response.geometry_validation.valid, 4)
        self.assertIn("latitude", response.columns)
        self.assertIn("longitude", response.columns)

    def test_invalid_and_missing_geometry_counts(self):
        """C. Verify invalid, empty, and missing geometry counts are handled."""
        response: DatasetProfileResponse = profile_dataset_endpoint(
            ProfileRequest(file_path="invalid_geom_fixture.geojson")
        )

        self.assertEqual(response.feature_count, 3)
        self.assertEqual(response.geometry_validation.valid, 1)
        self.assertEqual(response.geometry_validation.invalid, 1)
        self.assertEqual(response.geometry_validation.missing, 1)

        # Reasons should list topological defects
        self.assertGreater(len(response.geometry_validation.invalid_reasons), 0)
        self.assertIn("Self-intersection", response.geometry_validation.invalid_reasons[0])

        # Readiness score should be penalized for invalid geometries
        self.assertNotEqual(response.readiness.status, "ready")
        self.assertLess(response.readiness.score, 80.0)

    def test_readiness_score_is_deterministic(self):
        """D. Verify readiness score calculation produces identical results across multiple calls."""
        res1 = profile_dataset_endpoint(ProfileRequest(file_path="test_fixture.geojson"))
        res2 = profile_dataset_endpoint(ProfileRequest(file_path="test_fixture.geojson"))

        self.assertEqual(res1.readiness.score, res2.readiness.score)
        self.assertEqual(res1.readiness.status, res2.readiness.status)
        self.assertEqual(res1.readiness.reasons, res2.readiness.reasons)

    def test_security_path_traversal_is_rejected(self):
        """E. Verify path traversal outside the allowed data directory is rejected with HTTP 403."""
        # Attempt to access root or parent directories outside backend/sample_data
        traversal_attempts = [
            "../../package.json",
            "../main.py",
            "C:/Windows/System32/drivers/etc/hosts",
            "/etc/passwd",
        ]

        for bad_path in traversal_attempts:
            with self.assertRaises(HTTPException) as cm:
                profile_dataset_endpoint(ProfileRequest(file_path=bad_path))
            self.assertEqual(cm.exception.status_code, 403, f"Failed to reject traversal path: {bad_path}")

    def test_nonexistent_file_returns_404(self):
        """Verify non-existent file inside sample directory returns HTTP 404."""
        with self.assertRaises(HTTPException) as cm:
            profile_dataset_endpoint(ProfileRequest(file_path="does_not_exist.geojson"))
        self.assertEqual(cm.exception.status_code, 404)


if __name__ == "__main__":
    unittest.main()
