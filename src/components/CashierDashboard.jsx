import React, { useState } from 'react';
import { Calendar, Bot, TrendingUp, DollarSign, Activity, Users, ShoppingCart, Percent, BarChart2, PieChart as PieIcon, Layers, Table as TableIcon, Loader2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ComposedChart } from 'recharts';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
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
    const [view, setView] = useState('table'); // table, bar, combo, pie

    const handleReset = () => setDateRange(getDefaults());

    const getFilename = (baseName) => {
        const now = new Date();
        const date = now.toISOString().split('T')[0];
        const time = now.toTimeString().split(' ')[0].replace(/:/g, '-');
        return `${baseName}_${date}_${time}`;
    };

    const handleExportExcel = () => {
        if (!reportData) return;
        const ws = XLSX.utils.json_to_sheet(reportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Cashier_Flash");
        XLSX.writeFile(wb, `${getFilename('Cashier_Flash')}.xlsx`);
    };

    const handleExportPDF = () => {
        if (!reportData) return;
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text("Cashier Flash Analysis", 14, 15);
        doc.setFontSize(10);
        doc.text(`Period: ${dateRange.start} to ${dateRange.end}`, 14, 22);

        const tableColumn = ["Cashier", "Date", "Period", "Reg", "Sales VI", "Trans", "Margin %"];
        const tableRows = reportData.map(row => [
            row.UserName,
            new Date(row.InvoiceDate).toLocaleDateString(),
            row.SalesPeriod,
            row.Register,
            `$${row.SalesVI.toLocaleString()}`,
            row.Trans,
            `${row['%Margin'].toFixed(2)}%`
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 28,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [59, 130, 246] } // Blue header
        });
        doc.save(`${getFilename('Cashier_Flash')}.pdf`);
    };

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
                    <button className="cd-run-btn" onClick={handleRunAnalysis} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {loading ? <><Loader2 className="animate-spin" size={18} /> Processing...</> : 'Run Analysis'}
                    </button>
                    {reportData && (
                        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem', borderLeft: '1px solid #374151', paddingLeft: '1rem' }}>
                            <button
                                onClick={handleExportExcel}
                                title="Export to Excel"
                                style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', padding: '0.6rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                                <TableIcon size={14} /> XLSX
                            </button>
                            <button
                                onClick={handleExportPDF}
                                title="Save as PDF"
                                style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', padding: '0.6rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                                <Users size={14} /> PDF
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* View Toggles */}
            {reportData && (
                <div className="cd-actions">
                    <div className="view-toggles">
                        <button title="Table View" className={`toggle-btn ${view === 'table' ? 'active' : ''}`} onClick={() => setView('table')}><TableIcon size={16} /> Table</button>
                        <button title="Bar Chart (Sales)" className={`toggle-btn ${view === 'bar' ? 'active' : ''}`} onClick={() => setView('bar')}><BarChart2 size={16} /> Sales</button>
                        <button title="Combo (Sales & Margin)" className={`toggle-btn ${view === 'combo' ? 'active' : ''}`} onClick={() => setView('combo')}><Activity size={16} /> Combo</button>
                        <button title="Pie Trans" className={`toggle-btn ${view === 'pie' ? 'active' : ''}`} onClick={() => setView('pie')}><PieIcon size={16} /> Trans</button>
                    </div>
                </div>
            )}

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
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiSummary}</ReactMarkdown>
                    </div>
                </div>
            )}



            {/* Chart Section */}
            {view !== 'table' && reportData && (
                <div className="cd-chart-section" style={{ height: '400px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', padding: '20px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        {view === 'bar' ? (
                            <BarChart data={reportData.slice(0, 20)}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="UserName" stroke="#9ca3af" fontSize={12} tickFormatter={(val) => val.length > 10 ? val.substring(0, 10) + '...' : val} />
                                <YAxis stroke="#9ca3af" />
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#f3f4f6' }} />
                                <Legend />
                                <Bar dataKey="SalesVI" name="Total Sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        ) : view === 'combo' ? (
                            <ComposedChart data={reportData.slice(0, 20)}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="UserName" stroke="#9ca3af" fontSize={12} tickFormatter={(val) => val.length > 10 ? val.substring(0, 10) + '...' : val} />
                                <YAxis yAxisId="left" stroke="#9ca3af" />
                                <YAxis yAxisId="right" orientation="right" stroke="#ec4899" />
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#f3f4f6' }} />
                                <Legend />
                                <Bar yAxisId="left" dataKey="SalesVI" name="Total Sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                <Line yAxisId="right" type="monotone" dataKey="%Margin" name="Margin %" stroke="#ec4899" strokeWidth={2} />
                            </ComposedChart>
                        ) : (
                            <PieChart>
                                <Pie
                                    data={reportData.slice(0, 10)}
                                    cx="50%" cy="50%"
                                    outerRadius={120}
                                    fill="#8884d8"
                                    dataKey="Trans"
                                    nameKey="UserName"
                                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                        const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                                        const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                                        return `${(percent * 100).toFixed(0)}%`;
                                    }}
                                >
                                    {reportData.slice(0, 10).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][index % 6]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#f3f4f6' }} />
                                <Legend />
                            </PieChart>
                        )}
                    </ResponsiveContainer>
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
