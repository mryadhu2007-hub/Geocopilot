import type { GeospatialDataset, DatasetProfileResult } from "@/modules/data/types";
import type { MapViewportState, MapLayer } from "@/modules/map/types";
import type { CopilotMessage, CopilotPlanProposal } from "@/modules/copilot/types";
import type {
  WorkflowGraph,
  WorkflowStatus,
  PipelineStage,
  HumanApprovalGate,
  ApprovalStatus,
} from "@/modules/workflow/types";

/**
 * High-level mode indicating the primary state of the workspace
 */
export type WorkspaceMode =
  | "empty"
  | "dataset-selected"
  | "intent-entered"
  | "workflow-draft"
  | "approval-required";

/**
 * Provenance / audit trail event model for tracking every human and system action
 */
export interface AuditEvent {
  id: string;
  timestamp: string;
  type:
    | "intent_set"
    | "dataset_selected"
    | "layer_toggled"
    | "dataset_profiled"
    | "dataset_uploaded"
    | "plan_generated"
    | "approval_decision"
    | "workflow_status_change"
    | "scenario_loaded"
    | "workspace_reset";
  actor: "human" | "ai" | "system";
  summary: string;
  details?: Record<string, unknown>;
}

/**
 * Collapsible panel visibility states
 */
export interface PanelState {
  leftExpanded: boolean;
  rightExpanded: boolean;
  bottomExpanded: boolean;
}

/**
 * Geospatial validation and compatibility status
 */
export interface ValidationState {
  isValid: boolean;
  crsCompatible: boolean;
  geometryValid: boolean;
  warnings: string[];
  errors: string[];
  lastValidated?: string;
}

/**
 * Unified GeoCopilot Workspace State
 */
export interface WorkspaceState {
  project: {
    id: string;
    name: string;
    description: string;
    lastSaved?: string;
  };
  mode: WorkspaceMode;
  datasets: GeospatialDataset[];
  activeDatasetId: string | null;
  map: {
    viewport: MapViewportState;
    layers: MapLayer[];
    basemap: "dark" | "light" | "satellite" | "streets";
  };
  copilot: {
    messages: CopilotMessage[];
    currentIntent: string;
    planProposal: CopilotPlanProposal | null;
    isThinking: boolean;
  };
  workflow: {
    graph: WorkflowGraph;
    status: WorkflowStatus;
    currentStage: PipelineStage;
    approvalGate: HumanApprovalGate | null;
    executionProgress?: number;
  };
  validation: ValidationState;
  auditTrail: AuditEvent[];
  panels: PanelState;
}

/**
 * Strongly typed actions for Workspace Reducer
 */
export type WorkspaceAction =
  | { type: "SET_INTENT"; payload: string }
  | { type: "SUBMIT_INTENT"; payload: string }
  | { type: "CLEAR_INTENT" }
  | { type: "SELECT_DATASET"; payload: string | null }
  | { type: "TOGGLE_DATASET_LAYER"; payload: string }
  | { type: "ADD_DATASET"; payload: GeospatialDataset }
  | { type: "GENERATE_DRAFT_WORKFLOW" }
  | { type: "SET_WORKFLOW_STATUS"; payload: WorkflowStatus }
  | { type: "SET_PIPELINE_STAGE"; payload: PipelineStage }
  | { type: "SET_APPROVAL_GATE"; payload: HumanApprovalGate | null }
  | {
      type: "UPDATE_APPROVAL_DECISION";
      payload: {
        status: ApprovalStatus;
        note?: string;
        modifiedParams?: Record<string, unknown>;
      };
    }
  | { type: "TOGGLE_PANEL"; payload: { panel: "left" | "right" | "bottom" } }
  | { type: "SET_PANELS"; payload: Partial<PanelState> }
  | { type: "ADD_COPILOT_MESSAGE"; payload: CopilotMessage }
  | { type: "LOAD_DEMO_SCENARIO"; payload: "flood-risk" | "urban-parcels" }
  | { type: "RESET_WORKSPACE" }
  | { type: "SET_MAP_VIEWPORT"; payload: Partial<MapViewportState> }
  | { type: "SET_MAP_BASEMAP"; payload: "dark" | "light" | "satellite" | "streets" }
  | { type: "START_DATASET_PROFILING"; payload: { datasetId: string } }
  | {
      type: "DATASET_PROFILING_SUCCESS";
      payload: { datasetId: string; result: DatasetProfileResult };
    }
  | {
      type: "DATASET_PROFILING_ERROR";
      payload: { datasetId: string; error: string };
    }
  | { type: "REGISTER_IMPORTED_DATASET"; payload: GeospatialDataset };
