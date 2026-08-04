/**
 * Developer: Praful (jobspraful@gmail.com)
 * Application: NexusAML - Financial Crime & Graph Intelligence Application
 * Assignment: Wexa AI Take-Home Assignment (CognoDB + openCypher)
 * File: src/App.jsx - Main Application Container & Tab Router
 */

import React, { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import GraphCanvas from './components/GraphCanvas';
import FraudWorkbench from './components/FraudWorkbench';
import SqlVsGraphExplainer from './components/SqlVsGraphExplainer';
import DbConfigModal from './components/DbConfigModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('visualizer'); // 'visualizer' | 'workbench' | 'explainer'
  const [graphData, setGraphData] = useState({ nodes: [], relationships: [] });
  const [dbStatus, setDbStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setDbStatus(data);
    } catch (err) {
      setDbStatus({ status: 'DISCONNECTED', error: err.message });
    }
  };

  const fetchGraphData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/graph');
      const data = await res.json();
      setGraphData({
        nodes: data.nodes || [],
        relationships: data.relationships || []
      });
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

      <main className="flex-1 relative">
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

      <DbConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        dbStatus={dbStatus}
      />
    </div>
  );
}
