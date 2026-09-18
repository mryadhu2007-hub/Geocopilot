import React from "react";
import type { CopilotComponentProps } from "../types";
import styles from "./CopilotPlaceholder.module.css";

/**
 * ============================================================================
 * AI COPILOT INTEGRATION PLACEHOLDER
 * ============================================================================
 * RESPONSIBLE: Member 5 (AI Workflow Planning & Pitch) & Member 2 (Frontend Lead)
 *
 * HOW TO REPLACE:
 * 1. Wire up chat history state and input event handlers.
 * 2. Connect user queries to your backend/LLM endpoint.
 * 3. Render structured spatial plan proposals with confirmation buttons.
 * ============================================================================
 */
export const CopilotPlaceholder: React.FC<CopilotComponentProps> = () => {
  return (
    <div className={styles.container} role="region" aria-label="AI Copilot Area">
      <div className={styles.header}>
        <div className={styles.badge}>
          <span>🤖 AI Copilot</span>
          <span>•</span>
          <span>Assigned: Member 5 & 2</span>
        </div>
        <h3 className={styles.title}>Natural Language Assistant Area</h3>
        <p className={styles.description}>
          This is the integration boundary for the AI reasoning agent.
          Geospatial commands like &ldquo;Find flood-risk parcels within 1km of river&rdquo;
          will be parsed into structured workflow graphs here.
        </p>
      </div>

      <div className={styles.chatPreview}>
        <div className={styles.botBubble}>
          <strong>GeoCopilot:</strong> &ldquo;Ready for spatial instructions. Propose a query to generate an executable analysis workflow.&rdquo;
        </div>
      </div>

      <div className={styles.inputMock}>
        <input
          type="text"
          className={styles.inputField}
          placeholder="Ask GeoCopilot to plan a spatial workflow..."
          disabled
          aria-label="Disabled copilot input placeholder"
        />
        <button type="button" className={styles.inputBtn} disabled>
          Send
        </button>
      </div>
    </div>
  );
};
