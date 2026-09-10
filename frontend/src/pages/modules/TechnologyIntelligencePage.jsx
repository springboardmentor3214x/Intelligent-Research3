import React from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useResearchProfile } from "../../hooks/useResearchProfile";
import { Cpu, Award, Zap, CheckCircle2, Plus, AlertCircle } from "lucide-react";

export default function TechnologyIntelligencePage() {
  const { profile, loading } = useResearchProfile();
  const technologies = profile?.technologies || [];

  const evaluatedCount = technologies.length;
  const avgTrl = evaluatedCount > 0
    ? (technologies.reduce((acc, t) => acc + (Number(t.trl || t.readinessLevel) || 5), 0) / evaluatedCount).toFixed(1)
    : "N/A";

  return (
    <DashboardLayout pageTitle="Technology Intelligence" breadcrumbs={["Platform", "Module 6", "Technology Intelligence"]}>
      <div className="tab-pane-content">
        <div className="tab-pane-header">
          <div>
            <h3 className="tab-section-title">Technology Intelligence & TRL Assessment</h3>
            <p className="tab-section-desc">Technology Readiness Level (TRL) audits, framework benchmarks, and computational infrastructure mapping from your profile.</p>
          </div>
          <Link to="/research-profile" className="btn-action-primary" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <Plus size={14} /> Add Technology
          </Link>
        </div>

        <div className="overview-stats-grid">
          <div className="overview-stat-card">
            <div className="stat-card-header"><span className="stat-label">Evaluated Stacks</span><Cpu size={18} className="stat-icon-cyan" /></div>
            <div className="stat-val">{evaluatedCount} Stacks</div>
            <span className="stat-nav-hint">Registered in Research Profile</span>
          </div>
          <div className="overview-stat-card">
            <div className="stat-card-header"><span className="stat-label">Average TRL Index</span><Award size={18} className="stat-icon-blue" /></div>
            <div className="stat-val">{avgTrl !== "N/A" ? `TRL ${avgTrl}` : "TRL Pending"}</div>
            <span className="stat-nav-hint">Technology readiness average</span>
          </div>
          <div className="overview-stat-card">
            <div className="stat-card-header"><span className="stat-label">Profile Domain</span><Zap size={18} className="stat-icon-amber" /></div>
            <div className="stat-val">{profile?.research?.primaryDomain || "AI & Computing"}</div>
            <span className="stat-nav-hint">Primary research domain</span>
          </div>
        </div>

        {technologies.length === 0 ? (
          <div className="form-card-panel" style={{ textAlign: "center", padding: "48px" }}>
            <Cpu size={36} style={{ color: "#94a3b8", margin: "0 auto 12px" }} />
            <h4 style={{ margin: "0 0 6px", color: "#0f172a" }}>No Technologies Registered</h4>
            <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: "0.88rem" }}>
              Add software frameworks, computational models, or hardware prototypes to your Research Profile (Module 2) to view TRL assessments.
            </p>
            <Link to="/research-profile" className="btn-action-primary">
              Open Research Profile
            </Link>
          </div>
        ) : (
          <div className="publications-stream">
            {technologies.map((s, idx) => (
              <div key={s.id || s.name || idx} className="publication-entry-card">
                <div className="pub-card-header">
                  <div className="pub-card-main-info">
                    <div className="pub-badge-row">
                      <span className="badge-pub-type type-journal">
                        <CheckCircle2 size={12} /> TRL {s.trl || s.readinessLevel || "7"} — {s.category || "Software"}
                      </span>
                      <span className="pub-date-text">{s.deploymentStage || s.readiness || "Operational"}</span>
                    </div>
                    <h4 className="pub-entry-title">{s.name}</h4>
                    <p className="pub-entry-authors">
                      {s.description || `Computational stack registered in ${profile?.personalInfo?.fullName || "researcher"} portfolio.`}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}