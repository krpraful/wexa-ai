/**
 * Developer: Praful (jobspraful@gmail.com)
 * Application: NexusAML - Financial Crime & Graph Intelligence Application
 * Assignment: Wexa AI Take-Home Assignment (CognoDB + openCypher)
 * File: src/components/FraudWorkbench.jsx - Cypher Fraud Detection & Query Executor Suite
 */

import React, { useState } from 'react';
import { Play, Code, ShieldAlert, Cpu, Layers, Link, CheckCircle2, ChevronRight, AlertCircle, Sparkles } from 'lucide-react';

export default function FraudWorkbench() {
  const [activeQueryKey, setActiveQueryKey] = useState('CIRCULAR');
  const [loading, setLoading] = useState(false);
  const [queryResult, setQueryResult] = useState(null);
  const [error, setError] = useState(null);

  const PRESET_QUERIES = {
    CIRCULAR: {
      name: '4-Hop Circular Money Laundering (Layering)',
      badge: 'Multi-Hop (2-5 Hops)',
      endpoint: '/api/detect/circular',
      cypher: `MATCH path = (origin:Account)-[r:TRANSFERRED*2..5]->(origin)
WITH origin, path, r, reduce(total = 0.0, tx IN r | total + toFloat(tx.amount)) AS totalVolume
RETURN origin, path, totalVolume, length(path) AS hopCount
ORDER BY totalVolume DESC`,
      params: { limit: 20 },
      explanation: 'Traverses variable length paths (2 to 5 hops) looking for money flow that originates from an account and cycles back to it. Traditional SQL requires complex recursive CTEs that scale poorly.'
    },
    UBO: {
      name: 'Ultimate Beneficial Owner (UBO) Shell Company Tracing',
      badge: 'Deep Hierarchy Traversal',
      endpoint: '/api/detect/ubo',
      cypher: `MATCH path = (owner:Person)-[:BENEFICIAL_OWNER*1..6]->(target:Company)
WHERE target.isShellCompany = true OR owner.riskScore > 75
RETURN owner, target, path, length(path) AS tierCount
ORDER BY tierCount DESC`,
      params: { limit: 20 },
      explanation: 'Resolves complex multi-tier shell company ownership chains up to 6 hops deep to unmask ultimate human controllers hiding behind offshore entities.'
    },
    SYNTHETIC: {
      name: 'Synthetic Identity Ring & Shared Infrastructure',
      badge: 'Pattern Matching',
      endpoint: '/api/detect/infrastructure',
      cypher: `MATCH (a1:Account)-[:LOGGED_IN_FROM|USED_DEVICE|REGISTERED_AT]->(infra)<-[:LOGGED_IN_FROM|USED_DEVICE|REGISTERED_AT]-(a2:Account)
WHERE a1.id < a2.id
RETURN a1, infra, a2, labels(infra)[0] AS infraType`,
      params: { limit: 30 },
      explanation: 'Identifies clusters of distinct accounts that secretly connect to identical IP addresses, physical street addresses, or hardware device fingerprints.'
    }
  };

  const handleRunQuery = async (key) => {
    setActiveQueryKey(key);
    setLoading(true);
    setError(null);
    setQueryResult(null);

    const preset = PRESET_QUERIES[key];
    try {
      const res = await fetch(preset.endpoint);
      const data = await res.json();
      setQueryResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const currentPreset = PRESET_QUERIES[activeQueryKey];

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-8">
      
      {/* Page Title Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="w-5 h-5 text-indigo-400" />
            <h2 className="text-2xl font-bold tracking-tight text-white">Cypher Fraud Workbench</h2>
          </div>
          <p className="text-xs text-slate-400">
            Run parameterised openCypher queries over CognoDB to detect multi-hop financial crime patterns in real-time.
          </p>
        </div>
      </div>

      {/* Preset Selector Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(PRESET_QUERIES).map(([key, q]) => (
          <button
            key={key}
            onClick={() => handleRunQuery(key)}
            className={`p-5 rounded-2xl border text-left transition-all ${
              activeQueryKey === key
                ? 'bg-indigo-600/10 border-indigo-500 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/50'
                : 'glass-card hover:bg-slate-900/60'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {q.badge}
              </span>
              <Play className={`w-4 h-4 ${activeQueryKey === key ? 'text-indigo-400' : 'text-slate-500'}`} />
            </div>
            <h3 className="text-sm font-bold text-slate-100 mb-2">{q.name}</h3>
            <p className="text-xs text-slate-400 line-clamp-2">{q.explanation}</p>
          </button>
        ))}
      </div>

      {/* Query Code & Execution Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Cypher Code Inspector */}
        <div className="glass-panel rounded-2xl border border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-200">Parameterised openCypher Code</h3>
            </div>
            <span className="text-[11px] font-mono text-slate-500">Neo4j Driver v5.x</span>
          </div>

          {/* Cypher Snippet Box */}
          <div className="relative bg-slate-950 p-4 rounded-xl border border-slate-800/80 font-mono text-xs text-indigo-300 overflow-x-auto">
            <pre className="whitespace-pre-wrap leading-relaxed">{currentPreset.cypher}</pre>
          </div>

          {/* Parameters Box */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Driver Parameters</div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400">
              {JSON.stringify(currentPreset.params, null, 2)}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Why this query rocks:</span> {currentPreset.explanation}
            </div>
          </div>
        </div>

        {/* Right Column: Execution Output Panel */}
        <div className="glass-panel rounded-2xl border border-slate-800 p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-200">Execution Results</h3>
              </div>
              {queryResult && (
                <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {queryResult.mode}
                </span>
              )}
            </div>

            {loading && (
              <div className="py-16 text-center text-slate-400 space-y-3">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-medium">Executing Cypher graph traversal...</p>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <div>{error}</div>
              </div>
            )}

            {!loading && !queryResult && !error && (
              <div className="py-16 text-center text-slate-500 text-xs">
                Click "Run" on any preset query above to test graph traversal execution.
              </div>
            )}

            {!loading && queryResult && (
              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-400">Detected Suspicious Graph Patterns</div>
                
                {queryResult.results && queryResult.results.map((res, idx) => (
                  <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-indigo-400 font-bold">
                      <span>Pattern #{idx + 1}</span>
                      {res.totalVolume && <span>Total Volume: ${res.totalVolume.toLocaleString()}</span>}
                    </div>

                    {res.cyclePath && (
                      <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px] text-slate-300 py-2">
                        {res.cyclePath.map((step, sIdx) => (
                          <React.Fragment key={sIdx}>
                            <span className="px-2 py-1 bg-slate-900 border border-slate-800 rounded-md text-emerald-400 font-semibold">
                              {step}
                            </span>
                            {sIdx < res.cyclePath.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-slate-600" />}
                          </React.Fragment>
                        ))}
                      </div>
                    )}

                    {res.ownershipChain && (
                      <div className="space-y-1 py-1">
                        {res.ownershipChain.map((chainStep, cIdx) => (
                          <div key={cIdx} className="flex items-center gap-2 text-slate-300 text-xs">
                            <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] flex items-center justify-center text-slate-400 font-mono">
                              {cIdx + 1}
                            </span>
                            <span>{chainStep}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {res.accountsSharing && (
                      <div className="text-slate-300">
                        <div className="font-semibold text-slate-400 mb-1">{res.sharedInfra}</div>
                        <div className="flex flex-wrap gap-2">
                          {res.accountsSharing.map((acc, aIdx) => (
                            <span key={aIdx} className="px-2 py-1 bg-slate-900 border border-slate-800 rounded-md text-sky-300">
                              {acc}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500 text-center">
            Queries executed over standard Neo4j Bolt Driver (Bolt 5.0–5.4) protocol on CognoDB Cloud
          </div>
        </div>

      </div>

    </div>
  );
}
