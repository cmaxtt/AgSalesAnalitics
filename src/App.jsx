import React, { useState, useEffect } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import VendorDashboard from './components/VendorDashboard';
import CashierDashboard from './components/CashierDashboard';
import Chatbot from './components/Chatbot';

function App() {
  const [currentView, setCurrentView] = useState('overview');
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('app-theme') || 'dark';
  });

  useEffect(() => {
    console.log(`[App] Applied theme: ${theme}`);
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    console.log('[App] Toggling theme...');
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const renderView = () => {
    switch (currentView) {
      case 'overview': return <Dashboard />;
      case 'vendor': return <VendorDashboard />;
      case 'cashier': return <CashierDashboard />;
      case 'chat': return <Chatbot />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="app-container">
      <Sidebar
        currentView={currentView}
        onNavigate={setCurrentView}
        isDarkMode={theme === 'dark'}
        toggleTheme={toggleTheme}
      />
      <main className="main-content">
        {renderView()}
      </main>
    </div>
  );
}

export default App;
