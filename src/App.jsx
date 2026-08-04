/* ==============================================================
 * Script: src/App.jsx
 * Purpose: Main application container, active tab router, top-level state manager,
 *          and error boundary fallback integration.
 * Author: Praful Kumar
 * Created On: 04/08/2026
 *
 * Modification History:
 * - 04/08/2026 : Initial React layout assembly with CognoDB status checking
 * - 04/08/2026 : Added Footer component with developer details and prafulkr.xyz link
 * - 04/08/2026 : Added safe response status checks and React Error Boundary wrapper
 *
 * Notes:
 * - Manages graph visualizer, fraud workbench, and SQL vs Graph explainer views.
 * ============================================================== */

import React, { useEffect, useState, Component } from 'react';
import Navbar from './components/Navbar';
import GraphCanvas from './components/GraphCanvas';
import FraudWorkbench from './components/FraudWorkbench';
import SqlVsGraphExplainer from './components/SqlVsGraphExplainer';
import DbConfigModal from './components/DbConfigModal';
import Footer from './components/Footer';

// React Error Boundary Class to prevent blank screen crashes
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Component Exception:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 font-bold">
            Application Rendering Warning
          </div>
          <p className="text-xs text-slate-400 max-w-md">
            {this.state.error ? String(this.state.error.message || this.state.error) : 'A rendering issue occurred.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function MainContent() {
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

export default function App() {
  return (
    <ErrorBoundary>
      <MainContent />
    </ErrorBoundary>
  );
}
