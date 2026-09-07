import React from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { FileKey, Search, ShieldCheck, Layers, Award, ExternalLink } from "lucide-react";

export default function PatentIntelligencePage() {
  const landscapes = [
    {
      domain: "Neural Decision Verification & Interpretable Ensembles",
      patentsCount: "1,420 Global Filings",
      whitespaceScore: "High Whitespace",
      topAssignees: "Google LLC, Microsoft, NIAC, IBM",
      status: "Rapid Acceleration"
    },
    {
      domain: "Edge AI Quantization & Micro-Architecture Pruning",
      patentsCount: "860 Global Filings",
      whitespaceScore: "Moderate Whitespace",
      topAssignees: "Qualcomm, Intel, Apple, Samsung",
      status: "High Commercialization"
    },
    {
      domain: "Differential Privacy in Distributed Clinical Machine Learning",
      patentsCount: "410 Global Filings",
      whitespaceScore: "Prime Opportunity",
      topAssignees: "Siemens Healthineers, Philips, Academic Consortia",
      status: "Emerging Protection"
    }
  ];

  return (
    <DashboardLayout pageTitle="Patent Landscape Analysis" breadcrumbs={["Research Intelligence", "Module 5", "Patent Intelligence"]}>
      <div className="tab-pane-content">
        <div className="tab-pane-header">
          <div>
            <h3 className="tab-section-title">Patent Landscape Analysis & Prior-Art Mapping</h3>
            <p className="tab-section-desc">Automated prior-art discovery, whitespace opportunity detection, and competitive filing trajectory mapping.</p>
          </div>
        </div>

        <div className="overview-stats-grid">
          <div className="overview-stat-card">
            <div className="stat-card-header"><span className="stat-label">Mapped IPC Classes</span><Layers size={18} className="stat-icon-amber" /></div>
            <div className="stat-val">G06N, G06F</div>
            <span className="stat-nav-hint">Computing & AI classifications</span>
          </div>
          <div className="overview-stat-card">
            <div className="stat-card-header"><span className="stat-label">IP Whitespace Index</span><ShieldCheck size={18} className="stat-icon-emerald" /></div>
            <div className="stat-val">88 / 100</div>
            <span className="stat-nav-hint">Novelty defensibility potential</span>
          </div>
          <div className="overview-stat-card">
            <div className="stat-card-header"><span className="stat-label">Registered Citations</span><FileKey size={18} className="stat-icon-blue" /></div>
            <div className="stat-val">68 Citations</div>
            <span className="stat-nav-hint">Across registered IP records</span>
          </div>
        </div>

        <div className="publications-stream">
          {landscapes.map((l) => (
            <div key={l.domain} className="publication-entry-card">
              <div className="pub-card-header">
                <div className="pub-card-main-info">
                  <div className="pub-badge-row">
                    <span className="badge-pub-type type-journal">{l.whitespaceScore}</span>
                    <span className="pub-date-text">{l.patentsCount}</span>
                  </div>
                  <h4 className="pub-entry-title">{l.domain}</h4>
                  <p className="pub-entry-authors"><strong>Top IP Holders:</strong> {l.topAssignees}</p>
                </div>
                <button type="button" className="btn-action-secondary btn-sm">
                  Explore Landscape <ExternalLink size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}