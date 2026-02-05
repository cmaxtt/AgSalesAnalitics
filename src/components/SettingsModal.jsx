import React, { useState } from 'react';
import { X } from 'lucide-react';
import './SettingsModal.css';

const SettingsModal = ({ isOpen, onClose, onConnect }) => {
    const [config, setConfig] = useState({
        server: 'HPWIN11',
        database: 'PVSQLDBN',
        user: 'sa',
        password: 'pass@word123'
    });
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setConfig({ ...config, [e.target.name]: e.target.value });
    };

    const handleConnect = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', message: '' });

        try {
            const res = await fetch('http://localhost:3030/api/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            const result = await res.json();

            if (!res.ok) throw new Error(result.error || 'Connection failed');

            setStatus({ type: 'success', message: 'Connected Successfully!' });

            // Notify parent
            if (onConnect) onConnect(config);

            // Close after brief delay on success
            setTimeout(() => {
                onClose();
                setStatus({ type: '', message: '' });
            }, 1000);

        } catch (err) {
            setStatus({ type: 'error', message: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="settings-modal-overlay">
            <div className="settings-modal fade-in">
                <div className="modal-header">
                    <h2>Database Connection</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleConnect}>
                    <div className="form-group">
                        <label>Server Name</label>
                        <input
                            name="server"
                            value={config.server}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Database Name</label>
                        <input
                            name="database"
                            value={config.database}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>User</label>
                        <input
                            name="user"
                            value={config.user}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            name="password"
                            type="password"
                            value={config.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {status.message && (
                        <div className={`status-message status-${status.type}`}>
                            {status.message}
                        </div>
                    )}

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Connecting...' : 'Connect'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SettingsModal;
