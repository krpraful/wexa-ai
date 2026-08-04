/* ==============================================================
 * Script: server/index.js
 * Purpose: Express API server endpoints providing live CognoDB graph traversal API
 *          routes and fallback demo data handler for non-technical evaluation.
 * Author: Praful Kumar
 * Created On: 04/08/2026
 *
 * Modification History:
 * - 04/08/2026 : Implemented REST endpoints for graph topology & AML detection
 *
 * Notes:
 * - CORS enabled; handles graceful connection errors if database is unreachable.
 * ============================================================== */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { executeCypher, formatRecords, verifyConnection, getConnectionState } from './db.js';
import { QUERIES } from './queries.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// In-Memory Mock Graph dataset for smooth initial evaluation fallback
const MOCK_GRAPH_DATA = {
  nodes: [
    { id: 'PER-001', label: 'Person', name: 'Viktor Vance', riskScore: 98, isSanctioned: true, nationality: 'CYP' },
    { id: 'PER-002', label: 'Person', name: 'Elena Rostova', riskScore: 88, isSanctioned: false, nationality: 'MLT' },
    { id: 'CMP-101', label: 'Company', name: 'Apex Global Holdings Ltd', isShellCompany: true, riskScore: 92, jurisdiction: 'BVI' },
    { id: 'CMP-102', label: 'Company', name: 'BlueSky Logistics LLC', isShellCompany: true, riskScore: 85, jurisdiction: 'Panama' },
    { id: 'CMP-103', label: 'Company', name: 'Aegis Capital Group', isShellCompany: true, riskScore: 78, jurisdiction: 'Malta' },
    { id: 'ACC-101', label: 'Account', accountNumber: 'CH-9910-2281-01', bank: 'Credit Helvete', balance: 1450000, riskScore: 89, flag: 'SUSPICIOUS_CIRCULAR' },
    { id: 'ACC-102', label: 'Account', accountNumber: 'CY-8820-1102-02', bank: 'Bank of Nicosia', balance: 450000, riskScore: 84, flag: 'SUSPICIOUS_CIRCULAR' },
    { id: 'ACC-103', label: 'Account', accountNumber: 'PA-3390-4419-03', bank: 'Banmo Panama', balance: 445000, riskScore: 82, flag: 'SUSPICIOUS_CIRCULAR' },
    { id: 'ACC-104', label: 'Account', accountNumber: 'MT-1102-7741-04', bank: 'Valletta Trust', balance: 440000, riskScore: 85, flag: 'SUSPICIOUS_CIRCULAR' },
    { id: 'ACC-108', label: 'Account', accountNumber: 'US-1029-4481-08', bank: 'JPMorgan Chase', balance: 310000, riskScore: 91, flag: 'SANCTIONED_EXPOSURE' },
    { id: 'ACC-109', label: 'Account', accountNumber: 'US-8830-1192-09', bank: 'Citi Commercial', balance: 180000, riskScore: 88, flag: 'SANCTIONED_EXPOSURE' },
    { id: 'ACC-110', label: 'Account', accountNumber: 'CH-4410-9921-10', bank: 'UBS Global', balance: 520000, riskScore: 96, flag: 'SANCTIONED_EXPOSURE' },
    { id: 'ACC-111', label: 'Account', accountNumber: 'US-7710-5502-11', bank: 'Wells Fargo', balance: 95000, riskScore: 80, flag: 'SYNTHETIC_RING' },
    { id: 'ACC-112', label: 'Account', accountNumber: 'US-7710-5503-12', bank: 'Wells Fargo', balance: 112000, riskScore: 82, flag: 'SYNTHETIC_RING' },
    { id: 'ACC-113', label: 'Account', accountNumber: 'US-7710-5504-13', bank: 'Wells Fargo', balance: 88000, riskScore: 79, flag: 'SYNTHETIC_RING' },
    { id: 'ADD-001', label: 'Address', street: '100 Panama Offshore Way, Suite 404', country: 'Panama' },
    { id: 'IP-001', label: 'IPAddress', ip: '192.168.1.100', isVpn: true, country: 'Panama' },
    { id: 'DEV-8849', label: 'Device', deviceFingerprint: 'FP-MACBOOK-PRO-88492-PAN', deviceType: 'Laptop' }
  ],
  relationships: [
    // 4-hop Circular Loop
    { id: 'R1', source: 'ACC-101', target: 'ACC-102', type: 'TRANSFERRED', amount: 450000, txnId: 'TXN-9001' },
    { id: 'R2', source: 'ACC-102', target: 'ACC-103', type: 'TRANSFERRED', amount: 445000, txnId: 'TXN-9002' },
    { id: 'R3', source: 'ACC-103', target: 'ACC-104', type: 'TRANSFERRED', amount: 440000, txnId: 'TXN-9003' },
    { id: 'R4', source: 'ACC-104', target: 'ACC-101', type: 'TRANSFERRED', amount: 435000, txnId: 'TXN-9004' },

    // UBO Hierarchy
    { id: 'R5', source: 'PER-001', target: 'CMP-101', type: 'BENEFICIAL_OWNER', sharesPercentage: 100 },
    { id: 'R6', source: 'CMP-101', target: 'CMP-102', type: 'BENEFICIAL_OWNER', sharesPercentage: 85 },
    { id: 'R7', source: 'CMP-102', target: 'CMP-103', type: 'BENEFICIAL_OWNER', sharesPercentage: 90 },
    { id: 'R8', source: 'CMP-103', target: 'ACC-101', type: 'BENEFICIAL_OWNER', sharesPercentage: 100 },

    // Sanctioned Path
    { id: 'R9', source: 'PER-001', target: 'ACC-110', type: 'OWNS_ACCOUNT' },
    { id: 'R10', source: 'ACC-108', target: 'ACC-109', type: 'TRANSFERRED', amount: 800000 },
    { id: 'R11', source: 'ACC-109', target: 'ACC-110', type: 'TRANSFERRED', amount: 780000 },

    // Shared Infra Synthetic Ring
    { id: 'R12', source: 'ACC-111', target: 'IP-001', type: 'LOGGED_IN_FROM' },
    { id: 'R13', source: 'ACC-112', target: 'IP-001', type: 'LOGGED_IN_FROM' },
    { id: 'R14', source: 'ACC-113', target: 'IP-001', type: 'LOGGED_IN_FROM' },
    { id: 'R15', source: 'ACC-111', target: 'DEV-8849', type: 'USED_DEVICE' },
    { id: 'R16', source: 'ACC-112', target: 'DEV-8849', type: 'USED_DEVICE' },
    { id: 'R17', source: 'ACC-111', target: 'ADD-001', type: 'REGISTERED_AT' },
    { id: 'R18', source: 'ACC-113', target: 'ADD-001', type: 'REGISTERED_AT' }
  ]
};

// Health and DB status check
app.get('/api/health', async (req, res) => {
  const status = await verifyConnection();
  const connState = getConnectionState();
  res.json({
    status: status.isConnected ? 'CONNECTED' : 'DISCONNECTED',
    driver: 'neo4j-driver (openCypher / Bolt)',
    author: 'Praful Kumar (jobspraful@gmail.com)',
    uri: connState.uri,
    user: connState.user,
    error: status.error || null,
    isMockFallback: !status.isConnected
  });
});

// GET full graph dataset
app.get('/api/graph', async (req, res) => {
  const status = await verifyConnection();
  if (!status.isConnected) {
    // Return mock data fallback
    return res.json({
      success: true,
      mode: 'MOCK_FALLBACK',
      message: 'Operating in pre-loaded Demo mode. Configure CognoDB env variables to connect to live graph instance.',
      nodes: MOCK_GRAPH_DATA.nodes,
      relationships: MOCK_GRAPH_DATA.relationships
    });
  }

  try {
    const records = await executeCypher(QUERIES.GET_FULL_GRAPH.cypher, QUERIES.GET_FULL_GRAPH.params);
    const formatted = formatRecords(records);

    // Extract unique nodes and relationships
    const nodesMap = new Map();
    const relsMap = new Map();

    formatted.forEach(item => {
      if (item.n && item.n.id) {
        nodesMap.set(item.n.id, {
          id: item.n.id,
          label: item.n.labels ? item.n.labels[0] : 'Entity',
          ...item.n.properties
        });
      }
      if (item.m && item.m.id) {
        nodesMap.set(item.m.id, {
          id: item.m.id,
          label: item.m.labels ? item.m.labels[0] : 'Entity',
          ...item.m.properties
        });
      }
      if (item.r && item.r.id) {
        relsMap.set(item.r.id, {
          id: item.r.id,
          source: item.r.startNodeId || item.n?.id,
          target: item.r.endNodeId || item.m?.id,
          type: item.r.type,
          ...item.r.properties
        });
      }
    });

    res.json({
      success: true,
      mode: 'LIVE_COGNO_DB',
      nodes: Array.from(nodesMap.values()),
      relationships: Array.from(relsMap.values())
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, mode: 'ERROR_FALLBACK' });
  }
});

// Multi-hop Circular Money Laundering Detection Endpoint
app.get('/api/detect/circular', async (req, res) => {
  const status = await verifyConnection();
  if (!status.isConnected) {
    return res.json({
      success: true,
      mode: 'MOCK_FALLBACK',
      queryInfo: QUERIES.DETECT_CIRCULAR_FUNDS,
      results: [
        {
          originAccountId: 'ACC-101',
          originAccountNo: 'CH-9910-2281-01',
          hopCount: 4,
          totalVolume: 1770000,
          cyclePath: ['ACC-101', 'ACC-102', 'ACC-103', 'ACC-104', 'ACC-101'],
          pattern: '4-Hop Circular Layering Loop (Switzerland -> Cyprus -> Panama -> Malta -> Switzerland)'
        }
      ]
    });
  }

  try {
    const records = await executeCypher(QUERIES.DETECT_CIRCULAR_FUNDS.cypher, QUERIES.DETECT_CIRCULAR_FUNDS.params);
    const formatted = formatRecords(records);
    res.json({
      success: true,
      mode: 'LIVE_COGNO_DB',
      queryInfo: QUERIES.DETECT_CIRCULAR_FUNDS,
      rawRecords: formatted
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// UBO Shell Hierarchy Tracing Endpoint
app.get('/api/detect/ubo', async (req, res) => {
  const status = await verifyConnection();
  if (!status.isConnected) {
    return res.json({
      success: true,
      mode: 'MOCK_FALLBACK',
      queryInfo: QUERIES.DETECT_UBO_HIERARCHY,
      results: [
        {
          owner: 'Viktor Vance (Sanctioned Individual)',
          tierCount: 4,
          ownershipChain: [
            'Viktor Vance (Person)',
            'Apex Global Holdings Ltd (BVI Shell Co - 100%)',
            'BlueSky Logistics LLC (Panama Shell Co - 85%)',
            'Aegis Capital Group (Malta Shell Co - 90%)',
            'Target Account ACC-101 (Credit Helvete)'
          ]
        }
      ]
    });
  }

  try {
    const records = await executeCypher(QUERIES.DETECT_UBO_HIERARCHY.cypher, QUERIES.DETECT_UBO_HIERARCHY.params);
    res.json({
      success: true,
      mode: 'LIVE_COGNO_DB',
      queryInfo: QUERIES.DETECT_UBO_HIERARCHY,
      rawRecords: formatRecords(records)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Synthetic Identity Ring Endpoint
app.get('/api/detect/infrastructure', async (req, res) => {
  const status = await verifyConnection();
  if (!status.isConnected) {
    return res.json({
      success: true,
      mode: 'MOCK_FALLBACK',
      queryInfo: QUERIES.DETECT_SHARED_INFRASTRUCTURE,
      results: [
        {
          sharedInfra: 'IP-001 (192.168.1.100 - Panama VPN)',
          accountsSharing: ['ACC-111 (Wells Fargo)', 'ACC-112 (Wells Fargo)', 'ACC-113 (Wells Fargo)'],
          riskFlag: 'Synthetic Identity Fraud Cluster (Shared Device FP-MACBOOK-PRO-88492 & Address 100 Panama Way)'
        }
      ]
    });
  }

  try {
    const records = await executeCypher(QUERIES.DETECT_SHARED_INFRASTRUCTURE.cypher, QUERIES.DETECT_SHARED_INFRASTRUCTURE.params);
    res.json({
      success: true,
      mode: 'LIVE_COGNO_DB',
      queryInfo: QUERIES.DETECT_SHARED_INFRASTRUCTURE,
      rawRecords: formatRecords(records)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Query Workbench definitions endpoint
app.get('/api/queries', (req, res) => {
  res.json(QUERIES);
});

app.listen(PORT, () => {
  console.log(`NexusAML API Server running on port ${PORT}`);
});
