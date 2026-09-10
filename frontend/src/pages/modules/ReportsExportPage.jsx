import React from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useResearchProfile } from "../../hooks/useResearchProfile";
import { FileText, Download, Printer, Share2, CheckCircle2 } from "lucide-react";

export default function ReportsExportPage() {
  const { profile } = useResearchProfile();
  const publications = profile?.publications || [];
  const patents = profile?.patents || [];

  function handlePrint() {
    window.print();
  }

  function handleDownloadBib() {
    if (publications.length === 0) {
      alert("No publications found in your profile to export.");
      return;
    }

    const bibContent = publications.map((p, idx) => {
      const citeKey = (p.authors?.[0]?.split(" ")?.pop() || "researcher") + (p.publicationDate?.slice(0, 4) || "2024") + `_${idx}`;
      return `@article{${citeKey},
  title = {${p.title}},
  author = {${Array.isArray(p.authors) ? p.authors.join(" and ") : (p.authors || "Researcher")}},
  journal = {${p.journal || "Research Publication"}},
  year = {${p.publicationDate?.slice(0, 4) || "2024"}},
  doi = {${p.doi || ""}}
}`;
    }).join("\n\n");

    const blob = new Blob([bibContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `research_publications_${new Date().toISOString().slice(0, 10)}.bib`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <DashboardLayout pageTitle="Reports & Export" breadcrumbs={["Platform", "Module 11", "Reports & Export"]}>
      <div className="tab-pane-content">
        <div className="tab-pane-header">
          <div>
            <h3 className="tab-section-title">Scholarly Dossier & Research Dossier Export</h3>
            <p className="tab-section-desc">Generate institutional dossiers, grant application summaries, and BibTeX citation packages from your real profile.</p>
          </div>
        </div>

        <div className="overview-stats-grid">
          <div className="overview-stat-card">
            <div className="stat-card-header"><span className="stat-label">Full Dossier (PDF)</span><FileText size={18} className="stat-icon-blue" /></div>
            <div className="stat-val">{publications.length} Pubs / {patents.length} Patents</div>
            <button type="button" className="btn-action-primary btn-sm" onClick={handlePrint} style={{ marginTop: "8px" }}>
              <Printer size={13} /> Print / Export PDF
            </button>
          </div>
          <div className="overview-stat-card">
            <div className="stat-card-header"><span className="stat-label">BibTeX Citations</span><Download size={18} className="stat-icon-emerald" /></div>
            <div className="stat-val">{publications.length} Entries</div>
            <button type="button" className="btn-action-secondary btn-sm" onClick={handleDownloadBib} style={{ marginTop: "8px" }}>
              <Download size={13} /> Download .bib
            </button>
          </div>
          <div className="overview-stat-card">
            <div className="stat-card-header"><span className="stat-label">Grant CV / Bio</span><Share2 size={18} className="stat-icon-purple" /></div>
            <div className="stat-val">{profile?.personalInfo?.fullName || "Researcher Profile"}</div>
            <button type="button" className="btn-action-secondary btn-sm" onClick={handlePrint} style={{ marginTop: "8px" }}>
              Export NIH/NSF Bio
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}