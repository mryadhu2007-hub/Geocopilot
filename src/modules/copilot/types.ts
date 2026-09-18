/**
 * AI Copilot Module Interfaces
 *
 * OWNED BY: Member 5 (AI Workflow Planning & Pitch) & Member 2 (Frontend Lead)
 *
 * When ready to integrate AI capabilities:
 * 1. Implement structured intent parsing (natural language -> geospatial plan).
 * 2. Connect the prompt bar to your AI endpoint / LLM API.
 * 3. Emit structured workflow graphs into `src/modules/workflow/` upon user confirmation.
 */

export type MessageRole = "user" | "assistant" | "system" | "tool";

export interface CopilotMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  intent?: string;
  suggestedAction?: {
    type: "create_workflow" | "load_layer" | "run_analysis" | "select_dataset" | "review_workflow" | "approve_gate";
    payload: unknown;
  };
}

export interface SpatialPlanStep {
  stepNumber: number;
  operation: string;
  description: string;
  requiresApproval: boolean;
  layerInputs?: string[];
}

export interface CopilotPlanProposal {
  id: string;
  title: string;
  summary: string;
  steps: SpatialPlanStep[];
}

export interface CopilotComponentProps {
  messages?: CopilotMessage[];
  currentIntent?: string;
  planProposal?: CopilotPlanProposal | null;
  isThinking?: boolean;
  onSendMessage?: (content: string) => void;
  onAcceptPlan?: (plan: CopilotPlanProposal) => void;
  onQuickPromptClick?: (prompt: string) => void;
}

