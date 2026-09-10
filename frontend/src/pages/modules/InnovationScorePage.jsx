import React from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useResearchProfile } from "../../hooks/useResearchProfile";
import { Award, ShieldCheck, Zap, Sparkles, TrendingUp, DollarSign, BookOpen, FileKey } from "lucide-react";

export default function InnovationScorePage() {
  const { profile, completion } = useResearchProfile();

  const publications = profile?.publications || [];
  const patents = profile?.patents || [];
  const technologies = profile?.technologies || [];

  const pubScore = Math.min(100, Math.max(30, publications.length * 15 + (publications.reduce((a, b) => a + (Number(b.citationCount) || 0), 0) > 10 ? 25 : 10)));
  const patentScore = Math.min(100, Math.max(25, patents.length * 30 + 20));
  const techScore = Math.min(100, Math.max(20, technologies.length * 25 + 25));
  const profileScore = completion?.percentage || 70;
  const grantScore = Math.min(100, Math.max(40, (publications.length > 0 ? 40 : 10) + (patents.length > 0 ? 35 : 15) + (profile?.research?.primaryDomain ? 20 : 0)));

  const compositeScore = Math.round(
    pubScore * 0.25 +
    patentScore * 0.25 +
    techScore * 0.20 +
    profileScore * 0.15 +
    grantScore * 0.15
  );

  const dimensions = [
    { dimension: "Scholarly Novelty & Publication Output", score: pubScore, weight: "25%", status: `${publications.length} Papers Indexed` },
    { dimension: "Intellectual Property Defensibility (Patents)", score: patentScore, weight: "25%", status: `${patents.length} Patents Registered` },
    { dimension: "Technology Readiness & Practical TRL", score: techScore, weight: "20%", status: `${technologies.length} Tech Assets` },
    { dimension: "Profile Completion & Metadata Quality", score: profileScore, weight: "15%", status: `${profileScore}% Configured` },
    { dimension: "Grant & Funding Alignment Potential", score: grantScore, weight: "15%", status: "High Strategic Fit" }
  ];

  const ratingLabel = compositeScore >= 85 ? "Tier-1 Institutional Rating" : compositeScore >= 70 ? "Tier-2 Advanced Rating" : "Emerging Research Rating";

  return (
    <DashboardLayout pageTitle="Innovation Scoring Engine" breadcrumbs={["Platform", "Module 7", "Innovation Score"]}>
      <div className="tab-pane-content">
        <div className="tab-pane-header">
          <div>
            <h3 className="tab-section-title">Composite Innovation Scoring Engine</h3>
            <p className="tab-section-desc">Real-time multi-dimensional evaluation quantifying research novelty, IP defensibility, TRL, and profile data.</p>
          </div>
          <Link to="/research-profile" className="btn-action-primary">
            Update Research Profile
          </Link>
        </div>

        <div className="overview-stats-grid">
          <div className="overview-stat-card">
            <div className="stat-card-header"><span className="stat-label">Composite Innovation Index</span><Award size={18} className="stat-icon-blue" /></div>
            <div className="stat-val">{compositeScore} / 100</div>
            <span className="stat-nav-hint">{ratingLabel}</span>
          </div>
          <div className="overview-stat-card">
            <div className="stat-card-header"><span className="stat-label">IP Assets Registered</span><ShieldCheck size={18} className="stat-icon-emerald" /></div>
            <div className="stat-val">{patents.length} Patents</div>
            <span className="stat-nav-hint">{patents.length > 0 ? "Defensible registered IP" : "No patents added yet"}</span>
          </div>
          <div className="overview-stat-card">
            <div className="stat-card-header"><span className="stat-label">Scholarly Output</span><BookOpen size={18} className="stat-icon-amber" /></div>
            <div className="stat-val">{publications.length} Papers</div>
            <span className="stat-nav-hint">Peer-reviewed publications</span>
          </div>
        </div>

        <div className="form-card-panel">
          <h4 className="form-card-title">Score Dimensions Breakdown (Calculated from Profile Data)</h4>
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