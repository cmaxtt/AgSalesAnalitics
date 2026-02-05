import React, { useState } from 'react';
import { Calendar, Bot, TrendingUp, DollarSign, Activity, Users, ShoppingCart, Percent } from 'lucide-react';
import './CashierDashboard.css';

const CashierDashboard = () => {
    const getDefaults = () => {
        const today = new Date();
        const prevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        return {
            start: prevMonth.toISOString().split('T')[0],
            end: today.toISOString().split('T')[0]
        };
    };

    const [dateRange, setDateRange] = useState(getDefaults());
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [aiSummary, setAiSummary] = useState('');

    const handleReset = () => setDateRange(getDefaults());

    const handleRunAnalysis = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:3030/api/reports/cashier-flash', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ startDate: dateRange.start, endDate: dateRange.end })
            });
            const result = await response.json();

            if (response.ok) {
                setReportData(result.data);
                setAiSummary(result.aiSummary);
            } else {
                alert("Error: " + (result.error || "Failed to fetch report"));
            }
        } catch (error) {
            console.error("Fetch error:", error);
            alert("Network error. Please check backend connection.");
        } finally {
            setLoading(false);
        }
    };

    const metrics = reportData ? reportData.reduce((acc, curr) => ({
        sales: acc.sales + curr.SalesVI,
        cost: acc.cost + curr.Cost,
        trans: acc.trans + curr.Trans,
    }), { sales: 0, cost: 0, trans: 0 }) : { sales: 0, cost: 0, trans: 0 };

    const overallMargin = metrics.sales > 0 ? ((metrics.sales - metrics.cost) / metrics.sales * 100) : 0;
    const averageATV = metrics.trans > 0 ? (metrics.sales / metrics.trans) : 0;

    return (
        <div className="cashier-dashboard">
            <header className="cd-header">
                <div className="cd-title">
                    <h1>Cashier Flash Analysis</h1>
                    <span style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Personnel Performance & Transaction Metrics</span>
                </div>
                <div className="cd-controls">
                    <div className="cd-control-group">
                        <label>Start Date</label>
                        <input
                            type="date"
                            className="cd-date-input"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        />
                    </div>
                    <div className="cd-control-group">
                        <label>End Date</label>
                        <input
                            type="date"
                            className="cd-date-input"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        />
                    </div>
                    <button
                        className="cd-run-btn"
                        onClick={handleReset}
                        style={{ background: 'transparent', border: '1px solid rgba(74, 222, 128, 0.3)', width: 'auto', padding: '0.6rem', color: 'white' }}
                    >
                        Reset
                    </button>
                    <button className="cd-run-btn" onClick={handleRunAnalysis} disabled={loading}>
                        {loading ? 'Processing...' : 'Run Analysis'}
                    </button>
                </div>
            </header>

            <div className="cd-metrics-grid">
                <div className="cd-stat-card border-cyan">
                    <div className="cd-stat-title">TOTAL SALES VI</div>
                    <div className="cd-stat-value text-cyan">${metrics.sales.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    <div className="cd-stat-trend">
                        <DollarSign size={16} className="text-cyan" />
                        <span>Gross Volume</span>
                    </div>
                </div>
                <div className="cd-stat-card border-green">
                    <div className="cd-stat-title">TRANSACTIONS</div>
                    <div className="cd-stat-value text-green">{metrics.trans.toLocaleString()}</div>
                    <div className="cd-stat-trend">
                        <ShoppingCart size={16} className="text-green" />
                        <span>Total Invoices</span>
                    </div>
                </div>
                <div className="cd-stat-card border-pink">
                    <div className="cd-stat-title">OVERALL MARGIN</div>
                    <div className="cd-stat-value text-pink">{overallMargin.toFixed(1)}%</div>
                    <div className="cd-stat-trend">
                        <Percent size={16} className="text-pink" />
                        <span>Profitability %</span>
                    </div>
                </div>
                <div className="cd-stat-card border-amber">
                    <div className="cd-stat-title">AVERAGE ATV</div>
                    <div className="cd-stat-value text-amber">${averageATV.toFixed(2)}</div>
                    <div className="cd-stat-trend">
                        <Activity size={16} className="text-amber" />
                        <span>Value per Trans</span>
                    </div>
                </div>
            </div>

            {aiSummary && (
                <div className="cd-ai-section">
                    <div className="cd-ai-header">
                        <Bot size={24} className="cd-ai-icon" />
                        <h3>AI-Intelligence Report</h3>
                    </div>
                    <div className="cd-ai-content">
                        {aiSummary}
                    </div>
                </div>
            )}

            <div className="cd-table-container">
                <table className="cd-table">
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'left', paddingLeft: '1.5rem' }}>CASHIER</th>
                            <th style={{ textAlign: 'center' }}>DATE</th>
                            <th style={{ textAlign: 'center' }}>PERIOD</th>
                            <th style={{ textAlign: 'center' }}>REG</th>
                            <th style={{ textAlign: 'right' }}>SALES VI</th>
                            <th style={{ textAlign: 'right' }}>TRANS</th>
                            <th style={{ textAlign: 'right', paddingRight: '1.5rem' }}>MARGIN %</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reportData ? reportData.map((row, idx) => (
                            <tr key={idx}>
                                <td style={{ textAlign: 'left', paddingLeft: '1.5rem', fontWeight: 500 }}>{row.UserName}</td>
                                <td style={{ textAlign: 'center' }}>{new Date(row.InvoiceDate).toLocaleDateString()}</td>
                                <td style={{ textAlign: 'center' }}>{row.SalesPeriod}</td>
                                <td style={{ textAlign: 'center' }}>{row.Register}</td>
                                <td style={{ textAlign: 'right', color: '#4ade80' }}>${row.SalesVI.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td style={{ textAlign: 'right' }}>{row.Trans}</td>
                                <td style={{ textAlign: 'right', paddingRight: '1.5rem', color: row['%Margin'] < 20 ? '#ef4444' : 'inherit' }}>
                                    {row['%Margin'].toFixed(2)}%
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                                    Enter date range and Run Analysis to view findings.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CashierDashboard;
