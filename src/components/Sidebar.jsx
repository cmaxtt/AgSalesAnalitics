import React from 'react';
import { LayoutDashboard, PieChart, Users, MessageSquare, Sun, Moon } from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ currentView, onNavigate, isDarkMode, toggleTheme }) => {
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
                <div
                    className={`nav-item ${currentView === 'cashier' ? 'active' : ''}`}
                    onClick={() => onNavigate('cashier')}
                >
                    <Users className="nav-icon" />
                    <span>Cashier Analysis</span>
                </div>
            </div>

            <div className="nav-section">
                <div className="nav-section-title">Tools</div>
                <div
                    className={`nav-item ${currentView === 'chat' ? 'active' : ''}`}
                    onClick={() => onNavigate('chat')}
                >
                    <MessageSquare className="nav-icon" />
                    <span>AI Assistant</span>
                </div>
            </div>

            <div className="nav-section" style={{ marginTop: 'auto' }}>
                <div className="nav-section-title">Settings</div>
                <div
                    className="nav-item theme-toggle"
                    onClick={() => {
                        console.log('[Sidebar] Theme toggle clicked');
                        if (toggleTheme) toggleTheme();
                        else console.error('[Sidebar] toggleTheme prop is missing!');
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            if (toggleTheme) toggleTheme();
                        }
                    }}
                >
                    {isDarkMode ? <Sun className="nav-icon" /> : <Moon className="nav-icon" />}
                    <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
