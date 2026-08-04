# NexusAML — Complete Step-by-Step Implementation Reference

/* ==============================================================
 * Document: PROJECT_DOCUMENTATION.md
 * Purpose: Complete step-by-step developer reference guide detailing architecture,
 *          file responsibilities, Cypher queries, and execution instructions.
 * Author: Praful Kumar (jobspraful@gmail.com) | https://prafulkr.xyz/
 * Created On: 04/08/2026
 * ============================================================== */

This document provides a complete technical walkthrough of the **NexusAML** Financial Crime & Graph Intelligence Application built for the **Wexa AI Take-Home Assignment**.

---

## 1. Project Overview & Requirements Mapping

The assignment requested a graph database application using **CognoDB Cloud** (openCypher over Bolt protocol via `neo4j-driver`).

### 10-Point Compliance Matrix

| # | Requirement | Implementation Summary | Verified File Location |
|---|---|---|---|
| 1 | **Database Layer** | CognoDB Cloud connected via `neo4j-driver` over `bolt+s://` protocol | [`server/db.js`](file:///Applications/MAMP/htdocs/wexa-ai/server/db.js) |
| 2 | **Use Case** | NexusAML: Financial Crime, 4-Hop Money Laundering & UBO Tracing | [`server/queries.js`](file:///Applications/MAMP/htdocs/wexa-ai/server/queries.js) |
| 3 | **Graph Data Model** | 6 Labeled Node types, 5 Relationship types & Mermaid diagram | [`README.md`](file:///Applications/MAMP/htdocs/wexa-ai/README.md) |
| 4 | **Seed Data Script** | Node.js seed script (`npm run seed`) resetting & seeding CognoDB | [`scripts/seed.js`](file:///Applications/MAMP/htdocs/wexa-ai/scripts/seed.js) |
| 5 | **Multi-Hop Cypher** | 4-hop circular transfer loop (`*2..5`) & 6-hop UBO shell chain (`*1..6`) | [`server/queries.js`](file:///Applications/MAMP/htdocs/wexa-ai/server/queries.js) |
| 6 | **Parameterised Queries** | Parameter objects (`$accountId`, `$limit`) passed safely to `session.run()` | [`server/queries.js`](file:///Applications/MAMP/htdocs/wexa-ai/server/queries.js) |
| 7 | **Web Application UI** | React + Cytoscape.js interactive network visualizer & query workbench | [`src/components/GraphCanvas.jsx`](file:///Applications/MAMP/htdocs/wexa-ai/src/components/GraphCanvas.jsx) |
| 8 | **UI/UX Excellence** | Dark glassmorphism theme, node inspector drawer, search & filters | [`src/index.css`](file:///Applications/MAMP/htdocs/wexa-ai/src/index.css) |
| 9 | **Environment Variables** | Secrets (`COGNO_URI`, `COGNO_PASSWORD`) read via `dotenv` & git-ignored | [`server/db.js`](file:///Applications/MAMP/htdocs/wexa-ai/server/db.js) |
| 10 | **Deliverables** | GitHub Repo URL, README with "Why Graph DB?", and requirement PDF | [`README.md`](file:///Applications/MAMP/htdocs/wexa-ai/README.md) |

---

## 2. Step-by-Step Implementation Timeline

### Step 1: Environment & Project Setup
- Created `package.json` with dependencies: `express`, `neo4j-driver`, `dotenv`, `cors`, `react`, `react-dom`, `vite`, `@tailwindcss/vite`, `cytoscape`, `lucide-react`.
- Configured `.env.example` and `.gitignore` to prevent secret credentials from being committed.

### Step 2: Database Layer & Driver Initialization
- Built [`server/db.js`](file:///Applications/MAMP/htdocs/wexa-ai/server/db.js) using the official `neo4j-driver`. Handles connection health checks, integer formatting, and parameterised Cypher execution over Bolt protocol.

### Step 3: Graph Data Seeding Script
- Created [`scripts/seed.js`](file:///Applications/MAMP/htdocs/wexa-ai/scripts/seed.js). When run via `npm run seed`, it clears the database (`MATCH (n) DETACH DELETE n`) and creates realistic financial network nodes:
  - **4-Hop Circular Laundering**: `ACC-101` -> `ACC-102` ($450k) -> `ACC-103` ($445k) -> `ACC-104` ($440k) -> `ACC-101` ($435k)
  - **UBO Corporate Hierarchy**: `Viktor Vance` (Sanctioned) -> `Apex Global` (BVI) -> `BlueSky Logistics` (Panama) -> `Aegis Capital` (Malta) -> `ACC-101`
  - **Synthetic Ring**: `ACC-111`, `ACC-112`, `ACC-113` sharing device `FP-MACBOOK-PRO-88492` and address `100 Panama Offshore Way`.

### Step 4: Express API Server
- Built [`server/index.js`](file:///Applications/MAMP/htdocs/wexa-ai/server/index.js) running on port `3098`. Provides `/api/health`, `/api/graph`, `/api/detect/circular`, `/api/detect/ubo`, and `/api/detect/infrastructure`. Includes automatic mock fallback.

### Step 5: Frontend UI & Interactive Network Visualizer
- Created [`src/components/GraphCanvas.jsx`](file:///Applications/MAMP/htdocs/wexa-ai/src/components/GraphCanvas.jsx) using Cytoscape.js for node visualization, search filtering, layout switching (`Tree`, `Concentric`, `Circular`), and node attribute drawer.
- Created [`src/components/FraudWorkbench.jsx`](file:///Applications/MAMP/htdocs/wexa-ai/src/components/FraudWorkbench.jsx) for running preset multi-hop Cypher queries and inspecting returned paths.
- Created [`src/components/SqlVsGraphExplainer.jsx`](file:///Applications/MAMP/htdocs/wexa-ai/src/components/SqlVsGraphExplainer.jsx) detailing why openCypher outperforms SQL recursive CTEs.
- Created [`src/components/Footer.jsx`](file:///Applications/MAMP/htdocs/wexa-ai/src/components/Footer.jsx) with developer details (Praful Kumar) and portfolio link ([https://prafulkr.xyz/](https://prafulkr.xyz/)).

### Step 6: GitHub Remote Push & Verification
- Initialized git, committed all files (including requirement PDF `954b5d66-2f75-47a6-b18e-0f004c82a7e3.pdf`), and pushed to GitHub repository [`https://github.com/krpraful/wexa-ai.git`](https://github.com/krpraful/wexa-ai.git).

---

## 3. Comprehensive File Specifications

### 1. `server/db.js`
- **Purpose**: Connection pool manager to CognoDB Cloud over `bolt+s://`.
- **Functions**:
  - `getDriver()`: Initializes singleton `neo4j.driver()` instance.
  - `verifyConnection()`: Runs `getServerInfo()` health check.
  - `executeCypher(cypher, params)`: Opens driver session and runs parameterised Cypher query.
  - `formatRecords(records)`: Converts Neo4j Record objects and Neo4j Integer types to native JavaScript types.

### 2. `server/queries.js`
- **Purpose**: Parameterised Cypher query registry and SQL comparison metrics.
- **Queries Included**:
  - `GET_FULL_GRAPH`: Topology fetch query up to `$limit`.
  - `DETECT_CIRCULAR_FUNDS`: Multi-hop circular money laundering loop detection (`*2..5`).
  - `DETECT_UBO_HIERARCHY`: Ultimate beneficial owner shell company ownership chain traversal (`*1..6`).
  - `DETECT_SHARED_INFRASTRUCTURE`: Shared IP address, device fingerprint, and physical address cluster discovery.

### 3. `server/index.js`
- **Purpose**: Express API server running on port `3098`.
- **API Routes**:
  - `GET /api/health` -> Returns DB status, latency, developer details, and mode.
  - `GET /api/graph` -> Returns node and relationship JSON for Cytoscape.
  - `GET /api/detect/circular` -> Triggers multi-hop circular laundering detection.
  - `GET /api/detect/ubo` -> Triggers shell company UBO chain resolution.
  - `GET /api/detect/infrastructure` -> Triggers synthetic identity ring discovery.

### 4. `scripts/seed.js`
- **Purpose**: Database reset & population script.
- **Execution**: `npm run seed` or `node scripts/seed.js`.
- **Action**: Clears existing data (`MATCH (n) DETACH DELETE n`) and populates 18 nodes and 16 relationships.

### 5. `src/App.jsx`
- **Purpose**: Root React component managing active tab state (`visualizer` \| `workbench` \| `explainer`), DB connection polling, and navbar/footer layout rendering.

### 6. `src/components/GraphCanvas.jsx`
- **Purpose**: Interactive network visualization component using Cytoscape.js.
- **Features**:
  - Node color coding by label (`Person`, `Company`, `Account`, `Address`, `IP`, `Device`).
  - Risk indicators for sanctioned entities (`isSanctioned: true`) and shell companies (`isShellCompany: true`).
  - Node selection drawer displaying attributes and node IDs.
  - Real-time search filtering by name, ID, or account number.
  - Built-in default fallback dataset for guaranteed rendering before API fetch.

### 7. `src/components/FraudWorkbench.jsx`
- **Purpose**: Cypher query execution workbench.
- **Features**:
  - Preset runners for 4-hop circular laundering, UBO tracing, and synthetic identity rings.
  - Live parameterised openCypher code inspector.
  - Execution result output panel formatting returned paths.

### 8. `src/components/SqlVsGraphExplainer.jsx`
- **Purpose**: Interactive architectural evaluation view explaining why graph databases outperform relational SQL schemas for multi-hop graph problems.

### 9. `src/components/Footer.jsx`
- **Purpose**: Page footer displaying developer credit (Praful Kumar), Wexa AI assignment note, and portfolio link ([https://prafulkr.xyz/](https://prafulkr.xyz/)).

### 10. `vite.config.js`
- **Purpose**: Vite build configuration.
- **Ports**: Dev server port `3099`, API proxy port `3098`.

---

## 4. How to Run the Application

```bash
# 1. Clone repository
git clone https://github.com/krpraful/wexa-ai.git
cd wexa-ai

# 2. Install dependencies
npm install

# 3. Seed live CognoDB Cloud instance
npm run seed

# 4. Start API server & Vite dev server
npm run dev

# 5. Open browser at http://localhost:3099
```

---

## 5. Developer & Contact Info

- **Developer**: Praful Kumar
- **Email**: [jobspraful@gmail.com](mailto:jobspraful@gmail.com)
- **Website**: [https://prafulkr.xyz/](https://prafulkr.xyz/)
- **GitHub Repository**: [https://github.com/krpraful/wexa-ai](https://github.com/krpraful/wexa-ai)
