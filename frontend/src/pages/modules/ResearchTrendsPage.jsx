import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import researchService from "../../services/researchService";
import {
  TrendingUp,
  Award,
  Zap,
  Flame,
  BarChart3,
  Tag,
  Layers,
  RefreshCw,
  AlertCircle,
  Sparkles,
  ArrowUpRight
} from "lucide-react";

export default function ResearchTrendsPage() {
  const [trendsData, setTrendsData] = useState(null);
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTrends = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await researchService.getTrends(domain);
      setTrendsData(data);
    } catch (err) {
      console.error("Failed to load research trends:", err);
      setError(err.message || "Failed to load research trends");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrends();
  }, [domain]);

  const trendTopics = trendsData?.trend_topics || [];
  const papersByYear = trendsData?.papers_by_year || [];
  const topAreas = trendsData?.top_research_areas || [];
  const topKeywords = trendsData?.top_keywords || [];
  const emergingTopics = trendsData?.emerging_topics || [];
  const totalAnalyzed = trendsData?.total_analyzed || 0;

  const maxYearCount = Math.max(...papersByYear.map((y) => y.count), 1);
  const maxAreaCount = Math.max(...topAreas.map((a) => a.count), 1);

  return (
    <DashboardLayout
      pageTitle="Research Trend Intelligence"
      breadcrumbs={["Platform", "Module 4", "Research Trend Intelligence"]}
    >
      <div className="tab-pane-content">
        <div className="tab-pane-header">
          <div>
            <h3 className="tab-section-title">Research Trend Intelligence</h3>
            <p className="tab-section-desc">
              Publication trend analysis, emerging topic detection, research hotspots, domain monitoring, and citation analytics.
            </p>
          </div>

          <div className="filter-select-group">
            <span className="filter-label">Domain Scope:</span>
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="filter-select"
            >
              <option value="">All Research Domains</option>
              <option value="Artificial Intelligence">Artificial Intelligence</option>
              <option value="Machine Learning">Machine Learning</option>
              <option value="Deep Learning">Deep Learning</option>
              <option value="Natural Language Processing">Natural Language Processing</option>
              <option value="Computer Vision">Computer Vision</option>
              <option value="Biotechnology">Biotechnology</option>
              <option value="Cybersecurity">Cybersecurity</option>
            </select>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="overview-stats-grid">
          <div className="overview-stat-card">
            <div className="stat-card-header">
              <span className="stat-label">Indexed Trend Clusters</span>
              <TrendingUp size={18} className="stat-icon-purple" />
            </div>
            <div className="stat-val">{trendTopics.length} Topics</div>
            <span className="stat-nav-hint">{domain || "Global multidisciplinary"} domain</span>
          </div>

          <div className="overview-stat-card">
            <div className="stat-card-header">
              <span className="stat-label">Corpus Papers Analyzed</span>
              <BarChart3 size={18} className="stat-icon-blue" />
            </div>
            <div className="stat-val">{totalAnalyzed.toLocaleString()}</div>
            <span className="stat-nav-hint">Database research corpus</span>
          </div>

          <div className="overview-stat-card">
            <div className="stat-card-header">
              <span className="stat-label">Emerging Topic Vectors</span>
              <Flame size={18} className="stat-icon-amber" />
            </div>
            <div className="stat-val">{emergingTopics.length} Clusters</div>
            <span className="stat-nav-hint">High annual growth rate</span>
          </div>
        </div>

        {loading ? (
          <div className="form-card-panel" style={{ textAlign: "center", padding: "48px" }}>
            <RefreshCw size={28} className="animate-spin" style={{ color: "#2563eb", margin: "0 auto 12px" }} />
            <p style={{ margin: 0, color: "#64748b" }}>Analyzing citation trajectories and trend velocity...</p>
          </div>
        ) : error ? (
          <div className="form-card-panel" style={{ textAlign: "center", padding: "36px", borderColor: "#fecaca" }}>
            <AlertCircle size={28} style={{ color: "#ef4444", margin: "0 auto 8px" }} />
            <p style={{ color: "#b91c1c", fontWeight: 600, margin: "0 0 8px" }}>{error}</p>
            <button type="button" onClick={fetchTrends} className="btn-action-primary">
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Trend Topics Stream */}
            <div className="publications-stream">
              <h4 style={{ margin: "10px 0 4px", fontSize: "1rem", fontWeight: 700, color: "#0f172a" }}>
                Velocity Forecast & High-Growth Research Topics
              </h4>

              {trendTopics.map((t, idx) => (
                <div key={idx} className="publication-entry-card">
                  <div className="pub-card-header">
                    <div className="pub-card-main-info">
                      <div className="pub-badge-row">
                        <span className="badge-pub-type type-conference">
                          <Flame size={12} /> {t.status || "Active Cluster"}
                        </span>
                        <span className="pub-date-text" style={{ color: "#16a34a", fontWeight: "700" }}>
                          {t.velocity || "+110% YoY"} Growth
                        </span>
                        <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
                          Momentum: <strong>{t.citation_momentum || t.citationMomentum || "High"}</strong>
                        </span>
                      </div>

                      <h4 className="pub-entry-title">{t.topic}</h4>
                      <p className="pub-entry-authors">
                        <strong>Leading Research Centers:</strong>{" "}
                        {t.leading_institutions || t.leadingInstitutions || "Global Academic Institutions"}
                      </p>
                    </div>

                    <div className="citation-count-badge">
                      <span className="cite-num">{t.relevance || 92}%</span>
                      <small className="cite-text">Relevance</small>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Visual Intelligence: Papers by Year & Top Research Areas */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px", marginTop: "14px" }}>
              {/* Publication Output Timeline */}
              <div className="form-card-panel">
                <h4 className="form-card-title" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <BarChart3 size={16} style={{ color: "#2563eb" }} />
                  Publication Volume Timeline
                </h4>
                {papersByYear.length === 0 ? (
                  <p style={{ color: "#64748b", fontSize: "0.85rem" }}>No timeline data available.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {papersByYear.map((item) => {
                      const pct = Math.round((item.count / maxYearCount) * 100);
                      return (
                        <div key={item.year} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ width: "45px", fontSize: "0.8rem", fontWeight: 600, color: "#334155" }}>
                            {item.year}
                          </span>
                          <div style={{ flex: 1, height: "20px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                            <div
                              style={{
                                width: `${Math.max(pct, 5)}%`,
                                height: "100%",
                                background: "linear-gradient(90deg, #2563eb, #3b82f6)",
                                borderRadius: "4px",
                                transition: "width 0.4s ease",
                              }}
                            />
                          </div>
                          <span style={{ width: "40px", textAlign: "right", fontSize: "0.8rem", fontWeight: 700, color: "#0f172a" }}>
                            {item.count}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Top Research Areas */}
              <div className="form-card-panel">
                <h4 className="form-card-title" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Layers size={16} style={{ color: "#059669" }} />
                  Top Domain Concentrations
                </h4>
                {topAreas.length === 0 ? (
                  <p style={{ color: "#64748b", fontSize: "0.85rem" }}>No domain data available.</p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {topAreas.slice(0, 7).map((item) => {
                      const pct = Math.round((item.count / maxAreaCount) * 100);
                      return (
                        <div key={item.area} style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                            <span style={{ fontWeight: 600, color: "#334155" }}>{item.area}</span>
                            <span style={{ fontWeight: 700, color: "#0f172a" }}>{item.count} papers</span>
                          </div>
                          <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                            <div
                              style={{
                                width: `${Math.max(pct, 4)}%`,
                                height: "100%",
                                background: "linear-gradient(90deg, #059669, #10b981)",
                                borderRadius: "4px",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Keyword Entity Cloud */}
            {topKeywords.length > 0 && (
              <div className="form-card-panel" style={{ marginTop: "14px" }}>
                <h4 className="form-card-title" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Tag size={16} style={{ color: "#7c3aed" }} />
                  High-Frequency Technical Keywords
                </h4>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {topKeywords.map((kw) => (
                    <span
                      key={kw.keyword}
                      style={{
                        fontSize: "0.8rem",
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        color: "#334155",
                        padding: "5px 12px",
                        borderRadius: "20px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <span>{kw.keyword}</span>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          background: "#e0e7ff",
                          color: "#3730a3",
                          padding: "1px 6px",
                          borderRadius: "10px",
                          fontWeight: 700,
                        }}
                      >
                        {kw.count}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}