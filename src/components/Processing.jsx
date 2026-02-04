
import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import './Processing.css';

const Processing = () => {
    const [step, setStep] = useState(0);
    const steps = [
        "Establishing secure connection...",
        "Reading sales tables...",
        "Analyzing monthly trends...",
        "Generating stunning reports..."
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
        }, 800);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="processing-container fade-in">
            <div className="processing-card">
                <div className="spinner-wrapper">
                    <Loader2 size={48} className="spinner" />
                </div>
                <h3>Processing Data</h3>
                <div className="steps-container">
                    {steps.map((s, i) => (
                        <p key={i} className={`step ${i <= step ? 'active' : ''} ${i === step ? 'current' : ''}`}>
                            {i < step ? "✓ " : i === step ? "➤ " : "○ "} {s}
                        </p>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Processing;
