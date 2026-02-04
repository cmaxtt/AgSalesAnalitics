
import React from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { ArrowLeft, TrendingUp, DollarSign, RotateCcw, Download } from 'lucide-react';
import './ResultsDashboard.css';

// Simulated Data
const data = [
    { name: 'Jan', sales: 4000, returns: 400 },
    { name: 'Feb', sales: 3000, returns: 200 },
    { name: 'Mar', sales: 5000, returns: 350 },
    { name: 'Apr', sales: 2780, returns: 100 },
    { name: 'May', sales: 1890, returns: 50 },
    { name: 'Jun', sales: 6390, returns: 400 },
    { name: 'Jul', sales: 8490, returns: 800 },
];

const ResultsDashboard = ({ onBack, analysisResult }) => {
    // If we have an AI summary, use it. Otherwise fall back to a default message.
    // We intentionally don't fallback to the hardcoded text to avoid confusion, 
    // unless analysisResult is missing entirely (which shouldn't happen in normal flow).

    // Format the summary to handle newlines if any
    const renderSummary = () => {
        if (analysisResult?.aiSummary) {
            return (
                <div className="insight-content">
                    <p style={{ whiteSpace: 'pre-wrap' }}>{analysisResult.aiSummary}</p>
                </div>
            );
        }
        return (
            <div className="insight-content">
                <p>No AI analysis available. Please check the backend connection and API key.</p>
            </div>
        );
    };

    return (
        <div className="results-container fade-in">
            <header className="results-header">
                <button onClick={onBack} className="back-btn">
                    <ArrowLeft size={20} />
                    <span>New Analysis</span>
                </button>
                <div className="header-actions">
                    <button className="export-btn">
                        <Download size={18} />
                        Export PDF
                    </button>
                </div>
            </header>

            <div className="kpi-grid">
                <div className="kpi-card glass">
                    <div className="kpi-icon primary"><DollarSign size={24} /></div>
                    <div>
                        <p className="kpi-label">Total Revenue</p>
                        <h3>$31,550</h3>
                        <span className="kpi-trend up">+12.5% vs last month</span>
                    </div>
                </div>
                <div className="kpi-card glass">
                    <div className="kpi-icon secondary"><TrendingUp size={24} /></div>
                    <div>
                        <p className="kpi-label">Net Sales</p>
                        <h3>$29,250</h3>
                        <span className="kpi-trend up">+8.2% vs last month</span>
                    </div>
                </div>
                <div className="kpi-card glass">
                    <div className="kpi-icon accent"><RotateCcw size={24} /></div>
                    <div>
                        <p className="kpi-label">Returns</p>
                        <h3>$2,300</h3>
                        <span className="kpi-trend down">-2.1% (Improved)</span>
                    </div>
                </div>
            </div>

            <div className="main-grid">
                <div className="chart-card glass">
                    <h4>Monthly Performance</h4>
                    <div className="chart-wrapper">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#E0BBE4" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#E0BBE4" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#999', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#999', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="sales"
                                    stroke="#E0BBE4"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorSales)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="insight-card glass">
                    <div className="insight-header">
                        <h4>AI Generated Insight</h4>
                        <span className="ai-badge">AI Analysis</span>
                    </div>
                    {renderSummary()}
                </div>
            </div>
        </div>
    );
};

export default ResultsDashboard;
