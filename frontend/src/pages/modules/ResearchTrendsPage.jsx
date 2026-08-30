import React from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { TrendingUp, Award, BarChart3, Zap, ArrowUpRight, Flame } from "lucide-react";

export default function ResearchTrendsPage() {
  const trends = [
    {
      topic: "Explainable & Interpretable Deep Neural Networks (XAI)",
      velocity: "+148% YoY",
      citationMomentum: "Very High",
      leadingInstitutions: "Stanford, IIT Bombay, MIT, Oxford",
      status: "Hyper-Growth",
      relevance: 98
    },
    {
      topic: "Multimodal Foundation Models for Clinical Bio-Imaging",
      velocity: "+122% YoY",
      citationMomentum: "High",
      leadingInstitutions: "Harvard Medical, NIAC, Johns Hopkins",
      status: "Emerging Breakthrough",
      relevance: 94
    },
    {
      topic: "Hardware-Aware Neural Architecture Search (NAS) for Edge AI",
      velocity: "+86% YoY",
      citationMomentum: "Moderate-High",
      leadingInstitutions: "UC Berkeley, ETH Zurich, IISc",
      status: "Scaling",
      relevance: 89
    },
    {
      topic: "Federated Privacy-Preserving Collaborative Learning",
      velocity: "+94% YoY",
      citationMomentum: "High",
      leadingInstitutions: "Cambridge, NUS, Carnegie Mellon",
      status: "High Commercial Interest",
      relevance: 91
    }
  ];

  return (
    <DashboardLayout pageTitle="Research Trends Intelligence" breadcrumbs={["Research Intelligence", "Module 4", "Trend Intelligence"]}>
      <div className="tab-pane-content">
        <div className="tab-pane-header">
          <div>
            <h3 className="tab-section-title">Research Trend Intelligence & Citation Velocity Forecasting</h3>
            <p className="tab-section-desc">Clustering citation trajectories, emerging topic heatmaps, and cross-disciplinary novelty vectors.</p>
          </div>
        </div>

        <div className="overview-stats-grid">
          <div className="overview-stat-card">
            <div className="stat-card-header"><span className="stat-label">Indexed Trend Clusters</span><TrendingUp size={18} className="stat-icon-purple" /></div>
            <div className="stat-val">14 Topics</div>
            <span className="stat-nav-hint">AI & Machine Learning domain</span>
          </div>
          <div className="overview-stat-card">
            <div className="stat-card-header"><span className="stat-label">Citation Velocity Avg</span><Zap size={18} className="stat-icon-amber" /></div>
            <div className="stat-val">+112%</div>
            <span className="stat-nav-hint">Annual acceleration rate</span>
          </div>
          <div className="overview-stat-card">
            <div className="stat-card-header"><span className="stat-label">Domain Alignment</span><Award size={18} className="stat-icon-blue" /></div>
            <div className="stat-val">94.5%</div>
            <span className="stat-nav-hint">Fit with your publications</span>
          </div>
        </div>

        <div className="publications-stream">
          {trends.map((t) => (
            <div key={t.topic} className="publication-entry-card">
              <div className="pub-card-header">
                <div className="pub-card-main-info">
                  <div className="pub-badge-row">
                    <span className="badge-pub-type type-conference"><Flame size={12} /> {t.status}</span>
                    <span className="pub-date-text" style={{ color: "#16a34a", fontWeight: "700" }}>{t.velocity} Growth</span>
                  </div>
                  <h4 className="pub-entry-title">{t.topic}</h4>
                  <p className="pub-entry-authors"><strong>Leading Research Centers:</strong> {t.leadingInstitutions}</p>
                </div>
                <div className="citation-count-badge">
                  <span className="cite-num">{t.relevance}%</span>
                  <small className="cite-text">Relevance</small>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}