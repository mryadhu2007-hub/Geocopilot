import type {
  WorkspaceState,
  WorkspaceAction,
  WorkspaceMode,
  AuditEvent,
} from "./types";
import { initialWorkspaceState, INITIAL_EMPTY_WORKFLOW, SAMPLE_DATASETS } from "./initialState";
import type { CopilotPlanProposal } from "@/modules/copilot/types";
import type { HumanApprovalGate, WorkflowGraph } from "@/modules/workflow/types";

function createAudit(
  type: AuditEvent["type"],
  actor: AuditEvent["actor"],
  summary: string,
  details?: Record<string, unknown>
): AuditEvent {
  return {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    type,
    actor,
    summary,
    details,
  };
}

function deriveWorkspaceMode(
  currentMode: WorkspaceMode,
  hasIntent: boolean,
  hasActiveDataset: boolean,
  hasDraftWorkflow: boolean,
  hasPendingApproval: boolean
): WorkspaceMode {
  if (hasPendingApproval) return "approval-required";
  if (hasDraftWorkflow) return "workflow-draft";
  if (hasIntent) return "intent-entered";
  if (hasActiveDataset) return "dataset-selected";
  return "empty";
}

export function workspaceReducer(
  state: WorkspaceState,
  action: WorkspaceAction
): WorkspaceState {
  switch (action.type) {
    case "SET_INTENT": {
      return {
        ...state,
        copilot: {
          ...state.copilot,
          currentIntent: action.payload,
        },
      };
    }

    case "SUBMIT_INTENT": {
      const intentText = action.payload.trim();
      if (!intentText) return state;

      const userMsg = {
        id: `msg-${Date.now()}-user`,
        role: "user" as const,
        content: intentText,
        timestamp: new Date().toISOString(),
        intent: intentText,
      };

      const planProposal: CopilotPlanProposal = {
        id: `plan-${Date.now()}`,
        title: "Draft Geospatial Analysis Pipeline",
        summary: `Synthesized GIS pipeline based on objective: "${intentText}". Includes automated CRS inspection, buffering, and a supervised human approval gate.`,
        steps: [
          {
            stepNumber: 1,
            operation: "Dataset Ingestion & Schema Profiling",
            description: "Profile geometry integrity, attribute schema, and feature count.",
            requiresApproval: false,
            layerInputs: [state.activeDatasetId || "sample-parcels-01"],
          },
          {
            stepNumber: 2,
            operation: "Coordinate System Harmonization",
            description: "Detect CRS mismatch (EPSG:3857 vs EPSG:4326) and reproject vectors.",
            requiresApproval: true,
            layerInputs: ["sample-flood-02"],
          },
          {
            stepNumber: 3,
            operation: "Spatial Buffer & Overlay Computation",
            description: "Compute 250m safety margin buffer around inundation boundaries.",
            requiresApproval: true,
          },
          {
            stepNumber: 4,
            operation: "Topological Validation & Result Export",
            description: "Validate result polygon rings and compile provenance audit trail.",
            requiresApproval: false,
          },
        ],
      };

      const assistantMsg = {
        id: `msg-${Date.now()}-assistant`,
        role: "assistant" as const,
        content: `I have received your objective: "${intentText}". I generated a draft 4-step pipeline proposal with a supervised Human Approval Gate for CRS conversion and buffer distance. Would you like to review the proposed pipeline?`,
        timestamp: new Date().toISOString(),
        suggestedAction: {
          type: "create_workflow" as const,
          payload: planProposal,
        },
      };

      const audit = createAudit(
        "intent_set",
        "human",
        `User defined geospatial objective: "${intentText.slice(0, 60)}..."`,
        { intent: intentText }
      );

      const updatedWorkflow: WorkflowGraph = {
        id: `wf-${Date.now()}`,
        title: `Pipeline: ${intentText.slice(0, 45)}...`,
        state: "idle",
        status: "planned",
        createdAt: new Date().toISOString(),
        nodes: [
          {
            id: "n-1",
            type: "intent_definition",
            label: "1. Stated Objective",
            stage: "intent",
            position: { x: 50, y: 50 },
            status: "completed",
            description: intentText,
          },
          {
            id: "n-2",
            type: "dataset_input",
            label: "2. Profile Selected Data",
            stage: "data",
            position: { x: 250, y: 50 },
            status: "running",
            description: "Profile spatial datasets and bounding boxes.",
          },
          {
            id: "n-3",
            type: "harmonize_crs",
            label: "3. CRS Harmonization",
            stage: "harmonize",
            position: { x: 450, y: 50 },
            status: "idle",
            description: "Align coordinates to EPSG:4326.",
          },
          {
            id: "n-4",
            type: "human_approval_gate",
            label: "4. Human Review Gate",
            stage: "review",
            position: { x: 650, y: 50 },
            status: "paused_for_approval",
            description: "Review buffer distance (250m) and projected layer.",
          },
          {
            id: "n-5",
            type: "execute_spatial_op",
            label: "5. GIS Computation",
            stage: "execute",
            position: { x: 850, y: 50 },
            status: "idle",
            description: "Deterministic polygon intersection calculation.",
          },
          {
            id: "n-6",
            type: "validate_results",
            label: "6. Validation & Output",
            stage: "validate",
            position: { x: 1050, y: 50 },
            status: "idle",
            description: "Quality assertions and audit snapshot.",
          },
        ],
        edges: [
          { id: "e1-2", source: "n-1", target: "n-2" },
          { id: "e2-3", source: "n-2", target: "n-3" },
          { id: "e3-4", source: "n-3", target: "n-4" },
          { id: "e4-5", source: "n-4", target: "n-5" },
          { id: "e5-6", source: "n-5", target: "n-6" },
        ],
      };

      const newMode = deriveWorkspaceMode(
        state.mode,
        true,
        Boolean(state.activeDatasetId),
        true,
        false
      );

      return {
        ...state,
        mode: newMode,
        copilot: {
          ...state.copilot,
          currentIntent: intentText,
          planProposal,
          messages: [...state.copilot.messages, userMsg, assistantMsg],
        },
        workflow: {
          ...state.workflow,
          graph: updatedWorkflow,
          status: "planned",
          currentStage: "data",
        },
        auditTrail: [...state.auditTrail, audit],
      };
    }

    case "CLEAR_INTENT": {
      const newMode = deriveWorkspaceMode(
        state.mode,
        false,
        Boolean(state.activeDatasetId),
        false,
        false
      );
      return {
        ...state,
        mode: newMode,
        copilot: {
          ...state.copilot,
          currentIntent: "",
          planProposal: null,
        },
      };
    }

    case "SELECT_DATASET": {
      const selectedId = action.payload;
      const selectedDataset = state.datasets.find((d) => d.id === selectedId);

      const audit = createAudit(
        "dataset_selected",
        "human",
        selectedDataset
          ? `Selected dataset: ${selectedDataset.name}`
          : "Deselected active dataset",
        { datasetId: selectedId }
      );

      const hasIntent = Boolean(state.copilot.currentIntent);
      const hasPendingApproval = state.workflow.approvalGate?.status === "pending";
      const hasDraftWorkflow = state.workflow.status !== "draft" || hasIntent;

      const newMode = deriveWorkspaceMode(
        state.mode,
        hasIntent,
        Boolean(selectedId),
        hasDraftWorkflow,
        hasPendingApproval
      );

      return {
        ...state,
        activeDatasetId: selectedId,
        mode: newMode,
        auditTrail: [...state.auditTrail, audit],
      };
    }

    case "TOGGLE_DATASET_LAYER": {
      const datasetId = action.payload;
      const updatedDatasets = state.datasets.map((d) =>
        d.id === datasetId ? { ...d, isLoadedOnMap: !d.isLoadedOnMap } : d
      );
      const updatedLayers = state.map.layers.map((l) =>
        l.id === datasetId ? { ...l, visible: !l.visible } : l
      );

      const target = state.datasets.find((d) => d.id === datasetId);
      const audit = createAudit(
        "layer_toggled",
        "human",
        `Toggled map layer visibility for "${target?.name || datasetId}"`,
        { datasetId, nowVisible: !target?.isLoadedOnMap }
      );

      return {
        ...state,
        datasets: updatedDatasets,
        map: {
          ...state.map,
          layers: updatedLayers,
        },
        auditTrail: [...state.auditTrail, audit],
      };
    }

    case "ADD_DATASET": {
      return {
        ...state,
        datasets: [action.payload, ...state.datasets],
        auditTrail: [
          ...state.auditTrail,
          createAudit("dataset_selected", "human", `Registered new dataset: ${action.payload.name}`),
        ],
      };
    }

    case "REGISTER_IMPORTED_DATASET": {
      const newDataset = action.payload;
      const audit = createAudit(
        "dataset_uploaded",
        "human",
        `Imported user dataset: "${newDataset.name}" (${newDataset.format.toUpperCase()})`,
        {
          datasetId: newDataset.id,
          format: newDataset.format,
          filePath: newDataset.filePath,
        }
      );

      const hasIntent = Boolean(state.copilot.currentIntent);
      const hasPendingApproval = state.workflow.approvalGate?.status === "pending";
      const hasDraftWorkflow = state.workflow.status !== "draft" || hasIntent;
      const newMode = deriveWorkspaceMode(state.mode, hasIntent, true, hasDraftWorkflow, hasPendingApproval);

      const newMapLayer = {
        id: newDataset.id,
        name: newDataset.name,
        type: (newDataset.geometryType === "Polygon" || newDataset.geometryType === "MultiPolygon"
          ? ("fill" as const)
          : newDataset.geometryType === "Point"
          ? ("circle" as const)
          : ("line" as const)),
        visible: newDataset.isLoadedOnMap,
        opacity: 0.75,
      };

      return {
        ...state,
        mode: newMode,
        activeDatasetId: newDataset.id,
        datasets: [newDataset, ...state.datasets.filter((d) => d.id !== newDataset.id)],
        map: {
          ...state.map,
          layers: [newMapLayer, ...state.map.layers.filter((l) => l.id !== newDataset.id)],
        },
        auditTrail: [...state.auditTrail, audit],
      };
    }

    case "GENERATE_DRAFT_WORKFLOW": {
      const audit = createAudit(
        "plan_generated",
        "ai",
        "Generated draft 6-stage GIS workflow representation."
      );
      return {
        ...state,
        mode: "workflow-draft",
        workflow: {
          ...state.workflow,
          status: "planned",
          currentStage: "review",
        },
        auditTrail: [...state.auditTrail, audit],
      };
    }

    case "SET_WORKFLOW_STATUS": {
      return {
        ...state,
        workflow: {
          ...state.workflow,
          status: action.payload,
        },
        auditTrail: [
          ...state.auditTrail,
          createAudit("workflow_status_change", "system", `Workflow status changed to ${action.payload}`),
        ],
      };
    }

    case "SET_PIPELINE_STAGE": {
      return {
        ...state,
        workflow: {
          ...state.workflow,
          currentStage: action.payload,
        },
      };
    }

    case "SET_APPROVAL_GATE": {
      const gate = action.payload;
      const isPending = gate?.status === "pending";
      return {
        ...state,
        mode: isPending ? "approval-required" : state.mode,
        workflow: {
          ...state.workflow,
          approvalGate: gate,
          status: isPending ? "awaiting-approval" : state.workflow.status,
        },
      };
    }

    case "UPDATE_APPROVAL_DECISION": {
      const { status, note, modifiedParams } = action.payload;
      if (!state.workflow.approvalGate) return state;

      const updatedGate: HumanApprovalGate = {
        ...state.workflow.approvalGate,
        status,
        isApproved: status === "approved" || status === "edited",
        decisionNote: note,
        modifiedParams,
      };

      const audit = createAudit(
        "approval_decision",
        "human",
        `Human supervisor decision: ${status.toUpperCase()} on gate "${updatedGate.stepName}".`,
        { status, note, modifiedParams }
      );

      const copilotConfirmation = {
        id: `msg-${Date.now()}-decision`,
        role: "assistant" as const,
        content:
          status === "approved"
            ? `Decision logged: Approved step "${updatedGate.stepName}". Workflow will proceed deterministically with configured parameters.`
            : status === "edited"
            ? `Decision logged: Modified parameters for step "${updatedGate.stepName}". Proceeding with human-adjusted values.`
            : `Decision logged: Rejected step "${updatedGate.stepName}". Workflow execution paused. You may revise parameters or the objective.`,
        timestamp: new Date().toISOString(),
      };

      return {
        ...state,
        mode: status === "pending" ? "approval-required" : "workflow-draft",
        workflow: {
          ...state.workflow,
          approvalGate: updatedGate,
          status: status === "approved" || status === "edited" ? "executing" : "draft",
          currentStage: status === "approved" || status === "edited" ? "execute" : "review",
        },
        copilot: {
          ...state.copilot,
          messages: [...state.copilot.messages, copilotConfirmation],
        },
        auditTrail: [...state.auditTrail, audit],
      };
    }

    case "TOGGLE_PANEL": {
      const { panel } = action.payload;
      return {
        ...state,
        panels: {
          ...state.panels,
          [panel === "left"
            ? "leftExpanded"
            : panel === "right"
            ? "rightExpanded"
            : "bottomExpanded"]: !state.panels[
            panel === "left"
              ? "leftExpanded"
              : panel === "right"
              ? "rightExpanded"
              : "bottomExpanded"
          ],
        },
      };
    }

    case "SET_PANELS": {
      return {
        ...state,
        panels: {
          ...state.panels,
          ...action.payload,
        },
      };
    }

    case "ADD_COPILOT_MESSAGE": {
      return {
        ...state,
        copilot: {
          ...state.copilot,
          messages: [...state.copilot.messages, action.payload],
        },
      };
    }

    case "LOAD_DEMO_SCENARIO": {
      const scenario = action.payload;
      if (scenario === "flood-risk") {
        const intentText =
          "Identify vulnerable urban parcels intersecting the 100-year flood zone with a 250m safety buffer";

        const approvalGate: HumanApprovalGate = {
          nodeId: "node-gate-flood",
          stepName: "Reproject Flood Zone & Apply 250m Safety Buffer",
          dataSummary:
            "CRS Mismatch detected: Inundation zones are in EPSG:3857, while Cadastral Parcels are in EPSG:4326. Buffer radius set to 250 meters. Estimated ~342 parcels in risk perimeter.",
          estimatedCost: "Low (~0.12s local compute)",
          isApproved: false,
          status: "pending",
          reason:
            "CRS reprojection requires datum transformation confirmation; buffer distance determines regulatory setback boundary.",
          actionRequired:
            "Confirm reprojection to WGS84 (EPSG:4326) and 250m buffer radius, or adjust buffer distance.",
        };

        const audit = createAudit(
          "scenario_loaded",
          "human",
          "Loaded Flood Risk Assessment Demo Scenario with pending Human Approval Gate."
        );

        return {
          ...state,
          mode: "approval-required",
          activeDatasetId: "sample-flood-02",
          copilot: {
            ...state.copilot,
            currentIntent: intentText,
            messages: [
              ...state.copilot.messages,
              {
                id: `msg-${Date.now()}-scen-u`,
                role: "user",
                content: intentText,
                timestamp: new Date().toISOString(),
                intent: intentText,
              },
              {
                id: `msg-${Date.now()}-scen-a`,
                role: "assistant",
                content:
                  "I have profiled the flood hazard dataset and detected a CRS discrepancy (EPSG:3857 vs EPSG:4326). A Human Approval Gate has been issued to supervise the reprojection and 250m buffer parameters.",
                timestamp: new Date().toISOString(),
              },
            ],
          },
          workflow: {
            ...state.workflow,
            status: "awaiting-approval",
            currentStage: "review",
            approvalGate,
          },
          auditTrail: [...state.auditTrail, audit],
        };
      }

      if (scenario === "urban-parcels") {
        const intentText =
          "Analyze cadastral parcel density and highlight zoning parcels with assessed value > $500,000";

        const audit = createAudit(
          "scenario_loaded",
          "human",
          "Loaded Metro Urban Parcels Demo Scenario."
        );

        return {
          ...state,
          mode: "dataset-selected",
          activeDatasetId: "sample-parcels-01",
          copilot: {
            ...state.copilot,
            currentIntent: intentText,
            messages: [
              ...state.copilot.messages,
              {
                id: `msg-${Date.now()}-u2`,
                role: "user",
                content: intentText,
                timestamp: new Date().toISOString(),
                intent: intentText,
              },
              {
                id: `msg-${Date.now()}-a2`,
                role: "assistant",
                content:
                  "Active dataset set to Metro Urban Parcels (1,420 features). Ready to draft spatial density query workflow.",
                timestamp: new Date().toISOString(),
              },
            ],
          },
          workflow: {
            ...state.workflow,
            status: "draft",
            currentStage: "data",
            approvalGate: null,
          },
          auditTrail: [...state.auditTrail, audit],
        };
      }

      return state;
    }

    case "RESET_WORKSPACE": {
      return {
        ...initialWorkspaceState,
        auditTrail: [
          ...initialWorkspaceState.auditTrail,
          createAudit("workspace_reset", "human", "Workspace state reset to clean empty standby."),
        ],
      };
    }

    case "SET_MAP_VIEWPORT": {
      return {
        ...state,
        map: {
          ...state.map,
          viewport: {
            ...state.map.viewport,
            ...action.payload,
          },
        },
      };
    }

    case "SET_MAP_BASEMAP": {
      return {
        ...state,
        map: {
          ...state.map,
          basemap: action.payload,
        },
      };
    }

    case "START_DATASET_PROFILING": {
      const { datasetId } = action.payload;
      const targetDataset = state.datasets.find((d) => d.id === datasetId);
      const audit = createAudit(
        "dataset_selected",
        "human",
        `Initiated GIS profiling for dataset "${targetDataset?.name || datasetId}"`,
        { datasetId }
      );

      const updatedDatasets = state.datasets.map((d) => {
        if (d.id !== datasetId) return d;
        return {
          ...d,
          status: "profiling" as const,
          profilingStatus: "profiling" as const,
          profilingError: null,
        };
      });

      return {
        ...state,
        datasets: updatedDatasets,
        auditTrail: [...state.auditTrail, audit],
      };
    }

    case "DATASET_PROFILING_SUCCESS": {
      const { datasetId, result } = action.payload;
      const isReady = result.readiness.status === "ready";
      const geomVal = result.geometry_validation || result.geometry_validity;
      const geomType = result.primary_geometry_type || result.geometry_type || "Vector";
      const attrs = result.columns || result.attribute_names || [];
      const warnings = result.warnings || result.readiness?.warnings || [];

      const audit = createAudit(
        "dataset_profiled",
        "system",
        `Completed GIS profiling for "${result.dataset_name}". Readiness Score: ${result.readiness.score}/100 (${result.readiness.status})`,
        {
          datasetId,
          score: result.readiness.score,
          status: result.readiness.status,
          crs: result.crs,
          featureCount: result.feature_count,
        }
      );

      const updatedDatasets = state.datasets.map((d) => {
        if (d.id !== datasetId) return d;
        return {
          ...d,
          name: d.name || result.dataset_name,
          status: isReady ? ("ready" as const) : ("needs-review" as const),
          profilingStatus: "success" as const,
          profileResult: result,
          profilingError: null,
          crs: result.crs || "unknown",
          featureCount: result.feature_count,
          boundingBox: result.bounding_box || d.boundingBox,
          attributes: attrs,
          geometryType: (["Point", "Polygon", "MultiPolygon", "LineString", "Mixed"].includes(geomType)
            ? (geomType as "Point" | "Polygon" | "MultiPolygon" | "LineString" | "Mixed")
            : d.geometryType),
        };
      });

      return {
        ...state,
        datasets: updatedDatasets,
        validation: {
          ...state.validation,
          crsCompatible: result.crs !== "unknown" && result.crs !== null,
          geometryValid: geomVal ? geomVal.invalid === 0 && geomVal.missing === 0 : true,
          warnings,
          lastValidated: new Date().toISOString(),
        },
        auditTrail: [...state.auditTrail, audit],
      };
    }

    case "DATASET_PROFILING_ERROR": {
      const { datasetId, error } = action.payload;
      const targetDataset = state.datasets.find((d) => d.id === datasetId);
      const audit = createAudit(
        "dataset_profiled",
        "system",
        `GIS profiling failed for dataset "${targetDataset?.name || datasetId}": ${error}`,
        { datasetId, error }
      );

      const updatedDatasets = state.datasets.map((d) => {
        if (d.id !== datasetId) return d;
        return {
          ...d,
          status: "error" as const,
          profilingStatus: "error" as const,
          profilingError: error,
        };
      });

      return {
        ...state,
        datasets: updatedDatasets,
        auditTrail: [...state.auditTrail, audit],
      };
    }

    default:
      return state;
  }
}
