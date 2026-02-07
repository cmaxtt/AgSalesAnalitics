import React, { useState, useRef, useEffect } from 'react';
import { Send, FileText, Table as TableIcon, Activity, BarChart2, PieChart as PieIcon, Layers, Star, Trash2, X, History, User } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ComposedChart } from 'recharts';
import './Chatbot.css';

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

// Intelligent Chart Rendering Component
const ChartRenderer = ({ data, id, onExport }) => {
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

        // Chart Container Wrapper with Unique ID
        const ChartWrapper = ({ children }) => (
            <div id={`${id}-chart-container`} style={{ background: 'white', padding: '10px', borderRadius: '8px' }}>
                {children}
            </div>
        );

        switch (view) {
            case 'line':
                return (
                    <ChartWrapper>
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
                    </ChartWrapper>
                );
            case 'bar':
                return (
                    <ChartWrapper>
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
                    </ChartWrapper>
                );
            case 'stacked':
                return (
                    <ChartWrapper>
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
                    </ChartWrapper>
                );
            case 'combo':
                return (
                    <ChartWrapper>
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
                    </ChartWrapper>
                );
            case 'pie':
                return (
                    <ChartWrapper>
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
                    </ChartWrapper>
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
        <div className="result-block" id={id}>
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
                    <button onClick={() => onExport('excel', data, id)} className="export-btn excel" title="Save Excel"><TableIcon size={14} style={{ marginRight: 4 }} /> XLS</button>
                    <button onClick={() => onExport('pdf', data, id)} className="export-btn pdf" title="Save PDF"><FileText size={14} style={{ marginRight: 4 }} /> PDF</button>
                </div>
            </div>
            <div className="result-content-area">
                {renderChart()}
            </div>
        </div>
    );
};

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

    const [favorites, setFavorites] = useState([]);
    const [showFavorites, setShowFavorites] = useState(false);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        fetchFavorites();
    }, []);

    const fetchFavorites = async () => {
        try {
            const res = await fetch('http://localhost:3030/api/chat/favorites');
            if (res.ok) {
                const data = await res.json();
                setFavorites(data);
            }
        } catch (error) {
            console.error("Failed to load favorites", error);
        }
    };

    const addToFavorites = async (msg) => {
        if (!msg.content && !msg.sql) return;
        const note = prompt("Enter a name for this favorite (optional):");
        if (note === null) return;

        try {
            const res = await fetch('http://localhost:3030/api/chat/favorite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    queryText: msg.content,
                    generatedSql: msg.sql,
                    note: note || "Saved Query"
                })
            });
            if (res.ok) {
                alert("Added to favorites!");
                fetchFavorites();
            }
        } catch (error) {
            console.error("Failed to add favorite", error);
        }
    };

    const deleteFavorite = async (id, e) => {
        e.stopPropagation();
        if (!confirm("Delete this favorite?")) return;
        try {
            await fetch(`http://localhost:3030/api/chat/favorite/${id}`, { method: 'DELETE' });
            fetchFavorites();
        } catch (error) {
            console.error("Failed to delete favorite", error);
        }
    };

    const executeQuery = async (queryText) => {
        if (!queryText || !queryText.trim()) return;

        const userMsg = { type: 'user', content: queryText };
        setMessages(prev => [...prev, userMsg]);
        setLoading(true);

        try {
            const response = await fetch('http://localhost:3030/api/chat/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userPrompt: queryText })
            });

            const data = await response.json();

            if (data.error) {
                setMessages(prev => [...prev, { type: 'bot', content: `Error: ${data.error}` }]);
            } else {
                setMessages(prev => [...prev, {
                    type: 'bot',
                    content: data.explanation || 'Here are the results:',
                    data: data.data,
                    sql: data.sql,
                    relatedPrompt: queryText
                }]);
            }
        } catch (err) {
            console.error("Chat Error:", err);
            setMessages(prev => [...prev, { type: 'bot', content: 'Connection failed. Please ensure the backend is running.' }]);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = () => {
        if (!input.trim()) return;
        executeQuery(input);
        setInput('');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const getFilename = async (baseName, currentMessages) => {
        const now = new Date();
        const dateStr = now.toLocaleDateString('en-CA');
        const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }).replace(':', '');
        const defaultName = `${baseName}_${dateStr}_${timeStr}`;

        try {
            const lastUserMsg = currentMessages ? [...currentMessages].reverse().find(m => m.type === 'user') : null;
            if (lastUserMsg) {
                const res = await fetch('http://localhost:3030/api/chat/suggest-name', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: lastUserMsg.content })
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.filename) {
                        const aiName = data.filename.replace(/[^a-z0-9_\-\s]/gi, '_').trim();
                        // Prompt with AI suggestion pre-filled
                        const userPrompt = prompt("Confirm report name:", aiName);
                        return userPrompt ? userPrompt.replace(/[^a-z0-9_\-\s]/gi, '_').trim() : defaultName;
                    }
                }
            }
        } catch (e) { console.error("Name suggestion failed", e); }

        const userPrompt = prompt("Enter a name for this report:", defaultName);
        if (!userPrompt) return defaultName;
        return userPrompt.replace(/[^a-z0-9_\-\s]/gi, '_').trim();
    };

    const exportToExcel = (data, filename) => {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Report");
        XLSX.writeFile(wb, `${filename}.xlsx`);
    };

    const exportToPDF = async (data, filename, chartId) => {
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
            doc.text(filename.replace(/_/g, ' ') || "AI Generated Report", 14, 15);
            doc.setFontSize(10);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 22);

            let chartHeight = 0;

            // 1. Capture Chart if available and ID is provided
            if (chartId) {
                const chartContainerId = `${chartId}-chart-container`;
                const chartElement = document.getElementById(chartContainerId);

                if (chartElement) {
                    try {
                        // Wait a moment for any rendering/animations
                        await new Promise(r => setTimeout(r, 500));

                        const canvas = await html2canvas(chartElement, {
                            scale: 2,
                            useCORS: true,
                            logging: false
                        });

                        const imgData = canvas.toDataURL('image/png');
                        const imgProps = doc.getImageProperties(imgData);
                        const pdfWidth = doc.internal.pageSize.getWidth() - 28;
                        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                        doc.addImage(imgData, 'PNG', 14, 30, pdfWidth, pdfHeight);
                        chartHeight = pdfHeight + 10; // Add spacing
                    } catch (e) {
                        console.error("Chart capture failed", e);
                    }
                }
            }

            // 2. Add Data Table
            // Adjust startY based on chart height
            const startY = 30 + chartHeight;

            // Check if table needs new page
            if (startY > doc.internal.pageSize.getHeight() - 40) {
                doc.addPage();
                autoTable(doc, {
                    head: [headers],
                    body: rows,
                    startY: 20,
                    styles: { fontSize: 8 },
                    theme: 'grid'
                });
            } else {
                autoTable(doc, {
                    head: [headers],
                    body: rows,
                    startY: startY,
                    styles: { fontSize: 8 },
                    theme: 'grid'
                });
            }

            console.log("Saving PDF as", filename);
            doc.save(`${filename}.pdf`);
        } catch (error) {
            console.error("PDF Export Error:", error);
            alert("Failed to generate PDF. check console for details.");
        }
    };

    const handleExport = async (type, data, chartId) => {
        console.log(`[Export Debug] Type: ${type}, ChartID: ${chartId}, Data Length: ${data ? data.length : 0}`);
        try {
            // alert(`Starting ${type} export...`); // Temporary debug alert
            const filename = await getFilename('AI_Report', messages);
            console.log("[Export Debug] Filename:", filename);

            if (type === 'excel') {
                exportToExcel(data, filename);
            }
            if (type === 'pdf') {
                console.log("[Export Debug] Calling exportToPDF...");
                await exportToPDF(data, filename, chartId);
            }
        } catch (error) {
            console.error("[Export Debug] Export failed:", error);
            alert("Failed to save report. Check console for details: " + error.message);
        }
    };

    return (
        <div className="chatbot-container">
            <div className="chat-controls">
                <div className="favorites-dropdown-container">
                    <Star size={16} color="#f59e0b" fill="#f59e0b" style={{ marginRight: 4 }} />
                    <select
                        className="favorites-select"
                        onChange={(e) => {
                            if (e.target.value) {
                                executeQuery(e.target.value);
                                e.target.value = "";
                            }
                        }}
                        defaultValue=""
                    >
                        <option value="" disabled>Load Saved Query...</option>
                        {favorites.length === 0 && <option disabled>No favorites saved</option>}
                        {favorites.map(fav => (
                            <option key={fav.ID} value={fav.QueryText}>
                                {fav.Note || (fav.QueryText.length > 30 ? fav.QueryText.substring(0, 30) + '...' : fav.QueryText)}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="chat-messages">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`message ${msg.type}`}>
                        {msg.type === 'bot' && (
                            <div className="message-header">
                                <span className="bot-label">AI Analyst</span>
                                {msg.data && (
                                    <button className="save-favorite-btn" onClick={() => addToFavorites(msg)}>
                                        <Star size={12} /> Save
                                    </button>
                                )}
                            </div>
                        )}
                        {msg.content && <div className="content" style={{ marginBottom: msg.data ? '8px' : '0' }}>{msg.content}</div>}
                        {msg.data && <ChartRenderer data={msg.data} id={`chart-${idx}`} onExport={handleExport} />}
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
