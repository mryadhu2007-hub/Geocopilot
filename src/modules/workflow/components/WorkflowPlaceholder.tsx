import React from "react";
import type { WorkflowComponentProps } from "../types";
import styles from "./WorkflowPlaceholder.module.css";

/**
 * ============================================================================
 * WORKFLOW & REACT FLOW INTEGRATION PLACEHOLDER
 * ============================================================================
 * RESPONSIBLE: Member 2 (Frontend Lead) & Member 5 (AI Workflow Planning)
 *
 * HOW TO REPLACE:
 * 1. Install `@xyflow/react`.
 * 2. Mount the `<ReactFlow>` canvas with custom nodes (Input, Filter, Buffer, Gate, Output).
 * 3. Connect nodes to execution state and human-in-the-loop approval triggers.
 * ============================================================================
 */
export const WorkflowPlaceholder: React.FC<WorkflowComponentProps> = () => {
  return (
    <div className={styles.container} role="region" aria-label="Workflow Canvas Area">
      <div className={styles.badge}>
        <span>⚡ Workflow Canvas</span>
        <span>•</span>
        <span>Assigned: Member 2 & 5</span>
      </div>

      <h3 className={styles.title}>React Flow Pipeline Area</h3>
      <p className={styles.description}>
        This is the integration boundary for the node-based visual workflow editor.
        AI-generated spatial analysis pipelines and human approval gates will render here.
      </p>

      <div className={styles.pipelinePreview}>
        <span className={styles.stepNode}>1. Ingest GeoJSON</span>
        <span className={styles.arrow}>➔</span>
        <span className={styles.stepNode}>2. Spatial Buffer (500m)</span>
        <span className={styles.arrow}>➔</span>
        <span className={styles.approvalNode}>3. Human Approval Gate</span>
        <span className={styles.arrow}>➔</span>
        <span className={styles.stepNode}>4. PostGIS Export</span>
      </div>
    </div>
  );
};
