/**
 * Developer: Praful (jobspraful@gmail.com)
 * Application: NexusAML - Financial Crime & Graph Intelligence Application
 * Assignment: Wexa AI Take-Home Assignment (CognoDB + openCypher)
 * File: src/components/DbConfigModal.jsx - CognoDB Cloud Connection Guidance Modal
 */

import React from 'react';
import { X, ExternalLink, Database, CheckCircle, AlertTriangle, Key, Terminal } from 'lucide-react';

export default function DbConfigModal({ isOpen, onClose, dbStatus }) {
  if (!isOpen) return null;

  const isConnected = dbStatus?.status === 'CONNECTED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl glass-panel rounded-3xl border border-slate-800 p-6 sm:p-8 space-y-6 shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">CognoDB Cloud Configuration</h3>
              <p className="text-xs text-slate-400">Managed Graph Database Connection (openCypher over Bolt protocol)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Connection Status Pill */}
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
          isConnected
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
        }`}>
          <div className="flex items-center gap-3">
            {isConnected ? (
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            )}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider">
                Status: {isConnected ? 'Connected to CognoDB Cloud' : 'Operating in Pre-Loaded Demo Mode'}
              </div>
              <div className="text-xs opacity-80 mt-0.5">
                {isConnected
                  ? `URI: ${dbStatus.uri || 'Connected'}`
                  : (dbStatus?.error || 'Database environment variables not configured.')}
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-4 text-xs text-slate-300">
          <h4 className="font-bold text-slate-200 uppercase tracking-wider">How to connect your CognoDB Cloud instance:</h4>
          
          <ol className="space-y-3 list-decimal list-inside">
            <li className="space-y-1">
              <span>Sign up for a free instance at </span>
              <a
                href="https://console.cognodb.com/signup"
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:underline font-semibold inline-flex items-center gap-1"
              >
                console.cognodb.com <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li>Create a free <strong>(c0)</strong> database instance.</li>
            <li>Copy your connection URI (<code className="text-indigo-300 font-mono">bolt+s://&lt;instance-id&gt;.databases.cognodb.cloud</code>) and generated password.</li>
            <li>Open or create the <code className="text-indigo-300 font-mono">.env</code> file in the project root directory and set:</li>
          </ol>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-indigo-300 space-y-1">
            <div>COGNO_URI=bolt+s://your-instance-id.databases.cognodb.cloud</div>
            <div>COGNO_USER=cognodb</div>
            <div>COGNO_PASSWORD=2BWqSfgfwy96kxh</div>
            <div>PORT=3001</div>
          </div>

          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Seed CognoDB via command line:</span>
            </span>
            <code className="text-emerald-400 font-mono bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
              npm run seed
            </code>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-indigo-600/30"
          >
            Got it
          </button>
        </div>

      </div>
    </div>
  );
}
