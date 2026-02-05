import React from 'react';
import './DataTable.css';
import { ArrowUp } from 'lucide-react';



const DataTable = ({ data = [] }) => {
    if (!data || data.length === 0) {
        return (
            <div className="data-table-wrapper" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                No data available. Run a report to see results.
            </div>
        );
    }

    return (
        <div className="data-table-wrapper">
            <table className="data-table">
                <thead>
                    <tr>
                        <th>Code</th>
                        <th className="sortable">
                            Product Name
                            <ArrowUp size={14} style={{ display: 'inline', marginLeft: 6 }} />
                        </th>
                        <th className="cell-right">Qty Sold</th>
                        <th className="cell-right">Total Value</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((item, index) => (
                        <tr key={index}>
                            {/* Adapt to potential dynamic keys, but keeping structure for now */}
                            <td className="cell-code">{item.code || item.Code || '-'}</td>
                            <td>{item.name || item.Name || item.Description || '-'}</td>
                            <td className="cell-right">{(item.qty || item.Qty || 0).toLocaleString()}</td>
                            <td className="cell-right">{item.value || item.Value || item.Total || '-'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default DataTable;
