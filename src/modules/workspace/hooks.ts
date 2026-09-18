"use client";

import { useContext } from "react";
import { WorkspaceContext } from "./context/WorkspaceContext";
import type { WorkspaceContextValue } from "./context/WorkspaceContext";

export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a <WorkspaceProvider />");
  }
  return context;
}

export function useWorkspaceState() {
  return useWorkspace().state;
}

export function useWorkspaceDispatch() {
  return useWorkspace().dispatch;
}

export function useWorkspacePanels() {
  const { state, dispatch } = useWorkspace();
  return {
    panels: state.panels,
    togglePanel: (panel: "left" | "right" | "bottom") =>
      dispatch({ type: "TOGGLE_PANEL", payload: { panel } }),
  };
}

export function useWorkspaceDataset() {
  const { state, dispatch } = useWorkspace();
  const activeDataset = state.datasets.find((d) => d.id === state.activeDatasetId) || null;

  return {
    datasets: state.datasets,
    activeDataset,
    selectDataset: (id: string | null) => dispatch({ type: "SELECT_DATASET", payload: id }),
    toggleLayer: (id: string) => dispatch({ type: "TOGGLE_DATASET_LAYER", payload: id }),
  };
}

export function useWorkspaceApproval() {
  const { state, dispatch } = useWorkspace();
  const gate = state.workflow.approvalGate;

  return {
    gate,
    isApprovalRequired: gate?.status === "pending",
    approve: (note?: string) =>
      dispatch({
        type: "UPDATE_APPROVAL_DECISION",
        payload: { status: "approved", note },
      }),
    reject: (note?: string) =>
      dispatch({
        type: "UPDATE_APPROVAL_DECISION",
        payload: { status: "rejected", note },
      }),
    modify: (modifiedParams: Record<string, unknown>, note?: string) =>
      dispatch({
        type: "UPDATE_APPROVAL_DECISION",
        payload: { status: "edited", note, modifiedParams },
      }),
  };
}
