"use client";

import React, { useState } from "react";
import { useWorkspace, useWorkspaceApproval } from "../hooks";
import { StatusBadge } from "@/components/common/StatusBadge";
import styles from "./WorkflowPanel.module.css";

const STAGES = [
  { id: "intent", name: "1. Intent", desc: "User spatial query" },
  { id: "data", name: "2. Data", desc: "Layer schema profiling" },
  { id: "harmonize", name: "3. Harmonize", desc: "CRS & datum reprojection" },
  { id: "review", name: "4. Review", desc: "Human Approval Gate" },
  { id: "execute", name: "5. Execute", desc: "Deterministic GIS engine" },
  { id: "validate", name: "6. Validate", desc: "Topology & provenance logs" },
] as const;

export const WorkflowPanel: React.FC = () => {
  const { state, dispatch } = useWorkspace();
  const { workflow, auditTrail } = state;
  const { approvalGate, status, currentStage } = workflow;
  const { approve, reject } = useWorkspaceApproval();

  const [activeTab, setActiveTab] = useState<"pipeline" | "audit">("pipeline");

  const workflowStatusConfig = {
    draft: { status: "planned" as const, label: "Drafting" },
    planned: { status: "in-development" as const, label: "Planned" },
    "awaiting-approval": { status: "in-development" as const, label: "⚠️ Awaiting Human Approval" },
    executing: { status: "ready" as const, label: "Executing Engine" },
    completed: { status: "ready" as const, label: "Completed & Validated" },
    failed: { status: "planned" as const, label: "Failed" },
  }[status];

  return (
    <section
      className={styles.panel}
      aria-label="Workflow Canvas & Execution Area"
      role="region"
    >
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <span aria-hidden="true">⚡</span>
          <h2 className={styles.title}>GIS Workflow Execution Pipeline</h2>
          <StatusBadge
            status={workflowStatusConfig.status}
            label={workflowStatusConfig.label}
          />
        </div>

        <div className={styles.tabGroup} role="tablist">
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === "pipeline" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("pipeline")}
            role="tab"
            aria-selected={activeTab === "pipeline"}
          >
            Pipeline Stages (6)
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === "audit" ? styles.tabBtnActive : ""}`}
            onClick={() => setActiveTab("audit")}
            role="tab"
            aria-selected={activeTab === "audit"}
          >
            Provenance Audit Trail ({auditTrail.length})
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className={styles.contentArea}>
        {activeTab === "pipeline" ? (
          <>
            {/* 6-Stage Pipeline Strip */}
            <div className={styles.pipelineTrack} aria-label="Pipeline progression stages">
              {STAGES.map((stg, idx) => {
                const isCurrent = currentStage === stg.id;
                const isGate = stg.id === "review";
                const isCompleted =
                  status === "completed" ||
                  (currentStage === "execute" && idx < 4) ||
                  (currentStage === "review" && idx < 3) ||
                  (currentStage === "harmonize" && idx < 2);

                const nodeState = isCompleted
                  ? "Completed"
                  : isCurrent && approvalGate?.status === "pending" && isGate
                  ? "Awaiting Action"
                  : isCurrent
                  ? "Active"
                  : "Standby";

                return (
                  <React.Fragment key={stg.id}>
                    <div
                      className={`${styles.stageNode} ${
                        isCurrent ? styles.stageNodeActive : ""
                      } ${isGate && approvalGate?.status === "pending" ? styles.stageNodeGate : ""} ${
                        isCompleted ? styles.stageNodeCompleted : ""
                      }`}
                    >
                      <div className={styles.stageHeader}>
                        <span className={styles.stageName}>{stg.name}</span>
                        <span
                          className={`${styles.stageStateBadge} ${
                            isCompleted
                              ? styles.stateCompleted
                              : isGate && approvalGate?.status === "pending"
                              ? styles.stateGatePending
                              : isCurrent
                              ? styles.stateRunning
                              : styles.stateIdle
                          }`}
                        >
                          {nodeState}
                        </span>
                      </div>
                      <p className={styles.stageDesc}>{stg.desc}</p>
                    </div>

                    {idx < STAGES.length - 1 && (
                      <span className={styles.arrow} aria-hidden="true">
                        ➔
                      </span>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Human Approval Gate Card (State E: Approval Required) */}
            {approvalGate && approvalGate.status === "pending" && (
              <div
                className={styles.approvalBanner}
                role="alert"
                aria-label="Supervised Human Approval Gate Required"
              >
                <div className={styles.approvalInfo}>
                  <div className={styles.approvalTitle}>
                    <span aria-hidden="true">🛑</span>
                    <span>Human Approval Gate: {approvalGate.stepName}</span>
                  </div>
                  <div className={styles.approvalSummary}>
                    {approvalGate.dataSummary}
                  </div>
                  {approvalGate.estimatedCost && (
                    <small style={{ color: "#94a3b8" }}>
                      Estimated compute impact: {approvalGate.estimatedCost}
                    </small>
                  )}
                </div>

                <div className={styles.approvalActions}>
                  <button
                    type="button"
                    className={styles.approveBtn}
                    onClick={() => approve("Supervised approval: Confirmed reprojection to EPSG:4326 and 250m buffer.")}
                  >
                    Approve Execution &rarr;
                  </button>
                  <button
                    type="button"
                    className={styles.rejectBtn}
                    onClick={() => reject("Supervised rejection: Parameters require re-evaluation.")}
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Audit / Provenance History View */
          <div className={styles.auditList} aria-label="Workflow Provenance Audit Log">
            {auditTrail.map((ev) => (
              <div key={ev.id} className={styles.auditItem}>
                <span className={styles.auditTime}>
                  {new Date(ev.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
                <span
                  className={`${styles.auditActor} ${
                    ev.actor === "human"
                      ? styles.actorHuman
                      : ev.actor === "ai"
                      ? styles.actorAi
                      : styles.actorSystem
                  }`}
                >
                  {ev.actor}
                </span>
                <span className={styles.auditSummary}>{ev.summary}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
