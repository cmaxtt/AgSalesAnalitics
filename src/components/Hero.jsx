
import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import './Hero.css';

const Hero = ({ onStart }) => {
    return (
        <div className="hero-container fade-in">
            <div className="hero-content">
                <div className="icon-badge">
                    <Sparkles size={24} color="#E0BBE4" fill="#E0BBE4" />
                    <span>v1.0.0</span>
                </div>

                <h1>
                    Turn Your <span className="highlight">Sales Data</span> into <br />
                    <span className="highlight-alt">Stunning Stories</span>
                </h1>

                <p className="hero-subtitle">
                    Connect your SQL Server or upload files to generate beautiful,
                    actionable sales insights in seconds. No coding required.
                </p>

                <button className="cta-button" onClick={onStart}>
                    Start Analysis
                    <ArrowRight size={20} />
                </button>
            </div>

            <div className="hero-visual">
                {/* Abstract Decorative Elements using CSS */}
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
                <div className="card-mockup">
                    <div className="mockup-header"></div>
                    <div className="mockup-body">
                        <div className="mockup-line w-70"></div>
                        <div className="mockup-line w-50"></div>
                        <div className="mockup-chart"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Hero;
