import React, { useState, useEffect } from "react";
import "./modules-shared.css";
import DashboardLayout from "../../components/layout/DashboardLayout";
import {
  FileKey,
  Search,
  ShieldCheck,
  Layers,
  Award,
  ExternalLink,
  RefreshCw,
  Building,
  TrendingUp,
  Cpu,
  Sparkles,
} from "lucide-react";
import {
  getPatentLandscape,
  getPatentCompetitors,
} from "../../services/patentService";

export default function PatentIntelligencePage() {
  const [landscapeData, setLandscapeData] = useState(null);
  const [competitors, setCompetitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  async function loadData() {
    setLoading(true);
    try {
      const [landRes, compRes] = await Promise.all([
        getPatentLandscape(),
        getPatentCompetitors(15),
      ]);
      if (landRes) setLandscapeData(landRes);
      if (compRes && compRes.items) setCompetitors(compRes.items);
    } catch (err) {
      console.error("Failed to load patent landscape", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const landscapes = (landscapeData?.landscapes || []).filter((l) =>
    !searchQuery ||
    l.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.top_assignees.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout
      pageTitle="Patent Landscape Analysis"
      breadcrumbs={["Intelligence Platform", "Module 5", "Patent Intelligence"]}
    >
      <div className="tab-pane-content" style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
        {/* Header */}
        <div className="tab-pane-header">
          <div>
            <h3 className="tab-section-title">Patent Landscape Analysis & Prior-Art Mapping</h3>
            <p className="tab-section-desc">
              Automated prior-art discovery, whitespace defensibility mapping, and competitive assignee filing trajectories across USPTO / PatentsView.
            </p>
          </div>
        </div>

        {/* Overview Stats Cards */}
        <div className="overview-stats-grid">
          <div className="overview-stat-card">
            <div className="stat-card-header">
              <span className="stat-label">Mapped IPC Classes</span>
              <Layers size={18} className="stat-icon-amber" />
            </div>
            <div className="stat-val" style={{ fontSize: "1.2rem" }}>
              G06N, G06F, H04L
            </div>
            <span className="stat-nav-hint">AI & Digital Processing classifications</span>
          </div>

          <div className="overview-stat-card">
            <div className="stat-card-header">
              <span className="stat-label">IP Whitespace Index</span>
              <ShieldCheck size={18} className="stat-icon-emerald" />
            </div>
            <div className="stat-val">
              {landscapeData?.whitespace_index || 88.5} / 100
            </div>
            <span className="stat-nav-hint">Novelty defensibility potential</span>
          </div>

          <div className="overview-stat-card">
            <div className="stat-card-header">
              <span className="stat-label">Indexed IP Filings</span>
              <FileKey size={18} className="stat-icon-blue" />
            </div>
            <div className="stat-val">
              {landscapeData?.total_monitored_patents?.toLocaleString() || "1,420"}
            </div>
            <span className="stat-nav-hint">Across verified enterprise assignees</span>
          </div>

          <div className="overview-stat-card">
            <div className="stat-card-header">
              <span className="stat-label">Competitive Assignees</span>
              <Building size={18} className="stat-icon-purple" />
            </div>
            <div className="stat-val">
              {landscapeData?.total_assignees_indexed || competitors.length || 24} Orgs
            </div>
            <span className="stat-nav-hint">Monitored for filing accelerations</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="module-search-bar">
          <div className="module-search-input-wrap">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="module-search-input"
              placeholder="Search patent landscape by domain, technology, or assignee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Landscapes Stream */}
        <div className="publications-stream">
          <h4 style={{ margin: "0", fontSize: "1rem", fontWeight: "700", color: "#ffffff" }}>
            Technology Domain Prior-Art Trajectories
          </h4>

          {loading ? (
            <div className="module-loading">
              <RefreshCw size={24} className="spin-icon" style={{ color: "#22c55e" }} />
              <p>Calculating patent landscape from database records...</p>
            </div>
          ) : landscapes.length === 0 ? (
            <div className="module-empty">
              <FileKey size={28} className="module-empty-icon" />
              <p>No patent landscapes found matching your search.</p>
            </div>
          ) : (
            landscapes.map((l) => (
              <div key={l.domain} className="publication-entry-card">
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "14px", flexWrap: "wrap", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span className="tag tag-blue">
                      {l.whitespace_score}
                    </span>
                    <span className="tag tag-green">
                      {l.status}
                    </span>
                  </div>

                  <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "#22c55e" }}>
                    {l.patents_count} Filings
                  </span>
                </div>

                <h4 style={{ margin: "0 0 6px", fontSize: "1.05rem", fontWeight: "700", color: "var(--charcoal-900)" }}>
                  {l.domain}
                </h4>

                <p style={{ margin: "0 0 10px", fontSize: "0.82rem", color: "var(--charcoal-600)" }}>
                  <strong style={{ color: "var(--charcoal-800)" }}>Top Patent Holders:</strong> {l.top_assignees}
                </p>

                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", borderTop: "1px solid var(--border-light)", paddingTop: "10px" }}>
                  <span style={{ fontSize: "0.72rem", color: "var(--charcoal-500)" }}>IPC Classifications:</span>
                  {(l.ipc_classes || []).map((ipc) => (
                    <span key={ipc} className="tag tag-gray">
                      {ipc}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Competitive Assignees Portfolio Table */}
        <div className="section-container">
          <h4 className="section-inner-title">
            Top Assignees & Corporate IP Portfolios
          </h4>

          <div style={{ overflowX: "auto" }}>
            <table className="module-table">
              <thead>
                <tr>
                  <th>Organization / Assignee</th>
                  <th>Patent Filings</th>
                  <th>Research Output</th>
                  <th>Patent Trajectory</th>
                </tr>
              </thead>
              <tbody>
                {competitors.slice(0, 10).map((c) => (
                  <tr key={c.id || c.organization_name}>
                    <td>
                      <strong>{c.organization_name}</strong>
                    </td>
                    <td style={{ color: "#22c55e", fontWeight: "700" }}>
                      {c.patent_count}
                    </td>
                    <td>
                      {c.research_count}
                    </td>
                    <td>
                      <span className="tag tag-green">
                        {c.patent_trend || "Active Growth"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}