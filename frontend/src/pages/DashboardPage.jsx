import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import { useResearchProfile } from "../hooks/useResearchProfile";
import {
  Sparkles,
  BookOpen,
  FileKey,
  Cpu,
  Award,
  TrendingUp,
  Search,
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe,
  Layers,
  CheckCircle2,
  Clock,
  Plus,
  Printer,
  Download,
  AlertCircle,
  BarChart2,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import "./DashboardPage.css";

export default function DashboardPage() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const { profile, completion, expertise } = useResearchProfile();

  const [activeTabFilter, setActiveTabFilter] = useState("all");

  const displayName = profile?.personalInfo?.fullName || user?.name || user?.email?.split("@")[0] || "Researcher";
  const userRole = role || "Academic Researcher";

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const publications = profile?.publications || [];
  const patents = profile?.patents || [];
  const technologies = profile?.technologies || [];
  const keywords = profile?.keywords || [];

  const publicationsCount = publications.length;
  const patentsCount = patents.length;
  const techCount = technologies.length;
  const keywordsCount = keywords.length;

  const totalCitations = publications.reduce(
    (acc, p) => acc + (Number(p.citationCount) || 0),
    0
  );

  const modules = [
    {
      title: "Module 2: Research Profile Management",
      desc: "Manage academic background, specialized research domains, publication outputs, and registered patents.",
      badge: "Active Module",
      badgeType: "active",
      link: "/research-profile",
      icon: <Layers size={20} className="mod-icon-blue" />,
      actionText: "Manage Profile"
    },
    {
      title: "Module 3: Funding Opportunity Discovery",
      desc: "AI-driven grants matching engine indexing global funding calls, NSF, Horizon Europe, and industry sponsorships.",
      badge: "Active",
      badgeType: "active",
      link: "/funding",
      icon: <Search size={20} className="mod-icon-emerald" />,
      actionText: "Explore Grants"
    },
    {
      title: "Module 4: Research Trend Intelligence",
      desc: "Emerging topic clustering, citation velocity forecasting, and cross-disciplinary novelty tracking.",
      badge: "Active",
      badgeType: "active",
      link: "/trends",
      icon: <TrendingUp size={20} className="mod-icon-purple" />,
      actionText: "View Trends"
    },
    {
      title: "Module 5: Patent Landscape Analysis",
      desc: "Semantic prior-art searching, claims mapping, and whitespace opportunity identification across patent offices.",
      badge: "Active",
      badgeType: "active",
      link: "/patent-intel",
      icon: <FileKey size={20} className="mod-icon-amber" />,
      actionText: "Explore Patents"
    },
    {
      title: "Module 6: Technology Intelligence",
      desc: "TRL assessment, benchmark radar charts, and computational framework maturity tracking.",
      badge: "Active",
      badgeType: "active",
      link: "/tech-intel",
      icon: <Cpu size={20} className="mod-icon-cyan" />,
      actionText: "Tech Insights"
    },
    {
      title: "Module 7: Innovation Scoring Engine",
      desc: "Multi-dimensional composite scoring evaluating research novelty, patent defensibility, and market commercialization.",
      badge: "Active",
      badgeType: "active",
      link: "/innovation-score",
      icon: <Award size={20} className="mod-icon-rose" />,
      actionText: "Check Score"
    }
  ];

  return (
    <DashboardLayout
      pageTitle="Intelligence Dashboard"
      breadcrumbs={["Research Intelligence", "Executive Dashboard"]}
    >
      <div className="dashboard-page-container animate-fade">
        {/* ── Top Notification / Grant Alert Banner ── */}
        <div className="dashboard-alert-banner">
          <div className="alert-banner-left">
            <span className="alert-pill">Upcoming RFP</span>
            <p className="alert-text">
              <strong>NSF Trustworthy AI 2026:</strong> Call deadline is approaching in 15 days. Profile alignment: <strong>96% match</strong>.
            </p>
          </div>
          <Link to="/funding" className="btn-alert-link">
            Review RFP Details <ArrowRight size={13} />
          </Link>
        </div>

        {/* ── Hero Welcome Banner ── */}
        <div className="enterprise-hero-card">
          <div className="hero-left-content">
            <div className="hero-greeting-pill">
              <Sparkles size={14} className="sparkle-amber" />
              <span>{greeting}, {displayName}</span>
            </div>
            <h2 className="hero-main-title">
              AI Research Funding & Innovation Intelligence Platform
            </h2>
            <p className="hero-subtext">
              Institutional intelligence workbench connecting academic research profiling, federal grant discovery, patent prior-art mapping, and technology transfer.
            </p>
            <div className="hero-action-buttons">
              <Link to="/research-profile" className="btn-hero-primary">
                <Layers size={16} /> Open Research Profile (Module 2)
              </Link>
              <Link to="/funding" className="btn-hero-secondary">
                <Search size={16} /> Discover Grants
              </Link>
              <Link to="/reports" className="btn-hero-secondary">
                <Printer size={16} /> Export Research Dossier
              </Link>
            </div>
          </div>

          <div className="hero-right-completion">
            <div className="completion-dial-box">
              <span className="dial-value">{completion.percentage}%</span>
              <span className="dial-label">Profile Strength</span>
            </div>
            <p className="dial-desc">
              {completion.recommendations.length > 0
                ? `${completion.recommendations.length} action items to optimize semantic grant matching`
                : "All intelligence attributes configured"}
            </p>
            <Link to="/research-profile" className="btn-dial-action">
              Complete Profile Attributes →
            </Link>
          </div>
        </div>

        {/* ── Key Performance Metrics Grid ── */}
        <section className="dashboard-metrics-grid" aria-label="Key Performance Indicators">
          <div className="metric-kpi-card" onClick={() => navigate("/research-profile")} style={{ cursor: "pointer" }}>
            <div className="metric-header">
              <span className="metric-label">Publications Record</span>
              <BookOpen size={18} className="kpi-icon-blue" />
            </div>
            <div className="metric-number-row">
              <span className="metric-number">{publicationsCount}</span>
              <span className="metric-growth-badge">+{totalCitations} Cites</span>
            </div>
            <span className="metric-footer-text">Peer-reviewed manuscripts & journals</span>
          </div>

          <div className="metric-kpi-card" onClick={() => navigate("/patent-intel")} style={{ cursor: "pointer" }}>
            <div className="metric-header">
              <span className="metric-label">Patents & IP Portfolio</span>
              <FileKey size={18} className="kpi-icon-amber" />
            </div>
            <div className="metric-number-row">
              <span className="metric-number">{patentsCount}</span>
              <span className="metric-growth-badge badge-amber">Granted & Filed</span>
            </div>
            <span className="metric-footer-text">Priority intellectual property assets</span>
          </div>

          <div className="metric-kpi-card" onClick={() => navigate("/tech-intel")} style={{ cursor: "pointer" }}>
            <div className="metric-header">
              <span className="metric-label">Technology Competencies</span>
              <Cpu size={18} className="kpi-icon-cyan" />
            </div>
            <div className="metric-number-row">
              <span className="metric-number">{techCount}</span>
              <span className="metric-growth-badge badge-cyan">TRL 7.2 Avg</span>
            </div>
            <span className="metric-footer-text">Frameworks & computational stacks</span>
          </div>

          <div className="metric-kpi-card" onClick={() => navigate("/funding")} style={{ cursor: "pointer" }}>
            <div className="metric-header">
              <span className="metric-label">Matched Grant Calls</span>
              <Zap size={18} className="kpi-icon-purple" />
            </div>
            <div className="metric-number-row">
              <span className="metric-number">$4.8M+</span>
              <span className="metric-growth-badge badge-purple">93% Fit</span>
            </div>
            <span className="metric-footer-text">NSF, Horizon Europe & Industry RFPs</span>
          </div>
        </section>

        {/* ── Quick Action Shortcuts Bar ── */}
        <div className="dashboard-quick-actions-bar">
          <span className="quick-actions-label">Quick Actions:</span>
          <div className="quick-actions-buttons">
            <Link to="/research-profile" className="btn-quick-chip">
              <Plus size={13} /> Add Publication
            </Link>
            <Link to="/research-profile" className="btn-quick-chip">
              <Plus size={13} /> Add Patent
            </Link>
            <Link to="/funding" className="btn-quick-chip">
              <Search size={13} /> Run Grant Matcher
            </Link>
            <Link to="/innovation-score" className="btn-quick-chip">
              <Award size={13} /> Calculate Innovation Index
            </Link>
            <Link to="/reports" className="btn-quick-chip">
              <Download size={13} /> Export BibTeX
            </Link>
          </div>
        </div>

        {/* ── Main Dual Section ── */}
        <div className="dashboard-dual-section">
          {/* Left Column: Platform Intelligence Modules Grid */}
          <div className="dashboard-modules-panel">
            <div className="section-title-row">
              <h3 className="section-heading">Platform Intelligence Modules</h3>
              <span className="section-badge">Infosys Internship Architecture</span>
            </div>

            <div className="modules-card-grid">
              {modules.map((m) => (
                <div key={m.title} className="module-item-card">
                  <div className="module-card-top">
                    <div className="module-icon-wrap">{m.icon}</div>
                    <span className={`mod-status-tag tag-${m.badgeType}`}>
                      {m.badge}
                    </span>
                  </div>
                  <h4 className="module-title">{m.title}</h4>
                  <p className="module-desc">{m.desc}</p>
                  <Link to={m.link} className="module-action-link">
                    <span>{m.actionText}</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              ))}
            </div>

            {/* Recent Publications Preview Card */}
            <div className="enterprise-panel" style={{ marginTop: "10px" }}>
              <div className="panel-header">
                <h3 className="panel-title">
                  <BookOpen size={17} className="panel-icon-indigo" /> Recent Publications Output
                </h3>
                <Link to="/research-profile" className="btn-panel-link">
                  Manage All ({publications.length}) →
                </Link>
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
          </div>

          {/* Right Column: Research Specialization & Live Intelligence Stream */}
          <div className="dashboard-side-panel">
            {/* Top Expertise Breakdown */}
            <div className="side-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 className="side-card-title">
                  <Award size={16} className="text-amber" /> Research Competencies
                </h3>
                <Link to="/research-profile" style={{ fontSize: "0.76rem", color: "#1e40af", fontWeight: "600" }}>
                  Edit
                </Link>
              </div>
              <div className="side-expertise-list">
                {expertise.slice(0, 5).map((exp) => (
                  <div key={exp.name} className="side-expertise-item">
                    <div className="side-exp-meta">
                      <span className="side-exp-name">{exp.name}</span>
                      <span className="side-exp-pct">{exp.percentage}%</span>
                    </div>
                    <div className="side-exp-track">
                      <div
                        className="side-exp-fill"
                        style={{ width: `${exp.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/tech-intel" className="side-card-footer-link">
                View Full TRL Competency Matrix →
              </Link>
            </div>

            {/* Registered IP Portfolio Mini Card */}
            <div className="side-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 className="side-card-title">
                  <FileKey size={16} className="text-amber" /> Registered Intellectual Property
                </h3>
                <Link to="/patent-intel" style={{ fontSize: "0.76rem", color: "#1e40af", fontWeight: "600" }}>
                  Analysis
                </Link>
              </div>
              <div className="mini-record-list">
                {patents.slice(0, 2).map((pat) => (
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
              <Link to="/research-profile" className="side-card-footer-link">
                Manage All IP Records ({patents.length}) →
              </Link>
            </div>

            {/* Platform Live Stream Feed */}
            <div className="side-card">
              <h3 className="side-card-title">
                <Clock size={16} className="text-blue" /> Live Activity & Intelligence Stream
              </h3>
              <div className="feed-items-list">
                <div className="feed-item">
                  <div className="feed-dot dot-emerald" />
                  <div className="feed-body">
                    <p className="feed-text">
                      <strong>Module 2 Research Profile Connected:</strong> Institutional Researcher ID <code>{profile?.id || "RES-10234"}</code> active.
                    </p>
                    <small className="feed-time">Verified Active</small>
                  </div>
                </div>

                <div className="feed-item">
                  <div className="feed-dot dot-blue" />
                  <div className="feed-body">
                    <p className="feed-text">
                      <strong>Semantic Vectors Mapped:</strong> {keywordsCount} technical keywords calibrated for Module 3 grant discovery.
                    </p>
                    <small className="feed-time">Indexed</small>
                  </div>
                </div>

                <div className="feed-item">
                  <div className="feed-dot dot-purple" />
                  <div className="feed-body">
                    <p className="feed-text">
                      <strong>IP Whitespace Index:</strong> 88/100 rated on patent claim defensibility.
                    </p>
                    <small className="feed-time">Updated</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}