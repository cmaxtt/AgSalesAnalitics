import React, { useState } from 'react';
import { Settings, Wifi, Calendar, DollarSign, Package, Tag } from 'lucide-react';
import StatCard from './StatCard';
import DataTable from './DataTable';
import SettingsModal from './SettingsModal';
import './Dashboard.css';

const Dashboard = () => {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [stats, setStats] = useState({
        sales: '$0',
        units: '0',
        products: '0'
    });
    const [tableData, setTableData] = useState([]);

    // Check connection status on mount
    React.useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await fetch('http://localhost:3030/api/connection-status');
                const data = await res.json();
                if (data.connected) {
                    setIsConnected(true);
                }
            } catch (err) {
                console.error("Failed to check connection status:", err);
            }
        };
        checkStatus();
    }, []);

    const handleConnect = (config) => {
        // Here we could also trigger an initial data fetch if needed
        setIsConnected(true);
        console.log("Connected with config:", config);
    };

    const runReport = async () => {
        if (!isConnected) {
            alert("Please connect to the database first via Settings.");
            return;
        }
        // Placeholder for future logic where we fetch actual report data
        alert("Report generation not yet implemented. Please wait for next instructions.");
    };

    return (
        <div className="dashboard">
            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                onConnect={handleConnect}
            />

            <header className="top-bar">
                <div className="brand-header">
                    <span className="brand-title">PARK VIEW ANALYTICAL</span>
                </div>
                <div className="top-actions">
                    <div className="connection-status" style={{
                        backgroundColor: isConnected ? 'rgba(0, 255, 157, 0.1)' : 'rgba(255, 46, 99, 0.1)',
                        color: isConnected ? 'var(--color-accent-green)' : 'var(--color-accent-pink)',
                        borderColor: isConnected ? 'rgba(0, 255, 157, 0.2)' : 'rgba(255, 46, 99, 0.2)'
                    }}>
                        <Wifi size={14} />
                        <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
                    </div>
                    <button
                        className="settings-btn"
                        onClick={() => setIsSettingsOpen(true)}
                        title="Database Settings"
                    >
                        <Settings size={20} />
                    </button>
                </div>
            </header>

            <div className="section-header">
                <h1>Purchase Summary by Product</h1>
            </div>

            <div className="controls-row">
                <div className="control-group">
                    <label className="control-label">Start Date</label>
                    <div className="date-input-wrapper">
                        <span>12/01/2025</span>
                        <Calendar size={16} className="text-muted" />
                    </div>
                </div>
                <div className="control-group">
                    <label className="control-label">End Date</label>
                    <div className="date-input-wrapper">
                        <span>12/24/2025</span>
                        <Calendar size={16} className="text-muted" />
                    </div>
                </div>
                <button className="run-report-btn" onClick={runReport}>
                    Run Report
                </button>
            </div>

            <div className="stats-grid">
                <StatCard
                    title="TOTAL SALES VALUE"
                    value={stats.sales}
                    icon={DollarSign}
                    color="var(--color-accent-cyan)"
                />
                <StatCard
                    title="TOTAL UNITS SOLD"
                    value={stats.units}
                    icon={Package}
                    color="var(--color-accent-green)"
                />
                <StatCard
                    title="UNIQUE PRODUCTS"
                    value={stats.products}
                    icon={Tag}
                    color="var(--color-accent-pink)"
                />
            </div>

            <div className="data-table-container">
                <DataTable data={tableData} />
            </div>
        </div>
    );
};

export default Dashboard;
