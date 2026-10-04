import React from "react";
import { Link } from "react-router-dom";
import { Sparkles, Shield, Database, BookOpen, ExternalLink } from "lucide-react";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="enterprise-footer" role="contentinfo">
      <div className="footer-inner">
        <div className="footer-brand-section">
          <div className="footer-brand-row">
            <div className="footer-logo-badge">
              <Sparkles size={16} />
            </div>
            <div>
              <span className="footer-platform-name">Research Intelligence Platform</span>
              <p className="footer-platform-tagline">
                Research • Funding • Patents • Technology • Innovation
              </p>
            </div>
          </div>
          <p className="footer-platform-desc">
            Enterprise analytics platform connecting global scientific research outputs, federal grant calls, prior-art patent filings, and automated technology commercialization pathways.
          </p>
        </div>

        <div className="footer-links-grid">
          <div className="footer-column">
            <h4 className="footer-col-title">Platform</h4>
            <ul className="footer-col-links">
              <li><Link to="/dashboard">Intelligence Dashboard</Link></li>
              <li><Link to="/trends">Research Intelligence</Link></li>
              <li><Link to="/funding">Funding Opportunities</Link></li>
              <li><Link to="/patent-intel">Patent Landscape</Link></li>
              <li><Link to="/tech-intel">Technology Intelligence</Link></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4 className="footer-col-title">Data Sources & Provenance</h4>
            <ul className="footer-col-links">
              <li><span className="footer-provenance-item"><Database size={12} /> OpenAlex Live API</span></li>
              <li><span className="footer-provenance-item"><Database size={12} /> NIH RePORTER Grants</span></li>
              <li><span className="footer-provenance-item"><Database size={12} /> USPTO / PatentsView</span></li>
              <li><span className="footer-provenance-item"><Database size={12} /> Google Gemini AI</span></li>
              <li><span className="footer-provenance-item"><Database size={12} /> OpenAI GPT Engines</span></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4 className="footer-col-title">Governance & Security</h4>
            <ul className="footer-col-links">
              <li><span className="footer-security-pill"><Shield size={12} /> Role-Based Access Control</span></li>
              <li><span className="footer-security-pill"><Shield size={12} /> Zero Mock Data Policy</span></li>
              <li><Link to="/notifications">Alert & Event Telemetry</Link></li>
              <li><Link to="/reports">Export Research Dossier</Link></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="footer-bottom-bar">
        <div className="footer-bottom-inner">
          <span className="footer-copyright">
            © 2026 Research Intelligence Platform • Production Enterprise Edition
          </span>
          <div className="footer-meta-tags">
            <span className="footer-status-indicator">
              <span className="status-dot status-dot-green"></span>
              All Data Pipelines Operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
