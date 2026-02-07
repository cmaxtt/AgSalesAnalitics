import React, { useState, useMemo, useEffect } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';
import { Calendar, Users, ShoppingCart, DollarSign, TrendingUp, Info, Loader2 } from 'lucide-react';
import './ExecutiveDashboard.css';

const ExecutiveDashboard = () => {
    console.log("ExecutiveDashboard: Rendering...");
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

    // Auto-load data on mount
    useEffect(() => {
        console.log("ExecutiveDashboard: Mounted, fetching data...");
        handleRunAnalysis();
    }, []);

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
            } else {
                alert("Error: " + (result.error || "Failed to fetch data"));
            }
        } catch (error) {
            console.error("Fetch error:", error);
            alert("Network error. Please check backend connection.");
        } finally {
            setLoading(false);
        }
    };

    // Data Processing for Charts
    const { chartData, pieData, metrics } = useMemo(() => {
        if (!reportData || reportData.length === 0) return { chartData: [], pieData: [], metrics: {} };

        // 1. Metrics
        const totalSales = reportData.reduce((sum, r) => sum + r.SalesVI, 0);
        const totalTrans = reportData.reduce((sum, r) => sum + r.Trans, 0);
        const totalCost = reportData.reduce((sum, r) => sum + r.Cost, 0);
        const uniqueCashiers = new Set(reportData.map(r => r.UserName)).size;
        const uniqueRegs = new Set(reportData.map(r => r.Register)).size;

        const metrics = {
            sales: totalSales,
            trans: totalTrans,
            regs: uniqueRegs,
            cashiers: uniqueCashiers,
            atv: totalTrans > 0 ? totalSales / totalTrans : 0,
            margin: totalSales > 0 ? ((totalSales - totalCost) / totalSales * 100) : 0
        };

        // 2. Trend Data (Aggregate by Date)
        const dateMap = {};
        reportData.forEach(r => {
            const date = new Date(r.InvoiceDate).toLocaleDateString();
            if (!dateMap[date]) dateMap[date] = 0;
            dateMap[date] += r.SalesVI;
        });
        const chartData = Object.keys(dateMap).map(date => ({ date, sales: dateMap[date] }))
            .sort((a, b) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return (isNaN(dateA) || isNaN(dateB)) ? 0 : dateA - dateB;
            });

        // 3. Pie Data (Sales by Cashier)
        const cashierMap = {};
        reportData.forEach(r => {
            if (!cashierMap[r.UserName]) cashierMap[r.UserName] = 0;
            cashierMap[r.UserName] += r.SalesVI;
        });
        const pieData = Object.keys(cashierMap).map(name => ({ name, value: cashierMap[name] })).sort((a, b) => b.value - a.value).slice(0, 5);

        // 4. Register Data (Sales by Register)
        const registerMap = {};
        reportData.forEach(r => {
            if (!registerMap[r.Register]) registerMap[r.Register] = 0;
            registerMap[r.Register] += r.SalesVI;
        });
        const regData = Object.keys(registerMap).map(name => ({ name, value: registerMap[name] })).sort((a, b) => b.value - a.value);

        return { chartData, pieData, regData, metrics };
    }, [reportData]);

    const COLORS = ['#3b82f6', '#10b981', '#f43f5e', '#fbbf24', '#8b5cf6'];

    return (
        <div className="executive-dashboard">
            <header className="ed-header">
                <div className="ed-header-left">
                    <div className="ed-logo-circle"></div>
                    <h1>Executive Profitability Overview</h1>
                </div>
                <div className="ed-controls">
                    <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    />
                    <span>to</span>
                    <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    />
                    <button onClick={handleRunAnalysis} disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin" size={16} />
                                <span>Processing...</span>
                            </>
                        ) : (
                            'Run Report'
                        )}
                    </button>
                </div>
            </header>

            <div className="ed-metrics-row">
                <div className="ed-metric-card">
                    <div className="ed-metric-icon revenue"><DollarSign size={18} /></div>
                    <div className="ed-metric-value">${(metrics.sales || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                    <div className="ed-metric-label">Total Revenue</div>
                </div>
                <div className="ed-metric-card">
                    <div className="ed-metric-icon trans"><ShoppingCart size={18} /></div>
                    <div className="ed-metric-value">{(metrics.trans || 0).toLocaleString()}</div>
                    <div className="ed-metric-label">Invoices Booked</div>
                </div>
                <div className="ed-metric-card">
                    <div className="ed-metric-icon regs"><Calendar size={18} /></div>
                    <div className="ed-metric-value">{metrics.regs || 0}</div>
                    <div className="ed-metric-label">Active Registers</div>
                </div>
                <div className="ed-metric-card">
                    <div className="ed-metric-icon users"><Users size={18} /></div>
                    <div className="ed-metric-value">{metrics.cashiers || 0}</div>
                    <div className="ed-metric-label">Staff Count</div>
                </div>
                <div className="ed-metric-card">
                    <div className="ed-metric-icon trend"><TrendingUp size={18} /></div>
                    <div className="ed-metric-value">${(metrics.atv || 0).toFixed(2)}</div>
                    <div className="ed-metric-label">Avg Sale Value</div>
                </div>
                <div className="ed-metric-card">
                    <div className="ed-metric-icon info"><Info size={18} /></div>
                    <div className="ed-metric-value">{(metrics.margin || 0).toFixed(1)}%</div>
                    <div className="ed-metric-label">Profit Margin</div>
                </div>
            </div>

            <div className="ed-charts-grid">
                <div className="ed-chart-container full-width">
                    <div className="ed-chart-header">Revenue Performance Trend</div>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="date"
                                    fontSize={10}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8' }}
                                    minTickGap={30}
                                />
                                <YAxis
                                    fontSize={10}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8' }}
                                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                                />
                                <Area type="monotone" dataKey="sales" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSales)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="ed-chart-container">
                    <div className="ed-chart-header">Sales by Top Cashiers</div>
                    <div style={{ width: '100%', height: 250 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="ed-chart-container">
                    <div className="ed-chart-header">Register Utilization</div>
                    <div style={{ width: '100%', height: 250 }}>
                        <ResponsiveContainer>
                            <BarChart data={regData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <footer className="ed-footer">
                <div className="ed-footer-item">
                    <div className="ed-footer-bar" style={{ width: '80%', background: '#3b82f6' }}></div>
                    <span>Revenue Target Met</span>
                </div>
                <div className="ed-footer-item">
                    <div className="ed-footer-bar" style={{ width: '65%', background: '#10b981' }}></div>
                    <span>Volume Performance</span>
                </div>
                <div className="ed-footer-item">
                    <div className="ed-footer-bar" style={{ width: '90%', background: '#fbbf24' }}></div>
                    <span>Margin Stability</span>
                </div>
            </footer>
        </div>
    );
};

export default ExecutiveDashboard;
