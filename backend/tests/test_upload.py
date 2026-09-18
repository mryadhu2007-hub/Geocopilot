"""
Unit tests for Dataset Upload Service (Phase 4A)
"""

import json
import os
import unittest
from pathlib import Path

from backend.app.services.upload import (
    process_uploaded_bytes,
    sanitize_filename,
    UPLOADS_DIR,
    MAX_UPLOAD_BYTES,
)
from backend.app.services.profiler import profile_dataset

SAMPLE_DATA_DIR = Path(__file__).resolve().parent.parent / "sample_data"


class TestDatasetUpload(unittest.TestCase):
    """Test suite covering dataset upload validation, security, and persistence."""

    def setUp(self):
        UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
        self.created_files = []

    def tearDown(self):
        # Clean up files created during testing
        for file_path in self.created_files:
            try:
                p = Path(file_path)
                if not p.is_absolute():
                    p = (Path.cwd() / file_path).resolve()
                if p.exists() and p.is_file():
                    p.unlink()
            except OSError:
                pass

    def test_valid_geojson_upload(self):
        """Test uploading a valid GeoJSON file from sample fixture."""
        fixture_path = SAMPLE_DATA_DIR / "test_fixture.geojson"
        with open(fixture_path, "rb") as f:
            content = f.read()

        response = process_uploaded_bytes("my_vellore_parcels.geojson", content)
        self.created_files.append(response.file_path)

        self.assertEqual(response.detected_format, "geojson")
        self.assertEqual(response.original_filename, "my_vellore_parcels.geojson")
        self.assertTrue(response.filename.endswith(".geojson"))
        self.assertGreater(response.size_bytes, 0)
        self.assertTrue(response.file_path.startswith("backend/uploads/"))

        # Verify saved file exists inside UPLOADS_DIR
        saved_path = UPLOADS_DIR / response.filename
        self.assertTrue(saved_path.exists())

        # Verify the uploaded file can be profiled immediately
        profile = profile_dataset(response.file_path)
        self.assertEqual(profile.detected_format, "geojson")
        self.assertEqual(profile.feature_count, 4)
        self.assertEqual(profile.readiness.status, "ready")

    def test_valid_csv_upload(self):
        """Test uploading a valid CSV file with lat/lon coordinates."""
        fixture_path = SAMPLE_DATA_DIR / "test_fixture.csv"
        with open(fixture_path, "rb") as f:
            content = f.read()

        response = process_uploaded_bytes("sensor_stations.csv", content)
        self.created_files.append(response.file_path)

        self.assertEqual(response.detected_format, "csv")
        self.assertTrue(response.filename.endswith(".csv"))

        # Verify the uploaded CSV can be profiled immediately
        profile = profile_dataset(response.file_path)
        self.assertEqual(profile.detected_format, "csv")
        self.assertEqual(profile.feature_count, 4)
        self.assertEqual(profile.crs, "EPSG:4326")

    def test_unsupported_extensions_rejected(self):
        """Test that .shp, .tif, .zip, and executable files are rejected with informative errors."""
        unsupported = [
            ("parcels.shp", b"dummy shapefile content"),
            ("elevation.tif", b"dummy geotiff content"),
            ("satellite.tiff", b"dummy tiff content"),
            ("archive.zip", b"PK\x03\x04dummy zip"),
            ("malicious.exe", b"MZ\x90\x00executable"),
            ("notes.txt", b"plain text"),
        ]

        for filename, content in unsupported:
            with self.subTest(filename=filename):
                with self.assertRaises(ValueError) as ctx:
                    process_uploaded_bytes(filename, content)
                self.assertIn("Unsupported", str(ctx.exception))

    def test_malformed_geojson_rejected(self):
        """Test that invalid JSON syntax or broken GeoJSON structure is rejected."""
        malformed_cases = [
            ("broken_syntax.geojson", b"{\"type\": \"FeatureCollection\", features: ["),
            ("non_object.geojson", b"[\"not\", \"an\", \"object\"]"),
            ("invalid_type.geojson", b"{\"type\": \"InvalidGeoType\", \"features\": []}"),
            ("missing_features.geojson", b"{\"type\": \"FeatureCollection\"}"),
        ]

        for filename, content in malformed_cases:
            with self.subTest(filename=filename):
                with self.assertRaises(ValueError) as ctx:
                    process_uploaded_bytes(filename, content)
                # Confirm target file was cleaned up and does not linger
                self.assertFalse((UPLOADS_DIR / filename).exists())

    def test_oversized_file_rejected(self):
        """Test that files exceeding 50 MB are rejected."""
        # Simulate oversized payload
        fake_large_size = MAX_UPLOAD_BYTES + 1024
        # We don't allocate 50MB in memory; test sanitize_filename and mock size
        with self.assertRaises(ValueError) as ctx:
            # Pass oversized dummy byte string (mocked by size assertion logic)
            process_uploaded_bytes("huge.geojson", b"x" * (MAX_UPLOAD_BYTES + 10))
        self.assertIn("exceeds the maximum allowed limit of 50 MB", str(ctx.exception))

    def test_safe_filename_handling_and_path_traversal(self):
        """Test that path traversal attempts in filename cannot escape backend/uploads/."""
        traversal_filenames = [
            "../../../etc/passwd.geojson",
            "..\\..\\windows\\system32\\evil.geojson",
            "/absolute/root/path.geojson",
            "C:\\Users\\Admin\\secret.geojson",
            "test;rm -rf.geojson",
        ]

        valid_geojson_content = json.dumps({
            "type": "FeatureCollection",
            "features": []
        }).encode("utf-8")

        for malicious_name in traversal_filenames:
            with self.subTest(name=malicious_name):
                safe_name, suffix = sanitize_filename(malicious_name)
                # Confirm no path separators exist in safe_name
                self.assertNotIn("/", safe_name)
                self.assertNotIn("\\", safe_name)
                self.assertNotIn("..", safe_name)
                self.assertEqual(suffix, ".geojson")

                # Confirm destination remains strictly inside UPLOADS_DIR
                dest = (UPLOADS_DIR / safe_name).resolve()
                self.assertTrue(dest.is_relative_to(UPLOADS_DIR))

    def test_empty_file_rejected(self):
        """Test that empty file (0 bytes) is rejected."""
        with self.assertRaises(ValueError) as ctx:
            process_uploaded_bytes("empty.geojson", b"")
        self.assertIn("empty (0 bytes)", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
