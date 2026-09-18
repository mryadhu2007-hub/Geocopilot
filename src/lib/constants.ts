import type { TeamMemberRole } from "@/types";

export const APP_NAME = "GeoCopilot";
export const APP_TAGLINE = "Human-AI Geospatial Workspace";

/**
 * Team architecture definitions mapping roles to their code workspaces.
 * Referenced by contributors to maintain modularity.
 */
export const TEAM_ROLES: TeamMemberRole[] = [
  {
    member: "Member 1",
    role: "UI/UX Designer",
    focus: "Design system in Stitch / Figma to be imported into frontend",
    primaryPath: "Design specifications & styles (src/app/globals.css)",
  },
  {
    member: "Member 2",
    role: "Frontend & Integration Lead",
    focus: "Main Next.js app, dashboard, chat UI, workflow UI, approval UI & module integration",
    primaryPath: "src/app/ & src/components/",
  },
  {
    member: "Member 3",
    role: "MapLibre & Geospatial Visualization",
    focus: "MapLibre GL map instance, vector/raster tile rendering & GeoJSON layers",
    primaryPath: "src/modules/map/",
  },
  {
    member: "Member 4",
    role: "Backend, Supabase & PostGIS",
    focus: "Database schema, GIS query endpoints, PostGIS spatial analysis & Supabase client",
    primaryPath: "src/services/supabase/",
  },
  {
    member: "Member 5",
    role: "AI Workflow Planning & Pitch",
    focus: "Structured workflow generation, spatial plan schema & prompt orchestration",
    primaryPath: "src/modules/copilot/ & src/modules/workflow/",
  },
];
