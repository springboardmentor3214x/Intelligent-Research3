import React, { useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { Search, Filter, DollarSign, Calendar, Globe, Building, CheckCircle, ArrowRight, ExternalLink } from "lucide-react";

export default function FundingOpportunitiesPage() {
  const [query, setQuery] = useState("");
  const [funderType, setFunderType] = useState("ALL");

  const grants = [
    {
      id: "G-8901",
      title: "National Science Foundation: Trustworthy AI & Safe Autonomous Systems",
      agency: "National Science Foundation (NSF)",
      amount: "$1,250,000",
      deadline: "2026-11-15",
      type: "Government / Federal",
      matchScore: 96,
      domain: "Artificial Intelligence",
      eligibility: "Principal Investigators, Academic Institutions",
      status: "Open Call"
    },
    {
      id: "G-8902",
      title: "Horizon Europe: Next-Generation Explainable Clinical Decision AI",
      agency: "European Innovation Council",
      amount: "€2,500,000",
      deadline: "2026-12-01",
      type: "International Consortium",
      matchScore: 92,
      domain: "Healthcare AI",
      eligibility: "Cross-border University-Industry Partnerships",
      status: "Open Call"
    },
    {
      id: "G-8903",
      title: "Google Research Scholar Grant: Efficient Machine Learning at the Edge",
      agency: "Google Research",
      amount: "$60,000",
      deadline: "2026-10-30",
      type: "Corporate R&D",
      matchScore: 89,
      domain: "Edge Computing & AI",
      eligibility: "Early-Career Faculty & Academic Researchers",
      status: "Open Call"
    },
    {
      id: "G-8904",
      title: "SERB Core Research Grant: Robust Optimization for Deep Neural Architectures",
      agency: "Science and Engineering Research Board (SERB)",
      amount: "₹65,00,000",
      deadline: "2026-10-15",
      type: "Government / Federal",
      matchScore: 94,
      domain: "Artificial Intelligence",
      eligibility: "Tenured Faculty & Senior Scientists in India",
      status: "Open Call"
    }
  ];

  const filtered = grants.filter((g) => {
    const matchesQ = !query || g.title.toLowerCase().includes(query.toLowerCase()) || g.agency.toLowerCase().includes(query.toLowerCase());
    const matchesT = funderType === "ALL" || g.type === funderType;
    return matchesQ && matchesT;
  });

  return (
    <DashboardLayout pageTitle="Funding Opportunities Discovery" breadcrumbs={["Research Intelligence", "Module 3", "Funding Discovery"]}>
      <div className="tab-pane-content">
        <div className="tab-pane-header">
          <div>
            <h3 className="tab-section-title">Funding Opportunity Discovery & Grants Intelligence</h3>
            <p className="tab-section-desc">AI-driven grant matching indexing global RFPs, federal agencies, and corporate innovation awards.</p>
          </div>
        </div>

        <div className="overview-stats-grid">
          <div className="overview-stat-card">
            <div className="stat-card-header"><span className="stat-label">Active Matched Calls</span><Search size={18} className="stat-icon-blue" /></div>
            <div className="stat-val">{grants.length}</div>
            <span className="stat-nav-hint">Based on your research domain</span>
          </div>
          <div className="overview-stat-card">
            <div className="stat-card-header"><span className="stat-label">Total Available Pool</span><DollarSign size={18} className="stat-icon-emerald" /></div>
            <div className="stat-val">$4.8M+</div>
            <span className="stat-nav-hint">Multi-agency funding volume</span>
          </div>
          <div className="overview-stat-card">
            <div className="stat-card-header"><span className="stat-label">Average Match Score</span><CheckCircle size={18} className="stat-icon-cyan" /></div>
            <div className="stat-val">93%</div>
            <span className="stat-nav-hint">Semantic profile alignment</span>
          </div>
        </div>

        <div className="filter-controls-bar">
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search grants by keyword, agency, or topic..."
              className="filter-search-input"
            />
          </div>
          <div className="filter-select-group">
            <span className="filter-label">Funder:</span>
            <select value={funderType} onChange={(e) => setFunderType(e.target.value)} className="filter-select">
              <option value="ALL">All Funders</option>
              <option value="Government / Federal">Government / Federal</option>
              <option value="International Consortium">International Consortium</option>
              <option value="Corporate R&D">Corporate R&D</option>
            </select>
          </div>
        </div>

        <div className="publications-stream">
          {filtered.map((g) => (
            <div key={g.id} className="publication-entry-card">
              <div className="pub-card-header">
                <div className="pub-card-main-info">
                  <div className="pub-badge-row">
                    <span className="badge-pub-type type-journal">{g.type}</span>
                    <span className="pub-date-text"><Calendar size={13} /> Deadline: {g.deadline}</span>
                    <span className="pub-domain-text"><Globe size={13} /> {g.domain}</span>
                  </div>
                  <h4 className="pub-entry-title">{g.title}</h4>
                  <p className="pub-entry-authors"><Building size={14} /> <strong>Agency:</strong> {g.agency} • <strong>Eligibility:</strong> {g.eligibility}</p>
                </div>
                <div className="citation-count-badge">
                  <span className="cite-num">{g.matchScore}%</span>
                  <small className="cite-text">Match Score</small>
                </div>
              </div>
              <div className="pub-footer-link" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#16a34a" }}>Funding Ceiling: {g.amount}</span>
                <button type="button" className="btn-action-primary btn-sm">
                  View Call Details & Apply <ExternalLink size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}