import React, { useState } from 'react';
import { Calendar, Bot, TrendingUp, DollarSign, Activity, Package } from 'lucide-react';
import './VendorDashboard.css';

const VendorDashboard = () => {
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

    const handleExportExcel = () => {
        if (!reportData) return;
        const headers = ["Vendor Name", "Invoices", "Units", "Net Revenue", "Total Cost", "Gross Profit", "Margin %"];
        const csvContent = [
            headers.join(","),
            ...reportData.map(row => [
                `"${row.VendorName}"`,
                row.TotalInvoices,
                row.TotalUnitsSold,
                row.NetRevenue.toFixed(2),
                row.TotalCost.toFixed(2),
                row.GrossProfit.toFixed(2),
                row.MarginPct.toFixed(2) + "%"
            ].join(","))
        ].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `vendor_revenue_${dateRange.start}_${dateRange.end}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportPDF = () => {
        if (!reportData) return;
        window.print();
    };

    const handleRunAnalysis = async () => {
        setLoading(true);
        try {
            const response = await fetch('http://localhost:3030/api/reports/vendor-revenue', {
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

    // Calculate Summary Metrics from Data
    const metrics = reportData ? reportData.reduce((acc, curr) => ({
        revenue: acc.revenue + curr.NetRevenue,
        profit: acc.profit + curr.GrossProfit,
        units: acc.units + curr.TotalUnitsSold,
        margin: acc.margin + (curr.MarginPct * (curr.NetRevenue / (reportData.reduce((s, c) => s + c.NetRevenue, 0) || 1))) // Weighted avg approx
    }), { revenue: 0, profit: 0, units: 0, margin: 0 }) : { revenue: 0, profit: 0, units: 0, margin: 0 };

    return (
        <div className="vendor-dashboard">
            <header className="vd-header">
                <div className="vd-title">
                    <h1>Vendor Range Revenue Analysis</h1>
                    <span style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Real-time performance metrics & AI Insights</span>
                </div>
                <div className="vd-controls">
                    <div className="vd-control-group">
                        <label>From Date</label>
                        <input
                            type="date"
                            className="vd-date-input"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                        />
                    </div>
                    <div className="vd-control-group">
                        <label>To Date</label>
                        <input
                            type="date"
                            className="vd-date-input"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                        />
                    </div>
                    <button
                        className="vd-run-btn"
                        onClick={handleReset}
                        style={{ background: 'transparent', border: '1px solid rgba(74, 222, 128, 0.3)', width: 'auto', padding: '0.6rem' }}
                        title="Reset to Default Dates"
                    >
                        Reset
                    </button>
                    <button className="vd-run-btn" onClick={handleRunAnalysis} disabled={loading}>
                        {loading ? 'Analyzing...' : 'Run Analysis'}
                    </button>

                    {reportData && (
                        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem', borderLeft: '1px solid #374151', paddingLeft: '1rem' }}>
                            <button
                                onClick={handleExportExcel}
                                title="Export to Excel"
                                style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', padding: '0.6rem', cursor: 'pointer' }}
                            >
                                Excel
                            </button>
                            <button
                                onClick={handleExportPDF}
                                title="Print / Save as PDF"
                                style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', padding: '0.6rem', cursor: 'pointer' }}
                            >
                                PDF
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <div className="vd-metrics-grid">
                <div className="vd-stat-card">
                    <div className="vd-stat-title">Total Revenue</div>
                    <div className="vd-stat-value text-green">${metrics.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    <div className="vd-stat-trend">
                        <TrendingUp size={16} className="vd-trend-up" />
                        <span>Aggregated Period Sales</span>
                    </div>
                </div>
                <div className="vd-stat-card">
                    <div className="vd-stat-title">Gross Profit</div>
                    <div className="vd-stat-value">${metrics.profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    <div className="vd-stat-trend">
                        <Activity size={16} className="text-white" />
                        <span>Net Earnings</span>
                    </div>
                </div>
                <div className="vd-stat-card">
                    <div className="vd-stat-title">Total Volume</div>
                    <div className="vd-stat-value">{metrics.units.toLocaleString()}</div>
                    <div className="vd-stat-trend">
                        <Package size={16} />
                        <span>Units Sold</span>
                    </div>
                </div>
                <div className="vd-stat-card">
                    <div className="vd-stat-title">Avg Margin</div>
                    <div className="vd-stat-value">{(metrics.revenue > 0 ? (metrics.profit / metrics.revenue * 100) : 0).toFixed(1)}%</div>
                    <div className="vd-stat-trend">
                        <DollarSign size={16} />
                        <span>Return on Sales</span>
                    </div>
                </div>
            </div>

            {aiSummary && (
                <div className="vd-ai-section" style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 78, 59, 0.2) 100%)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
                    marginBottom: '2rem'
                }}>
                    <div className="vd-ai-header" style={{ borderBottom: '1px solid rgba(16, 185, 129, 0.1)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                        <Bot size={24} className="vd-ai-icon" style={{ color: '#34d399', filter: 'drop-shadow(0 0 5px rgba(52, 211, 153, 0.5))' }} />
                        <h3 style={{ margin: 0, color: '#f0fdf4', fontSize: '1.1rem', letterSpacing: '0.5px' }}>AI-Intelligence Report</h3>
                    </div>
                    <div className="vd-ai-content" style={{ color: '#d1fae5', fontSize: '0.95rem', lineHeight: '1.7', fontFamily: "'Inter', sans-serif" }}>
                        {aiSummary}
                    </div>
                </div>
            )}

            <div className="vd-table-container">
                <table className="vd-table">
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'left', paddingLeft: '1.5rem', color: '#4ade80', letterSpacing: '0.05em' }}>VENDOR NAME</th>
                            <th style={{ textAlign: 'right', width: '10%' }}>INVOICES</th>
                            <th style={{ textAlign: 'right', width: '10%' }}>UNITS</th>
                            <th style={{ textAlign: 'right', width: '15%', color: '#4ade80' }}>NET REVENUE</th>
                            <th style={{ textAlign: 'right', width: '15%' }}>TOTAL COST</th>
                            <th style={{ textAlign: 'right', width: '15%' }}>GROSS PROFIT</th>
                            <th style={{ textAlign: 'right', width: '10%', paddingRight: '1.5rem' }}>MARGIN %</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reportData ? reportData.map((row, idx) => (
                            <tr key={idx}>
                                <td style={{ textAlign: 'left', paddingLeft: '1.5rem', fontWeight: 500, color: 'white' }}>{row.VendorName}</td>
                                <td style={{ textAlign: 'right' }}>{row.TotalInvoices}</td>
                                <td style={{ textAlign: 'right' }}>{row.TotalUnitsSold}</td>
                                <td style={{ textAlign: 'right', color: '#4ade80', fontWeight: '600' }}>${row.NetRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                <td style={{ textAlign: 'right' }}>${row.TotalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                <td style={{ textAlign: 'right', color: 'white' }}>${row.GrossProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                <td style={{ textAlign: 'right', paddingRight: '1.5rem' }}>{row.MarginPct.toFixed(2)}%</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                                    Select a date range and click "Run Analysis" to load data.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {/* Print Styles */}
            <style>{`
                @media print {
                    .sidebar, .vd-controls, .vd-header .vd-title span { display: none !important; }
                    .vendor-dashboard { background: white; color: black; padding: 0; }
                    .vd-header { border-bottom: 2px solid #000; margin-bottom: 1rem; }
                    .vd-title h1 { color: #000; font-size: 1.5rem; }
                    .vd-stat-card { border: 1px solid #ccc; background: #fff; color: #000; }
                    .vd-stat-value, .vd-stat-title, .vd-stat-trend { color: #000 !important; }
                    .vd-ai-section { border: 1px solid #ccc; background: #f9f9f9; box-shadow: none; color: #000; }
                    .vd-ai-header h3, .vd-ai-content { color: #000 !important; }
                    .vd-table th { background: #eee; color: #000 !important; border-bottom: 1px solid #000; }
                    .vd-table td { color: #000 !important; border-bottom: 1px solid #ddd; }
                    .vd-table-container { border: none; }
                }
            `}</style>
        </div>
    );
};

export default VendorDashboard;
