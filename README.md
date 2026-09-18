# GeoCopilot — Human-AI Geospatial Workspace

GeoCopilot is an interactive, human-in-the-loop geospatial workspace that unifies AI workflow planning, interactive 2D/3D map visualization, and PostGIS spatial analytics. It enables users to express complex spatial questions in natural language, visually inspect AI-proposed analysis pipelines, approve or modify each execution gate, and explore resulting geospatial layers in real time.

---

## 👥 Team Roles & Module Ownership

To maximize developer velocity during the hackathon and avoid merge conflicts, each contributor owns a designated domain and directory:

| Contributor | Role | Responsibility | Primary Directory |
| :--- | :--- | :--- | :--- |
| **Member 1** | UI/UX Designer | Designs interface in Stitch / Figma; exports visual tokens & final layouts | `src/app/globals.css`, design assets |
| **Member 2** | Frontend & Integration Lead | Maintains Next.js App Router app, dashboard, chat UI, workflow canvas integration, and module wiring | `src/app/`, `src/components/` |
| **Member 3** | Map & Geospatial Lead | Implements MapLibre GL map canvas, vector/raster basemaps, and GeoJSON layer rendering | `src/modules/map/` |
| **Member 4** | Backend & Database Lead | Sets up Supabase, PostGIS spatial tables, API routes, and spatial queries | `src/services/supabase/` |
| **Member 5** | AI & Workflow Lead | Defines spatial plan schemas, prompt orchestration, and structured pipeline steps | `src/modules/copilot/`, `src/modules/workflow/` |

---

## 📁 Directory Structure

```text
geocopilot/
├── .env.example                # Template for environment variables (Supabase, AI keys)
├── .gitignore                  # Git ignore rules for Next.js and secrets
├── next.config.ts              # Next.js configuration
├── package.json                # Dependencies and dev scripts
├── tsconfig.json               # TypeScript strict configuration with `@/*` path alias
├── README.md                   # Project and team architecture documentation
└── src/
    ├── app/                    # Next.js App Router root
    │   ├── globals.css         # Global design tokens and dark geospatial theme
    │   ├── layout.tsx          # Root HTML shell, metadata, and viewport settings
    │   ├── page.tsx            # GeoCopilot workspace dashboard page
    │   └── page.module.css     # CSS module styling for workspace dashboard
    ├── components/             # Reusable, shared UI primitives
    │   └── common/
    │       ├── Header.tsx      # Application navigation bar and branding
    │       ├── Header.module.css
    │       ├── StatusBadge.tsx # Module state indicator (Ready, Stub, In Progress)
    │       ├── StatusBadge.module.css
    │       ├── Card.tsx        # Container card primitive
    │       └── Card.module.css
    ├── modules/                # Feature modules (isolated for team members)
    │   ├── map/                # [Member 3] MapLibre visualization module
    │   │   ├── types.ts        # Map viewport, layers, and coordinate interfaces
    │   │   └── components/
    │   │       ├── MapPlaceholder.tsx
    │   │       └── MapPlaceholder.module.css
    │   ├── workflow/           # [Member 2 & 5] React Flow pipeline module
    │   │   ├── types.ts        # Workflow node, edge, and execution interfaces
    │   │   └── components/
    │   │       ├── WorkflowPlaceholder.tsx
    │   │       └── WorkflowPlaceholder.module.css
    │   ├── copilot/            # [Member 5 & 2] AI reasoning and chat module
    │   │   ├── types.ts        # Chat messages and structured spatial plan schemas
    │   │   └── components/
    │   │       ├── CopilotPlaceholder.tsx
    │   │       └── CopilotPlaceholder.module.css
    │   └── data/               # Geospatial catalog & layer management
    │       ├── types.ts        # Geospatial dataset interfaces
    │       └── components/
    │           ├── DatasetPlaceholder.tsx
    │           └── DatasetPlaceholder.module.css
    ├── services/               # External backend and cloud integrations
    │   └── supabase/           # [Member 4] Supabase & PostGIS integration boundary
    │       ├── client.ts       # Documented Supabase client boundary and env checks
    │       └── types.ts        # Database record and spatial query interfaces
    ├── lib/                    # Shared utilities and application constants
    │   ├── constants.ts        # Team definitions and application metadata
    │   └── utils.ts            # Class name joiner (`cn`) and coordinate formatters
    └── types/                  # Global shared TypeScript contracts
        └── index.ts            # Universal coordinate and workspace types
```

---

## 🚀 How to Run the Project

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional for Local Stub Mode)
```bash
cp .env.example .env.local
```
*(No environment variables are required to run the initial foundation in stub mode).*

### 3. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm run start
```

---

## 🧩 Placeholders & Integration Guide

The following modules are currently clean, typed placeholders to avoid unneeded dependencies in the foundation. Here is how each contributor should integrate their real implementation:

### 1. MapLibre Integration (`src/modules/map/`) — Assigned to Member 3
1. Install MapLibre:
   ```bash
   npm install maplibre-gl
   npm install --save-dev @types/maplibre-gl
   ```
2. In `src/modules/map/components/MapPlaceholder.tsx`:
   - Replace the placeholder markup with a MapLibre GL container (or `react-map-gl/maplibre`).
   - Use the interfaces from `src/modules/map/types.ts` (`MapViewportState`, `MapLayer`).
   - Propagate viewport changes back to the parent via `onViewportChange`.

### 2. React Flow Workflow (`src/modules/workflow/`) — Assigned to Member 2 & 5
1. Install React Flow:
   ```bash
   npm install @xyflow/react
   ```
2. In `src/modules/workflow/components/WorkflowPlaceholder.tsx`:
   - Mount `<ReactFlow>` using the node and edge definitions in `src/modules/workflow/types.ts`.
   - Implement custom nodes for `spatial_filter`, `buffer_geometry`, and `human_approval_gate`.

### 3. AI Copilot (`src/modules/copilot/`) — Assigned to Member 5 & 2
1. Connect your LLM endpoint (OpenAI, Anthropic, or local model) via Next.js Route Handlers (`src/app/api/copilot/route.ts`).
2. Replace `CopilotPlaceholder.tsx` with an active chat session that emits `CopilotPlanProposal` objects defined in `src/modules/copilot/types.ts`.
3. Dispatch confirmed plans to the workflow module.

### 4. Supabase & PostGIS (`src/services/supabase/`) — Assigned to Member 4
1. Install the Supabase client:
   ```bash
   npm install @supabase/supabase-js
   ```
2. Add your project URL and anon key to `.env.local`:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
3. In `src/services/supabase/client.ts`, initialize the client with `createClient(url, key)`.
4. Define your PostGIS RPC endpoints for spatial queries (e.g., `ST_DWithin`, `ST_Intersects`).

### 5. Design System Implementation — Assigned to Member 1
1. Translate Stitch / Figma color palettes, component styles, and layouts into `src/app/globals.css` and CSS module files.
2. Ensure components maintain the shared CSS variable conventions.

---

## 🌿 Git Branching Rules

To prevent code collisions, team members must strictly adhere to the following branch strategy:

1. **Never commit directly to `main`.**
2. Create feature branches prefixed by your area:
   - `feature/maplibre-canvas` (Member 3)
   - `feature/supabase-postgis` (Member 4)
   - `feature/copilot-ai-planner` (Member 5)
   - `feature/workflow-react-flow` (Member 2)
   - `feature/ui-stitch-design` (Member 1)
3. Open Pull Requests into `main` after verifying:
   - `npm run build` succeeds with zero TypeScript errors.
   - All module contracts in `types.ts` remain satisfied.
