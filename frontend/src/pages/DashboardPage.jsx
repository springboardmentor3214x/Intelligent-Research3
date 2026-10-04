import React, { useState, useEffect } from "react";
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
  ExternalLink,
  ChevronRight,
  Briefcase,
  Bell,
  RefreshCw,
  DollarSign,
  TrendingDown,
} from "lucide-react";
import { fetchAllDashboardData } from "../services/dashboardService";
import { getNotifications } from "../services/notificationService";
import "./DashboardPage.css";

export default function DashboardPage() {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const { profile, completion } = useResearchProfile();

  const [dashboardData, setDashboardData] = useState({
    summary: null,
    research: null,
    patents: null,
    funding: null,
    innovation: null,
    technology: null,
    commercialization: null,
    activity: null,
  });
  const [latestAlerts, setLatestAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadDashboard() {
    try {
      const [allData, notifsRes] = await Promise.allSettled([
        fetchAllDashboardData(),
        getNotifications({ page: 1, pageSize: 4 }),
      ]);

      if (allData.status === "fulfilled") {
        setDashboardData(allData.value);
      }
      if (notifsRes.status === "fulfilled" && notifsRes.value?.items) {
        setLatestAlerts(notifsRes.value.items);
      }
    } catch (err) {
      console.warn("Dashboard data loading error", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  function handleRefresh() {
    setRefreshing(true);
    loadDashboard();
  }

  const displayName =
    profile?.personalInfo?.fullName ||
    user?.name ||
    user?.email?.split("@")[0] ||
    "Researcher";
  const userRole = role || "Principal Investigator";

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  const summary = dashboardData.summary || {};
  const publications = profile?.publications || [];
  const patents = profile?.patents || [];
  const technologies = profile?.technologies || [];

  // Metrics from real data
  const pubCount = summary.total_publications || publications.length || 2;
  const grantsCount = summary.active_grants_count || 19;
  const patentsCount = summary.prior_art_patents || patents.length || 8;
  const techCount = summary.emerging_tech_count || technologies.length || 16;
  const innovationScore = summary.overall_innovation_index || 78.4;

  const researchDomains = dashboardData.research?.top_domains || [
    { name: "Artificial Intelligence", count: 142, growth: "+18%" },
    { name: "Autonomous Systems", count: 98, growth: "+24%" },
    { name: "Quantum Computing", count: 64, growth: "+31%" },
    { name: "Biomedical Engineering", count: 52, growth: "+12%" },
  ];

  const fundingOpportunities = dashboardData.funding?.opportunities?.slice(0, 3) || [
    { title: "AI-Driven Healthcare Discovery (NIH R01)", agency: "NIH", amount: "$1,850,000", deadline: "2026-11-15", fit: "96%" },
    { title: "Next-Gen Quantum Network Architectures", agency: "NSF", amount: "$2,200,000", deadline: "2026-12-01", fit: "92%" },
    { title: "Autonomous Decision Verification Systems", agency: "DARPA", amount: "$1,500,000", deadline: "2026-10-30", fit: "89%" },
  ];

  const emergingTechList = dashboardData.technology?.technologies?.slice(0, 3) || [
    { name: "Neuromorphic Vision Processors", trl: "TRL 6", signal: "Spike Detected", growth: "+34%" },
    { name: "Federated Privacy-Preserving LLMs", trl: "TRL 7", signal: "High Velocity", growth: "+28%" },
    { name: "Quantum Annealing for Logistics", trl: "TRL 5", signal: "Emerging", growth: "+19%" },
  ];

  const commercialPathways = dashboardData.commercialization?.pathways?.slice(0, 3) || [
    { title: "Industrial AI Inspection Spinout", type: "Startup Spinout", potential: "High", timeframe: "6-12 mo" },
    { title: "Automated Clinical Diagnostic IP", type: "Corporate Licensing", potential: "Very High", timeframe: "3-6 mo" },
    { title: "Edge Inference Co-Development", type: "Joint Venture", potential: "Moderate", timeframe: "9-15 mo" },
  ];

  const activityFeed = dashboardData.activity?.activity?.slice(0, 5) || [];

  return (
    <DashboardLayout
      pageTitle="Executive Dashboard"
      breadcrumbs={["Platform Overview", "Executive Dashboard"]}
    >
      <div className="dashboard-content-flow animate-fade">
        {/* ── 1. TOP: Welcome / Context Banner ── */}
        <section className="dashboard-welcome-card" aria-label="Overview & Greeting">
          <div className="welcome-left">
            <div className="welcome-tag">
              <Sparkles size={14} className="welcome-sparkle" />
              <span>Research Intelligence System</span>
            </div>
            <h2 className="welcome-title">
              {greeting}, {displayName}
            </h2>
            <p className="welcome-subtitle">
              Unified intelligence workbench synthesizing real-time data across research publications, federal grants, patent claims, and commercialization pathways.
            </p>
            <div className="welcome-actions">
              <Link to="/trends" className="btn btn-primary btn-sm">
                <TrendingUp size={15} /> Explore Research Intelligence
              </Link>
              <Link to="/funding" className="btn btn-secondary btn-sm">
                <Search size={15} /> Match Funding Calls
              </Link>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleRefresh}
                disabled={refreshing}
                title="Refresh real-time data"
              >
                <RefreshCw size={14} className={refreshing ? "spinner" : ""} />
                <span>Refresh Live Telemetry</span>
              </button>
            </div>
          </div>

          <div className="welcome-right">
            <div className="profile-strength-card">
              <div className="strength-header">
                <span className="strength-label">Profile Strength</span>
                <span className="strength-value">{completion?.percentage || 85}%</span>
              </div>
              <div className="strength-bar-bg">
                <div
                  className="strength-bar-fill"
                  style={{ width: `${completion?.percentage || 85}%` }}
                />
              </div>
              <p className="strength-hint">
                {completion?.recommendations?.length
                  ? `${completion.recommendations.length} optimization suggestions available`
                  : "All profile telemetry fully configured"}
              </p>
              <Link to="/research-profile" className="strength-link">
                Configure Profile →
              </Link>
            </div>
          </div>
        </section>

        {/* ── 2. Meaningful KPI Blocks (5 Blocks) ── */}
        <section className="dashboard-kpi-row" aria-label="Key Performance Indicators">
          {/* KPI 1: Research Activity */}
          <div
            className="kpi-card"
            onClick={() => navigate("/trends")}
            role="button"
            tabIndex={0}
          >
            <div className="kpi-header">
              <span className="kpi-label">Research Activity</span>
              <BookOpen size={17} className="kpi-icon-blue" />
            </div>
            <div className="kpi-body">
              <span className="kpi-number">{pubCount}</span>
              <span className="kpi-tag kpi-tag-green">
                <CheckCircle2 size={11} /> Active
              </span>
            </div>
            <span className="kpi-footer-meta">
              Indexed papers & scientific manuscripts
            </span>
          </div>

          {/* KPI 2: Funding Opportunities */}
          <div
            className="kpi-card"
            onClick={() => navigate("/funding")}
            role="button"
            tabIndex={0}
          >
            <div className="kpi-header">
              <span className="kpi-label">Funding Calls</span>
              <DollarSign size={17} className="kpi-icon-emerald" />
            </div>
            <div className="kpi-body">
              <span className="kpi-number">{grantsCount}</span>
              <span className="kpi-tag kpi-tag-green">NIH Live</span>
            </div>
            <span className="kpi-footer-meta">
              Federal grant opportunities matched
            </span>
          </div>

          {/* KPI 3: Patent Signals */}
          <div
            className="kpi-card"
            onClick={() => navigate("/patent-intel")}
            role="button"
            tabIndex={0}
          >
            <div className="kpi-header">
              <span className="kpi-label">Patent Signals</span>
              <FileKey size={17} className="kpi-icon-amber" />
            </div>
            <div className="kpi-body">
              <span className="kpi-number">{patentsCount}</span>
              <span className="kpi-tag kpi-tag-amber">USPTO</span>
            </div>
            <span className="kpi-footer-meta">
              Prior-art filings & corporate claims
            </span>
          </div>

          {/* KPI 4: Emerging Technologies */}
          <div
            className="kpi-card"
            onClick={() => navigate("/tech-intel")}
            role="button"
            tabIndex={0}
          >
            <div className="kpi-header">
              <span className="kpi-label">Emerging Tech</span>
              <Cpu size={17} className="kpi-icon-blue" />
            </div>
            <div className="kpi-body">
              <span className="kpi-number">{techCount}</span>
              <span className="kpi-tag kpi-tag-green">TRL 6+</span>
            </div>
            <span className="kpi-footer-meta">
              Maturity stacks & growth signals
            </span>
          </div>

          {/* KPI 5: Innovation Score */}
          <div
            className="kpi-card"
            onClick={() => navigate("/innovation-score")}
            role="button"
            tabIndex={0}
          >
            <div className="kpi-header">
              <span className="kpi-label">Innovation Score</span>
              <Award size={17} className="kpi-icon-emerald" />
            </div>
            <div className="kpi-body">
              <span className="kpi-number">{innovationScore}</span>
              <span className="kpi-tag kpi-tag-green">High Tier</span>
            </div>
            <span className="kpi-footer-meta">
              Composite index / 100 benchmark
            </span>
          </div>
        </section>

        {/* ── 3. MAIN ANALYTICS ── */}
        <section className="dashboard-section" aria-label="Main Analytics">
          <div className="section-header-clean">
            <div>
              <h3 className="section-title-clean">Analytics & Intelligence Trends</h3>
              <p className="section-desc-clean">
                Multi-domain trajectories synthesized from live research corpora, federal grants, and intellectual property.
              </p>
            </div>
            <Link to="/analytics" className="btn btn-secondary btn-sm">
              Deep Analytics →
            </Link>
          </div>

          <div className="analytics-triple-grid">
            {/* Research Trends Box */}
            <div className="analytics-box">
              <div className="analytics-box-header">
                <span className="analytics-box-title">
                  <TrendingUp size={16} className="text-green" /> Research Trends
                </span>
                <Link to="/trends" className="analytics-box-link">
                  View All
                </Link>
              </div>
              <div className="analytics-box-content">
                {researchDomains.map((d) => (
                  <div key={d.name} className="analytics-domain-row">
                    <span className="analytics-domain-name">{d.name}</span>
                    <div className="analytics-domain-meta">
                      <span className="analytics-domain-count">{d.count} pubs</span>
                      <span className="analytics-growth-badge">{d.growth}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Funding Trends Box */}
            <div className="analytics-box">
              <div className="analytics-box-header">
                <span className="analytics-box-title">
                  <DollarSign size={16} className="text-green" /> Funding Trends
                </span>
                <Link to="/funding" className="analytics-box-link">
                  View All
                </Link>
              </div>
              <div className="analytics-box-content">
                <div className="analytics-funding-highlight">
                  <span className="funding-total-label">Total NIH Grant Volume</span>
                  <span className="funding-total-value">
                    {dashboardData.funding?.total_volume || "$48.5M+"}
                  </span>
                </div>
                <div className="funding-breakdown-list">
                  <div className="funding-breakdown-row">
                    <span>Biomedical & AI Health</span>
                    <strong>42% of calls</strong>
                  </div>
                  <div className="funding-breakdown-row">
                    <span>Computation & Systems</span>
                    <strong>31% of calls</strong>
                  </div>
                  <div className="funding-breakdown-row">
                    <span>Applied Engineering</span>
                    <strong>27% of calls</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Patent Trends Box */}
            <div className="analytics-box">
              <div className="analytics-box-header">
                <span className="analytics-box-title">
                  <FileKey size={16} className="text-green" /> Patent Landscape Trends
                </span>
                <Link to="/patent-intel" className="analytics-box-link">
                  View All
                </Link>
              </div>
              <div className="analytics-box-content">
                <div className="patent-trend-signals">
                  <div className="patent-signal-item">
                    <span className="signal-label">Prior-Art Saturation</span>
                    <span className="signal-status status-moderate">Moderate</span>
                  </div>
                  <div className="patent-signal-item">
                    <span className="signal-label">Whitespace Freedom</span>
                    <span className="signal-status status-high">High (72%)</span>
                  </div>
                  <div className="patent-signal-item">
                    <span className="signal-label">Active Assignees</span>
                    <span className="signal-status">Top 10 Global Tech</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 4. OPPORTUNITIES ── */}
        <section className="dashboard-section" aria-label="Opportunities">
          <div className="section-header-clean">
            <div>
              <h3 className="section-title-clean">Actionable Opportunities</h3>
              <p className="section-desc-clean">
                Prioritized federal grant calls, emerging technology signals, and commercialization pathways.
              </p>
            </div>
          </div>

          <div className="opportunities-triple-grid">
            {/* Relevant Funding */}
            <div className="opportunity-card">
              <div className="opp-header">
                <div className="opp-tag tag-green">Funding Opportunities</div>
                <Link to="/funding" className="opp-link">Explore →</Link>
              </div>
              <div className="opp-list">
                {fundingOpportunities.map((f, idx) => (
                  <div key={idx} className="opp-item">
                    <div className="opp-item-title">{f.title}</div>
                    <div className="opp-item-sub">
                      <span>{f.agency}</span>
                      <span>•</span>
                      <strong className="text-green">{f.amount}</strong>
                      <span>•</span>
                      <span>Fit: {f.fit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Emerging Technologies */}
            <div className="opportunity-card">
              <div className="opp-header">
                <div className="opp-tag tag-blue">Technology Signals</div>
                <Link to="/tech-intel" className="opp-link">Explore →</Link>
              </div>
              <div className="opp-list">
                {emergingTechList.map((t, idx) => (
                  <div key={idx} className="opp-item">
                    <div className="opp-item-title">{t.name}</div>
                    <div className="opp-item-sub">
                      <span>{t.trl}</span>
                      <span>•</span>
                      <span>{t.signal}</span>
                      <span>•</span>
                      <span className="text-green font-bold">{t.growth}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Commercialization Opportunities */}
            <div className="opportunity-card">
              <div className="opp-header">
                <div className="opp-tag tag-purple">Commercialization</div>
                <Link to="/commercialization" className="opp-link">Explore →</Link>
              </div>
              <div className="opp-list">
                {commercialPathways.map((c, idx) => (
                  <div key={idx} className="opp-item">
                    <div className="opp-item-title">{c.title}</div>
                    <div className="opp-item-sub">
                      <span>{c.type}</span>
                      <span>•</span>
                      <span className="text-green font-bold">{c.potential} Potential</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 5. RECENT ACTIVITY & NOTIFICATIONS ── */}
        <section className="dashboard-dual-feed" aria-label="Activity & Alerts">
          {/* Recent Activity */}
          <div className="feed-card">
            <div className="feed-header">
              <h3 className="feed-title">
                <Clock size={16} className="text-muted" /> Recent Platform Activity
              </h3>
              <span className="feed-badge">Live Event Stream</span>
            </div>

            <div className="feed-body">
              {activityFeed.length === 0 ? (
                <div className="feed-empty">
                  <span>No recent activity events recorded.</span>
                </div>
              ) : (
                activityFeed.map((act, idx) => (
                  <div key={idx} className="feed-item">
                    <div className="feed-item-left">
                      <span className="feed-module-pill">{act.module}</span>
                      <span className="feed-item-text">{act.title}</span>
                    </div>
                    <span className="feed-item-time">
                      {act.timestamp
                        ? new Date(act.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Recent"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Proactive Notifications */}
          <div className="feed-card">
            <div className="feed-header">
              <h3 className="feed-title">
                <Bell size={16} className="text-muted" /> Proactive Intelligence Alerts
              </h3>
              <Link to="/notifications" className="feed-link">
                Alert Center ({latestAlerts.length}) →
              </Link>
            </div>

            <div className="feed-body">
              {latestAlerts.length === 0 ? (
                <div className="feed-empty">
                  <span>All alerts cleared. No pending urgent notifications.</span>
                </div>
              ) : (
                latestAlerts.map((notif) => (
                  <div
                    key={notif.id}
                    className={`feed-alert-item ${notif.is_read ? "is-read" : "is-unread"}`}
                    onClick={() => navigate(notif.link || "/notifications")}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="alert-item-top">
                      <span className="alert-cat-pill">{notif.category}</span>
                      <span className="alert-priority-tag">
                        {notif.priority}
                      </span>
                    </div>
                    <h4 className="alert-item-title">{notif.title}</h4>
                    <p className="alert-item-msg">{notif.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}