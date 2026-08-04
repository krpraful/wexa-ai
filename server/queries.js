/* ==============================================================
 * Script: server/queries.js
 * Purpose: Central openCypher query registry for multi-hop money laundering detection,
 *          UBO shell company tracing, synthetic identity discovery, and SQL comparison docs.
 * Author: Praful Kumar
 * Created On: 04/08/2026
 *
 * Modification History:
 * - 04/08/2026 : Added parameterised Cypher queries for 4-hop circular loops and UBO chains
 *
 * Notes:
 * - Queries are parameterised ($limit, $accountId) to eliminate Cypher injection risks.
 * ============================================================== */

export const QUERIES = {
  // Fetch overall network topology (Nodes & Relationships) for interactive graph explorer
  GET_FULL_GRAPH: {
    name: 'Full Network Graph',
    description: 'Retrieves all nodes and relationships up to limit for interactive network topology exploration.',
    cypher: `
      MATCH (n)
      OPTIONAL MATCH (n)-[r]->(m)
      RETURN n, r, m
      LIMIT $limit
    `,
    params: { limit: 150 },
    sqlComparison: 'Requires multiple SELECT statements across 6+ tables and manual join stitching on backend.'
  },

  // 1. Multi-hop Circular Funds Traversal (Layering Detection)
  // Requirement: Multi-hop traversal (2+ hops)
  DETECT_CIRCULAR_FUNDS: {
    name: 'Multi-Hop Circular Funds Traversal (Money Laundering Layering)',
    description: 'Detects circular transfer loops where funds originate from an account, pass through 2 to 5 intermediate accounts, and return to the source.',
    cypher: `
      MATCH path = (origin:Account)-[r:TRANSFERRED*2..5]->(origin)
      WITH origin, path, r, reduce(total = 0.0, tx IN r | total + toFloat(tx.amount)) AS totalVolume
      RETURN origin, path, totalVolume, length(path) AS hopCount
      ORDER BY totalVolume DESC
      LIMIT $limit
    `,
    params: { limit: 20 },
    sqlComparison: 'Relational databases require recursive Common Table Expressions (CTEs) or multiple self-joins with fixed hop depth limits, leading to severe query complexity and exponential execution slowdown.'
  },

  // 2. Ultimate Beneficial Owner (UBO) Shell Company Hierarchy Tracing
  DETECT_UBO_HIERARCHY: {
    name: 'Ultimate Beneficial Owner (UBO) Shell Hierarchy Tracing',
    description: 'Traces multi-tier corporate ownership chains through offshore holding companies to reveal the ultimate individual owner.',
    cypher: `
      MATCH path = (owner:Person)-[:BENEFICIAL_OWNER*1..6]->(target:Company)
      WHERE target.isShellCompany = true OR owner.riskScore > 75
      RETURN owner, target, path, length(path) AS tierCount
      ORDER BY tierCount DESC
      LIMIT $limit
    `,
    params: { limit: 20 },
    sqlComparison: 'SQL requires multi-table self-joins or recursive CTEs with joins across Persons, Companies, and Ownership tables. Arbitrary-depth path traversal in Cypher (`*1..6`) is natively indexed by graph adjacency lists.'
  },

  // 3. Synthetic Identity & Shared Infrastructure Ring Detection
  DETECT_SHARED_INFRASTRUCTURE: {
    name: 'Synthetic Identity Ring & Shared Infrastructure Discovery',
    description: 'Uncovers clusters of separate accounts that secretly share physical addresses, IP addresses, or device fingerprints.',
    cypher: `
      MATCH (a1:Account)-[:LOGGED_IN_FROM|USED_DEVICE|REGISTERED_AT]->(infra)<-[:LOGGED_IN_FROM|USED_DEVICE|REGISTERED_AT]-(a2:Account)
      WHERE a1.id < a2.id
      RETURN a1, infra, a2, labels(infra)[0] AS infraType
      LIMIT $limit
    `,
    params: { limit: 30 },
    sqlComparison: 'In SQL, finding accounts sharing N different entity types requires separate UNION queries across Account_IP, Account_Device, and Account_Address tables. Graph databases treat entity attributes as first-class nodes.'
  },

  // 4. Shortest Risk Path Traversal to Sanctioned Entities
  SHORTEST_PATH_TO_SANCTIONED: {
    name: 'Shortest Risk Path Traversal to Sanctioned Entity',
    description: 'Calculates the shortest transaction/relationship path from a given account or person to any sanctioned entity.',
    cypher: `
      MATCH (start:Account {id: $accountId}), (sanctioned:Person {isSanctioned: true})
      MATCH path = shortestPath((start)-[*1..6]-(sanctioned))
      RETURN start, sanctioned, path, length(path) AS riskDistance
    `,
    params: { accountId: 'ACC-101' },
    sqlComparison: 'Shortest path algorithms (Dijkstra/BFS) are natively implemented in graph query engines. In SQL, shortest path requires complex external application code pulling massive datasets or stored procedures.'
  },

  // Search node by ID or term
  SEARCH_NODES: {
    name: 'Search Entities',
    description: 'Search accounts, persons, companies, or infrastructure by name or ID.',
    cypher: `
      MATCH (n)
      WHERE n.id CONTAINS $query OR n.name CONTAINS $query OR n.accountNumber CONTAINS $query
      RETURN n
      LIMIT 20
    `,
    params: { query: '' }
  }
};
