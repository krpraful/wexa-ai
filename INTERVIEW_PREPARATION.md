# NexusAML — Complete Technical Interview Preparation Guide

/* ==============================================================
 * Script: INTERVIEW_PREPARATION.md
 * Purpose: Complete interview preparation questions & perfect expert answers for 
 *          Wexa AI Take-Home Assignment evaluation.
 * Author: Praful Kumar (jobspraful@gmail.com) | https://prafulkr.xyz/
 * Created On: 04/08/2026
 * ============================================================== */

This reference guide contains the top 14 technical interview questions and expert answers based on your **NexusAML** Financial Crime & Graph Intelligence application built for **Wexa AI**.

---

## 📌 Table of Contents
1. [Project Overview & Architecture](#1-project-overview--architecture)
2. [Graph Database vs. Relational (RDBMS) Deep Dive](#2-graph-database-vs-relational-rdbms-deep-dive)
3. [CognoDB Cloud & openCypher Queries](#3-cognodb-cloud--opencypher-queries)
4. [Full-Stack Implementation & Scalability](#4-full-stack-implementation--scalability)

---

## 1. Project Overview & Architecture

### Q1: Can you give a 2-minute elevator pitch of what you built for the Wexa AI assignment?
> **Perfect Answer**:  
> "For the Wexa AI assignment, I built **NexusAML** — a full-stack financial crime and graph intelligence application backed by **CognoDB Cloud** using openCypher over the official Neo4j Bolt driver (`bolt+s://`).  
>
> Financial fraud networks are inherently graph-structured. Traditional relational databases fail at detecting multi-hop layering schemes because relational JOINs scale exponentially ($O(N^k)$) with path depth. NexusAML models financial entities — Persons, Companies, Accounts, IP Addresses, and Devices — as a property graph to perform real-time pattern detection across 3 key financial crime typologies:
> 1. **4-Hop Circular Money Laundering Loops** (funds originating from Account A passing through B, C, D, and returning to A).
> 2. **6-Hop Ultimate Beneficial Owner (UBO) Tracing** through offshore shell companies in secrecy jurisdictions to reveal sanctioned individuals.
> 3. **Synthetic Identity Fraud Rings** (clusters of accounts secretly sharing physical addresses, VPN IPs, or device fingerprints).
>
> The app features an Express backend (port 3098), a Node.js seeding script (`npm run seed`), and a React + Cytoscape.js visualizer (port 3099) with search filters, node inspectors, and Cypher query execution suites."

---

### Q2: Why did you choose Anti-Money Laundering (AML) and UBO Tracing as your graph use case?
> **Perfect Answer**:  
> "I chose financial crime and AML because it represents the gold standard use case where graph databases hold a structural mathematical advantage over relational databases:
> - **In RDBMS**: Finding multi-hop circular transfers or 5-tier offshore shell company chains requires writing complex recursive Common Table Expressions (CTEs) or multi-table JOINs that lock tables and degrade performance.
> - **In Graph DB**: Relationships are stored as first-class physical pointers (**index-free adjacency**). Traversing a 4-hop transfer loop or 6-tier ownership chain takes microseconds regardless of total database size because graph engines chase pointers in $O(1)$ memory time rather than building expensive hash joins."

---

### Q3: Explain the overall system architecture of NexusAML.
> **Perfect Answer**:  
> "The architecture follows a clean 3-tier decoupled design:
> 1. **Database Layer**: **CognoDB Cloud** (managed graph database speaking openCypher over Bolt protocol 5.4).
> 2. **Backend API Layer**: Node.js + Express server running on port `3098`. It uses official `neo4j-driver` (v5.x) connection pooling, executes parameterised openCypher queries, and transforms graph records into clean JSON endpoints (`/api/health`, `/api/graph`, `/api/detect/circular`, `/api/detect/ubo`, `/api/detect/infrastructure`).
> 3. **Frontend UI Layer**: React + Vite application running on port `3099`. It uses **Cytoscape.js** for canvas rendering, Cytoscape tree/ring layout algorithms, dark glassmorphism styling, search filters, and an entity attribute drawer."

---

## 2. Graph Database vs. Relational (RDBMS) Deep Dive

### Q4: What is "Index-Free Adjacency" and why does it make graph databases faster than SQL for multi-hop queries?
> **Perfect Answer**:  
> "In a traditional RDBMS, relationships are abstract foreign keys. To connect `Table A` to `Table B`, the database must perform an index lookup ($O(\log N)$) or hash join ($O(N)$) for every step. In a 4-hop query, performance scales exponentially as $O(N^4)$.
>
> In a graph database like CognoDB, nodes store direct memory references (pointers) to their adjacent relationships and neighbor nodes. This is called **Index-Free Adjacency**. Traversing from Node A to Node B is a simple pointer dereference operating in **$O(1)$ constant time**. As your database grows from 100k nodes to 100M nodes, 4-hop traversal latency stays constant."

---

### Q5: How does openCypher compare to SQL for a 4-hop circular money laundering query?
> **Perfect Answer**:  
> - **In SQL (Recursive CTE)**:
>   ```sql
>   WITH RECURSIVE TransferPath AS (
>     SELECT source_acc, target_acc, amount, 1 AS depth, ARRAY[source_acc] AS path
>     FROM transactions WHERE source_acc = 'ACC-101'
>     UNION ALL
>     SELECT t.source_acc, t.target_acc, t.amount, tp.depth + 1, tp.path || t.source_acc
>     FROM transactions t
>     JOIN TransferPath tp ON t.source_acc = tp.target_acc
>     WHERE tp.depth < 5 AND NOT (t.source_acc = ANY(tp.path))
>   )
>   SELECT * FROM TransferPath WHERE target_acc = 'ACC-101';
>   ```
>   *Drawbacks*: Requires 15+ lines of SQL, manual array tracking for cycle prevention, temporary table allocations, and heavy RAM locking.
>
> - **In openCypher**:
>   ```cypher
>   MATCH path = (origin:Account)-[r:TRANSFERRED*2..5]->(origin)
>   RETURN origin, path, length(path) AS hopCount;
>   ```
>   *Advantages*: Cypher natively treats variable-length paths (`*2..5`) as built-in patterns, eliminating cycle tracking boilerplate and running in milliseconds.

---

## 3. CognoDB Cloud & openCypher Queries

### Q6: What protocol does CognoDB Cloud use and how did you connect to it?
> **Perfect Answer**:  
> "CognoDB Cloud speaks openCypher over the **Bolt protocol (Bolt 5.0–5.4)**. Because it complies with openCypher standards, I used the official Neo4j JavaScript driver (`neo4j-driver`).  
> I established a secure encrypted connection via `bolt+s://db-1716681d.databases.cognodb.com` using basic authentication (`cognodb` user + generated instance password). Connection settings include driver session pooling and connection lifetime parameters."

---

### Q7: Walk us through your UBO (Ultimate Beneficial Owner) Cypher query.
> **Perfect Answer**:  
> "The UBO query unmasks individuals hiding behind offshore shell companies:
> ```cypher
> MATCH path = (owner:Person)-[:BENEFICIAL_OWNER*1..6]->(target:Company)
> WHERE target.isShellCompany = true OR owner.riskScore > 75
> RETURN owner, target, path, length(path) AS tierCount
> ORDER BY tierCount DESC
> LIMIT $limit
> ```
> This query matches any `Person` connected to a `Company` through 1 to 6 hops of `BENEFICIAL_OWNER` relationships. It filters for target companies flagged as shell entities (`isShellCompany = true`) or owners with high risk scores (> 75), returning the complete ownership path and tier depth."

---

### Q8: How did your parameterised Cypher queries prevent Cypher Injection?
> **Perfect Answer**:  
> "Just like SQL injection, Cypher injection occurs when string concatenation is used in query strings. To eliminate this risk, all queries in `server/queries.js` use parameter placeholders (e.g., `$limit`, `$accountId`) passed safely to `session.run(cypherText, parametersObject)`:
> ```javascript
> const records = await executeCypher(QUERIES.DETECT_CIRCULAR_FUNDS.cypher, { limit: 20 });
> ```
> CognoDB parses and compiles the execution plan once, treating inputs strictly as literal values rather than executable Cypher clauses."

---

## 4. Full-Stack Implementation & Scalability

### Q9: How did you structure your Node.js database seed script (`npm run seed`)?
> **Perfect Answer**:  
> "The seed script (`scripts/seed.js`) provides an automated, idempotent setup:
> 1. Connects to CognoDB Cloud over Bolt driver.
> 2. Clears existing data using `MATCH (n) DETACH DELETE n`.
> 3. Creates 18 nodes across 6 labels (`Person`, `Company`, `Account`, `Address`, `IPAddress`, `Device`).
> 4. Establishes 16 relationships (`TRANSFERRED`, `BENEFICIAL_OWNER`, `OWNS_ACCOUNT`, `LOGGED_IN_FROM`, `USED_DEVICE`, `REGISTERED_AT`).
> 5. Logs success confirmation and closes the driver session cleanly."

---

### Q10: How did you implement real-time interactive network visualization in React?
> **Perfect Answer**:  
> "I integrated **Cytoscape.js** into a custom React component (`GraphCanvas.jsx`):
> - **State Stability**: Used `useMemo` for nodes and relationships datasets to prevent Cytoscape re-creation loops.
> - **Entity Color Coding**: Mapped entity types to distinct visual colors (Person: Indigo, Company: Amber, Account: Emerald, Address: Rose, IP: Purple, Device: Sky, Sanctioned: Red).
> - **Interactivity**: Added real-time search filtering, type dropdown filters, layout switching (`Tree`, `Concentric`, `Circular`), and a node attribute inspector drawer."

---

### Q11: How does your application handle backend offline or database disconnection scenarios?
> **Perfect Answer**:  
> "I built a resilient multi-layered fallback system:
> 1. **Backend Level**: If CognoDB is unreachable, Express API endpoints gracefully return a pre-loaded in-memory mock dataset (`mode: 'MOCK_FALLBACK'`).
> 2. **Frontend Level**: If the Express server is completely offline, `GraphCanvas.jsx` loads a built-in default graph dataset, ensuring evaluators always see an operational UI.
> 3. **Status Polling**: `App.jsx` polls `/api/health` every 5 seconds to update the status pill (`🟢 CognoDB Cloud (Live)` vs `🟡 Demo Mode (Offline)`)."

---

### Q12: How would you scale this application to handle 100 Million transactions?
> **Perfect Answer**:  
> "To scale NexusAML to production scale (100M+ nodes & edges):
> 1. **Database Level**: Configure Cypher schema indexes on node identifiers (`CREATE INDEX FOR (a:Account) ON (a.id)` and `CREATE INDEX FOR (p:Person) ON (p.id)`).
> 2. **Query Optimization**: Limit path traversal bounds (e.g. `*2..4` instead of unbound `*`), use `LIMIT` clauses, and compute heavy graph analytics (like PageRank or Community Detection) asynchronously using graph data science (GDS) algorithms.
> 3. **Read Replicas**: Distribute read queries across CognoDB read replicas while directing write transactions to the leader node."

---

### Q13: What developer details and documentation did you include for code ownership?
> **Perfect Answer**:  
> "Every custom script contains standardized developer ownership headers:
> ```javascript
> /* ==============================================================
>  * Script: FileName.js
>  * Purpose: Description of feature and API handlers...
>  * Author: Praful Kumar
>  * Created On: 04/08/2026
>  * ============================================================== */
> ```
> I also updated `README.md` and `PROJECT_DOCUMENTATION.md` with complete step-by-step instructions, Mermaid data model diagrams, CognoDB instance configuration, and portfolio links ([https://prafulkr.xyz/](https://prafulkr.xyz/))."

---

### Q14: If you had 2 more weeks to build on this, what features would you add?
> **Perfect Answer**:  
> "If given 2 more weeks, I would add:
> 1. **Time-Windowed Graph Filtering**: Filter transfers by date ranges to detect fast velocity layering (e.g., funds moved through 4 accounts within 10 minutes).
> 2. **Automated Risk Scoring Engine**: Calculate graph-based risk scores using degree centrality and distance to sanctioned nodes.
> 3. **Export SAR Reports**: Add PDF export functionality for Anti-Money Laundering Suspicious Activity Reports (SAR)."

---

## 👨‍💻 Quick Summary of Developer Ownership
- **Developer**: Praful Kumar
- **Email**: [jobspraful@gmail.com](mailto:jobspraful@gmail.com)
- **Website**: [https://prafulkr.xyz/](https://prafulkr.xyz/)
- **GitHub Repository**: [https://github.com/krpraful/wexa-ai](https://github.com/krpraful/wexa-ai)
