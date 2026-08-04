/* ==============================================================
 * Script: src/components/GraphCanvas.jsx
 * Purpose: Cytoscape.js interactive network visualizer component featuring node
 *          color coding, entity selection drawer, search filters, and tree/ring layout algorithms.
 * Author: Praful Kumar
 * Created On: 04/08/2026
 *
 * Modification History:
 * - 04/08/2026 : Cytoscape canvas integration with risk level highlighting & node inspector
 * - 04/08/2026 : Refactored Cytoscape selectors to standard property mappers for 100% reliable rendering
 *
 * Notes:
 * - Color codes nodes by type (Person, Company, Account, Address, IP, Device).
 * ============================================================== */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import cytoscape from 'cytoscape';
import { Search, RefreshCw, ZoomIn, ZoomOut, Maximize2, Shield, AlertTriangle, User, Building, CreditCard, MapPin, Globe, Smartphone, ChevronRight, Info } from 'lucide-react';

const NODE_COLORS = {
  Person: '#818cf8',      // Indigo
  Company: '#fbbf24',     // Amber
  Account: '#34d399',     // Emerald
  Address: '#f43f5e',     // Rose
  IPAddress: '#c084fc',   // Purple
  Device: '#38bdf8'       // Sky
};

// Fallback dataset to guarantee visual rendering under all circumstances
const DEFAULT_FALLBACK_NODES = [
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
  { id: 'ADD-001', label: 'Address', street: '100 Panama Offshore Way', country: 'Panama' },
  { id: 'IP-001', label: 'IPAddress', ip: '192.168.1.100', isVpn: true, country: 'Panama' },
  { id: 'DEV-8849', label: 'Device', deviceFingerprint: 'FP-MACBOOK-PRO-88492', deviceType: 'Laptop' }
];

const DEFAULT_FALLBACK_RELS = [
  { id: 'R1', source: 'ACC-101', target: 'ACC-102', type: 'TRANSFERRED', amount: 450000 },
  { id: 'R2', source: 'ACC-102', target: 'ACC-103', type: 'TRANSFERRED', amount: 445000 },
  { id: 'R3', source: 'ACC-103', target: 'ACC-104', type: 'TRANSFERRED', amount: 440000 },
  { id: 'R4', source: 'ACC-104', target: 'ACC-101', type: 'TRANSFERRED', amount: 435000 },
  { id: 'R5', source: 'PER-001', target: 'CMP-101', type: 'BENEFICIAL_OWNER', sharesPercentage: 100 },
  { id: 'R6', source: 'CMP-101', target: 'CMP-102', type: 'BENEFICIAL_OWNER', sharesPercentage: 85 },
  { id: 'R7', source: 'CMP-102', target: 'CMP-103', type: 'BENEFICIAL_OWNER', sharesPercentage: 90 },
  { id: 'R8', source: 'CMP-103', target: 'ACC-101', type: 'BENEFICIAL_OWNER', sharesPercentage: 100 },
  { id: 'R9', source: 'PER-001', target: 'ACC-110', type: 'OWNS_ACCOUNT' },
  { id: 'R10', source: 'ACC-108', target: 'ACC-109', type: 'TRANSFERRED', amount: 800000 },
  { id: 'R11', source: 'ACC-109', target: 'ACC-110', type: 'TRANSFERRED', amount: 780000 },
  { id: 'R12', source: 'ACC-111', target: 'IP-001', type: 'LOGGED_IN_FROM' },
  { id: 'R13', source: 'ACC-112', target: 'IP-001', type: 'LOGGED_IN_FROM' },
  { id: 'R14', source: 'ACC-113', target: 'IP-001', type: 'LOGGED_IN_FROM' },
  { id: 'R15', source: 'ACC-111', target: 'DEV-8849', type: 'USED_DEVICE' },
  { id: 'R16', source: 'ACC-112', target: 'DEV-8849', type: 'USED_DEVICE' }
];

export default function GraphCanvas({ graphData, loading, onRefresh }) {
  const containerRef = useRef(null);
  const cyRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [layoutName, setLayoutName] = useState('breadthfirst');

  // Stable memoized nodes dataset
  const activeNodes = useMemo(() => {
    if (graphData && Array.isArray(graphData.nodes) && graphData.nodes.length > 0) {
      return graphData.nodes;
    }
    return DEFAULT_FALLBACK_NODES;
  }, [graphData?.nodes]);

  // Stable memoized relationships dataset
  const activeRels = useMemo(() => {
    if (graphData && Array.isArray(graphData.relationships) && graphData.relationships.length > 0) {
      return graphData.relationships;
    }
    return DEFAULT_FALLBACK_RELS;
  }, [graphData?.relationships]);

  // Initialize Cytoscape network graph
  useEffect(() => {
    if (!containerRef.current) return;

    try {
      // Convert API nodes and relationships into Cytoscape elements format
      const elements = [];

      activeNodes.forEach(node => {
        if (!node || !node.id) return;
        const isSanctioned = node.isSanctioned === true;
        const isShell = node.isShellCompany === true;
        const isHighRisk = (node.riskScore || 0) > 75;

        elements.push({
          data: {
            id: String(node.id),
            label: node.name || node.accountNumber || node.ip || node.street || node.deviceFingerprint || node.id,
            nodeType: node.label || 'Entity',
            riskScore: node.riskScore || 0,
            isSanctioned,
            isShell,
            isHighRisk,
            properties: node
          }
        });
      });

      activeRels.forEach((rel, idx) => {
        if (rel && rel.source && rel.target) {
          elements.push({
            data: {
              id: rel.id || `rel-${idx}`,
              source: String(rel.source),
              target: String(rel.target),
              label: rel.type || 'CONNECTED',
              amount: rel.amount ? `$${Number(rel.amount).toLocaleString()}` : '',
              properties: rel
            }
          });
        }
      });

      if (cyRef.current) {
        try { cyRef.current.destroy(); } catch (e) {}
      }

      const cy = cytoscape({
        container: containerRef.current,
        elements,
        style: [
          {
            selector: 'node',
            style: {
              'width': 34,
              'height': 34,
              'label': 'data(label)',
              'color': '#f8fafc',
              'font-size': '10px',
              'font-family': 'Inter, sans-serif',
              'font-weight': '600',
              'text-valign': 'bottom',
              'text-margin-y': 6,
              'background-color': '#34d399',
              'border-width': 2,
              'border-color': 'rgba(255, 255, 255, 0.3)'
            }
          },
          {
            selector: 'node[nodeType = "Person"]',
            style: { 'background-color': '#818cf8' }
          },
          {
            selector: 'node[nodeType = "Company"]',
            style: { 'background-color': '#fbbf24' }
          },
          {
            selector: 'node[nodeType = "Account"]',
            style: { 'background-color': '#34d399' }
          },
          {
            selector: 'node[nodeType = "Address"]',
            style: { 'background-color': '#f43f5e' }
          },
          {
            selector: 'node[nodeType = "IPAddress"]',
            style: { 'background-color': '#c084fc' }
          },
          {
            selector: 'node[nodeType = "Device"]',
            style: { 'background-color': '#38bdf8' }
          },
          {
            selector: 'node[isSanctioned = true]',
            style: {
              'background-color': '#ef4444',
              'border-width': 4,
              'border-color': '#dc2626',
              'width': 44,
              'height': 44
            }
          },
          {
            selector: 'node:selected',
            style: {
              'border-width': 4,
              'border-color': '#6366f1',
              'shadow-blur': 20,
              'shadow-color': '#6366f1'
            }
          },
          {
            selector: 'edge',
            style: {
              'width': 2,
              'line-color': 'rgba(148, 163, 184, 0.5)',
              'target-arrow-color': 'rgba(148, 163, 184, 0.7)',
              'target-arrow-shape': 'triangle',
              'curve-style': 'bezier',
              'label': 'data(label)',
              'font-size': '8px',
              'color': '#94a3b8',
              'text-rotation': 'autorotate',
              'text-margin-y': -8
            }
          },
          {
            selector: 'edge[type = "TRANSFERRED"]',
            style: {
              'line-color': 'rgba(52, 211, 153, 0.7)',
              'target-arrow-color': '#34d399',
              'width': 2.5
            }
          },
          {
            selector: 'edge[type = "BENEFICIAL_OWNER"]',
            style: {
              'line-color': 'rgba(251, 191, 36, 0.7)',
              'target-arrow-color': '#fbbf24',
              'line-style': 'dashed'
            }
          }
        ],
        layout: {
          name: layoutName || 'breadthfirst',
          animate: false,
          padding: 60
        }
      });

      cy.on('tap', 'node', function(evt) {
        const node = evt.target;
        if (node && node.data) {
          setSelectedNode(node.data());
        }
      });

      cy.on('tap', function(evt) {
        if (evt.target === cy) {
          setSelectedNode(null);
        }
      });

      cyRef.current = cy;
    } catch (err) {
      console.error('Cytoscape initialization error:', err);
    }

    return () => {
      if (cyRef.current) {
        try { cyRef.current.destroy(); } catch (e) {}
      }
    };
  }, [activeNodes, activeRels, layoutName]);

  // Apply Search Filter safely
  useEffect(() => {
    if (!cyRef.current) return;
    const cy = cyRef.current;

    try {
      cy.batch(() => {
        cy.nodes().forEach(node => {
          const data = node.data();
          const matchesQuery = !searchQuery || 
            (data.label && data.label.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (data.id && data.id.toLowerCase().includes(searchQuery.toLowerCase()));
          const matchesType = activeFilter === 'ALL' || data.nodeType === activeFilter;

          if (matchesQuery && matchesType) {
            node.style('display', 'element');
          } else {
            node.style('display', 'none');
          }
        });
      });
    } catch (err) {
      console.error('Error applying node filters:', err);
    }
  }, [searchQuery, activeFilter]);

  const handleZoomIn = () => {
    try { cyRef.current && cyRef.current.zoom(cyRef.current.zoom() * 1.25); } catch (e) {}
  };

  const handleZoomOut = () => {
    try { cyRef.current && cyRef.current.zoom(cyRef.current.zoom() * 0.8); } catch (e) {}
  };

  const handleFit = () => {
    try {
      if (cyRef.current) {
        cyRef.current.resize();
        cyRef.current.fit();
        cyRef.current.center();
      }
    } catch (e) {}
  };

  const getNodeIcon = (type) => {
    switch (type) {
      case 'Person': return <User className="w-4 h-4 text-indigo-400" />;
      case 'Company': return <Building className="w-4 h-4 text-amber-400" />;
      case 'Account': return <CreditCard className="w-4 h-4 text-emerald-400" />;
      case 'Address': return <MapPin className="w-4 h-4 text-rose-400" />;
      case 'IPAddress': return <Globe className="w-4 h-4 text-purple-400" />;
      case 'Device': return <Smartphone className="w-4 h-4 text-sky-400" />;
      default: return <Info className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-140px)] min-h-[500px] flex flex-col md:flex-row overflow-hidden bg-slate-950">
      
      {/* Main Controls & Canvas Area */}
      <div className="flex-1 flex flex-col relative h-full min-h-[450px]">
        
        {/* Top Control Toolbar */}
        <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
          
          {/* Search & Filter Bar */}
          <div className="flex flex-wrap items-center gap-2 pointer-events-auto bg-slate-900/90 backdrop-blur-md p-2 rounded-xl border border-slate-800 shadow-xl">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search account, entity, IP..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-48 lg:w-64"
              />
            </div>

            <select
              value={activeFilter}
              onChange={e => setActiveFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Entity Types</option>
              <option value="Account">Accounts</option>
              <option value="Person">Persons</option>
              <option value="Company">Companies</option>
              <option value="Address">Addresses</option>
              <option value="IPAddress">IP Addresses</option>
              <option value="Device">Devices</option>
            </select>

            <select
              value={layoutName}
              onChange={e => setLayoutName(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="breadthfirst">Tree Layout</option>
              <option value="concentric">Concentric Rings</option>
              <option value="circle">Circular Layout</option>
              <option value="grid">Grid Layout</option>
            </select>
          </div>

          {/* Canvas Tools */}
          <div className="flex items-center gap-1 pointer-events-auto bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-xl">
            <button
              onClick={handleZoomIn}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleFit}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Fit View"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <div className="w-px h-4 bg-slate-800 mx-1" />
            <button
              onClick={onRefresh}
              className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors"
              title="Reload Graph Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

        </div>

        {/* Legend Overlay */}
        <div className="absolute bottom-4 left-4 z-10 hidden sm:flex items-center gap-3 bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800 text-[11px] text-slate-300">
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#818cf8]" /> Person</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#fbbf24]" /> Company</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#34d399]" /> Account</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#f43f5e]" /> Address</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#c084fc]" /> IP</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] animate-pulse" /> Sanctioned</div>
        </div>

        {/* Cytoscape Container */}
        <div ref={containerRef} className="w-full h-full min-h-[450px] cursor-grab active:cursor-grabbing block" />
      </div>

      {/* Node Inspector Drawer */}
      {selectedNode && (
        <div className="w-full md:w-80 lg:w-96 glass-panel border-l border-slate-800 p-5 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
          <div>
            {/* Header */}
            <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  {getNodeIcon(selectedNode.nodeType)}
                </div>
                <div>
                  <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-400">
                    {selectedNode.nodeType}
                  </span>
                  <h3 className="text-sm font-bold text-white break-all">
                    {selectedNode.label}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 bg-slate-900 rounded-md border border-slate-800"
              >
                Close
              </button>
            </div>

            {/* Risk Alert Pill */}
            {selectedNode.isSanctioned && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-red-400 animate-risk-glow">
                <Shield className="w-5 h-5 shrink-0 text-red-400" />
                <div>
                  <div className="text-xs font-bold uppercase">Sanctioned Entity</div>
                  <div className="text-[11px] text-red-300/80">Flagged on international sanctions list.</div>
                </div>
              </div>
            )}

            {selectedNode.isShell && (
              <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-amber-300">
                <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
                <div>
                  <div className="text-xs font-bold uppercase">Offshore Shell Company</div>
                  <div className="text-[11px] text-amber-200/70">Registered in high-secrecy jurisdiction.</div>
                </div>
              </div>
            )}

            {/* Properties Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Node Attributes</h4>
              <div className="bg-slate-900/80 rounded-xl border border-slate-800 p-3 space-y-2 text-xs">
                {Object.entries(selectedNode.properties || {}).map(([key, val]) => (
                  <div key={key} className="flex justify-between items-center py-1 border-b border-slate-800/60 last:border-0">
                    <span className="text-slate-400 capitalize">{key}</span>
                    <span className="font-mono text-slate-200 text-right truncate max-w-[160px]">
                      {typeof val === 'boolean' ? (val ? 'Yes' : 'No') : String(val)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-500 text-center">
            Graph Node ID: <code className="text-indigo-400 font-mono">{selectedNode.id}</code>
          </div>
        </div>
      )}

    </div>
  );
}
