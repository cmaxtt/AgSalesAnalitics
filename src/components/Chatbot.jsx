import React, { useState, useRef, useEffect } from 'react';
import { Send, FileText, Table as TableIcon, Activity, BarChart2, PieChart as PieIcon, Layers } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ComposedChart } from 'recharts';
import './Chatbot.css';

const Chatbot = () => {
    const [messages, setMessages] = useState([
        { type: 'bot', content: 'Hello! I am your AI Data Analyst. Ask me anything about the MCV database (e.g., "Show me top 5 vendors by revenue").' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = { type: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const response = await fetch('http://localhost:3030/api/chat/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userPrompt: userMsg.content })
            });

            const data = await response.json();

            if (data.error) {
                setMessages(prev => [...prev, { type: 'bot', content: `Error: ${data.error}` }]);
            } else {
                setMessages(prev => [...prev, {
                    type: 'bot',
                    content: data.explanation || 'Here are the results:',
                    data: data.data,
                    sql: data.sql
                }]);
            }
        } catch (err) {
            console.error("Chat Error:", err);
            setMessages(prev => [...prev, { type: 'bot', content: 'Connection failed. Please ensure the backend is running.' }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const getFilename = (baseName) => {
        const now = new Date();
        const date = now.toISOString().split('T')[0];
        const time = now.toTimeString().split(' ')[0].replace(/:/g, '-');
        return `${baseName}_${date}_${time}`;
    };

    const exportToExcel = (data) => {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Report");
        XLSX.writeFile(wb, `${getFilename('AI_Report')}.xlsx`);
    };

    const exportToPDF = (data) => {
        try {
            const doc = new jsPDF();
            console.log("PDF Init", doc);
            if (!data || data.length === 0) {
                alert("No data to export");
                return;
            }

            const headers = Object.keys(data[0]);
            const rows = data.map(obj => Object.values(obj));

            doc.setFontSize(16);
            doc.text("AI Generated Report", 14, 15);
            doc.setFontSize(10);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

            autoTable(doc, {
                head: [headers],
                body: rows,
                startY: 28,
                styles: { fontSize: 8 },
                theme: 'grid'
            });
            const filename = `${getFilename('AI_Report')}.pdf`;
            console.log("Saving PDF as", filename);
            doc.save(filename);
        } catch (error) {
            console.error("PDF Export Error:", error);
            alert("Failed to generate PDF. check console for details.");
        }
    };

    const formatValue = (key, value) => {
        if (typeof value === 'number') {
            if (key.toLowerCase().includes('amount') || key.toLowerCase().includes('price') || key.toLowerCase().includes('revenue') || key.toLowerCase().includes('cost') || key.toLowerCase().includes('profit')) {
                return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
            }
            if (key.toLowerCase().includes('percent') || key.toLowerCase().includes('pct') || key.includes('%')) {
                return value.toFixed(2) + '%';
            }
        }
        if (typeof value === 'string' && !isNaN(Date.parse(value)) && value.length > 10) {
            // Try to detect dates (rough heuristic)
            const d = new Date(value);
            if (!isNaN(d.getTime())) return d.toLocaleDateString();
        }
        return value;
    };

    const handleExport = (type, data) => {
        try {
            if (type === 'excel') exportToExcel(data);
            if (type === 'pdf') exportToPDF(data);
        } catch (error) {
            console.error("Export failed:", error);
            alert("Failed to save report. Please try again.");
        }
    };

    // Intelligent Chart Rendering
    const ChartRenderer = ({ data }) => {
        const [view, setView] = useState('table'); // table, line, bar, stacked, combo, pie

        if (!data || data.length === 0) return <div className="result-block"><p className="no-data">No data returned.</p></div>;

        const headers = Object.keys(data[0]);
        // Simple heuristics to find Axis
        const keyX = headers.find(h => h.toLowerCase().includes('date') || h.toLowerCase().includes('name') || h.toLowerCase().includes('code')) || headers[0];
        const keysY = headers.filter(h => typeof data[0][h] === 'number');

        // Colors for charts
        const COLORS = ['#667eea', '#764ba2', '#10b981', '#f59e0b', '#ef4444'];

        const renderChart = () => {
            // Limit data points for performance/readability on charts
            const chartData = data.length > 30 ? data.slice(0, 30) : data;

            switch (view) {
                case 'line':
                    return (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey={keyX} />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                {keysY.map((k, i) => <Line key={k} type="monotone" dataKey={k} stroke={COLORS[i % COLORS.length]} />)}
                            </LineChart>
                        </ResponsiveContainer>
                    );
                case 'bar':
                    return (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey={keyX} />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                {keysY.map((k, i) => <Bar key={k} dataKey={k} fill={COLORS[i % COLORS.length]} />)}
                            </BarChart>
                        </ResponsiveContainer>
                    );
                case 'stacked':
                    return (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey={keyX} />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                {keysY.map((k, i) => <Bar key={k} dataKey={k} stackId="a" fill={COLORS[i % COLORS.length]} />)}
                            </BarChart>
                        </ResponsiveContainer>
                    );
                case 'combo':
                    return (
                        <ResponsiveContainer width="100%" height={300}>
                            <ComposedChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey={keyX} />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                {keysY.length > 0 && <Bar dataKey={keysY[0]} fill={COLORS[0]} />}
                                {keysY.length > 1 && <Line type="monotone" dataKey={keysY[1]} stroke={COLORS[1]} />}
                                {keysY.length === 1 && <Line type="monotone" dataKey={keysY[0]} stroke={COLORS[1]} />}
                            </ComposedChart>
                        </ResponsiveContainer>
                    );
                case 'pie':
                    return (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%" cy="50%"
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey={keysY[0]} // Use first numeric value
                                    nameKey={keyX}
                                    label
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    );
                default: // Table view
                    return (
                        <div className="result-table-container">
                            <table className="result-table">
                                <thead>
                                    <tr>{headers.map(h => <th key={h}>{h}</th>)}</tr>
                                </thead>
                                <tbody>
                                    {data.slice(0, 50).map((row, i) => (
                                        <tr key={i}>{headers.map((h, j) => <td key={j}>{formatValue(h, row[h])}</td>)}</tr>
                                    ))}
                                </tbody>
                            </table>
                            {data.length > 50 && <div className="table-footer">Showing first 50 of {data.length} rows. Export for full data.</div>}
                        </div>
                    );
            }
        };

        return (
            <div className="result-block">
                <div className="result-actions">
                    <div className="view-toggles">
                        <button title="Table View" className={`toggle-btn ${view === 'table' ? 'active' : ''}`} onClick={() => setView('table')}><TableIcon size={16} /></button>
                        <button title="Line Chart" className={`toggle-btn ${view === 'line' ? 'active' : ''}`} onClick={() => setView('line')}><Activity size={16} /></button>
                        <button title="Bar Chart" className={`toggle-btn ${view === 'bar' ? 'active' : ''}`} onClick={() => setView('bar')}><BarChart2 size={16} /></button>
                        <button title="Stacked Bar" className={`toggle-btn ${view === 'stacked' ? 'active' : ''}`} onClick={() => setView('stacked')}><Layers size={16} /></button>
                        <button title="Combo Chart" className={`toggle-btn ${view === 'combo' ? 'active' : ''}`} onClick={() => setView('combo')}><Activity size={16} />+</button>
                        <button title="Pie Chart" className={`toggle-btn ${view === 'pie' ? 'active' : ''}`} onClick={() => setView('pie')}><PieIcon size={16} /></button>
                    </div>
                    <div className="export-actions">
                        <button onClick={() => handleExport('excel', data)} className="export-btn excel" title="Save Excel"><TableIcon size={14} style={{ marginRight: 4 }} /> XLS</button>
                        <button onClick={() => handleExport('pdf', data)} className="export-btn pdf" title="Save PDF"><FileText size={14} style={{ marginRight: 4 }} /> PDF</button>
                    </div>
                </div>
                <div className="result-content-area">
                    {renderChart()}
                </div>
            </div>
        );
    };

    return (
        <div className="chatbot-container">
            <div className="chat-messages">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`message ${msg.type}`}>
                        {msg.content && <div className="content" style={{ marginBottom: msg.data ? '8px' : '0' }}>{msg.content}</div>}
                        {msg.data && <ChartRenderer data={msg.data} />}
                    </div>
                ))}
                {loading && (
                    <div className="message bot">
                        <div className="loading-dots"><span></span><span></span><span></span></div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area">
                <input
                    type="text"
                    className="chat-input"
                    placeholder="Ask a question (e.g., Who are the top 5 customers?)"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                />
                <button className="send-button" onClick={handleSend} disabled={loading}>
                    <Send size={20} />
                </button>
            </div>
        </div>
    );
};

export default Chatbot;
