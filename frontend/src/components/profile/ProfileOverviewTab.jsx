import React from "react";
import {
  BookOpen,
  FileKey,
  Cpu,
  Tag,
  Briefcase,
  Layers,
  Award,
  ExternalLink,
  ChevronRight,
  Sparkles
} from "lucide-react";

export default function ProfileOverviewTab({ profile, expertise, onNavigateTab }) {
  if (!profile) return null;

  const personal = profile.personalInfo || {};
  const org = profile.organization || {};
  const research = profile.research || {};
  const publications = profile.publications || [];
  const patents = profile.patents || [];
  const technologies = profile.technologies || [];
  const keywords = profile.keywords || [];

  const stats = [
    {
      label: "Research Areas",
      val: (research.researchAreas || []).length,
      icon: <Layers size={18} className="stat-icon-blue" />,
      tab: "research"
    },
    {
      label: "Research Keywords",
      val: keywords.length,
      icon: <Tag size={18} className="stat-icon-cyan" />,
      tab: "keywords"
    },
    {
      label: "Publications",
      val: publications.length,
      icon: <BookOpen size={18} className="stat-icon-indigo" />,
      tab: "publications"
    },
    {
      label: "Patents & IP",
      val: patents.length,
      icon: <FileKey size={18} className="stat-icon-amber" />,
      tab: "patents"
    },
    {
      label: "Technologies",
      val: technologies.length,
      icon: <Cpu size={18} className="stat-icon-emerald" />,
      tab: "technologies"
    },
    {
      label: "Experience",
      val: `${personal.experienceYears || 9} yrs`,
      icon: <Briefcase size={18} className="stat-icon-purple" />,
      tab: "history"
    }
  ];

  return (
    <div className="overview-tab-container">
      {/* ── Stats Grid ── */}
      <div className="overview-stats-grid">
        {stats.map((s) => (
          <div
            key={s.label}
            className="overview-stat-card"
            onClick={() => onNavigateTab(s.tab)}
            role="button"
            tabIndex={0}
          >
            <div className="stat-card-header">
              <span className="stat-label">{s.label}</span>
              {s.icon}
            </div>
            <div className="stat-val">{s.val}</div>
            <span className="stat-nav-hint">View details →</span>
          </div>
        ))}
      </div>

      {/* ── 2-Column Section: Expertise & Highlights ── */}
      <div className="overview-dual-grid">
        {/* Left Column: Research Expertise Bars */}
        <div className="enterprise-panel">
          <div className="panel-header">
            <h3 className="panel-title">
              <Award size={18} className="panel-icon-gold" /> Research Expertise & Specialization
            </h3>
            <button
              type="button"
              className="btn-panel-link"
              onClick={() => onNavigateTab("technologies")}
            >
              Manage Technologies
            </button>
          </div>
          <p className="panel-subtitle">
            Calculated dynamically from validated technology proficiencies and specialized research areas.
          </p>

          <div className="expertise-bars-list">
            {expertise.map((item) => (
              <div key={item.name} className="expertise-bar-row">
                <div className="expertise-meta">
                  <span className="expertise-name">{item.name}</span>
                  <div className="expertise-tags">
                    <span className="badge-category">{item.category}</span>
                    <span className="badge-level">{item.proficiency}</span>
                    <span className="expertise-pct">{item.percentage}%</span>
                  </div>
                </div>
                <div className="expertise-track">
                  <div
                    className="expertise-fill"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Research Summary & Keywords */}
        <div className="enterprise-panel">
          <div className="panel-header">
            <h3 className="panel-title">
              <Sparkles size={18} className="panel-icon-blue" /> Research Scope & Focus
            </h3>
            <button
              type="button"
              className="btn-panel-link"
              onClick={() => onNavigateTab("research")}
            >
              Edit Scope
            </button>
          </div>

          <div className="overview-summary-box">
            <h4 className="summary-box-title">Executive Research Summary</h4>
            <p className="summary-box-text">
              {research.summary || "No research summary provided yet."}
            </p>
          </div>

          <div className="overview-keywords-section">
            <div className="keywords-header">
              <span className="keywords-title">Core Intelligence Keywords</span>
              <button
                type="button"
                className="btn-text-link"
                onClick={() => onNavigateTab("keywords")}
              >
                Edit ({keywords.length}/20)
              </button>
            </div>
            <div className="overview-chips-wrap">
              {keywords.map((kw) => (
                <span key={kw} className="chip-item">
                  {kw}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent Publications & Patents Row ── */}
      <div className="overview-dual-grid">
        <div className="enterprise-panel">
          <div className="panel-header">
            <h3 className="panel-title">
              <BookOpen size={18} className="panel-icon-indigo" /> Top Publications
            </h3>
            <button
              type="button"
              className="btn-panel-link"
              onClick={() => onNavigateTab("publications")}
            >
              View All ({publications.length})
            </button>
          </div>
          <div className="mini-record-list">
            {publications.slice(0, 3).map((pub) => (
              <div key={pub.id} className="mini-record-item">
                <div className="mini-record-info">
                  <h4 className="mini-record-title">{pub.title}</h4>
                  <p className="mini-record-sub">
                    {pub.journal} • {pub.publicationDate ? pub.publicationDate.slice(0, 4) : "2024"}
                  </p>
                </div>
                <span className="mini-cite-badge">{pub.citationCount || 0} Citations</span>
              </div>
            ))}
          </div>
        </div>

        <div className="enterprise-panel">
          <div className="panel-header">
            <h3 className="panel-title">
              <FileKey size={18} className="panel-icon-amber" /> Registered Intellectual Property
            </h3>
            <button
              type="button"
              className="btn-panel-link"
              onClick={() => onNavigateTab("patents")}
            >
              View All ({patents.length})
            </button>
          </div>
          <div className="mini-record-list">
            {patents.slice(0, 3).map((pat) => (
              <div key={pat.id} className="mini-record-item">
                <div className="mini-record-info">
                  <h4 className="mini-record-title">{pat.title}</h4>
                  <p className="mini-record-sub">
                    {pat.patentNumber} • {pat.technologyDomain || "Artificial Intelligence"}
                  </p>
                </div>
                <span className={`patent-status-chip status-${(pat.status || "pending").toLowerCase()}`}>
                  {pat.status || "Pending"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}