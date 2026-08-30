import React from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { Cpu, Award, Zap, Layers, CheckCircle2 } from "lucide-react";

export default function TechnologyIntelligencePage() {
  const stacks = [
    { name: "PyTorch & DeepSpeed Distributed Runtime", trl: "TRL 8 — System Complete", readiness: "Production Proven", speed: "High Scalability" },
    { name: "TensorRT & ONNX Edge Inference Runtime", trl: "TRL 7 — Integrated Pilot", readiness: "Embedded Validated", speed: "Low Latency" },
    { name: "SHAP & Captum Model Interpretability Toolkits", trl: "TRL 6 — Lab Tested", readiness: "Academic & Clinical", speed: "Standardized" },
    { name: "Kubernetes Kubeflow ML Pipelines", trl: "TRL 8 — Production Grade", readiness: "Cloud Native", speed: "Automated" }
  ];

  return (
    <DashboardLayout pageTitle="Technology Intelligence" breadcrumbs={["Research Intelligence", "Module 6", "Technology Intelligence"]}>
      <div className="tab-pane-content">
        <div className="tab-pane-header">
          <div>
            <h3 className="tab-section-title">Technology Intelligence & TRL Assessment</h3>
            <p className="tab-section-desc">Technology Readiness Level (TRL) audits, framework benchmarks, and computational infrastructure mapping.</p>
          </div>
        </div>

        <div className="overview-stats-grid">
          <div className="overview-stat-card">
            <div className="stat-card-header"><span className="stat-label">Evaluated Stacks</span><Cpu size={18} className="stat-icon-cyan" /></div>
            <div className="stat-val">7 Core Stacks</div>
            <span className="stat-nav-hint">Across AI, ML & Edge</span>
          </div>
          <div className="overview-stat-card">
            <div className="stat-card-header"><span className="stat-label">Average TRL Index</span><Award size={18} className="stat-icon-blue" /></div>
            <div className="stat-val">TRL 7.2</div>
            <span className="stat-nav-hint">Ready for commercial pilots</span>
          </div>
          <div className="overview-stat-card">
            <div className="stat-card-header"><span className="stat-label">Benchmark Score</span><Zap size={18} className="stat-icon-amber" /></div>
            <div className="stat-val">91.4%</div>
            <span className="stat-nav-hint">Top decile compute efficiency</span>
          </div>
        </div>

        <div className="publications-stream">
          {stacks.map((s) => (
            <div key={s.name} className="publication-entry-card">
              <div className="pub-card-header">
                <div className="pub-card-main-info">
                  <div className="pub-badge-row">
                    <span className="badge-pub-type type-journal"><CheckCircle2 size={12} /> {s.trl}</span>
                    <span className="pub-date-text">{s.readiness}</span>
                  </div>
                  <h4 className="pub-entry-title">{s.name}</h4>
                  <p className="pub-entry-authors"><strong>Execution Performance:</strong> {s.speed}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}