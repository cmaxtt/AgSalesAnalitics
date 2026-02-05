import React from 'react';
import { LayoutDashboard, Database, PieChart } from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ currentView, onNavigate }) => {
    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                {/* Header content if needed */}
            </div>

            <div className="nav-section">
                <div className="nav-section-title">Navigation</div>
                <div
                    className={`nav-item ${currentView === 'overview' ? 'active' : ''}`}
                    onClick={() => onNavigate('overview')}
                >
                    <LayoutDashboard className="nav-icon" />
                    <span>Overview</span>
                </div>
                <div
                    className={`nav-item ${currentView === 'vendor' ? 'active' : ''}`}
                    onClick={() => onNavigate('vendor')}
                >
                    <PieChart className="nav-icon" />
                    <span>Vendor Analysis</span>
                </div>
            </div>

            <div className="nav-section">
                <div className="nav-section-title">Tools</div>
                <div className="nav-item">
                    <Database className="nav-icon" />
                    <span>Query Builder</span>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
