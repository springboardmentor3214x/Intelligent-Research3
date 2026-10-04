import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import RadarChart from "../../components/common/RadarChart";
import {
  Award,
  ShieldCheck,
  Zap,
  Sparkles,
  TrendingUp,
  DollarSign,
  RefreshCw,
  Info,
  ChevronRight,
  ArrowRight,
  X,
  FileCheck2,
  Database,
  Activity,
  Layers,
  HelpCircle,
  Cpu,
} from "lucide-react";

import { fetchTechnologies } from "../../services/technologyService";
import {
  fetchInnovationScore,
  recalculateInnovationScore,
  fetchInnovationScoreHistory,
} from "../../services/innovationScoreService";
import "./InnovationScorePage.css";

const FACTOR_META = [
  {
    key: "research_novelty",
    label: "Research Novelty",
    weight: 30,
    weightPct: "30%",
    icon: Sparkles,
    color: "#8b5cf6",
    source: "Module 3",
    description: "Evaluates scientific differentiation, topic uniqueness, and research gap coverage.",
  },
  {
    key: "patent_strength",
    label: "Patent Strength",
    weight: 20,
    weightPct: "20%",
    icon: ShieldCheck,
    color: "#3b82f6",
    source: "Module 5",
    description: "Evaluates patent filings, multi-jurisdiction family breadth, citations, and coverage.",
  },
  {
    key: "technology_maturity",
    label: "Technology Maturity",
    weight: 15,
    weightPct: "15%",
    icon: Zap,
    color: "#10b981",
    source: "Module 6",
    description: "Derived from Module 6 lifecycle classification (Emerging/Developing/Mature/Declining).",
  },
  {
    key: "market_potential",
    label: "Market Potential",
    weight: 20,
    weightPct: "20%",
    icon: TrendingUp,
    color: "#f59e0b",
    source: "Module 6 / Market Engine",
    description: "Measures application breadth, multi-sector use cases, and organizational demand signals.",
  },
  {
    key: "funding_relevance",
    label: "Funding Relevance",
    weight: 15,
    weightPct: "15%",
    icon: DollarSign,
    color: "#ec4899",
    source: "Module 4",
    description: "Measures alignment with active, relevant non-dilutive funding programs and grants.",
  },
];

export default function InnovationScorePage() {
  const [searchParams] = useSearchParams();
  const [technologies, setTechnologies] = useState([]);
  const [selectedTechId, setSelectedTechId] = useState("");

  const [scoreData, setScoreData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [loadingTechnologies, setLoadingTechnologies] = useState(true);
  const [loadingScore, setLoadingScore] = useState(false);
  const [error, setError] = useState("");
  const [showMethodologyModal, setShowMethodologyModal] = useState(false);

  useEffect(() => {
    loadTechnologies();
  }, []);

  // If navigated from Module 6 with ?tech=<id>, pre-select that technology
  useEffect(() => {
    const techFromUrl = searchParams.get('tech');
    if (techFromUrl && technologies.length > 0) {
      const match = technologies.find(
        (t) => String(t.technology_id || t.technologyId || t.id) === String(techFromUrl)
      );
      if (match) {
        const id = match.technology_id || match.technologyId || match.id;
        setSelectedTechId(String(id));
      } else {
        // Try direct set (might be ID not yet in list)
        setSelectedTechId(String(techFromUrl));
      }
    }
  }, [searchParams, technologies]);

  async function loadTechnologies() {
    try {
      setLoadingTechnologies(true);
      setError("");

      const response = await fetchTechnologies();
      const list = Array.isArray(response)
        ? response
        : response?.technologies || response?.items || [];

      setTechnologies(list);

      if (list.length > 0) {
        const firstId = list[0].technology_id || list[0].technologyId || list[0].id;
        if (firstId) {
          setSelectedTechId(String(firstId));
        }
      }
    } catch (err) {
      setError(err.message || "Failed to load technologies.");
    } finally {
      setLoadingTechnologies(false);
    }
  }

  useEffect(() => {
    if (!selectedTechId) return;
    loadScore(selectedTechId);
  }, [selectedTechId]);

  async function loadScore(technologyId, forceCalculate = false) {
    try {
      setLoadingScore(true);
      setError("");

      let result;
      if (forceCalculate) {
        result = await recalculateInnovationScore(technologyId);
      } else {
        result = await fetchInnovationScore(technologyId);
      }
      setScoreData(result);

      // Fetch historical calculations
      try {
        const hist = await fetchInnovationScoreHistory(technologyId);
        setHistoryData(hist?.history || []);
      } catch (_histErr) {
        setHistoryData([]);
      }
    } catch (err) {
      setScoreData(null);
      setError(err.message || "Innovation score could not be loaded or calculated for this technology.");
    } finally {
      setLoadingScore(false);
    }
  }

  const selectedTechnology = useMemo(() => {
    return technologies.find(
      (tech) =>
        String(tech.technology_id || tech.technologyId || tech.id) === String(selectedTechId)
    );
  }, [technologies, selectedTechId]);

  const overallScore = scoreData?.overall_score ?? scoreData?.innovation_score ?? null;
  const dataCompleteness = scoreData?.data_completeness ?? 100.0;
  const lifecycle = scoreData?.lifecycle || selectedTechnology?.maturity?.stage || "Developing";
  const status = scoreData?.status || "complete";
  const factors = scoreData?.factors || {};
  const evidenceList = scoreData?.evidence || [];
  const explanation = scoreData?.explanation || "";
  const missingFactors = scoreData?.missing_factors || [];

  // Radial stroke offset calculation
  const circleRadius = 70;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = overallScore !== null
    ? circumference - (overallScore / 100) * circumference
    : circumference;

  // Radar chart data array
  const radarChartData = useMemo(() => {
    return FACTOR_META.map((meta) => {
      const factorObj = factors[meta.key];
      const val = factorObj?.score ?? scoreData?.[meta.key] ?? null;
      return {
        label: meta.label,
        value: val,
      };
    });
  }, [factors, scoreData]);

  return (
    <DashboardLayout
      pageTitle="Innovation Scoring Engine"
      breadcrumbs={["Research Intelligence", "Module 7", "Innovation Score"]}
    >
      <div className="innovation-dashboard">
        {/* Cross-Module Navigation Bar */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <Link
            to="/tech-intel"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              fontSize: '0.82rem', color: '#2563EB', textDecoration: 'none',
              background: '#EFF6FF', border: '1px solid #BFDBFE',
              borderRadius: '6px', padding: '5px 12px', fontWeight: 600,
            }}
          >
            <Cpu size={13} /> ← Module 6: Technology Intelligence
          </Link>
          {selectedTechId && (
            <Link
              to={`/commercialization?tech=${encodeURIComponent(selectedTechId)}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                fontSize: '0.82rem', color: '#059669', textDecoration: 'none',
                background: '#ECFDF5', border: '1px solid #A7F3D0',
                borderRadius: '6px', padding: '5px 12px', fontWeight: 600,
              }}
            >
              Module 8: Commercialization →
            </Link>
          )}
        </div>
        {/* Header & Controls */}
        <div className="innovation-header">
          <div className="innovation-header-info">
            <h2>
              <Award className="stat-icon-blue" size={26} />
              Module 7 – Innovation Scoring Engine
            </h2>
            <p className="innovation-header-desc">
              Evidence-based, explainable innovation evaluation calculated mathematically from:
            </p>
            <div className="weights-subtitle-pills">
              <span className="weight-subtitle-pill">Research Novelty — <strong>30%</strong></span>
              <span className="weight-subtitle-pill">Patent Strength — <strong>20%</strong></span>
              <span className="weight-subtitle-pill">Technology Maturity — <strong>15%</strong></span>
              <span className="weight-subtitle-pill">Market Potential — <strong>20%</strong></span>
              <span className="weight-subtitle-pill">Funding Relevance — <strong>15%</strong></span>
            </div>
          </div>

          <div className="tech-selector-box">
            {loadingTechnologies ? (
              <span style={{ color: "#94a3b8" }}>Loading technologies...</span>
            ) : (
              <select
                value={selectedTechId}
                onChange={(e) => setSelectedTechId(e.target.value)}
                className="tech-select-dropdown"
              >
                {technologies.map((t) => {
                  const id = t.technology_id || t.technologyId || t.id;
                  const name = t.name || t.technology_name || id;
                  return (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  );
                })}
              </select>
            )}

            <button
              type="button"
              className="btn-primary-action"
              disabled={loadingScore || !selectedTechId}
              onClick={() => loadScore(selectedTechId, true)}
            >
              <RefreshCw size={15} className={loadingScore ? "animate-spin" : ""} />
              {loadingScore ? "Calculating Score..." : "Recalculate Score"}
            </button>

            <button
              type="button"
              className="btn-secondary-action"
              onClick={() => setShowMethodologyModal(true)}
            >
              <HelpCircle size={15} />
              Methodology
            </button>
          </div>
        </div>

        {error && (
          <div className="insight-narrative-card" style={{ borderColor: "#ef4444" }}>
            <h4 style={{ color: "#f87171" }}>
              <Info size={16} /> Scoring Evaluation Notice
            </h4>
            <p className="insight-narrative-text">{error}</p>
          </div>
        )}

        {loadingScore ? (
          <div className="insight-narrative-card" style={{ textAlign: "center", padding: "40px" }}>
            <RefreshCw size={28} className="animate-spin" style={{ color: "#3b82f6", margin: "0 auto 12px" }} />
            <p style={{ color: "#cbd5e1", fontSize: "1.1rem" }}>
              Calculating multi-factor innovation indicators from Modules 3, 4, 5, and 6...
            </p>
          </div>
        ) : (
          <>
            {/* Master Score Hero Display */}
            <div className="master-score-hero">
              <div className="radial-score-display">
                <div className="score-circle-wrapper">
                  <svg className="score-circle-svg" width="170" height="170">
                    <defs>
                      <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#10b981" />
                      </linearGradient>
                    </defs>
                    <circle
                      className="score-circle-bg"
                      cx="85"
                      cy="85"
                      r={circleRadius}
                    />
                    <circle
                      className="score-circle-progress"
                      cx="85"
                      cy="85"
                      r={circleRadius}
                      stroke="url(#scoreGrad)"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                    />
                  </svg>
                  <div className="score-circle-center">
                    <div className="score-number-big">
                      {overallScore !== null ? Number(overallScore).toFixed(1) : "N/A"}
                    </div>
                    <div className="score-number-denom">OUT OF 100</div>
                  </div>
                </div>

                <div className="score-label-title">Composite Innovation Score</div>

                <div className="score-meta-badges">
                  <div className="badge-pill badge-coverage">
                    <ShieldCheck size={14} />
                    Evidence Coverage: {dataCompleteness}%
                  </div>
                  <div className="badge-pill badge-lifecycle">
                    <Activity size={14} />
                    Lifecycle: {lifecycle}
                  </div>
                  <div className="badge-pill badge-status">
                    <FileCheck2 size={14} />
                    Status: {status.replaceAll("_", " ")}
                  </div>
                </div>
              </div>

              <div className="hero-right-insights">
                <div className="insight-narrative-card">
                  <h4>
                    <Sparkles size={16} />
                    Executive Score Interpretation
                  </h4>
                  <p className="insight-narrative-text">
                    {explanation ||
                      `The available evidence for ${selectedTechnology?.name || selectedTechId} indicates strong innovation potential across research novelty and market opportunities, with supporting patent protection.`}
                  </p>
                </div>

                <div className="quick-formula-strip">
                  <span style={{ fontWeight: 600, color: "#172033" }}>Official Weights:</span>
                  <span className="formula-tag">Novelty 30%</span>
                  <span>+</span>
                  <span className="formula-tag">Patent 20%</span>
                  <span>+</span>
                  <span className="formula-tag">Maturity 15%</span>
                  <span>+</span>
                  <span className="formula-tag">Market 20%</span>
                  <span>+</span>
                  <span className="formula-tag">Funding 15%</span>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <Link
                    to="/commercialization"
                    className="btn-primary-action"
                    style={{ textDecoration: "none" }}
                  >
                    View Commercialization Pathways (Module 8)
                    <ArrowRight size={15} />
                  </Link>
                </div>
              </div>
            </div>

            {/* Five Factor Cards Grid */}
            <div className="factor-cards-grid">
              {FACTOR_META.map((meta) => {
                const Icon = meta.icon;
                const factorObj = factors[meta.key];
                const score = factorObj?.score ?? scoreData?.[meta.key] ?? null;
                const contribution = factorObj?.contribution ?? (score !== null ? (score * (meta.weight / 100)).toFixed(1) : "N/A");

                return (
                  <div key={meta.key} className="factor-card">
                    <div>
                      <div className="factor-card-top">
                        <span className="factor-title" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Icon size={16} style={{ color: meta.color }} />
                          {meta.label}
                        </span>
                        <span className="factor-weight-tag">Weight {meta.weightPct}</span>
                      </div>

                      <div className="factor-score-row">
                        <span className="factor-score-num">
                          {score !== null ? Number(score).toFixed(1) : "N/A"}
                        </span>
                        <span className="factor-score-max">/ 100</span>
                      </div>

                      <div className="factor-contribution-bar">
                        <div
                          className="factor-contribution-fill"
                          style={{
                            width: `${score !== null ? Math.min(100, Math.max(0, score)) : 0}%`,
                            background: meta.color,
                          }}
                        />
                      </div>

                      <p style={{ fontSize: "0.8rem", color: "#94a3b8", lineHeight: 1.4 }}>
                        {meta.description}
                      </p>
                    </div>

                    <div className="factor-card-footer">
                      <span>Contribution: <strong>+{contribution} pts</strong></span>
                      <span className="factor-source-badge">{meta.source}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Visualizations Grid: Radar & Contribution Breakdown */}
            <div className="visualizations-grid">
              {/* Radar Chart */}
              <div className="viz-panel">
                <div className="viz-panel-header">
                  <h3 className="viz-panel-title">
                    <Activity size={18} style={{ color: "#38bdf8" }} />
                    Five-Factor Innovation Radar
                  </h3>
                  <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Scale: 0–100 Normalized</span>
                </div>
                <div className="radar-container">
                  <RadarChart data={radarChartData} size={300} />
                </div>
              </div>

              {/* Weighted Contribution Bar Chart */}
              <div className="viz-panel">
                <div className="viz-panel-header">
                  <h3 className="viz-panel-title">
                    <Layers size={18} style={{ color: "#818cf8" }} />
                    Weighted Score Contribution
                  </h3>
                  <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                    Total: {overallScore !== null ? Number(overallScore).toFixed(1) : 0} / 100
                  </span>
                </div>

                <div className="contribution-bars-list">
                  {FACTOR_META.map((meta) => {
                    const factorObj = factors[meta.key];
                    const score = factorObj?.score ?? scoreData?.[meta.key] ?? 0;
                    const contrib = factorObj?.contribution ?? Number(score * (meta.weight / 100)).toFixed(2);
                    const pctOfMaxContrib = (contrib / meta.weight) * 100;

                    return (
                      <div key={meta.key} className="contrib-bar-item">
                        <div className="contrib-bar-header">
                          <span className="contrib-bar-label">{meta.label}</span>
                          <span className="contrib-bar-points">
                            +{contrib} / {meta.weight} max pts ({score.toFixed(1)}/100)
                          </span>
                        </div>
                        <div className="contrib-track">
                          <div
                            className="contrib-fill"
                            style={{
                              width: `${Math.min(100, Math.max(0, pctOfMaxContrib))}%`,
                              background: meta.color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Score History Trend (if available) */}
            {historyData.length > 1 && (
              <div className="viz-panel">
                <div className="viz-panel-header">
                  <h3 className="viz-panel-title">
                    <TrendingUp size={18} style={{ color: "#34d399" }} />
                    Innovation Score Evolution Over Time
                  </h3>
                  <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                    {historyData.length} recorded calculations
                  </span>
                </div>
                <div style={{ display: "flex", gap: "16px", overflowX: "auto", padding: "10px 0" }}>
                  {historyData.map((h, i) => (
                    <div
                      key={h.id || i}
                      style={{
                        background: "#F8FAFC",
                        border: "1px solid #E2E8F0",
                        borderRadius: "10px",
                        padding: "12px 18px",
                        minWidth: "160px",
                        textAlign: "center",
                      }}
                    >
                      <div style={{ fontSize: "0.75rem", color: "#64748B", marginBottom: "4px" }}>
                        {h.created_at ? new Date(h.created_at).toLocaleDateString() : `Step ${i + 1}`}
                      </div>
                      <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#172033" }}>
                        {h.innovation_score ? Number(h.innovation_score).toFixed(1) : "N/A"}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "#2563EB", marginTop: "4px", fontWeight: 600 }}>
                        Lifecycle: {h.lifecycle}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Evidence Traceability Section */}
            <div className="evidence-section">
              <div className="evidence-section-header">
                <h3 className="viz-panel-title">
                  <Database size={18} style={{ color: "#60a5fa" }} />
                  Evidence Traceability by Source Module
                </h3>
                <p style={{ color: "#94a3b8", fontSize: "0.85rem", marginTop: "4px" }}>
                  Every indicator is deterministically calculated from empirical data supplied by Modules 3, 4, 5, and 6.
                </p>
              </div>

              <div className="evidence-grid">
                {evidenceList.map((ev, idx) => (
                  <div key={idx} className="evidence-module-card">
                    <div className="evidence-card-title">
                      <span>{ev.factor} ({ev.weight})</span>
                      <span style={{ color: "#38bdf8", fontSize: "0.8rem" }}>{ev.source}</span>
                    </div>
                    <ul className="evidence-bullet-list">
                      {(ev.items || []).map((item, itemIdx) => (
                        <li key={itemIdx} className="evidence-bullet-item">
                          <span className="evidence-dot" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Methodology Modal */}
        {showMethodologyModal && (
          <div className="modal-backdrop" onClick={() => setShowMethodologyModal(false)}>
            <div className="modal-dialog-box" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header-row">
                <h3 className="modal-title">
                  <Award size={20} style={{ color: "#3b82f6", marginRight: "8px", verticalAlign: "middle" }} />
                  How is the Innovation Score Calculated?
                </h3>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setShowMethodologyModal(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ color: "#475569", fontSize: "0.9rem", lineHeight: 1.6, display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <h4 style={{ color: "#172033", marginBottom: "6px" }}>1. Official Mathematical Formula</h4>
                  <p>
                    All 5 primary indicators are first normalized to a 0–100 scale using min-max and bounded percentile scaling.
                    The final Innovation Score is calculated using exact project weights:
                  </p>
                  <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", color: "#172033", padding: "12px", borderRadius: "8px", fontFamily: "monospace", margin: "8px 0" }}>
                    Innovation Score =<br />
                    &nbsp;&nbsp;Research Novelty × 0.30<br />
                    &nbsp;&nbsp;+ Patent Strength × 0.20<br />
                    &nbsp;&nbsp;+ Technology Maturity × 0.15<br />
                    &nbsp;&nbsp;+ Market Potential × 0.20<br />
                    &nbsp;&nbsp;+ Funding Relevance × 0.15
                  </div>
                </div>

                <div>
                  <h4 style={{ color: "#172033", marginBottom: "6px" }}>2. Data Ingestion & Input Pipeline</h4>
                  <ul style={{ paddingLeft: "20px" }}>
                    <li><strong>Module 3 (Research Intelligence):</strong> Semantic distinctiveness, emerging topic strength, research gaps.</li>
                    <li><strong>Module 4 (Funding Intelligence):</strong> Active relevant grant counts, eligibility fit, and program activity.</li>
                    <li><strong>Module 5 (Patent Landscape):</strong> Filings volume, citation strength, family breadth, and technology coverage.</li>
                    <li><strong>Module 6 (Technology Intelligence):</strong> Lifecycle classification (Emerging/Developing/Mature/Declining) and maturity index.</li>
                  </ul>
                </div>

                <div>
                  <h4 style={{ color: "#172033", marginBottom: "6px" }}>3. Missing Data Policy</h4>
                  <p>
                    Missing factors are never treated as zero. If at least 3 factors are available, remaining factors are calculated
                    using adjusted weights normalized to the available weight sum. If fewer than 3 factors exist, the score is marked
                    as <em>Insufficient Data</em>.
                  </p>
                </div>

                <div>
                  <h4 style={{ color: "#172033", marginBottom: "6px" }}>4. Downstream Integration (Module 8)</h4>
                  <p>
                    The composite Innovation Score, along with the 5 individual factor dimensions and lifecycle classification,
                    feeds directly into <strong>Module 8 – Commercialization Recommendation Engine</strong> to evaluate Productization,
                    Licensing, Startup, and Industry Partnership pathways.
                  </p>
                </div>

                <div style={{ marginTop: "12px", textAlign: "right" }}>
                  <button
                    type="button"
                    className="btn-primary-action"
                    onClick={() => setShowMethodologyModal(false)}
                  >
                    Close Methodology
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}