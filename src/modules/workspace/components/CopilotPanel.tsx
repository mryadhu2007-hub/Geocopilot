"use client";

import React, { useState, useRef, useEffect } from "react";
import { useWorkspace } from "../hooks";
import styles from "./CopilotPanel.module.css";

const QUICK_PROMPTS = [
  "Identify parcels intersecting 100-year flood zone within 250m",
  "Calculate residential parcel density and filter assessed value > $500k",
  "Check coordinate reference system compatibility between datasets",
];

export const CopilotPanel: React.FC = () => {
  const { state, dispatch } = useWorkspace();
  const { copilot, mode } = state;
  const { messages, currentIntent, planProposal } = copilot;

  const [inputVal, setInputVal] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    dispatch({ type: "SUBMIT_INTENT", payload: inputVal });
    setInputVal("");
  };

  const handleQuickPrompt = (prompt: string) => {
    dispatch({ type: "SUBMIT_INTENT", payload: prompt });
  };

  return (
    <aside
      className={styles.panel}
      aria-label="AI Geospatial Copilot Panel"
      role="region"
    >
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <span aria-hidden="true">🤖</span>
          <h2 className={styles.title}>AI Copilot</h2>
        </div>

        <span
          className={`${styles.agentBadge} ${
            mode === "approval-required" ? styles.agentBadgeGate : ""
          }`}
        >
          {mode === "approval-required" ? "Gate Pending" : "Planning Ready"}
        </span>
      </div>

      {/* Messages Stream */}
      <div className={styles.messagesArea}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`${styles.message} ${
              msg.role === "user" ? styles.messageUser : styles.messageAssistant
            }`}
          >
            <div className={styles.msgMeta}>
              <span>{msg.role === "user" ? "👤 Human Supervisor" : "🛰️ GeoCopilot"}</span>
              <span>•</span>
              <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
            </div>

            <div
              className={
                msg.role === "user" ? styles.bubbleUser : styles.bubbleAssistant
              }
            >
              {msg.content}
            </div>

            {/* Render Plan Proposal Card if available on message */}
            {msg.suggestedAction?.type === "create_workflow" && planProposal && (
              <div className={styles.proposalCard} aria-label="Proposed Analysis Pipeline">
                <div className={styles.proposalTitle}>
                  <span aria-hidden="true">⚡</span>
                  <span>{planProposal.title}</span>
                </div>
                <p className={styles.proposalSummary}>{planProposal.summary}</p>

                <div className={styles.stepsList}>
                  {planProposal.steps.map((step) => (
                    <div key={step.stepNumber} className={styles.stepItem}>
                      <span>
                        <strong>{step.stepNumber}.</strong> {step.operation}
                      </span>
                      {step.requiresApproval && (
                        <span className={styles.gateTag}>Approval Gate</span>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className={styles.applyPlanBtn}
                  onClick={() => dispatch({ type: "GENERATE_DRAFT_WORKFLOW" })}
                >
                  Inspect in Workflow Canvas &rarr;
                </button>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Objective Prompt Chips */}
      <div className={styles.quickPromptArea}>
        <span className={styles.quickLabel}>Suggested Spatial Objectives:</span>
        <div className={styles.chipRow}>
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className={styles.quickChip}
              onClick={() => handleQuickPrompt(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Natural Language Input UI (Phase 1 stores intent in workspace state without calling AI API) */}
      <div className={styles.inputArea}>
        <form className={styles.inputForm} onSubmit={handleSubmit}>
          <input
            type="text"
            className={styles.textInput}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Describe spatial analysis objective..."
            aria-label="Natural language geospatial objective input"
          />
          <button type="submit" className={styles.sendBtn}>
            Propose
          </button>
        </form>

        <div className={styles.footerNote}>
          AI proposes &amp; explains • Human supervises • Deterministic execution
        </div>
      </div>
    </aside>
  );
};
