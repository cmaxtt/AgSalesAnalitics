import React, { useState, useRef, useEffect } from 'react';
import { Send, FileText, Table as TableIcon, Activity, BarChart2, PieChart as PieIcon, Layers, Star, Trash2, X, History, User, Printer } from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
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
        const chartData = data.length > 30 ? data.slice(0, 30) : data;

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
                                    dataKey={keysY[0]}
                                    nameKey={keyX}
                                    label
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell - ${index} `} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartWrapper>
                );
            default:
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

    const handlePrint = async () => {
        const chartContainer = document.getElementById(`${id}-chart-container`);
        let chartImg = '';

        if (chartContainer) {
            try {
                const canvas = await html2canvas(chartContainer, { scale: 2 });
                chartImg = canvas.toDataURL('image/png');
            } catch (e) {
                console.error("Print capture failed", e);
            }
        }

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert("Please allow popups to print");
            return;
        }

        // Prepare Report Sections
        const aiReportHTML = aiReport ? `
            <div class="report-section ai-report">
                <h3>AI-Intelligence Report</h3>
                <p>${aiReport}</p>
            </div>
        ` : '';

        const opImprovementHTML = operationalImprovement ? `
            <div class="report-section op-improvement">
                <h3>Suggested Operational Improvement</h3>
                <p>${operationalImprovement}</p>
            </div>
        ` : '';

        printWindow.document.write(`
            <html>
            <head>
                <title>Print Report</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; max-width: 1200px; margin: 0 auto; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                    th, td { border: 1px solid #ddd; padding: 12px 8px; text-align: left; }
                    th { background-color: #f8f9fa; font-weight: 600; color: #495057; }
                    tr:nth-child(even) { background-color: #f8f9fa; }
                    img { max-width: 100%; height: auto; border: 1px solid #eee; margin-bottom: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                    .header { margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
                    .header h2 { margin: 0; color: #2c3e50; }
                    .header p { margin: 5px 0 0; color: #7f8c8d; font-size: 0.9rem; }
                    .footer { margin-top: 40px; font-size: 11px; color: #95a5a6; border-top: 1px solid #eee; padding-top: 20px; text-align: center; }
                    
                    .report-section { margin-bottom: 25px; padding: 15px 20px; border-radius: 8px; }
                    .report-section h3 { margin: 0 0 10px 0; font-size: 1.1rem; }
                    .report-section p { margin: 0; line-height: 1.6; font-size: 0.95rem; }
                    
                    .ai-report { background-color: #e0f7fa; border-left: 5px solid #00bcd4; }
                    .ai-report h3 { color: #00838f; }
                    
                    .op-improvement { background-color: #e8f5e9; border-left: 5px solid #2e7d32; }
                    .op-improvement h3 { color: #2e7d32; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h2>Analysis Report</h2>
                    <p>Generated on ${new Date().toLocaleString()}</p>
                </div>
                
                ${aiReportHTML}
                ${chartImg ? `<img src="${chartImg}" />` : ''}
                ${opImprovementHTML}

                <table>
                    <thead>
                        <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
                    </thead>
                    <tbody>
                        ${data.map(row => `<tr>${headers.map(h => `<td>${formatValue(h, row[h])}</td>`).join('')}</tr>`).join('')}
                    </tbody>
                </table>
                <div class="footer">
                    Generated by AgSales Analytics
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
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
                    <button onClick={handlePrint} className="export-btn print" title="Print"><Printer size={14} style={{ marginRight: 4 }} /> Print</button>
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
            const res = await fetch('http://localhost:5051/api/chat/favorites');
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
            const res = await fetch('http://localhost:5051/api/chat/favorite', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    queryText: msg.content,
                    generatedSql: msg.sql,
                    note: note || "Saved Query",
                    executionTimeMs: msg.metrics?.executionTimeMs,
                    tokenUsage: msg.metrics?.tokenUsage?.total
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
            await fetch(`http://localhost:5051/api/chat/favorite/${id}`, { method: 'DELETE' });
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
            const response = await fetch('http://localhost:5051/api/chat/query', {
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
                    aiReport: data.ai_report,
                    operationalImprovement: data.operational_improvement,
                    metrics: data.metrics,
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
            /* TEMPORARY DISABLE AI NAMING TO DEBUG HANG
            const lastUserMsg = currentMessages ? [...currentMessages].reverse().find(m => m.type === 'user') : null;
            if (lastUserMsg) {
                const res = await fetch('http://localhost:5051/api/chat/suggest-name', {
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
            */
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

    const exportToPDF = async (data, filename, chartId, msg) => {
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

            let currentY = 30;

            // 1. Capture Chart
            if (chartId) {
                const chartContainerId = `${chartId}-chart-container`;
                const chartElement = document.getElementById(chartContainerId);

                if (chartElement) {
                    try {
                        console.log(`[Export Debug] Found chart element: ${chartContainerId}, Width: ${chartElement.offsetWidth}, Height: ${chartElement.offsetHeight}`);

                        // Ensure chart is fully rendered - wait a bit longer or check for SVG
                        await new Promise(r => setTimeout(r, 1500));

                        const canvas = await html2canvas(chartElement, {
                            scale: 2,
                            useCORS: true,
                            logging: true, // Enable internal logging to console
                            backgroundColor: '#ffffff',
                            onclone: (clonedDoc) => {
                                console.log("[Export Debug] Element cloned for capture");
                                const clonedElement = clonedDoc.getElementById(chartContainerId);
                                if (clonedElement) {
                                    clonedElement.style.backgroundColor = '#ffffff'; // Enforce white bg on clone
                                    // Try to force SVGs to be visible
                                    const svgs = clonedElement.querySelectorAll('svg');
                                    svgs.forEach(svg => {
                                        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                                        svg.style.overflow = 'visible';
                                    });
                                }
                            }
                        });

                        const imgData = canvas.toDataURL('image/png');
                        console.log(`[Export Debug] Captured Image Data Length: ${imgData.length}`);

                        if (imgData.length < 1000) {
                            console.warn("[Export Debug] Image data suspiciously small, capture might be empty.");
                        }

                        const imgProps = doc.getImageProperties(imgData);
                        const pdfWidth = doc.internal.pageSize.getWidth() - 28;
                        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                        doc.addImage(imgData, 'PNG', 14, currentY, pdfWidth, pdfHeight);
                        currentY += pdfHeight + 10;
                    } catch (e) {
                        console.error("Chart capture failed", e);
                        doc.setFontSize(9);
                        doc.setTextColor(100, 100, 100);
                        doc.text("(Chart capture failed - see console for details)", 14, currentY);
                        currentY += 8;
                    }
                } else {
                    console.warn(`[Export Debug] Chart element not found (${chartContainerId}). Likely in Table view.`);
                    doc.setFontSize(9);
                    doc.setTextColor(128, 128, 128); // Gray
                    doc.text("(Chart not included. Switch to a Chart view to capture it.)", 14, currentY);
                    currentY += 8;
                }
            }

            // 2. Add AI Reports
            const pageWidth = doc.internal.pageSize.getWidth() - 28;

            if (msg?.aiReport) {
                if (currentY > doc.internal.pageSize.getHeight() - 40) { doc.addPage(); currentY = 20; }

                doc.setFontSize(12);
                doc.setTextColor(0, 150, 136); // Teal color
                doc.text("AI-Intelligence Report", 14, currentY);
                currentY += 7;

                doc.setFontSize(10);
                doc.setTextColor(50, 50, 50);
                const splitText = doc.splitTextToSize(msg.aiReport, pageWidth);
                doc.text(splitText, 14, currentY);
                currentY += (splitText.length * 5) + 10;
            }

            if (msg?.operationalImprovement) {
                if (currentY > doc.internal.pageSize.getHeight() - 40) { doc.addPage(); currentY = 20; }

                doc.setFontSize(12);
                doc.setTextColor(46, 125, 50); // Green color
                doc.text("Suggested Operational Improvement", 14, currentY);
                currentY += 7;

                doc.setFontSize(10);
                doc.setTextColor(50, 50, 50);
                const splitText = doc.splitTextToSize(msg.operationalImprovement, pageWidth);
                doc.text(splitText, 14, currentY);
                currentY += (splitText.length * 5) + 10;
            }

            // 3. Add Data Table
            doc.setTextColor(0, 0, 0); // Reset color
            if (currentY > doc.internal.pageSize.getHeight() - 40) {
                doc.addPage();
                currentY = 20;
            }

            autoTable(doc, {
                head: [headers],
                body: rows,
                startY: currentY,
                styles: { fontSize: 8 },
                theme: 'grid'
            });

            console.log("Saving PDF as", filename);
            doc.save(`${filename}.pdf`);
        } catch (error) {
            console.error("PDF Export Error:", error);
            alert("Failed to generate PDF. check console for details.");
        }
    };

    const handleExport = async (type, data, chartId, msg) => {
        console.log(`[Export Debug] Type: ${type}, ChartID: ${chartId}, Data Length: ${data ? data.length : 0}`);
        try {
            alert(`Starting ${type} export...`); // Debug Alert
            const filename = await getFilename('AI_Report', messages);
            alert(`Filename: ${filename}`); // Debug Alert
            console.log("[Export Debug] Filename:", filename);

            if (type === 'excel') {
                exportToExcel(data, filename);
            }
            if (type === 'pdf') {
                console.log("[Export Debug] Calling exportToPDF...");
                await exportToPDF(data, filename, chartId, msg);
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

                        {msg.aiReport && (
                            <div className="ai-report-section" style={{ marginTop: '10px', padding: '10px', backgroundColor: 'rgba(0, 229, 255, 0.05)', borderRadius: '8px', borderLeft: '3px solid #00e5ff' }}>
                                <h4 style={{ margin: '0 0 5px 0', color: '#00e5ff', fontSize: '0.9rem' }}>AI-Intelligence Report</h4>
                                <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.4' }}>{msg.aiReport}</p>
                            </div>
                        )}

                        {msg.operationalImprovement && (
                            <div className="operational-improvement-section" style={{ marginTop: '10px', padding: '10px', backgroundColor: 'rgba(0, 255, 157, 0.05)', borderRadius: '8px', borderLeft: '3px solid #00ff9d' }}>
                                <h4 style={{ margin: '0 0 5px 0', color: '#00ff9d', fontSize: '0.9rem' }}>Suggested Operational Improvement</h4>
                                <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.4' }}>{msg.operationalImprovement}</p>
                            </div>
                        )}

                        {msg.metrics && (
                            <div className="metrics-section" style={{ marginTop: '8px', fontSize: '0.75rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span>⏱️ {(msg.metrics.executionTimeMs / 1000).toFixed(2)}s</span>
                                <span>•</span>
                                <span>🪙 {msg.metrics.tokenUsage ? msg.metrics.tokenUsage.total : 'N/A'} tokens</span>
                            </div>
                        )}

                        {msg.data && <ChartRenderer data={msg.data} id={`chart-${idx}`} onExport={(type, data, id) => handleExport(type, data, id, msg)} />}
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
