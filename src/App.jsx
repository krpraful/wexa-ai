/* ==============================================================
 * Script: src/App.jsx
 * Purpose: Main application container, active tab router, top-level state manager,
 *          and footer integration.
 * Author: Praful Kumar
 * Created On: 04/08/2026
 *
 * Modification History:
 * - 04/08/2026 : Initial React layout assembly with CognoDB status checking
 * - 04/08/2026 : Added Footer component with developer details and prafulkr.xyz link
 * - 04/08/2026 : Added safe response status checks to handle proxy errors gracefully
 *
 * Notes:
 * - Manages graph visualizer, fraud workbench, and SQL vs Graph explainer views.
 * ============================================================== */

import React, { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import GraphCanvas from './components/GraphCanvas';
import FraudWorkbench from './components/FraudWorkbench';
import SqlVsGraphExplainer from './components/SqlVsGraphExplainer';
import DbConfigModal from './components/DbConfigModal';
import Footer from './components/Footer';

export default function App() {
  const [activeTab, setActiveTab] = useState('visualizer'); // 'visualizer' | 'workbench' | 'explainer'
  const [graphData, setGraphData] = useState({ nodes: [], relationships: [] });
  const [dbStatus, setDbStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (!res.ok) {
        setDbStatus({ status: 'DISCONNECTED', error: 'Express API server offline on port 3098 (run npm run dev)' });
        return;
      }
      const data = await res.json();
      setDbStatus(data);
    } catch (err) {
      setDbStatus({ status: 'DISCONNECTED', error: 'Express API server offline on port 3098 (run npm run dev)' });
    }
  };

  const fetchGraphData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/graph');
      if (res.ok) {
        const data = await res.json();
        setGraphData({
          nodes: data.nodes || [],
          relationships: data.relationships || []
        });
      }
    } catch (err) {
      console.error('Error fetching graph dataset:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    fetchGraphData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        dbStatus={dbStatus}
        onOpenConfig={() => setIsConfigOpen(true)}
      />

      <main className="flex-1 relative pb-8">
        {activeTab === 'visualizer' && (
          <GraphCanvas
            graphData={graphData}
            loading={loading}
            onRefresh={fetchGraphData}
          />
        )}

        {activeTab === 'workbench' && (
          <FraudWorkbench />
        )}

        {activeTab === 'explainer' && (
          <SqlVsGraphExplainer />
        )}
      </main>

      <Footer />

      <DbConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        dbStatus={dbStatus}
      />
    </div>
  );
}
