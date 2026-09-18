"use client";

import React, { useState } from "react";
import { useWorkspace } from "../hooks";
import { WorkspaceTopBar } from "./WorkspaceTopBar";
import { DatasetPanel } from "./DatasetPanel";
import { MapWorkspace } from "./MapWorkspace";
import { CopilotPanel } from "./CopilotPanel";
import { WorkflowPanel } from "./WorkflowPanel";
import { ArchitectureInfoModal } from "./ArchitectureInfoModal";
import styles from "./WorkspaceShell.module.css";

export const WorkspaceShell: React.FC = () => {
  const { state, dispatch } = useWorkspace();
  const { mode, panels, activeDatasetId, copilot } = state;
  const [showArchModal, setShowArchModal] = useState(false);

  const isWorkspaceEmpty = mode === "empty" && !activeDatasetId && !copilot.currentIntent;

  return (
    <div className={styles.shell}>
      {/* Top Application Bar */}
      <WorkspaceTopBar onOpenArchitectureModal={() => setShowArchModal(true)} />

      {/* Main Workspace Layout */}
      <main className={styles.bodyLayout}>
        {/* Left Dataset Panel (collapsible) */}
        {panels.leftExpanded ? (
          <DatasetPanel />
        ) : (
          <button
            type="button"
            className={styles.expandLeftBtn}
            onClick={() => dispatch({ type: "TOGGLE_PANEL", payload: { panel: "left" } })}
            title="Expand Left Datasets Panel"
            aria-label="Expand Left Datasets Panel"
          >
            <span>📁</span>
            <span className={styles.verticalText}>Datasets</span>
          </button>
        )}

        {/* Center Map & Bottom Workflow Area */}
        <div className={styles.centerColumn}>
          {/* State A: Empty Workspace Banner */}
          {isWorkspaceEmpty && (
            <div className={styles.emptyWelcomeBanner} role="status">
              <div className={styles.emptyTitle}>
                🛰️ Ready for Geospatial Instruction
              </div>
              <p className={styles.emptyText}>
                Start by describing what you want to analyze or add a dataset.
              </p>
              <div className={styles.emptyActions}>
                <button
                  type="button"
                  className={styles.emptyActionBtn}
                  onClick={() =>
                    dispatch({
                      type: "LOAD_DEMO_SCENARIO",
                      payload: "flood-risk",
                    })
                  }
                >
                  Load Flood Risk Demo
                </button>
                <button
                  type="button"
                  className={styles.emptyActionBtn}
                  onClick={() =>
                    dispatch({
                      type: "SELECT_DATASET",
                      payload: "sample-parcels-01",
                    })
                  }
                >
                  Select Sample Parcels
                </button>
              </div>
            </div>
          )}

          {/* Center Map Workspace (Dominant Viewport) */}
          <MapWorkspace />

          {/* Bottom Workflow Panel (collapsible) */}
          {panels.bottomExpanded ? (
            <WorkflowPanel />
          ) : (
            <button
              type="button"
              className={styles.expandBottomBtn}
              onClick={() => dispatch({ type: "TOGGLE_PANEL", payload: { panel: "bottom" } })}
              title="Expand Bottom Workflow Panel"
              aria-label="Expand Bottom Workflow Panel"
            >
              <span>⚡ Expand Workflow Canvas</span>
            </button>
          )}
        </div>

        {/* Right AI Copilot Panel (collapsible) */}
        {panels.rightExpanded ? (
          <CopilotPanel />
        ) : (
          <button
            type="button"
            className={styles.expandRightBtn}
            onClick={() => dispatch({ type: "TOGGLE_PANEL", payload: { panel: "right" } })}
            title="Expand Right AI Copilot Panel"
            aria-label="Expand Right AI Copilot Panel"
          >
            <span>🤖</span>
            <span className={styles.verticalText}>Copilot</span>
          </button>
        )}
      </main>

      {/* Team Architecture Modal */}
      <ArchitectureInfoModal
        isOpen={showArchModal}
        onClose={() => setShowArchModal(false)}
      />
    </div>
  );
};
