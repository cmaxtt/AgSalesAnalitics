import React, { useState } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import VendorDashboard from './components/VendorDashboard';

function App() {
  const [currentView, setCurrentView] = useState('overview');

  return (
    <div className="app-container">
      <Sidebar currentView={currentView} onNavigate={setCurrentView} />
      <main className="main-content">
        {currentView === 'overview' ? <Dashboard /> : <VendorDashboard />}
      </main>
    </div>
  );
}

export default App;
