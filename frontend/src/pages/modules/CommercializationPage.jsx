import React from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useResearchProfile } from "../../hooks/useResearchProfile";
import { DollarSign, Building2, Handshake, CheckCircle2, ArrowRight, FileKey, Cpu } from "lucide-react";

export default function CommercializationPage() {
  const { profile } = useResearchProfile();
  const patents = profile?.patents || [];
  const technologies = profile?.technologies || [];

  // Derive real commercialization opportunities from user's registered IP and tech
  const assets = [
    ...patents.map((p) => ({
      type: "Patent / IP Asset",
      title: p.title,
      model: "Non-Exclusive Industry Patent License",
      value: "High Royalty Fit",
      partner: "Enterprise Corporate R&D Consortia"
    })),
    ...technologies.map((t) => ({
      type: "Software / Tech Stack",
      title: t.name,
      model: "Direct Tech Transfer / Spinout",
      value: "Venture Backable",
      partner: "Institutional Technology Transfer Office"
    }))
  ];

  return (
    <DashboardLayout pageTitle="Commercialization Engine" breadcrumbs={["Platform", "Module 8", "Commercialization"]}>
      <div className="tab-pane-content">
        <div className="tab-pane-header">
          <div>
            <h3 className="tab-section-title">Commercialization & Technology Transfer Recommendations</h3>
            <p className="tab-section-desc">Automated matching of your academic IP and software artifacts to corporate licensing and technology transfer offices.</p>
          </div>
          <Link to="/research-profile" className="btn-action-primary">
            Manage IP Assets
          </Link>
        </div>

        {assets.length === 0 ? (
          <div className="form-card-panel" style={{ textAlign: "center", padding: "48px" }}>
            <Handshake size={36} style={{ color: "#94a3b8", margin: "0 auto 12px" }} />
            <h4 style={{ margin: "0 0 6px", color: "#0f172a" }}>No IP or Technology Assets Registered</h4>
            <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: "0.88rem" }}>
              Add patents or technology competencies to your Research Profile (Module 2) to unlock commercialization and licensing recommendations.
            </p>
            <Link to="/research-profile" className="btn-action-primary">
              Register IP in Profile
            </Link>
          </div>
        ) : (
          <div className="publications-stream">
            {assets.map((o, idx) => (
              <div key={idx} className="publication-entry-card">
                <div className="pub-card-header">
                  <div className="pub-card-main-info">
                    <div className="pub-badge-row">
                      <span className="badge-pub-type type-journal">{o.model}</span>
                      <span className="pub-date-text" style={{ color: "#16a34a", fontWeight: "700" }}>{o.value}</span>
                      <span style={{ fontSize: "0.74rem", color: "#64748b" }}>{o.type}</span>
                    </div>
                    <h4 className="pub-entry-title">{o.title}</h4>
                    <p className="pub-entry-authors"><strong>Transfer Pathway:</strong> {o.partner}</p>
                  </div>
                  <button type="button" className="btn-action-primary btn-sm">
                    Review Deal Sheet <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}