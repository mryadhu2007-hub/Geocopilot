/**
 * GeoCopilot — Global Shared Types
 * Central type definitions accessible across modules via `@/types`
 */

export type ModuleStatus = "ready" | "stubbed" | "in-development" | "planned";

export interface TeamMemberRole {
  member: string;
  role: string;
  focus: string;
  primaryPath: string;
}

export interface GeoCoordinates {
  lng: number;
  lat: number;
  altitude?: number;
}

export type BoundingBox = [minLng: number, minLat: number, maxLng: number, maxLat: number];

export interface WorkspaceSession {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  activeDatasetId?: string;
  activeWorkflowId?: string;
}
