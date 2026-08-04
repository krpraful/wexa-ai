/**
 * Developer: Praful (jobspraful@gmail.com)
 * Application: NexusAML - Financial Crime & Graph Intelligence Application
 * Assignment: Wexa AI Take-Home Assignment (CognoDB + openCypher)
 * File: src/components/Navbar.jsx - Header Navigation & CognoDB Status Indicator
 */

import React from 'react';
import { Network, ShieldAlert, Cpu, Database, Server, ExternalLink, HelpCircle } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, dbStatus, onOpenConfig }) {
  const isConnected = dbStatus?.status === 'CONNECTED';

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-emerald-400 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Network className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                Nexus<span className="text-indigo-400">AML</span>
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Graph DB
              </span>
            </div>
            <p className="text-xs text-slate-400">Financial Crime & Multi-Hop Network Intelligence</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('visualizer')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'visualizer'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Network className="w-4 h-4" />
            Network Visualizer
          </button>

          <button
            onClick={() => setActiveTab('workbench')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'workbench'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Cypher Fraud Workbench
          </button>

          <button
            onClick={() => setActiveTab('explainer')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'explainer'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Cpu className="w-4 h-4" />
            Why Graph Database?
          </button>
        </nav>

        {/* CognoDB Status Pill & Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenConfig}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
              isConnected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <Database className="w-3.5 h-3.5" />
            <span>{isConnected ? 'CognoDB Cloud (Live)' : 'Demo Mode (Offline)'}</span>
            <HelpCircle className="w-3.5 h-3.5 opacity-70 ml-1" />
          </button>
        </div>

      </div>
    </header>
  );
}
