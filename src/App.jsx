import React, { useState } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import VendorDashboard from './components/VendorDashboard';
import CashierDashboard from './components/CashierDashboard';

function App() {
  const [currentView, setCurrentView] = useState('overview');

  const renderView = () => {
    switch (currentView) {
      case 'overview': return <Dashboard />;
      case 'vendor': return <VendorDashboard />;
      case 'cashier': return <CashierDashboard />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar currentView={currentView} onNavigate={setCurrentView} />
      <main className="main-content">
        {renderView()}
      </main>
    </div>
  );
}

export default App;
