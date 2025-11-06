import React, { useState } from 'react';
import MapView from './components/MapView';
import ControlPanel from './components/ControlPanel';
import './App.css';

function App() {
  const [ndviEnabled, setNdviEnabled] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="app">
      <header className="app-header">
        <h1>🌾 Predictive Crop Management</h1>
      </header>
      <div className="app-content">
        <MapView 
          ndviEnabled={ndviEnabled} 
          setNdviEnabled={setNdviEnabled}
        />
        <ControlPanel 
          ndviEnabled={ndviEnabled}
          setNdviEnabled={setNdviEnabled}
          analysisResult={analysisResult}
          setAnalysisResult={setAnalysisResult}
          loading={loading}
          setLoading={setLoading}
        />
      </div>
    </div>
  );
}

export default App;
