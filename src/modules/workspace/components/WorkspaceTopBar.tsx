"use client";

import React from "react";
import { useWorkspace } from "../hooks";
import { StatusBadge } from "@/components/common/StatusBadge";
import styles from "./WorkspaceTopBar.module.css";

interface WorkspaceTopBarProps {
  onOpenArchitectureModal?: () => void;
}

export const WorkspaceTopBar: React.FC<WorkspaceTopBarProps> = ({
  onOpenArchitectureModal,
}) => {
  const { state, dispatch } = useWorkspace();
  const { mode, project, panels } = state;

  const modeBadgeConfig = {
    empty: { status: "planned" as const, label: "Empty Standby" },
    "dataset-selected": { status: "ready" as const, label: "Dataset Selected" },
    "intent-entered": { status: "in-development" as const, label: "Intent Registered" },
    "workflow-draft": { status: "ready" as const, label: "Workflow Drafted" },
    "approval-required": { status: "in-development" as const, label: "⚠️ Approval Required" },
  }[mode];

  return (
    <header className={styles.topBar} role="banner">
      {/* Brand & Project */}
      <div className={styles.brandGroup}>
        <div className={styles.brandLogo}>
          <span className={styles.logoIcon}>🛰️</span>
          <h1 className={styles.brandTitle}>GeoCopilot</h1>
        </div>

        <div className={styles.brandDivider} />

        <div className={styles.projectNameGroup}>
          <span className={styles.projectLabel}>Project</span>
          <span className={styles.projectName} title={project.name}>
            {project.name}
          </span>
        </div>

        <StatusBadge
          status={modeBadgeConfig.status}
          label={modeBadgeConfig.label}
        />
      </div>

      {/* Center Controls: Fast Scenario Loaders */}
      <div className={styles.centerControls} aria-label="Demo Scenarios">
        <button
          type="button"
          className={`${styles.scenarioBtn} ${mode === "approval-required" ? styles.scenarioBtnActive : ""}`}
          onClick={() => dispatch({ type: "LOAD_DEMO_SCENARIO", payload: "flood-risk" })}
          title="Load Flood Risk demo scenario with a pending human review gate"
        >
          <span>🌊</span>
          <span>Flood Risk Scenario</span>
        </button>

        <button
          type="button"
          className={`${styles.scenarioBtn} ${mode === "dataset-selected" ? styles.scenarioBtnActive : ""}`}
          onClick={() => dispatch({ type: "LOAD_DEMO_SCENARIO", payload: "urban-parcels" })}
          title="Load Metro Urban Parcels demo scenario"
        >
          <span>🏙️</span>
          <span>Parcels Scenario</span>
        </button>

        <button
          type="button"
          className={styles.resetBtn}
          onClick={() => dispatch({ type: "RESET_WORKSPACE" })}
          title="Reset workspace to clean empty standby"
        >
          <span>🔄</span> Reset
        </button>
      </div>

      {/* Right Controls: Panel Toggles, Architecture modal, Engine Status */}
      <div className={styles.rightControls}>
        <div className={styles.panelToggleGroup} aria-label="Workspace Panel Visibility">
          <button
            type="button"
            className={`${styles.toggleBtn} ${panels.leftExpanded ? styles.toggleBtnActive : ""}`}
            onClick={() => dispatch({ type: "TOGGLE_PANEL", payload: { panel: "left" } })}
            title="Toggle Left Datasets Panel"
            aria-pressed={panels.leftExpanded}
          >
            <span>📁</span> Data
          </button>

          <button
            type="button"
            className={`${styles.toggleBtn} ${panels.bottomExpanded ? styles.toggleBtnActive : ""}`}
            onClick={() => dispatch({ type: "TOGGLE_PANEL", payload: { panel: "bottom" } })}
            title="Toggle Bottom Workflow Canvas"
            aria-pressed={panels.bottomExpanded}
          >
            <span>⚡</span> Workflow
          </button>

          <button
            type="button"
            className={`${styles.toggleBtn} ${panels.rightExpanded ? styles.toggleBtnActive : ""}`}
            onClick={() => dispatch({ type: "TOGGLE_PANEL", payload: { panel: "right" } })}
            title="Toggle Right Copilot Panel"
            aria-pressed={panels.rightExpanded}
          >
            <span>🤖</span> Copilot
          </button>
        </div>

        {onOpenArchitectureModal && (
          <button
            type="button"
            className={styles.infoBtn}
            onClick={onOpenArchitectureModal}
            title="View Hackathon Architecture & Team Ownership"
          >
            <span>👥</span> Team
          </button>
        )}

        <div className={styles.engineStatus} title="Local GIS & State Engine Ready">
          <span className={styles.engineDot} />
          <span>Local Engine</span>
        </div>
      </div>
    </header>
  );
};
