
import React, { useState } from 'react';
import './App.css';
import Hero from './components/Hero';
import InputSection from './components/InputSection';
import ResultsDashboard from './components/ResultsDashboard';
import Processing from './components/Processing';

function App() {
  const [appState, setAppState] = useState('welcome'); // welcome, input, processing, results
  const [inputConfig, setInputConfig] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

  const handleStart = () => setAppState('input');

  const handleAnalyze = async (config) => {
    setInputConfig(config);
    setAppState('processing');

    // FETCH REAL DATA
    try {
      const res = await fetch('http://localhost:3030/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: config.table })
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Analysis failed');
      }

      setAnalysisResult(result);
      setAppState('results'); // Immediate transition

    } catch (err) {
      console.error("Analysis failed", err);
      alert(`Analysis Failed: ${err.message}`);
      setAppState('input'); // Go back to input on error
    }
  };

  const handleReset = () => {
    setAppState('input');
    setInputConfig(null);
    setAnalysisResult(null);
  };

  return (
    <div className="app-container">
      {appState === 'welcome' && <Hero onStart={handleStart} />}
      {appState === 'input' && <InputSection onAnalyze={handleAnalyze} />}
      {appState === 'processing' && <Processing />}
      {appState === 'results' && <ResultsDashboard onBack={handleReset} analysisResult={analysisResult} />}
    </div>
  );
}

export default App;
