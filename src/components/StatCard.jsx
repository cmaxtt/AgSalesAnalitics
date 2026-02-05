import React from 'react';
import './StatCard.css';

const StatCard = ({ title, value, icon: Icon, color }) => {
    return (
        <div className="stat-card" style={{ '--card-color': color }}>
            <div className="stat-header">
                <span className="stat-title">{title}</span>
                <div className="stat-icon-wrapper" style={{ color: color }}>
                    <Icon size={16} />
                </div>
            </div>
            <div className="stat-value">
                {value}
            </div>
        </div>
    );
};

export default StatCard;
