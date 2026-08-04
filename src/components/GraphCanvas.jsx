/* ==============================================================
 * Script: src/components/GraphCanvas.jsx
 * Purpose: Cytoscape.js interactive network visualizer component featuring node
 *          color coding, entity selection drawer, search filters, and tree/ring layout algorithms.
 * Author: Praful Kumar
 * Created On: 04/08/2026
 *
 * Modification History:
 * - 04/08/2026 : Cytoscape canvas integration with risk level highlighting & node inspector
 *
 * Notes:
 * - Color codes nodes by type (Person, Company, Account, Address, IP, Device).
 * ============================================================== */

import React, { useEffect, useRef, useState } from 'react';
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

export default function GraphCanvas({ graphData, loading, onRefresh }) {
  const containerRef = useRef(null);
  const cyRef = useRef(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [layoutName, setLayoutName] = useState('breadthfirst');

  // Initialize Cytoscape network graph
  useEffect(() => {
    if (!containerRef.current || !graphData) return;

    // Convert API nodes and relationships into Cytoscape elements format
    const elements = [];

    (graphData.nodes || []).forEach(node => {
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

    (graphData.relationships || []).forEach((rel, idx) => {
      if (rel.source && rel.target) {
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
      cyRef.current.destroy();
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': function(ele) {
              const type = ele.data('nodeType');
              if (ele.data('isSanctioned')) return '#ef4444'; // Red for sanctioned
              return NODE_COLORS[type] || '#94a3b8';
            },
            'label': 'data(label)',
            'color': '#f8fafc',
            'font-size': '10px',
            'font-family': 'Inter, sans-serif',
            'font-weight': 600,
            'text-valign': 'bottom',
            'text-margin-y': 6,
            'width': ele => ele.data('isSanctioned') ? 42 : (ele.data('isHighRisk') ? 36 : 28),
            'height': ele => ele.data('isSanctioned') ? 42 : (ele.data('isHighRisk') ? 36 : 28),
            'border-width': ele => (ele.data('isSanctioned') || ele.data('isHighRisk')) ? 3 : 1,
            'border-color': ele => ele.data('isSanctioned') ? '#dc2626' : (ele.data('isHighRisk') ? '#f59e0b' : 'rgba(255,255,255,0.2)'),
            'overlay-padding': '4px'
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
            'line-color': 'rgba(148, 163, 184, 0.4)',
            'target-arrow-color': 'rgba(148, 163, 184, 0.6)',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': ele => ele.data('amount') ? `${ele.data('label')} (${ele.data('amount')})` : ele.data('label'),
            'font-size': '8px',
            'color': '#94a3b8',
            'text-rotation': 'autorotate',
            'text-margin-y': -8
          }
        },
        {
          selector: 'edge[type = "TRANSFERRED"]',
          style: {
            'line-color': 'rgba(52, 211, 153, 0.6)',
            'target-arrow-color': '#34d399',
            'width': 2.5
          }
        },
        {
          selector: 'edge[type = "BENEFICIAL_OWNER"]',
          style: {
            'line-color': 'rgba(251, 191, 36, 0.6)',
            'target-arrow-color': '#fbbf24',
            'line-style': 'dashed'
          }
        }
      ],
      layout: {
        name: layoutName,
        animate: true,
        animationDuration: 500,
        padding: 50
      }
    });

    cy.on('tap', 'node', function(evt) {
      const node = evt.target;
      setSelectedNode(node.data());
    });

    cy.on('tap', function(evt) {
      if (evt.target === cy) {
        setSelectedNode(null);
      }
    });

    cyRef.current = cy;

    return () => {
      if (cyRef.current) cyRef.current.destroy();
    };
  }, [graphData, layoutName]);

  // Apply Search Filter
  useEffect(() => {
    if (!cyRef.current) return;
    const cy = cyRef.current;

    cy.batch(() => {
      cy.nodes().forEach(node => {
        const data = node.data();
        const matchesQuery = !searchQuery || 
          data.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          data.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = activeFilter === 'ALL' || data.nodeType === activeFilter;

        if (matchesQuery && matchesType) {
          node.style('display', 'element');
        } else {
          node.style('display', 'none');
        }
      });
    });
  }, [searchQuery, activeFilter]);

  const handleZoomIn = () => cyRef.current && cyRef.current.zoom(cyRef.current.zoom() * 1.25);
  const handleZoomOut = () => cyRef.current && cyRef.current.zoom(cyRef.current.zoom() * 0.8);
  const handleFit = () => cyRef.current && cyRef.current.fit();

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
    <div className="relative w-full h-[calc(100vh-80px)] flex flex-col md:flex-row overflow-hidden bg-slate-950">
      
      {/* Main Controls & Canvas Area */}
      <div className="flex-1 flex flex-col relative h-full">
        
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
        <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
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
