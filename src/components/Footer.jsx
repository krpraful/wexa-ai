/* ==============================================================
 * Script: src/components/Footer.jsx
 * Purpose: Application footer displaying developer credits, personal portfolio link,
 *          Wexa AI assignment metadata, and GitHub repository link.
 * Author: Praful Kumar
 * Created On: 04/08/2026
 *
 * Modification History:
 * - 04/08/2026 : Added developer footer with prafulkr.xyz link and Wexa AI credit
 *
 * Notes:
 * - Includes link to https://prafulkr.xyz/ and GitHub repo.
 * ============================================================== */

import React from 'react';
import { ExternalLink, Heart, Code2, Globe, Github } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full glass-panel border-t border-slate-800/80 py-6 px-4 lg:px-8 mt-auto z-40">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        
        {/* Left: Developer Credit */}
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>
            Developed by <strong className="text-slate-200">Praful Kumar</strong> for <span className="text-indigo-400 font-semibold">Wexa AI Take-Home Assignment</span>
          </span>
        </div>

        {/* Center: Portfolio & Website Links */}
        <div className="flex items-center gap-4">
          <a
            href="https://prafulkr.xyz/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 transition-all font-medium"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <span>prafulkr.xyz</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </a>

          <a
            href="https://github.com/krpraful/wexa-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all font-medium"
          >
            <Github className="w-3.5 h-3.5 text-slate-400" />
            <span>GitHub Repo</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </a>
        </div>

        {/* Right: Copyright / Tech Stack */}
        <div className="text-slate-500 text-[11px]">
          CognoDB Cloud &bull; openCypher &bull; Neo4j Driver v5.x
        </div>

      </div>
    </footer>
  );
}
