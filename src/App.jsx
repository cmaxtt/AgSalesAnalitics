
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
      setAnalysisResult(result);

      // Pass result to dashboard (via state - simplistic approach for now)
      // In a real app complexity, we'd use a context or Redux.
      // For this prototype, we'll simulated the response being "ready" and 
      // just pass the raw row count or data to the dashboard if we could.
      // For now, we still rely on the simulated delay for the UX "effect" 
      // but we wait for the fetch first.

      setTimeout(() => {
        setAppState('results');
      }, 2500); // Keep some animation time

    } catch (err) {
      console.error("Analysis failed", err);
      // Fallback to simulation so the user still sees something if backend fails
      setAnalysisResult(null);
      setTimeout(() => {
        setAppState('results');
      }, 3500);
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
