/**
 * Developer: Praful (jobspraful@gmail.com)
 * Application: NexusAML - Financial Crime & Graph Intelligence Application
 * Assignment: Wexa AI Take-Home Assignment (CognoDB + openCypher)
 * File: src/components/SqlVsGraphExplainer.jsx - "Why a Graph Database?" Comparison View
 */

import React from 'react';
import { Cpu, Zap, Database, ArrowRight, ShieldCheck, CheckCircle, XCircle, Code, Layers } from 'lucide-react';

export default function SqlVsGraphExplainer() {
  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 space-y-10">
      
      {/* Header Banner */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold uppercase tracking-wider">
          <Cpu className="w-3.5 h-3.5" /> Architectural Evaluation
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          Why a Graph Database for Financial Crime Intelligence?
        </h2>
        <p className="text-slate-300 text-sm max-w-3xl leading-relaxed">
          Relational databases (SQL) store entities in rigid tables linked by Foreign Key index lookups. When evaluating multi-hop money laundering cycles or complex ownership hierarchies, SQL requires expensive self-joins and recursive CTEs that degrade exponentially in performance. A Graph Database like CognoDB treats relationships as first-class citizens using pointer-based index-free adjacency.
        </p>
      </div>

      {/* Side-by-Side Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Relational SQL Card */}
        <div className="glass-panel p-6 rounded-2xl border border-red-500/20 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-red-400" />
              <h3 className="text-base font-bold text-white">Relational Schema (SQL)</h3>
            </div>
            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-md bg-red-500/10 text-red-400 border border-red-500/20">
              Rigid Tables
            </span>
          </div>

          <ul className="space-y-3 text-xs text-slate-300">
            <li className="flex items-start gap-2.5">
              <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span><strong>Recursive CTE Overhead:</strong> Variable-length paths (e.g. 2–6 hop money transfers) require recursive queries with memory-heavy temporary tables.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span><strong>Join Explosion:</strong> Querying shared attributes (accounts sharing same IP, Device, and Address) requires 5+ table self-joins.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span><strong>Time Complexity:</strong> Search time scales with table size <code className="text-red-300 font-mono">O(N log N)</code> per join operation.</span>
            </li>
          </ul>

          {/* SQL Code Box */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 font-mono text-[11px] text-red-300 space-y-1">
            <div className="text-[10px] text-slate-500 uppercase font-semibold mb-2">Complex SQL (4-Hop Transfer Cycle)</div>
            <pre className="whitespace-pre-wrap">{`WITH RECURSIVE transfer_chain AS (
  SELECT from_acc, to_acc, amount, 1 AS depth
  FROM transfers WHERE from_acc = 'ACC-101'
  UNION ALL
  SELECT t.from_acc, t.to_acc, t.amount, tc.depth + 1
  FROM transfers t
  JOIN transfer_chain tc ON t.from_acc = tc.to_acc
  WHERE tc.depth < 5
)
SELECT * FROM transfer_chain WHERE to_acc = 'ACC-101';`}</pre>
          </div>
        </div>

        {/* CognoDB Graph Card */}
        <div className="glass-panel p-6 rounded-2xl border border-emerald-500/30 space-y-4 shadow-xl shadow-emerald-500/5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">CognoDB Graph (openCypher)</h3>
            </div>
            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Index-Free Adjacency
            </span>
          </div>

          <ul className="space-y-3 text-xs text-slate-300">
            <li className="flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Native Path Pattern Matching:</strong> Intuitive Cypher syntax <code className="text-emerald-300 font-mono">[:TRANSFERRED*2..5]</code> expresses variable hop depth directly.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Index-Free Adjacency:</strong> Traversing relationships follows direct memory pointers between nodes without global index lookups.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Constant Traversal Speed:</strong> Search time scales with local subgraph density <code className="text-emerald-300 font-mono">O(k)</code> rather than overall database size.</span>
            </li>
          </ul>

          {/* Cypher Code Box */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 font-mono text-[11px] text-emerald-300 space-y-1">
            <div className="text-[10px] text-slate-500 uppercase font-semibold mb-2">Elegant Cypher (4-Hop Transfer Cycle)</div>
            <pre className="whitespace-pre-wrap">{`MATCH path = (origin:Account {id: $accountId})-[r:TRANSFERRED*2..5]->(origin)
RETURN path, length(path) AS hopCount,
       reduce(total = 0.0, tx IN r | total + tx.amount) AS totalVolume;`}</pre>
          </div>
        </div>

      </div>

      {/* Summary Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-xl space-y-2">
          <div className="text-2xl font-black text-indigo-400">100x+</div>
          <div className="text-xs font-bold text-slate-200">Faster Deep Multi-Hop Searches</div>
          <p className="text-[11px] text-slate-400">Traversing 4+ hops in graph memory takes milliseconds versus seconds or timeouts in relational SQL.</p>
        </div>
        <div className="glass-card p-5 rounded-xl space-y-2">
          <div className="text-2xl font-black text-emerald-400">Zero</div>
          <div className="text-xs font-bold text-slate-200">Complex Join Tables Required</div>
          <p className="text-[11px] text-slate-400">Heterogeneous connections (Account &rarr; Device &rarr; IP &rarr; Person) are native directed edges.</p>
        </div>
        <div className="glass-card p-5 rounded-xl space-y-2">
          <div className="text-2xl font-black text-amber-400">Declarative</div>
          <div className="text-xs font-bold text-slate-200">Cypher Graph Pattern Matching</div>
          <p className="text-[11px] text-slate-400">Business rules for financial crime compliance are written cleanly without nested CTE boilerplates.</p>
        </div>
      </div>

    </div>
  );
}
