import React from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { Award, ShieldCheck, Zap, Sparkles, TrendingUp, DollarSign } from "lucide-react";

export default function InnovationScorePage() {
  const dimensions = [
    { dimension: "Scholarly Novelty & Publication Impact", score: 94, weight: "30%", status: "Top Tier" },
    { dimension: "Intellectual Property Defensibility (Patents)", score: 91, weight: "25%", status: "High Protection" },
    { dimension: "Technology Readiness & Practical TRL", score: 88, weight: "20%", status: "Field Pilot Ready" },
    { dimension: "Market Commercialization Viability", score: 85, weight: "15%", status: "Strong Demand" },
    { dimension: "Grant & Funding Attractiveness", score: 96, weight: "10%", status: "Prime Funding Fit" }
  ];

  return (
    <DashboardLayout pageTitle="Innovation Scoring Engine" breadcrumbs={["Research Intelligence", "Module 7", "Innovation Score"]}>
      <div className="tab-pane-content">
        <div className="tab-pane-header">
          <div>
            <h3 className="tab-section-title">Composite Innovation Scoring Engine</h3>
            <p className="tab-section-desc">Multi-dimensional evaluation quantifying research novelty, IP defensibility, TRL, and market potential.</p>
          </div>
        </div>

        <div className="overview-stats-grid">
          <div className="overview-stat-card">
            <div className="stat-card-header"><span className="stat-label">Composite Innovation Index</span><Award size={18} className="stat-icon-blue" /></div>
            <div className="stat-val">91.2 / 100</div>
            <span className="stat-nav-hint">Tier-1 Institutional Rating</span>
          </div>
          <div className="overview-stat-card">
            <div className="stat-card-header"><span className="stat-label">IP Strength Rating</span><ShieldCheck size={18} className="stat-icon-emerald" /></div>
            <div className="stat-val">A+ (Defensible)</div>
            <span className="stat-nav-hint">3 registered patents</span>
          </div>
          <div className="overview-stat-card">
            <div className="stat-card-header"><span className="stat-label">Commercial Readiness</span><DollarSign size={18} className="stat-icon-amber" /></div>
            <div className="stat-val">87% Viable</div>
            <span className="stat-nav-hint">High enterprise fit</span>
          </div>
        </div>

        <div className="form-card-panel">
          <h4 className="form-card-title">Score Dimensions Breakdown</h4>
          <div className="expertise-bars-list">
            {dimensions.map((d) => (
              <div key={d.dimension} className="expertise-bar-row">
                <div className="expertise-meta">
                  <span className="expertise-name">{d.dimension}</span>
                  <div className="expertise-tags">
                    <span className="badge-category">Weight: {d.weight}</span>
                    <span className="badge-level">{d.status}</span>
                    <span className="expertise-pct">{d.score}%</span>
                  </div>
                </div>
                <div className="expertise-track">
                  <div className="expertise-fill" style={{ width: `${d.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}