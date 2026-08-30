import React from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { FileText, Download, Printer, Share2, CheckCircle2 } from "lucide-react";

export default function ReportsExportPage() {
  function handlePrint() {
    window.print();
  }

  return (
    <DashboardLayout pageTitle="Reports & Export" breadcrumbs={["Research Intelligence", "Module 11", "Reports & Export"]}>
      <div className="tab-pane-content">
        <div className="tab-pane-header">
          <div>
            <h3 className="tab-section-title">Scholarly Dossier & Research Dossier Export</h3>
            <p className="tab-section-desc">Generate institutional dossiers, grant application summaries, and BibTeX citation packages.</p>
          </div>
        </div>

        <div className="overview-stats-grid">
          <div className="overview-stat-card">
            <div className="stat-card-header"><span className="stat-label">Full Dossier (PDF)</span><FileText size={18} className="stat-icon-blue" /></div>
            <div className="stat-val">Complete</div>
            <button type="button" className="btn-action-primary btn-sm" onClick={handlePrint} style={{ marginTop: "8px" }}>
              <Printer size={13} /> Print / Export PDF
            </button>
          </div>
          <div className="overview-stat-card">
            <div className="stat-card-header"><span className="stat-label">BibTeX / RIS Citations</span><Download size={18} className="stat-icon-emerald" /></div>
            <div className="stat-val">5 Entries</div>
            <button type="button" className="btn-action-secondary btn-sm" style={{ marginTop: "8px" }}>
              <Download size={13} /> Download .bib
            </button>
          </div>
          <div className="overview-stat-card">
            <div className="stat-card-header"><span className="stat-label">Grant Application CV</span><Share2 size={18} className="stat-icon-purple" /></div>
            <div className="stat-val">Standard Form</div>
            <button type="button" className="btn-action-secondary btn-sm" style={{ marginTop: "8px" }}>
              Export NIH/NSF Bio
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}