/**
 * Module 9 — Dashboard & Analytics
 *
 * A professional, role-aware analytics dashboard that aggregates and visualises
 * outputs from Modules 1–8.  All data is fetched from the real backend.
 */
import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  AreaChart, Area, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  LayoutDashboard, Users, BookOpen, FileKey, DollarSign,
  Cpu, Award, TrendingUp, Zap, BarChart2, AlertCircle,
  RefreshCw, ChevronRight, Globe, Layers, ShieldCheck,
  Clock, Search, Activity,
} from "lucide-react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { fetchAllDashboardData, getUserAnalytics } from "../../services/dashboardService";
import "./AnalyticsDashboard.css";

// ── Colour palette reused across charts ──────────────────────────────────────
const COLORS = [
  "#6366f1", "#22d3ee", "#f59e0b", "#10b981", "#f43f5e",
  "#8b5cf6", "#3b82f6", "#ec4899", "#14b8a6", "#fb923c",
];

// ── Small helper components ───────────────────────────────────────────────────

function SectionLoading() {
  return (
    <div className="an-loading">
      <RefreshCw size={18} className="an-spin" />
      <span>Loading analytics…</span>
    </div>
  );
}

function SectionError({ message, onRetry }) {
  return (
    <div className="an-error">
      <AlertCircle size={16} />
      <span>{message || "Unable to load this analytics section."}</span>
      {onRetry && (
        <button className="an-retry-btn" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="an-empty">
      <BarChart2 size={32} className="an-empty-icon" />
      <p>{message || "No data available yet."}</p>
    </div>
  );
}

function KpiCard({ label, value, sub, icon: Icon, accent, link, unit }) {
  const content = (
    <div className={`an-kpi-card accent-${accent || "blue"}`}>
      <div className="an-kpi-header">
        <span className="an-kpi-label">{label}</span>
        {Icon && <Icon size={18} className="an-kpi-icon" />}
      </div>
      <div className="an-kpi-value">
        {value !== null && value !== undefined ? (
          <>
            <span className="an-kpi-number">{value}</span>
            {unit && <span className="an-kpi-unit">{unit}</span>}
          </>
        ) : (
          <span className="an-kpi-na">—</span>
        )}
      </div>
      {sub && <span className="an-kpi-sub">{sub}</span>}
    </div>
  );
  return link ? <Link to={link} className="an-kpi-link">{content}</Link> : content;
}

function SectionCard({ title, icon: Icon, children, source, link, linkLabel }) {
  return (
    <div className="an-section-card">
      <div className="an-section-header">
        <h3 className="an-section-title">
          {Icon && <Icon size={16} className="an-section-icon" />}
          {title}
        </h3>
        <div className="an-section-meta">
          {source && <span className="an-source-badge">{source}</span>}
          {link && (
            <Link to={link} className="an-section-link">
              {linkLabel || "View All"} <ChevronRight size={13} />
            </Link>
          )}
        </div>
      </div>
      <div className="an-section-body">{children}</div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="an-chart-tooltip">
        {label && <p className="an-tooltip-label">{label}</p>}
        {payload.map((entry, i) => (
          <p key={i} style={{ color: entry.color }}>
            {entry.name}: <strong>{entry.value}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ── Date range selector ───────────────────────────────────────────────────────
const DATE_RANGES = [
  { label: "All Time", value: "all" },
  { label: "Last Year", value: "1y" },
  { label: "Last 6 Months", value: "6m" },
  { label: "Last 30 Days", value: "30d" },
];

// ── Main page component ───────────────────────────────────────────────────────
export default function AnalyticsDashboard() {
  const { user, role } = useAuth();

  const [data, setData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState("overview");
  const [dateRange, setDateRange] = useState("all");
  const [lastRefresh, setLastRefresh] = useState(null);

  const userRole = (role || "").toLowerCase();
  const isAdmin = userRole === "administrator" || userRole === "admin";
  const isResearcher = userRole === "researcher";
  const isStartupFounder = userRole === "startup founder" || userRole === "startup_founder";
  const isInnovationMgr = userRole === "innovation manager" || userRole === "innovation_manager";

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const allData = await fetchAllDashboardData();
      setData(allData);
      if (isAdmin) {
        try {
          const ud = await getUserAnalytics();
          setUserData(ud);
        } catch {
          // non-fatal
        }
      }
      setLastRefresh(new Date());
    } catch (err) {
      setError(err.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const displayName = user?.name || user?.email?.split("@")[0] || "User";

  // ── Section nav tabs ────────────────────────────────────────────────────────
  const sections = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "research", label: "Research", icon: BookOpen },
    { id: "patents", label: "Patents", icon: FileKey },
    { id: "funding", label: "Funding", icon: DollarSign },
    { id: "innovation", label: "Innovation", icon: Award },
    { id: "technology", label: "Technology", icon: Cpu },
    { id: "commercialization", label: "Commercialization", icon: TrendingUp },
    ...(isAdmin ? [{ id: "admin", label: "Admin", icon: ShieldCheck }] : []),
  ];

  if (loading) {
    return (
      <DashboardLayout pageTitle="Analytics Dashboard" breadcrumbs={["Module 9", "Dashboard & Analytics"]}>
        <div className="an-page-loading">
          <RefreshCw size={32} className="an-spin" />
          <p>Loading Analytics Dashboard…</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout pageTitle="Analytics Dashboard" breadcrumbs={["Module 9", "Dashboard & Analytics"]}>
        <div className="an-page-error">
          <AlertCircle size={40} />
          <h3>Dashboard Error</h3>
          <p>{error}</p>
          <button className="an-retry-btn-large" onClick={loadData}>Retry</button>
        </div>
      </DashboardLayout>
    );
  }

  const summary = data?.summary || {};
  const research = data?.research || {};
  const patents = data?.patents || {};
  const funding = data?.funding || {};
  const innovation = data?.innovation || {};
  const technology = data?.technology || {};
  const commercialization = data?.commercialization || {};
  const activity = data?.activity || {};

  return (
    <DashboardLayout
      pageTitle="Dashboard & Analytics"
      breadcrumbs={["Module 9", "Dashboard & Analytics"]}
    >
      <div className="an-page">
        {/* ── Page header ── */}
        <div className="an-page-header">
          <div className="an-header-left">
            <h1 className="an-page-title">
              <BarChart2 size={22} className="an-title-icon" />
              Dashboard & Analytics
            </h1>
            <p className="an-page-sub">
              {isAdmin ? "Platform-wide intelligence overview" :
               isResearcher ? "Research intelligence for your profile" :
               isStartupFounder ? "Innovation & commercialization insights" :
               "Innovation pipeline analytics"}
              {" "}— <span className="an-role-badge">{role || "User"}</span>
            </p>
          </div>
          <div className="an-header-right">
            <div className="an-date-range-selector">
              {DATE_RANGES.map(({ label, value }) => (
                <button
                  key={value}
                  className={`an-range-btn ${dateRange === value ? "active" : ""}`}
                  onClick={() => setDateRange(value)}
                >
                  {label}
                </button>
              ))}
            </div>
            <button className="an-refresh-btn" onClick={loadData} title="Refresh data">
              <RefreshCw size={15} />
              Refresh
            </button>
          </div>
        </div>

        {lastRefresh && (
          <p className="an-last-refresh">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        )}

        {/* ── Section nav ── */}
        <nav className="an-section-nav">
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`an-nav-tab ${activeSection === id ? "active" : ""}`}
              onClick={() => setActiveSection(id)}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </nav>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION: OVERVIEW
        ══════════════════════════════════════════════════════════════════ */}
        {activeSection === "overview" && (
          <div className="an-section-content">
            {/* KPI Grid */}
            <div className="an-kpi-grid">
              {(isAdmin || isResearcher) && (
                <KpiCard
                  label="Publications"
                  value={summary.total_publications}
                  sub="In profile database"
                  icon={BookOpen}
                  accent="blue"
                  link="/research-profile"
                />
              )}
              <KpiCard
                label="Technologies"
                value={summary.total_technologies}
                sub="Tracked & analysed"
                icon={Cpu}
                accent="cyan"
                link="/tech-intel"
              />
              <KpiCard
                label="Funding Opportunities"
                value={summary.active_funding_opportunities}
                sub={`${summary.total_funding_opportunities ?? 0} total`}
                icon={DollarSign}
                accent="emerald"
                link="/funding"
              />
              {(isAdmin || isResearcher) && (
                <KpiCard
                  label="Patents"
                  value={summary.total_patents}
                  sub="In IP database"
                  icon={FileKey}
                  accent="amber"
                  link="/patent-intel"
                />
              )}
              <KpiCard
                label="Innovation Scores"
                value={summary.total_innovation_scores}
                sub={summary.avg_innovation_score ? `Avg: ${summary.avg_innovation_score}` : "No scores yet"}
                icon={Award}
                accent="purple"
                link="/innovation-score"
              />
              <KpiCard
                label="Emerging Technologies"
                value={summary.emerging_technologies}
                sub="Stage: Emerging"
                icon={Zap}
                accent="rose"
                link="/tech-intel"
              />
              <KpiCard
                label="Innovation Opportunities"
                value={summary.total_innovation_opportunities}
                sub="Detected signals"
                icon={TrendingUp}
                accent="indigo"
                link="/tech-intel"
              />
              <KpiCard
                label="Commercialization Recs"
                value={summary.total_commercialization_recommendations}
                sub={summary.avg_innovation_score ? `Platform avg: ${summary.avg_innovation_score}` : "Module 8 output"}
                icon={Layers}
                accent="orange"
                link="/commercialization"
              />
            </div>

            {/* Overview dual panel */}
            <div className="an-dual-panel">
              {/* Technology maturity distribution */}
              <SectionCard
                title="Technology Maturity Distribution"
                icon={Cpu}
                source="Module 6"
                link="/tech-intel"
                linkLabel="Tech Intel"
              >
                {technology.stage_distribution && technology.stage_distribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={technology.stage_distribution}
                        dataKey="count"
                        nameKey="stage"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={({ stage, percent }) =>
                          `${stage} (${(percent * 100).toFixed(0)}%)`
                        }
                      >
                        {technology.stage_distribution.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v, n) => [v, n]} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState message="No technology data available" />
                )}
              </SectionCard>

              {/* Innovation score overview */}
              <SectionCard
                title="Innovation Score Overview"
                icon={Award}
                source="Module 7"
                link="/innovation-score"
                linkLabel="Scores"
              >
                {innovation.scores_list && innovation.scores_list.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart
                      data={innovation.scores_list.slice(0, 10)}
                      margin={{ top: 5, right: 10, left: 0, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis
                        dataKey="technology_id"
                        tick={{ fill: "#94a3b8", fontSize: 10 }}
                        angle={-45}
                        textAnchor="end"
                        interval={0}
                      />
                      <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="innovation_score" name="Innovation Score" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState message="No innovation scores yet. Run the Innovation Score engine first." />
                )}
              </SectionCard>
            </div>

            {/* Recent Activity Feed */}
            <SectionCard
              title="Recent Platform Activity"
              icon={Activity}
              source="All Modules"
            >
              {activity.activity && activity.activity.length > 0 ? (
                <div className="an-activity-list">
                  {activity.activity.slice(0, 12).map((item, i) => (
                    <div key={i} className={`an-activity-item type-${item.type}`}>
                      <div className={`an-activity-dot dot-${item.type}`} />
                      <div className="an-activity-body">
                        <p className="an-activity-title">{item.title}</p>
                        <p className="an-activity-detail">
                          <span className="an-module-tag">{item.module}</span>
                          {item.detail}
                        </p>
                      </div>
                      {item.timestamp && (
                        <span className="an-activity-time">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState message="No recent activity. Start using the platform modules to generate activity." />
              )}
            </SectionCard>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            SECTION: RESEARCH (Modules 2 & 3)
        ══════════════════════════════════════════════════════════════════ */}
        {activeSection === "research" && (
          <div className="an-section-content">
            <div className="an-kpi-grid">
              <KpiCard label="Total Publications" value={research.total_publications} icon={BookOpen} accent="blue" link="/research-profile" />
              <KpiCard label="Total Patents (Profile)" value={research.total_patents} icon={FileKey} accent="amber" link="/research-profile" />
              <KpiCard label="Research Papers (API)" value={research.research_papers_count} sub="From OpenAlex" icon={Search} accent="cyan" />
              <KpiCard label="Research Areas" value={research.research_areas?.length} icon={Globe} accent="emerald" />
            </div>

            <div className="an-dual-panel">
              {/* Publications by year */}
              <SectionCard title="Publications Over Time" icon={BookOpen} source="Module 2 (Profile DB)" link="/research-profile">
                {research.publications_by_year && research.publications_by_year.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={research.publications_by_year}>
                      <defs>
                        <linearGradient id="pubGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="year" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="count" name="Publications" stroke="#6366f1" fill="url(#pubGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState message="Add publications to your research profile to see trends." />
                )}
              </SectionCard>

              {/* Research areas */}
              <SectionCard title="Research Areas" icon={Globe} source="Module 2">
                {research.research_areas && research.research_areas.length > 0 ? (
                  <div className="an-tag-cloud">
                    {research.research_areas.map((area, i) => (
                      <span key={i} className="an-tag" style={{ borderColor: COLORS[i % COLORS.length] }}>
                        {area}
                      </span>
                    ))}
                  </div>
                ) : (
                  <EmptyState message="No research areas found. Complete your research profile." />
                )}
              </SectionCard>
            </div>

            {/* Recent publications table */}
            <SectionCard title="Recent Publications" icon={BookOpen} source="Module 2" link="/research-profile" linkLabel="Manage All">
              {research.recent_publications && research.recent_publications.length > 0 ? (
                <div className="an-table-wrapper">
                  <table className="an-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Journal / Conference</th>
                        <th>Year</th>
                      </tr>
                    </thead>
                    <tbody>
                      {research.recent_publications.map((pub) => (
                        <tr key={pub.id}>
                          <td>
                            {pub.doi ? (
                              <a href={`https://doi.org/${pub.doi}`} target="_blank" rel="noreferrer" className="an-table-link">
                                {pub.title}
                              </a>
                            ) : pub.title}
                          </td>
                          <td>{pub.journal || "—"}</td>
                          <td>{pub.year || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState message="No publications recorded." />
              )}
            </SectionCard>

            {/* Top keywords */}
            {research.top_keywords && research.top_keywords.length > 0 && (
              <SectionCard title="Research Keywords" icon={Search} source="Module 2">
                <div className="an-tag-cloud">
                  {research.top_keywords.map((kw, i) => (
                    <span key={i} className="an-tag an-tag-sm" style={{ borderColor: COLORS[i % COLORS.length] }}>
                      {kw}
                    </span>
                  ))}
                </div>
              </SectionCard>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            SECTION: PATENTS (Module 5)
        ══════════════════════════════════════════════════════════════════ */}
        {activeSection === "patents" && (
          <div className="an-section-content">
            <div className="an-kpi-grid">
              <KpiCard label="Total Patents" value={patents.total_patents} icon={FileKey} accent="amber" link="/patent-intel" />
              <KpiCard
                label="Granted"
                value={patents.status_breakdown?.find(s => s.status?.toLowerCase() === "granted")?.count}
                icon={ShieldCheck}
                accent="emerald"
              />
              <KpiCard
                label="Pending / Filed"
                value={patents.status_breakdown?.find(s => s.status?.toLowerCase() === "pending" || s.status?.toLowerCase() === "filed")?.count}
                icon={Clock}
                accent="blue"
              />
            </div>

            <div className="an-dual-panel">
              {/* Patents by year */}
              <SectionCard title="Patent Filings Over Time" icon={FileKey} source="Module 5 / Module 2">
                {patents.patents_by_year && patents.patents_by_year.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={patents.patents_by_year}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="year" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Patents Filed" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState message="Add patents to your research profile to see filing trends." />
                )}
              </SectionCard>

              {/* Status breakdown */}
              <SectionCard title="Patent Status Breakdown" icon={ShieldCheck} source="Module 2">
                {patents.status_breakdown && patents.status_breakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={patents.status_breakdown}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={({ status, percent }) => `${status} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {patents.status_breakdown.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState message="No patent status data available." />
                )}
              </SectionCard>
            </div>

            {/* Recent patents table */}
            <SectionCard title="Recent Patents" icon={FileKey} source="Module 2" link="/research-profile" linkLabel="Manage IP">
              {patents.recent_patents && patents.recent_patents.length > 0 ? (
                <div className="an-table-wrapper">
                  <table className="an-table">
                    <thead>
                      <tr><th>Title</th><th>Patent Number</th><th>Status</th><th>Filing Date</th></tr>
                    </thead>
                    <tbody>
                      {patents.recent_patents.map((p) => (
                        <tr key={p.id}>
                          <td>{p.title}</td>
                          <td>{p.patent_number || "—"}</td>
                          <td>
                            <span className={`an-status-chip status-${(p.status || "unknown").toLowerCase()}`}>
                              {p.status || "Unknown"}
                            </span>
                          </td>
                          <td>{p.filing_date ? new Date(p.filing_date).toLocaleDateString() : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState message="No patents recorded. Add patents via the Research Profile module." />
              )}
            </SectionCard>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            SECTION: FUNDING (Module 4)
        ══════════════════════════════════════════════════════════════════ */}
        {activeSection === "funding" && (
          <div className="an-section-content">
            <div className="an-kpi-grid">
              <KpiCard label="Total Opportunities" value={funding.total_funding_opportunities} icon={DollarSign} accent="emerald" link="/funding" />
              <KpiCard
                label="Active Opportunities"
                value={funding.status_breakdown?.find(s => s.status === "active")?.count}
                icon={Zap}
                accent="blue"
                link="/funding"
              />
              <KpiCard
                label="Grants"
                value={funding.type_breakdown?.find(t => t.type === "grant")?.count}
                icon={Search}
                accent="purple"
              />
              <KpiCard
                label="Fellowships"
                value={funding.type_breakdown?.find(t => t.type === "fellowship")?.count}
                icon={Award}
                accent="amber"
              />
            </div>

            <div className="an-dual-panel">
              {/* By type */}
              <SectionCard title="Opportunities by Type" icon={DollarSign} source="Module 4">
                {funding.type_breakdown && funding.type_breakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={funding.type_breakdown} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <YAxis dataKey="type" type="category" width={90} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Opportunities" fill="#10b981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState message="No funding data. Funding opportunities are ingested from NIH/Grants.gov." />
                )}
              </SectionCard>

              {/* By source */}
              <SectionCard title="Opportunities by Source" icon={Globe} source="Module 4">
                {funding.source_breakdown && funding.source_breakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={funding.source_breakdown}
                        dataKey="count"
                        nameKey="source"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={({ source, percent }) => `${source} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {funding.source_breakdown.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState message="No source data available." />
                )}
              </SectionCard>
            </div>

            {/* Upcoming deadlines */}
            <SectionCard title="Upcoming Deadlines" icon={Clock} source="Module 4" link="/funding" linkLabel="All Opportunities">
              {funding.upcoming_deadlines && funding.upcoming_deadlines.length > 0 ? (
                <div className="an-table-wrapper">
                  <table className="an-table">
                    <thead>
                      <tr><th>Title</th><th>Organization</th><th>Type</th><th>Deadline</th><th>Amount</th></tr>
                    </thead>
                    <tbody>
                      {funding.upcoming_deadlines.map((f) => (
                        <tr key={f.id}>
                          <td>{f.title}</td>
                          <td>{f.organization || "—"}</td>
                          <td>{f.funding_type}</td>
                          <td>
                            <span className="an-deadline-chip">
                              {f.deadline ? new Date(f.deadline).toLocaleDateString() : "—"}
                            </span>
                          </td>
                          <td>
                            {f.funding_amount
                              ? `${f.currency} ${Number(f.funding_amount).toLocaleString()}`
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState message="No upcoming deadlines. Funding opportunities have not been ingested yet." />
              )}
            </SectionCard>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            SECTION: INNOVATION (Module 7)
        ══════════════════════════════════════════════════════════════════ */}
        {activeSection === "innovation" && (
          <div className="an-section-content">
            <div className="an-kpi-grid">
              <KpiCard label="Scored Technologies" value={innovation.total_scored_technologies} icon={Award} accent="purple" link="/innovation-score" />
              <KpiCard
                label="Avg Innovation Score"
                value={innovation.avg_innovation_score}
                sub="out of 100"
                icon={Zap}
                accent="amber"
                link="/innovation-score"
              />
              <KpiCard
                label="Research Novelty Avg"
                value={innovation.factor_averages?.research_novelty}
                sub="Factor score"
                icon={Search}
                accent="blue"
              />
              <KpiCard
                label="Market Potential Avg"
                value={innovation.factor_averages?.market_potential}
                sub="Factor score"
                icon={TrendingUp}
                accent="emerald"
              />
            </div>

            <div className="an-dual-panel">
              {/* Factor averages radar */}
              <SectionCard title="Innovation Factor Averages" icon={Award} source="Module 7">
                {innovation.factor_averages && Object.values(innovation.factor_averages).some(v => v !== null) ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart
                      data={[
                        { factor: "Research Novelty", value: innovation.factor_averages.research_novelty || 0 },
                        { factor: "Patent Strength", value: innovation.factor_averages.patent_strength || 0 },
                        { factor: "Tech Maturity", value: innovation.factor_averages.technology_maturity || 0 },
                        { factor: "Market Potential", value: innovation.factor_averages.market_potential || 0 },
                        { factor: "Funding Relevance", value: innovation.factor_averages.funding_relevance || 0 },
                      ]}
                    >
                      <PolarGrid stroke="rgba(255,255,255,0.1)" />
                      <PolarAngleAxis dataKey="factor" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 9 }} />
                      <Radar name="Avg Score" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.35} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState message="Run the Innovation Score engine on technologies to see factor averages." />
                )}
              </SectionCard>

              {/* Lifecycle distribution */}
              <SectionCard title="Technology Lifecycle Distribution" icon={Layers} source="Module 7">
                {innovation.lifecycle_distribution && innovation.lifecycle_distribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={innovation.lifecycle_distribution}
                        dataKey="count"
                        nameKey="lifecycle"
                        cx="50%"
                        cy="50%"
                        outerRadius={95}
                        label={({ lifecycle, percent }) => `${lifecycle} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {innovation.lifecycle_distribution.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState message="No lifecycle data yet." />
                )}
              </SectionCard>
            </div>

            {/* Top scored technologies */}
            <SectionCard title="Top Scored Technologies" icon={Award} source="Module 7" link="/innovation-score" linkLabel="View All Scores">
              {innovation.top_scored_technologies && innovation.top_scored_technologies.length > 0 ? (
                <div className="an-table-wrapper">
                  <table className="an-table">
                    <thead>
                      <tr>
                        <th>Technology</th>
                        <th>Innovation Score</th>
                        <th>Research Novelty</th>
                        <th>Patent Strength</th>
                        <th>Market Potential</th>
                        <th>Lifecycle</th>
                      </tr>
                    </thead>
                    <tbody>
                      {innovation.top_scored_technologies.map((s, i) => (
                        <tr key={i}>
                          <td>
                            <Link to={`/tech-intel/${s.technology_id}`} className="an-table-link">
                              {s.technology_id}
                            </Link>
                          </td>
                          <td>
                            <span className="an-score-chip">{s.innovation_score?.toFixed(1) ?? "—"}</span>
                          </td>
                          <td>{s.research_novelty?.toFixed(1) ?? "—"}</td>
                          <td>{s.patent_strength?.toFixed(1) ?? "—"}</td>
                          <td>{s.market_potential?.toFixed(1) ?? "—"}</td>
                          <td>
                            <span className={`an-lifecycle-chip lifecycle-${(s.lifecycle || "unknown").toLowerCase().replace(" ", "-")}`}>
                              {s.lifecycle || "—"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState message="No innovation scores yet. Use the Innovation Score page to evaluate technologies." />
              )}
            </SectionCard>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            SECTION: TECHNOLOGY (Module 6)
        ══════════════════════════════════════════════════════════════════ */}
        {activeSection === "technology" && (
          <div className="an-section-content">
            <div className="an-kpi-grid">
              <KpiCard label="Total Technologies" value={technology.total_technologies} icon={Cpu} accent="cyan" link="/tech-intel" />
              <KpiCard label="Total Opportunities" value={technology.total_opportunities} icon={Zap} accent="purple" link="/tech-intel" />
              <KpiCard
                label="Emerging Stage"
                value={technology.stage_distribution?.find(s => s.stage === "Emerging")?.count}
                icon={TrendingUp}
                accent="rose"
              />
              <KpiCard
                label="Mature Stage"
                value={technology.stage_distribution?.find(s => s.stage === "Mature")?.count}
                icon={ShieldCheck}
                accent="emerald"
              />
            </div>

            <div className="an-dual-panel">
              {/* Stage distribution */}
              <SectionCard title="Technology Stage Distribution" icon={Layers} source="Module 6" link="/tech-intel">
                {technology.stage_distribution && technology.stage_distribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={technology.stage_distribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="stage" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      {technology.stage_distribution.map((entry, i) => null)}
                      <Bar dataKey="count" name="Technologies" radius={[4, 4, 0, 0]}>
                        {technology.stage_distribution.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState message="No technology data." />
                )}
              </SectionCard>

              {/* Domain breakdown */}
              <SectionCard title="Technology Domains" icon={Globe} source="Module 6">
                {technology.domain_breakdown && technology.domain_breakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={technology.domain_breakdown} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <YAxis dataKey="domain" type="category" width={130} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Technologies" fill="#22d3ee" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState message="No domain data." />
                )}
              </SectionCard>
            </div>

            {/* Research direction */}
            <SectionCard title="Research Direction Trends" icon={TrendingUp} source="Module 6">
              {technology.research_direction_distribution && technology.research_direction_distribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={technology.research_direction_distribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="direction" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Technologies" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState message="No research direction data." />
              )}
            </SectionCard>

            {/* Technologies list */}
            <SectionCard title="Technology Intelligence List" icon={Cpu} source="Module 6" link="/tech-intel" linkLabel="Full Analysis">
              {technology.technologies_list && technology.technologies_list.length > 0 ? (
                <div className="an-table-wrapper">
                  <table className="an-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Domain</th>
                        <th>Stage</th>
                        <th>Maturity Score</th>
                        <th>Research Direction</th>
                        <th>Patent Direction</th>
                      </tr>
                    </thead>
                    <tbody>
                      {technology.technologies_list.map((t, i) => (
                        <tr key={i}>
                          <td>
                            <Link to={`/tech-intel/${t.id}`} className="an-table-link">{t.name}</Link>
                          </td>
                          <td>{t.domain || "—"}</td>
                          <td>
                            <span className={`an-stage-chip stage-${(t.stage || "unknown").toLowerCase()}`}>
                              {t.stage || "—"}
                            </span>
                          </td>
                          <td>{t.score ? t.score.toFixed(1) : "—"}</td>
                          <td>{t.research_direction || "—"}</td>
                          <td>{t.patent_direction || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState message="No technologies in the database yet." />
              )}
            </SectionCard>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            SECTION: COMMERCIALIZATION (Module 8)
        ══════════════════════════════════════════════════════════════════ */}
        {activeSection === "commercialization" && (
          <div className="an-section-content">
            <div className="an-kpi-grid">
              <KpiCard label="Total Recommendations" value={commercialization.total_recommendations} icon={Layers} accent="orange" link="/commercialization" />
              <KpiCard
                label="Avg Readiness Score"
                value={commercialization.avg_readiness_score}
                sub="out of 100"
                icon={Award}
                accent="purple"
              />
              <KpiCard
                label="Productization Avg"
                value={commercialization.pathway_avg_scores?.productization}
                sub="Pathway score"
                icon={Zap}
                accent="cyan"
              />
              <KpiCard
                label="Licensing Avg"
                value={commercialization.pathway_avg_scores?.licensing}
                sub="Pathway score"
                icon={FileKey}
                accent="emerald"
              />
            </div>

            <div className="an-dual-panel">
              {/* Pathway avg scores */}
              <SectionCard title="Commercialization Pathway Scores" icon={Layers} source="Module 8" link="/commercialization">
                {commercialization.pathway_avg_scores && Object.values(commercialization.pathway_avg_scores).some(v => v !== null) ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                      data={[
                        { pathway: "Productization", score: commercialization.pathway_avg_scores.productization || 0 },
                        { pathway: "Licensing", score: commercialization.pathway_avg_scores.licensing || 0 },
                        { pathway: "Startup", score: commercialization.pathway_avg_scores.startup || 0 },
                        { pathway: "Industry Partnership", score: commercialization.pathway_avg_scores.industry_partnership || 0 },
                      ]}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="pathway" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="score" name="Avg Score" radius={[4, 4, 0, 0]}>
                        {["#6366f1", "#22d3ee", "#f59e0b", "#10b981"].map((color, i) => (
                          <Cell key={i} fill={color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState message="No pathway scores. Run the Commercialization engine on technologies." />
                )}
              </SectionCard>

              {/* Lifecycle distribution */}
              <SectionCard title="Commercialization Lifecycle" icon={TrendingUp} source="Module 8">
                {commercialization.lifecycle_distribution && commercialization.lifecycle_distribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={commercialization.lifecycle_distribution}
                        dataKey="count"
                        nameKey="lifecycle"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={({ lifecycle, percent }) => `${lifecycle} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {commercialization.lifecycle_distribution.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState message="No lifecycle data." />
                )}
              </SectionCard>
            </div>

            {/* Top recommendations */}
            <SectionCard title="Top Commercialization Recommendations" icon={TrendingUp} source="Module 8" link="/commercialization" linkLabel="Full Analysis">
              {commercialization.top_recommendations && commercialization.top_recommendations.length > 0 ? (
                <div className="an-table-wrapper">
                  <table className="an-table">
                    <thead>
                      <tr>
                        <th>Technology</th>
                        <th>Readiness Score</th>
                        <th>Innovation Score</th>
                        <th>Lifecycle</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {commercialization.top_recommendations.map((r, i) => (
                        <tr key={i}>
                          <td>
                            <Link to={`/tech-intel/${r.technology_id}`} className="an-table-link">
                              {r.technology_id}
                            </Link>
                          </td>
                          <td>
                            <span className="an-score-chip">{r.commercialization_readiness?.toFixed(1) ?? "—"}</span>
                          </td>
                          <td>{r.innovation_score?.toFixed(1) ?? "—"}</td>
                          <td>
                            <span className={`an-lifecycle-chip lifecycle-${(r.lifecycle || "unknown").toLowerCase().replace(" ", "-")}`}>
                              {r.lifecycle || "—"}
                            </span>
                          </td>
                          <td>
                            <span className="an-status-chip status-complete">{r.status}</span>
                          </td>
                          <td>{r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}</td>
                          <td>
                            <Link to="/commercialization" className="an-action-link">
                              View <ChevronRight size={12} />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState message="No recommendations yet. Use the Commercialization module to analyse technologies." />
              )}
            </SectionCard>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            SECTION: ADMIN
        ══════════════════════════════════════════════════════════════════ */}
        {activeSection === "admin" && isAdmin && (
          <div className="an-section-content">
            <div className="an-kpi-grid">
              <KpiCard label="Total Users" value={userData?.total_users ?? summary.total_users} icon={Users} accent="blue" />
              <KpiCard label="Active Users" value={userData?.active_users ?? summary.active_users} icon={ShieldCheck} accent="emerald" />
              <KpiCard label="Inactive Users" value={userData?.inactive_users} icon={Clock} accent="rose" />
              <KpiCard label="Total Profiles" value={summary.total_profiles} icon={BookOpen} accent="purple" />
              <KpiCard label="Research Papers (API)" value={research.research_papers_count} sub="OpenAlex" icon={Search} accent="cyan" />
              <KpiCard label="Funding Opportunities" value={summary.total_funding_opportunities} icon={DollarSign} accent="emerald" link="/funding" />
              <KpiCard label="Technologies" value={summary.total_technologies} icon={Cpu} accent="cyan" link="/tech-intel" />
              <KpiCard label="Innovation Scores" value={summary.total_innovation_scores} icon={Award} accent="amber" link="/innovation-score" />
            </div>

            <div className="an-dual-panel">
              {/* Role distribution */}
              <SectionCard title="Users by Role" icon={Users} source="Module 1">
                {userData?.role_distribution && userData.role_distribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={userData.role_distribution}
                        dataKey="count"
                        nameKey="role"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={({ role, percent }) => `${role} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {userData.role_distribution.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState message="No user role data." />
                )}
              </SectionCard>

              {/* Registrations by month */}
              <SectionCard title="User Registrations Over Time" icon={TrendingUp} source="Module 1">
                {userData?.registrations_by_month && userData.registrations_by_month.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={userData.registrations_by_month}>
                      <defs>
                        <linearGradient id="regGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                      <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="count" name="Registrations" stroke="#6366f1" fill="url(#regGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState message="Not enough registration data to chart." />
                )}
              </SectionCard>
            </div>

            {/* Recent users table */}
            <SectionCard title="Recent Users" icon={Users} source="Module 1">
              {userData?.recent_users && userData.recent_users.length > 0 ? (
                <div className="an-table-wrapper">
                  <table className="an-table">
                    <thead>
                      <tr><th>Name</th><th>Email</th><th>Role</th><th>Organization</th><th>Active</th><th>Joined</th></tr>
                    </thead>
                    <tbody>
                      {userData.recent_users.map((u) => (
                        <tr key={u.id}>
                          <td>{u.name}</td>
                          <td>{u.email}</td>
                          <td>
                            <span className={`an-role-chip role-${(u.role || "").toLowerCase().replace(" ", "-")}`}>
                              {u.role}
                            </span>
                          </td>
                          <td>{u.organization || "—"}</td>
                          <td>
                            <span className={`an-bool-chip ${u.is_active ? "active" : "inactive"}`}>
                              {u.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td>{u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState message="No user data available." />
              )}
            </SectionCard>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
