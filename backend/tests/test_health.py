import unittest
from backend.app.api.routes import health_check, root_metadata
from backend.app.models.dataset import HealthResponse


class TestHealthEndpoints(unittest.TestCase):
    """Tests for the /health and root metadata endpoints."""

    def test_health_check_returns_ok(self):
        response: HealthResponse = health_check()
        self.assertEqual(response.status, "ok")
        self.assertEqual(response.service, "GeoCopilot GIS Engine")
        self.assertEqual(response.version, "0.1.0")

    def test_root_metadata_contains_docs_and_health(self):
        meta = root_metadata()
        self.assertIn("service", meta)
        self.assertIn("health", meta)
        self.assertIn("docs", meta)
        self.assertEqual(meta["service"], "GeoCopilot GIS Engine")


if __name__ == "__main__":
    unittest.main()
