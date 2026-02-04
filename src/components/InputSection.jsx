
import React, { useState } from 'react';
import { Database, FileText, Upload, CheckCircle } from 'lucide-react';
import './InputSection.css';

const InputSection = ({ onAnalyze }) => {
    const [method, setMethod] = useState('sql'); // sql or file
    const [config, setConfig] = useState({
        server: 'localhost',
        database: 'SalesDB',
        table: 'Sales',
        file: null
    });

    const handleInputChange = (e) => {
        setConfig({ ...config, [e.target.name]: e.target.value });
    };

    const handleFileDrop = (e) => {
        e.preventDefault();
        // Simulate file getting
        setConfig({ ...config, file: { name: 'sales_data_2025.csv' } });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (method === 'sql') {
            try {
                // 1. Validate Connection
                const res = await fetch('http://localhost:3030/api/connect', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(config)
                });

                const data = await res.json();

                if (data.success) {
                    onAnalyze(config); // Proceed to processing state
                } else {
                    alert('Connection Failed: ' + data.error);
                }
            } catch (err) {
                alert('Server Error. Ensure backend is running directly on port 3000.');
            }
        } else {
            // File mode simulation remains for now
            onAnalyze(config);
        }
    };

    return (
        <div className="input-container fade-in">
            <div className="input-card">
                <h2>Connect Your Data</h2>
                <p className="input-desc">Choose how you want to import your sales data.</p>

                <div className="method-toggle">
                    <button
                        className={`toggle-btn ${method === 'sql' ? 'active' : ''}`}
                        onClick={() => setMethod('sql')}
                    >
                        <Database size={18} />
                        SQL Server
                    </button>
                    <button
                        className={`toggle-btn ${method === 'file' ? 'active' : ''}`}
                        onClick={() => setMethod('file')}
                    >
                        <FileText size={18} />
                        Upload File
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="config-form">
                    {method === 'sql' ? (
                        <div className="form-group-stack">
                            <div className="input-group">
                                <label>Server Address</label>
                                <input
                                    type="text"
                                    name="server"
                                    value={config.server}
                                    onChange={handleInputChange}
                                    placeholder="e.g. localhost, 192.168.1.100"
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label>Database URI/Name</label>
                                <input
                                    type="text"
                                    name="database"
                                    value={config.database}
                                    onChange={handleInputChange}
                                    placeholder="e.g. SalesDB"
                                    required
                                />
                            </div>
                            <div className="input-group">
                                <label>Table Name</label>
                                <input
                                    type="text"
                                    name="table"
                                    value={config.table}
                                    onChange={handleInputChange}
                                    placeholder="e.g. dbo.Sales"
                                    required
                                />
                            </div>
                        </div>
                    ) : (
                        <div
                            className={`upload-zone ${config.file ? 'has-file' : ''}`}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleFileDrop}
                            onClick={() => setConfig({ ...config, file: { name: 'sales_dump.csv' } })} // Click sim
                        >
                            {config.file ? (
                                <>
                                    <CheckCircle size={40} className="success-icon" />
                                    <p>{config.file.name}</p>
                                    <span className="upload-hint">Click to change</span>
                                </>
                            ) : (
                                <>
                                    <Upload size={40} className="upload-icon" />
                                    <p>Drag & Drop your file here</p>
                                    <span className="upload-hint">Supports CSV, Excel, PDF</span>
                                </>
                            )}
                        </div>
                    )}

                    <button type="submit" className="analyze-btn">
                        Generate Reports
                    </button>
                </form>
            </div>
        </div>
    );
};

export default InputSection;
