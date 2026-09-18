import type { WorkspaceState } from "./types";
import type { GeospatialDataset } from "@/modules/data/types";
import type { WorkflowGraph } from "@/modules/workflow/types";

/**
 * Seed datasets explicitly marked as Sample / Demo datasets for development.
 * These are isolated and explicitly labeled to prevent confusing them with verified data.
 */
export const SAMPLE_DATASETS: GeospatialDataset[] = [
  {
    id: "sample-parcels-01",
    name: "Sample Dataset: Metro Urban Parcels (Demo)",
    format: "geojson",
    status: "ready",
    isSample: true,
    sourceType: "sample",
    crs: "EPSG:4326",
    geometryType: "Polygon",
    featureCount: 1420,
    sizeBytes: 2450000,
    boundingBox: [-122.48, 37.72, -122.36, 37.81],
    isLoadedOnMap: true,
    createdAt: "2026-09-18T10:00:00Z",
    description: "Synthesized cadastral parcel boundaries for urban density and zoning analysis.",
    attributes: ["parcel_id", "zoning_code", "assessed_val", "impervious_pct", "geom"],
  },
  {
    id: "sample-flood-02",
    name: "Sample Dataset: 100-Year Flood Hazard Zones (Demo)",
    format: "geojson",
    status: "needs-review",
    isSample: true,
    sourceType: "sample",
    crs: "EPSG:3857", // Purposeful CRS difference to trigger harmonization review
    geometryType: "MultiPolygon",
    featureCount: 86,
    sizeBytes: 980000,
    boundingBox: [-122.51, 37.70, -122.35, 37.83],
    isLoadedOnMap: true,
    createdAt: "2026-09-18T10:15:00Z",
    description: "Synthesized FEMA 100-year inundation risk zones. Requires CRS reprojection check.",
    attributes: ["zone_code", "risk_level", "base_flood_elev", "geom"],
  },
  {
    id: "sample-contours-03",
    name: "Sample Dataset: Coastal Elevation Contours (Demo)",
    format: "geojson",
    status: "ready",
    isSample: true,
    sourceType: "sample",
    crs: "EPSG:4326",
    geometryType: "LineString",
    featureCount: 520,
    sizeBytes: 1340000,
    boundingBox: [-122.52, 37.71, -122.37, 37.82],
    isLoadedOnMap: false,
    createdAt: "2026-09-18T10:30:00Z",
    description: "Synthetic topographic contour vectors at 5-meter vertical intervals.",
    attributes: ["contour_id", "elevation_m", "geom"],
  },
];

/**
 * Baseline 6-Stage Empty Workflow Graph
 */
export const INITIAL_EMPTY_WORKFLOW: WorkflowGraph = {
  id: "wf-initial",
  title: "Awaiting Geospatial Analysis Objective",
  state: "idle",
  status: "draft",
  nodes: [
    {
      id: "node-1",
      type: "intent_definition",
      label: "1. Objective Definition",
      stage: "intent",
      position: { x: 50, y: 50 },
      status: "idle",
      description: "Define natural language spatial question or analytical query.",
    },
    {
      id: "node-2",
      type: "dataset_input",
      label: "2. Data Profiling",
      stage: "data",
      position: { x: 250, y: 50 },
      status: "idle",
      description: "Inspect schema, geometry integrity, CRS, and feature bounds.",
    },
    {
      id: "node-3",
      type: "harmonize_crs",
      label: "3. CRS Harmonization",
      stage: "harmonize",
      position: { x: 450, y: 50 },
      status: "idle",
      description: "Align projections (e.g., EPSG:3857 to EPSG:4326) and unit scales.",
    },
    {
      id: "node-4",
      type: "human_approval_gate",
      label: "4. Human Review Gate",
      stage: "review",
      position: { x: 650, y: 50 },
      status: "idle",
      description: "Supervise ambiguous thresholds, buffer distances, and cost tradeoffs.",
    },
    {
      id: "node-5",
      type: "execute_spatial_op",
      label: "5. GIS Computation",
      stage: "execute",
      position: { x: 850, y: 50 },
      status: "idle",
      description: "Deterministic spatial operations executed via reproducible engine.",
    },
    {
      id: "node-6",
      type: "validate_results",
      label: "6. Provenance & Validation",
      stage: "validate",
      position: { x: 1050, y: 50 },
      status: "idle",
      description: "Validate topology, summarize impact metrics, and record audit log.",
    },
  ],
  edges: [
    { id: "e1-2", source: "node-1", target: "node-2", label: "profile" },
    { id: "e2-3", source: "node-2", target: "node-3", label: "align" },
    { id: "e3-4", source: "node-3", target: "node-4", label: "gate" },
    { id: "e4-5", source: "node-4", target: "node-5", label: "execute" },
    { id: "e5-6", source: "node-5", target: "node-6", label: "record" },
  ],
};

/**
 * Initial clean workspace state (State A: Empty Workspace)
 */
export const initialWorkspaceState: WorkspaceState = {
  project: {
    id: "proj-demo-01",
    name: "Urban Flood Exposure & Zoning Assessment",
    description: "Human-in-the-loop spatial analysis workspace for flood risk prioritization.",
    lastSaved: "2026-09-18T10:35:00Z",
  },
  mode: "empty",
  datasets: SAMPLE_DATASETS,
  activeDatasetId: null,
  map: {
    viewport: {
      longitude: -122.4194,
      latitude: 37.7749,
      zoom: 12,
      pitch: 0,
      bearing: 0,
    },
    layers: [
      {
        id: "sample-parcels-01",
        name: "Metro Urban Parcels",
        type: "fill",
        visible: true,
        opacity: 0.65,
      },
      {
        id: "sample-flood-02",
        name: "Flood Hazard Zones",
        type: "fill",
        visible: true,
        opacity: 0.5,
      },
    ],
    basemap: "dark",
  },
  copilot: {
    messages: [
      {
        id: "msg-welcome",
        role: "assistant",
        content:
          "Welcome to GeoCopilot. I am your geospatial copilot. State an objective such as 'Identify residential parcels intersecting the 100-year flood zone within 500m of the river' or select a dataset from the left panel to begin.",
        timestamp: "2026-09-18T10:00:00Z",
        suggestedAction: {
          type: "create_workflow",
          payload: "flood-risk-pipeline",
        },
      },
    ],
    currentIntent: "",
    planProposal: null,
    isThinking: false,
  },
  workflow: {
    graph: INITIAL_EMPTY_WORKFLOW,
    status: "draft",
    currentStage: "intent",
    approvalGate: null,
    executionProgress: 0,
  },
  validation: {
    isValid: true,
    crsCompatible: true,
    geometryValid: true,
    warnings: [],
    errors: [],
  },
  auditTrail: [
    {
      id: "audit-init",
      timestamp: "2026-09-18T10:00:00Z",
      type: "workspace_reset",
      actor: "system",
      summary: "Workspace foundation initialized in clean standby mode.",
    },
  ],
  panels: {
    leftExpanded: true,
    rightExpanded: true,
    bottomExpanded: true,
  },
};
