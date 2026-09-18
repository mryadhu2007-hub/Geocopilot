<div align="center">

# 🌍 GeoCopilot

**Human-AI Geospatial Workspace**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.10+-yellow?logo=python)](https://python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-green?logo=fastapi)](https://fastapi.tiangolo.com/)

GeoCopilot is an interactive, human-in-the-loop geospatial workspace that unifies **AI workflow planning**, **interactive 2D/3D map visualization**, and **PostGIS spatial analytics**.

</div>

---

## ✨ What It Does

Express complex spatial questions in natural language. GeoCopilot:

- 🤖 **Plans** — AI proposes structured, step-by-step geospatial analysis pipelines
- 👁️ **Visualizes** — Live 2D/3D map canvas powered by MapLibre GL
- ✅ **Collaborates** — Human-in-the-loop approval gates at every critical step
- 📊 **Analyses** — Python/PostGIS backend for deterministic spatial data profiling

---

## 🏗️ Tech Stack

| Layer | Technology |
|:------|:-----------|
| **Frontend** | Next.js 15 (App Router), TypeScript, MapLibre GL |
| **AI Workflow** | React Flow, custom spatial plan schemas |
| **Backend** | Python 3.10+, FastAPI, GeoPandas, Shapely, PyProj |
| **Database** | Supabase (PostgreSQL + PostGIS) |
| **Styling** | CSS Modules, dark geospatial theme |

---

## 👥 Team & Module Ownership

| Contributor | Role | Responsibility | Primary Directory |
|:------------|:-----|:---------------|:------------------|
| **Member 1** | UI/UX Designer | Designs interface in Stitch / Figma; exports visual tokens & final layouts | `src/app/globals.css`, design assets |
| **Member 2** | Frontend & Integration Lead | Maintains Next.js App Router app, dashboard, chat UI, workflow canvas integration, and module wiring | `src/app/`, `src/components/` |
| **Member 3** | Map & Geospatial Lead | Implements MapLibre GL map canvas, vector/raster basemaps, and GeoJSON layer rendering | `src/modules/map/` |
| **Member 4** | Backend & Database Lead | Sets up Supabase, PostGIS spatial tables, API routes, and spatial queries | `src/services/supabase/` |
| **Member 5** | AI & Workflow Lead | Defines spatial plan schemas, prompt orchestration, and structured pipeline steps | `src/modules/copilot/`, `src/modules/workflow/` |

---

## 📁 Directory Structure

```text
geocopilot/
├── .env.example                # Template for environment variables
├── .gitignore                  # Git ignore rules for Next.js, Python & secrets
├── LICENSE                     # MIT License
├── next.config.ts              # Next.js configuration
├── package.json                # Frontend dependencies and dev scripts
├── tsconfig.json               # TypeScript strict configuration with @/* path alias
├── README.md                   # Project documentation (this file)
├── backend/                    # Python FastAPI GIS engine
│   ├── requirements.txt        # Python dependencies
│   ├── README.md               # Backend-specific documentation
│   └── app/
│       ├── main.py             # FastAPI application entry point
│       ├── api/routes.py       # REST API route definitions
│       ├── models/             # Pydantic data models
│       └── services/           # GIS business logic (profiler, geometry, upload)
└── src/
    ├── app/                    # Next.js App Router root
    │   ├── globals.css         # Global design tokens and dark geospatial theme
    │   ├── layout.tsx          # Root HTML shell, metadata, and viewport settings
    │   └── page.tsx            # GeoCopilot workspace dashboard page
    ├── components/common/      # Shared UI primitives (Header, Card, StatusBadge)
    ├── modules/
    │   ├── map/                # MapLibre GL visualization module
    │   ├── workflow/           # React Flow pipeline canvas module
    │   ├── copilot/            # AI reasoning and chat module
    │   ├── workspace/          # Main workspace state and panels
    │   └── data/               # Geospatial catalog & layer management
    ├── services/
    │   ├── supabase/           # Supabase & PostGIS integration
    │   └── gis/                # GIS client utilities
    ├── lib/                    # Shared utilities and application constants
    └── types/                  # Global shared TypeScript contracts
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+
- **Python** 3.10+
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/mryadhu2007-hub/Geocopilot.git
cd Geocopilot
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Install Backend Dependencies

```bash
pip install -r backend/requirements.txt
```

### 4. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in your Supabase and AI API credentials. The app runs in **stub mode** without any credentials.

### 5. Start the Development Servers

**Frontend** (Next.js):
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

**Backend** (FastAPI):
```bash
python -m uvicorn backend.app.main:app --reload --port 8000
```
Open [http://localhost:8000/docs](http://localhost:8000/docs) for the interactive API docs.

---

## 📡 API Overview

| Endpoint | Method | Description |
|:---------|:-------|:------------|
| `/health` | GET | System heartbeat and engine identity |
| `/api/profile` | POST | Profile a geospatial dataset (CRS, geometry validation, readiness score) |
| `/api/upload` | POST | Upload a geospatial file for analysis |

Full API documentation available at `http://localhost:8000/docs` when the backend is running.

---

## 🧩 Module Integration Guide

### MapLibre GL (`src/modules/map/`)
```bash
npm install maplibre-gl
```
Replace `MapPlaceholder.tsx` with a live MapLibre GL container. Use the interfaces from `src/modules/map/types.ts`.

### React Flow Workflow (`src/modules/workflow/`)
```bash
npm install @xyflow/react
```
Mount `<ReactFlow>` with custom nodes for `spatial_filter`, `buffer_geometry`, and `human_approval_gate`.

### AI Copilot (`src/modules/copilot/`)
Connect your LLM (OpenAI / Anthropic / local) via Next.js Route Handlers at `src/app/api/copilot/route.ts`.

### Supabase & PostGIS (`src/services/supabase/`)
```bash
npm install @supabase/supabase-js
```
Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local`.

---

## 🌿 Git Branching Strategy

> **Never commit directly to `main`.**

| Branch | Assigned To |
|:-------|:------------|
| `feature/maplibre-canvas` | Member 3 |
| `feature/supabase-postgis` | Member 4 |
| `feature/copilot-ai-planner` | Member 5 |
| `feature/workflow-react-flow` | Member 2 |
| `feature/ui-stitch-design` | Member 1 |

Open a Pull Request into `main` only after:
- ✅ `npm run build` passes with zero TypeScript errors
- ✅ All module contracts in `types.ts` remain satisfied

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

Built with ❤️ for the GeoCopilot Hackathon

</div>
