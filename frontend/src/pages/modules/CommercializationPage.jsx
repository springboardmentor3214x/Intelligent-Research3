import React from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { DollarSign, Building2, Handshake, CheckCircle2, ArrowRight } from "lucide-react";

export default function CommercializationPage() {
  const opportunities = [
    { partner: "HealthTech Enterprise Consortia", model: "Non-Exclusive Patent License", tech: "Interpretable Medical AI Diagnosis", value: "High Royalty Fit" },
    { partner: "Autonomous Edge Systems Corp", model: "Joint Venture & Co-Development", tech: "Neural Pruning for Edge Microchips", value: "Venture Backable" },
    { partner: "National Research Technology Transfer Office", model: "Direct Tech Spinout", tech: "Cognitive Explainable Systems", value: "Incubator Approved" }
  ];

  return (
    <DashboardLayout pageTitle="Commercialization Engine" breadcrumbs={["Research Intelligence", "Module 8", "Commercialization"]}>
      <div className="tab-pane-content">
        <div className="tab-pane-header">
          <div>
            <h3 className="tab-section-title">Commercialization & Technology Transfer Recommendations</h3>
            <p className="tab-section-desc">Automated matching of academic IP and software artifacts to venture capital, licensing, and corporate R&D spinouts.</p>
          </div>
        </div>

        <div className="publications-stream">
          {opportunities.map((o) => (
            <div key={o.partner} className="publication-entry-card">
              <div className="pub-card-header">
                <div className="pub-card-main-info">
                  <div className="pub-badge-row">
                    <span className="badge-pub-type type-journal">{o.model}</span>
                    <span className="pub-date-text" style={{ color: "#16a34a", fontWeight: "700" }}>{o.value}</span>
                  </div>
                  <h4 className="pub-entry-title">{o.partner}</h4>
                  <p className="pub-entry-authors"><strong>Target IP / Tech Asset:</strong> {o.tech}</p>
                </div>
                <button type="button" className="btn-action-primary btn-sm">
                  Review Deal Sheet <ArrowRight size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}