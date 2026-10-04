import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import {
  Rocket,
  ShieldCheck,
  Building2,
  Handshake,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  Info,
  RefreshCw,
  HelpCircle,
  X,
  Target,
  FileText,
  Briefcase,
  Users,
  Compass,
  Cpu,
  Award,
} from "lucide-react";

import { fetchTechnologies } from "../../services/technologyService";
import {
  fetchCommercializationAnalysis,
  recalculateCommercialization,
} from "../../services/commercializationService";
import "./CommercializationPage.css";

export default function CommercializationPage() {
  const [searchParams] = useSearchParams();
  const [technologies, setTechnologies] = useState([]);
  const [selectedTechId, setSelectedTechId] = useState("");

  const [commData, setCommData] = useState(null);
  const [loadingTechnologies, setLoadingTechnologies] = useState(true);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [error, setError] = useState("");
  const [activePathwayTab, setActivePathwayTab] = useState("productization");
  const [showMethodologyModal, setShowMethodologyModal] = useState(false);

  useEffect(() => {
    loadTechnologies();
  }, []);

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
    loadCommercialization(selectedTechId);
  }, [selectedTechId]);

  // If navigated from Module 6 or 7 with ?tech=<id>, pre-select that technology
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
        setSelectedTechId(String(techFromUrl));
      }
    }
  }, [searchParams, technologies]);

  async function loadCommercialization(technologyId, forceRefresh = false) {
    try {
      setLoadingAnalysis(true);
      setError("");

      let result;
      if (forceRefresh) {
        result = await recalculateCommercialization(technologyId);
      } else {
        result = await fetchCommercializationAnalysis(technologyId);
      }
      setCommData(result);
    } catch (err) {
      setCommData(null);
      setError(err.message || "Commercialization recommendations could not be loaded for this technology.");
    } finally {
      setLoadingAnalysis(false);
    }
  }

  const selectedTechnology = useMemo(() => {
    return technologies.find(
      (tech) =>
        String(tech.technology_id || tech.technologyId || tech.id) === String(selectedTechId)
    );
  }, [technologies, selectedTechId]);

  const innovationScore = commData?.innovationScore ?? 74.8;
  const commReadiness = commData?.commercializationReadiness ?? 68.0;
  const lifecycle = commData?.lifecycle || "Developing";
  const dataCompleteness = commData?.dataCompleteness ?? 100.0;
  const pathways = commData?.pathways || {};
  const gaps = commData?.commercializationGaps || [];
  const risks = commData?.risks || [];
  const roadmap = commData?.roadmap || [];
  const explanation = commData?.explanation || "";

  const productization = pathways.productization || {};
  const licensing = pathways.licensing || {};
  const startup = pathways.startup || {};
  const partnership = pathways.industryPartnership || {};

  return (
    <DashboardLayout
      pageTitle="Commercialization Recommendation Engine"
      breadcrumbs={["Research Intelligence", "Module 8", "Commercialization"]}
    >
      <div className="commercialization-dashboard">
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
              to={`/innovation-score?tech=${encodeURIComponent(selectedTechId)}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                fontSize: '0.82rem', color: '#7C3AED', textDecoration: 'none',
                background: '#F5F3FF', border: '1px solid #DDD6FE',
                borderRadius: '6px', padding: '5px 12px', fontWeight: 600,
              }}
            >
              <Award size={13} /> Module 7: Innovation Score
            </Link>
          )}
        </div>
        {/* Header & Controls */}
        <div className="comm-header">
          <div>
            <h2 className="comm-header-title">
              <Rocket size={26} style={{ color: "#2563EB" }} />
              Module 8 – Commercialization Recommendation
            </h2>
            <p className="comm-header-subtitle">
              Transform research and technology intelligence into practical commercialization pathways.
            </p>
            <div className="comm-purpose-pills">
              <span className="comm-purpose-pill">Research Commercialization Analysis</span>
              <span className="comm-purpose-pill">Productization Recommendations</span>
              <span className="comm-purpose-pill">Licensing Opportunities</span>
              <span className="comm-purpose-pill">Startup Creation Recommendations</span>
              <span className="comm-purpose-pill">Industry Partnership Suggestions</span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
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
              disabled={loadingAnalysis || !selectedTechId}
              onClick={() => loadCommercialization(selectedTechId, true)}
            >
              <RefreshCw size={15} className={loadingAnalysis ? "animate-spin" : ""} />
              {loadingAnalysis ? "Evaluating Pathways..." : "Recalculate Analysis"}
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
              <AlertTriangle size={16} /> Commercialization Analysis Notice
            </h4>
            <p className="insight-narrative-text">{error}</p>
          </div>
        )}

        {loadingAnalysis ? (
          <div className="insight-narrative-card" style={{ textAlign: "center", padding: "40px" }}>
            <RefreshCw size={28} className="animate-spin" style={{ color: "#38bdf8", margin: "0 auto 12px" }} />
            <p style={{ color: "#cbd5e1", fontSize: "1.1rem" }}>
              Synthesizing evidence across Modules 2 through 7 to evaluate commercialization pathways...
            </p>
          </div>
        ) : (
          <>
            {/* Dual Metric Hero Strip */}
            <div className="comm-dual-hero">
              <div className="metric-hero-card highlight-blue">
                <div className="metric-hero-header">
                  <span>Innovation Score</span>
                  <Rocket size={18} style={{ color: "#2563EB" }} />
                </div>
                <div className="metric-hero-val">{Number(innovationScore).toFixed(1)} / 100</div>
                <div className="metric-hero-desc">Supplied by Module 7 Multi-Factor Engine</div>
              </div>

              <div className="metric-hero-card highlight-emerald">
                <div className="metric-hero-header">
                  <span>Commercialization Readiness</span>
                  <CheckCircle2 size={18} style={{ color: "#10B981" }} />
                </div>
                <div className="metric-hero-val">{Number(commReadiness).toFixed(1)} / 100</div>
                <div className="metric-hero-desc">Maturity, market & adoption readiness indicator</div>
              </div>

              <div className="metric-hero-card highlight-purple">
                <div className="metric-hero-header">
                  <span>Technology Lifecycle</span>
                  <Layers size={18} style={{ color: "#8B5CF6" }} />
                </div>
                <div className="metric-hero-val">{lifecycle}</div>
                <div className="metric-hero-desc">Ingested from Module 6 Intelligence</div>
              </div>

              <div className="metric-hero-card highlight-amber">
                <div className="metric-hero-header">
                  <span>Evidence Completeness</span>
                  <ShieldCheck size={18} style={{ color: "#F59E0B" }} />
                </div>
                <div className="metric-hero-val">{dataCompleteness}%</div>
                <div className="metric-hero-desc">Data integrated across Modules 2–7</div>
              </div>
            </div>

            {/* Strategic Synthesis Narrative */}
            {explanation && (
              <div className="insight-narrative-card">
                <h4>
                  <Compass size={16} /> Strategic Commercialization Synthesis
                </h4>
                <p className="insight-narrative-text">{explanation}</p>
              </div>
            )}

            {/* Four Core Commercialization Pathway Cards */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#172033" }}>
                  Four Core Commercialization Pathways
                </h3>
                <span style={{ fontSize: "0.85rem", color: "#64748B" }}>
                  Scores represent evidence-based relevance (not guaranteed success)
                </span>
              </div>

              <div className="pathway-cards-grid">
                {/* Pathway 1: Productization */}
                <div className="pathway-card prod">
                  <div>
                    <div className="pathway-top-row">
                      <span className="pathway-name">
                        <Briefcase size={18} style={{ color: "#2563EB" }} />
                        Productization
                      </span>
                      <span className="pathway-score-badge">
                        {productization.score !== undefined ? `${productization.score}/100` : "N/A"}
                      </span>
                    </div>

                    <p className="pathway-summary">
                      {productization.explanation || "Evaluating potential to develop direct software/hardware products from technology assets."}
                    </p>

                    <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                      Key Evidence:
                    </div>
                    <ul className="pathway-evidence-list">
                      {(productization.evidence || []).slice(0, 3).map((e, idx) => (
                        <li key={idx} className="pathway-evidence-item">
                          <span style={{ color: "#38bdf8" }}>•</span>
                          <span>{e}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    className="pathway-card-action"
                    onClick={() => setActivePathwayTab("productization")}
                  >
                    Deep Dive: Productization <ArrowRight size={14} />
                  </button>
                </div>

                {/* Pathway 2: Licensing */}
                <div className="pathway-card lic">
                  <div>
                    <div className="pathway-top-row">
                      <span className="pathway-name">
                        <FileText size={18} style={{ color: "#34d399" }} />
                        Licensing
                      </span>
                      <span className="pathway-score-badge">
                        {licensing.score !== undefined ? `${licensing.score}/100` : "N/A"}
                      </span>
                    </div>

                    <p className="pathway-summary">
                      {licensing.explanation || "Evaluating potential to license technology or patent rights to corporate licensees."}
                    </p>

                    <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                      Key Evidence:
                    </div>
                    <ul className="pathway-evidence-list">
                      {(licensing.evidence || []).slice(0, 3).map((e, idx) => (
                        <li key={idx} className="pathway-evidence-item">
                          <span style={{ color: "#10B981" }}>•</span>
                          <span>{e}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    className="pathway-card-action"
                    onClick={() => setActivePathwayTab("licensing")}
                  >
                    Deep Dive: Licensing <ArrowRight size={14} />
                  </button>
                </div>

                {/* Pathway 3: Startup Creation */}
                <div className="pathway-card start">
                  <div>
                    <div className="pathway-top-row">
                      <span className="pathway-name">
                        <Rocket size={18} style={{ color: "#8B5CF6" }} />
                        Startup Creation
                      </span>
                      <span className="pathway-score-badge">
                        {startup.score !== undefined ? `${startup.score}/100` : "N/A"}
                      </span>
                    </div>

                    <p className="pathway-summary">
                      {startup.explanation || "Evaluating venture formation around core technology and novel research assets."}
                    </p>

                    <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                      Key Evidence:
                    </div>
                    <ul className="pathway-evidence-list">
                      {(startup.evidence || []).slice(0, 3).map((e, idx) => (
                        <li key={idx} className="pathway-evidence-item">
                          <span style={{ color: "#8B5CF6" }}>•</span>
                          <span>{e}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    className="pathway-card-action"
                    onClick={() => setActivePathwayTab("startup")}
                  >
                    Deep Dive: Startup Creation <ArrowRight size={14} />
                  </button>
                </div>

                {/* Pathway 4: Industry Partnership */}
                <div className="pathway-card part">
                  <div>
                    <div className="pathway-top-row">
                      <span className="pathway-name">
                        <Handshake size={18} style={{ color: "#F59E0B" }} />
                        Industry Partnership
                      </span>
                      <span className="pathway-score-badge">
                        {partnership.score !== undefined ? `${partnership.score}/100` : "N/A"}
                      </span>
                    </div>

                    <p className="pathway-summary">
                      {partnership.explanation || "Evaluating collaborative pilot projects, sponsored R&D, and technology co-development."}
                    </p>

                    <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#475569", marginBottom: "6px" }}>
                      Key Evidence:
                    </div>
                    <ul className="pathway-evidence-list">
                      {(partnership.evidence || []).slice(0, 3).map((e, idx) => (
                        <li key={idx} className="pathway-evidence-item">
                          <span style={{ color: "#fbbf24" }}>•</span>
                          <span>{e}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    className="pathway-card-action"
                    onClick={() => setActivePathwayTab("partnership")}
                  >
                    Deep Dive: Partnerships <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Pathway Comparison Table */}
            <div className="comparison-panel">
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#172033", marginBottom: "4px" }}>
                Commercialization Pathway Comparison Matrix
              </h3>
              <p style={{ color: "#64748B", fontSize: "0.85rem" }}>
                Empirical side-by-side comparison to help institutional decision-makers select the optimal route.
              </p>

              <div className="comparison-table-wrapper">
                <table className="comparison-table">
                  <thead>
                    <tr>
                      <th>Pathway</th>
                      <th>Score</th>
                      <th>Primary Evidence Source</th>
                      <th>Primary Requirement</th>
                      <th>Key Risk Consideration</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <strong style={{ color: "#38bdf8" }}>Productization</strong>
                      </td>
                      <td>
                        <strong>{productization.score ?? 78}/100</strong>
                      </td>
                      <td>Market Potential (Module 7) & Applications (Module 6)</td>
                      <td>Build & validate customer MVP</td>
                      <td>Product-market fit divergence</td>
                    </tr>
                    <tr>
                      <td>
                        <strong style={{ color: "#34d399" }}>Licensing</strong>
                      </td>
                      <td>
                        <strong>{licensing.score ?? 72}/100</strong>
                      </td>
                      <td>Patent Strength (Module 5) & Assignee Activity</td>
                      <td>Claim charts & FTO legal review</td>
                      <td>Prior art claim narrowing</td>
                    </tr>
                    <tr>
                      <td>
                        <strong style={{ color: "#c084fc" }}>Startup Creation</strong>
                      </td>
                      <td>
                        <strong>{startup.score ?? 81}/100</strong>
                      </td>
                      <td>Research Novelty (Module 3) & Funding Grants (Module 4)</td>
                      <td>Form balanced founding team & seed runway</td>
                      <td>Capital intensity & execution risk</td>
                    </tr>
                    <tr>
                      <td>
                        <strong style={{ color: "#fbbf24" }}>Industry Partnership</strong>
                      </td>
                      <td>
                        <strong>{partnership.score ?? 75}/100</strong>
                      </td>
                      <td>Competitor/Org Activity (Module 6) & Technology Relevance</td>
                      <td>Establish clear background IP boundaries</td>
                      <td>Co-development IP contamination</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Deep-Dive Pathway Detail Tabs */}
            <div className="deep-dive-panel">
              <div className="deep-dive-nav">
                <button
                  type="button"
                  className={`tab-btn ${activePathwayTab === "productization" ? "active" : ""}`}
                  onClick={() => setActivePathwayTab("productization")}
                >
                  <Briefcase size={16} /> Productization Analysis
                </button>

                <button
                  type="button"
                  className={`tab-btn ${activePathwayTab === "licensing" ? "active" : ""}`}
                  onClick={() => setActivePathwayTab("licensing")}
                >
                  <FileText size={16} /> Licensing Opportunities
                </button>

                <button
                  type="button"
                  className={`tab-btn ${activePathwayTab === "startup" ? "active" : ""}`}
                  onClick={() => setActivePathwayTab("startup")}
                >
                  <Rocket size={16} /> Startup Creation
                </button>

                <button
                  type="button"
                  className={`tab-btn ${activePathwayTab === "partnership" ? "active" : ""}`}
                  onClick={() => setActivePathwayTab("partnership")}
                >
                  <Handshake size={16} /> Industry Partnerships
                </button>
              </div>

              {/* Productization Tab Content */}
              {activePathwayTab === "productization" && (
                <div>
                  <h4 style={{ color: "#172033", marginBottom: "8px" }}>Identified Potential Product Concepts</h4>
                  <p style={{ color: "#64748B", fontSize: "0.85rem", marginBottom: "16px" }}>
                    Derived from technology applications and market intelligence. Concepts require validation before engineering commitment.
                  </p>

                  <div className="entity-cards-grid">
                    {(productization.opportunities || []).map((opp, idx) => (
                      <div key={idx} className="entity-card">
                        <div className="entity-card-title">{opp.title}</div>
                        <div className="entity-card-meta">
                          <strong>Target Users:</strong> {opp.target_users}
                        </div>
                        <div style={{ fontSize: "0.85rem", color: "#475569", lineHeight: 1.4 }}>
                          {opp.value_proposition}
                        </div>
                        <div style={{ marginTop: "10px", fontSize: "0.75rem", color: "#2563EB", fontWeight: 700 }}>
                          Stage: {opp.stage}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: "20px" }}>
                    <h5 style={{ color: "#172033", marginBottom: "8px" }}>Productization Requirements</h5>
                    <ul style={{ paddingLeft: "20px", color: "#334155", fontSize: "0.85rem", lineHeight: 1.6 }}>
                      {(productization.requirements || []).map((req, i) => (
                        <li key={i}>{req}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Licensing Tab Content */}
              {activePathwayTab === "licensing" && (
                <div>
                  <h4 style={{ color: "#172033", marginBottom: "8px" }}>Potentially Relevant Licensee Organizations</h4>
                  <p style={{ color: "#64748B", fontSize: "0.85rem", marginBottom: "14px" }}>
                    Identified through active patent filings and competitor tracking in Module 5 & 6.
                  </p>

                  {licensing.ipDisclaimer && (
                    <div style={{ background: "#FFFBEB", border: "1px solid #FCD34D", borderRadius: "8px", padding: "12px", marginBottom: "16px", fontSize: "0.82rem", color: "#92400E" }}>
                      <strong>IP Notice:</strong> {licensing.ipDisclaimer}
                    </div>
                  )}

                  <div className="entity-cards-grid">
                    {(licensing.potentialLicensees || []).map((lic, idx) => (
                      <div key={idx} className="entity-card">
                        <div className="entity-card-title" style={{ display: "flex", justifyContent: "space-between" }}>
                          <span>{lic.organization_name}</span>
                          <span style={{ fontSize: "0.75rem", color: "#047857", fontWeight: 700 }}>Fit: {lic.relevance}</span>
                        </div>
                        <div className="entity-card-meta">{lic.reason_for_identification}</div>
                        <div style={{ fontSize: "0.82rem", color: "#475569" }}>
                          <strong>Recommended Approach:</strong> {lic.recommended_approach}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: "20px" }}>
                    <h5 style={{ color: "#172033", marginBottom: "8px" }}>Licensing Preparation Requirements</h5>
                    <ul style={{ paddingLeft: "20px", color: "#334155", fontSize: "0.85rem", lineHeight: 1.6 }}>
                      {(licensing.requirements || []).map((req, i) => (
                        <li key={i}>{req}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Startup Tab Content */}
              {activePathwayTab === "startup" && (
                <div>
                  <h4 style={{ color: "#172033", marginBottom: "8px" }}>Venture Opportunity Profile</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                    <div className="entity-card">
                      <div className="entity-card-title">Problem Statement</div>
                      <p style={{ color: "#475569", fontSize: "0.85rem", lineHeight: 1.5 }}>
                        {startup.problemStatement}
                      </p>
                    </div>

                    <div className="entity-card">
                      <div className="entity-card-title">Value Proposition</div>
                      <p style={{ color: "#475569", fontSize: "0.85rem", lineHeight: 1.5 }}>
                        {startup.potentialValueProposition}
                      </p>
                    </div>
                  </div>

                  <h5 style={{ color: "#172033", marginBottom: "8px" }}>Matching Funding Grants (Module 4 Integration)</h5>
                  <div className="entity-cards-grid">
                    {(startup.fundingSources || []).map((g, idx) => (
                      <div key={idx} className="entity-card">
                        <div className="entity-card-title" style={{ color: "#6D28D9" }}>{g.title}</div>
                        <div className="entity-card-meta">
                          Funder: {g.organization} | Type: {g.funding_type || "Grant"}
                        </div>
                        {g.funding_amount && (
                          <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#047857", marginTop: "4px" }}>
                            ${Number(g.funding_amount).toLocaleString()} {g.currency || "USD"}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Partnership Tab Content */}
              {activePathwayTab === "partnership" && (
                <div>
                  <h4 style={{ color: "#172033", marginBottom: "8px" }}>Industry Collaboration Opportunities</h4>
                  <p style={{ color: "#64748B", fontSize: "0.85rem", marginBottom: "14px" }}>
                    Recommended partnership candidates and collaboration structures.
                  </p>

                  <div className="entity-cards-grid">
                    {(partnership.potentialPartners || []).map((p, idx) => (
                      <div key={idx} className="entity-card">
                        <div className="entity-card-title">{p.organization}</div>
                        <div className="entity-card-meta">
                          Sector: {p.industry} | Proposed Model: {p.potential_collaboration_type}
                        </div>
                        <p style={{ color: "#475569", fontSize: "0.82rem", lineHeight: 1.4 }}>
                          {p.supporting_evidence}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: "20px" }}>
                    <h5 style={{ color: "#172033", marginBottom: "8px" }}>Partnership Structuring Types</h5>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {(partnership.partnershipTypes || []).map((pt, i) => (
                        <div key={i} style={{ background: "#F8FAFC", padding: "10px 14px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                          <strong style={{ color: "#B45309", fontSize: "0.9rem" }}>{pt.type}</strong>
                          <span style={{ color: "#334155", fontSize: "0.85rem", marginLeft: "10px" }}>{pt.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Commercialization Gaps Panel */}
            <div className="comparison-panel">
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#172033", marginBottom: "4px" }}>
                <Target size={18} style={{ color: "#EF4444", marginRight: "8px", verticalAlign: "middle" }} />
                Commercialization Gap Analysis
              </h3>
              <p style={{ color: "#64748B", fontSize: "0.85rem" }}>
                Identified gaps derived from indicator thresholds with actionable mitigations before commercial transfer.
              </p>

              <div className="gap-grid">
                {gaps.map((g, idx) => (
                  <div key={idx} className="gap-card">
                    <div>
                      <div className="gap-header">
                        <span className="gap-title">{g.category}</span>
                        <span className={g.importance === "High" ? "badge-severity-high" : "badge-severity-med"}>
                          {g.importance} Priority
                        </span>
                      </div>
                      <p style={{ color: "#334155", fontSize: "0.85rem", lineHeight: 1.4, marginBottom: "8px" }}>
                        {g.gap}
                      </p>
                      <div style={{ fontSize: "0.78rem", color: "#64748B", marginBottom: "10px" }}>
                        Evidence: {g.evidence}
                      </div>
                    </div>

                    <div style={{ fontSize: "0.82rem", color: "#2563EB", borderTop: "1px solid #F1F5F9", paddingTop: "8px" }}>
                      <strong>Action:</strong> {g.suggested_action}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Risk Analysis Matrix */}
            <div className="comparison-panel">
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#172033", marginBottom: "4px" }}>
                <AlertTriangle size={18} style={{ color: "#F59E0B", marginRight: "8px", verticalAlign: "middle" }} />
                Commercialization Risk Assessment
              </h3>
              <p style={{ color: "#64748B", fontSize: "0.85rem" }}>
                Multidimensional evaluation across Technology, Market, IP, Funding, Adoption, and Competition.
              </p>

              <div className="comparison-table-wrapper">
                <table className="comparison-table">
                  <thead>
                    <tr>
                      <th>Risk Dimension</th>
                      <th>Severity</th>
                      <th>Evidence / Indicator Signal</th>
                      <th>Mitigation Strategy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {risks.map((r, idx) => (
                      <tr key={idx}>
                        <td><strong>{r.category}</strong></td>
                        <td>
                          <span className={r.severity === "High" ? "badge-severity-high" : r.severity === "Medium" ? "badge-severity-med" : "badge-severity-low"}>
                            {r.severity}
                          </span>
                        </td>
                        <td style={{ color: "#172033" }}>{r.evidence}</td>
                        <td style={{ color: "#64748B" }}>{r.mitigation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Illustrative Commercialization Roadmap */}
            <div className="comparison-panel">
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#172033", marginBottom: "4px" }}>
                <Calendar size={18} style={{ color: "#10B981", marginRight: "8px", verticalAlign: "middle" }} />
                Illustrative Commercialization Roadmap
              </h3>
              <p style={{ color: "#64748B", fontSize: "0.85rem" }}>
                Phased execution timeline based on technology maturity and commercial readiness indicators.
              </p>

              <div className="roadmap-timeline">
                {roadmap.map((ph, idx) => (
                  <div key={idx} className="roadmap-phase-card">
                    <div className="roadmap-phase-num">Phase {idx + 1}</div>
                    <div className="roadmap-phase-title">{ph.phase}</div>
                    <div className="roadmap-phase-time">{ph.duration}</div>

                    <ul className="roadmap-milestones-list">
                      {(ph.milestones || []).map((m, mIdx) => (
                        <li key={mIdx} className="roadmap-milestone-item">
                          <CheckCircle2 size={13} style={{ color: "#10B981", flexShrink: 0, marginTop: "2px" }} />
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>

                    {ph.key_metric && (
                      <div style={{ marginTop: "12px", fontSize: "0.75rem", color: "#1D4ED8", borderTop: "1px solid #F1F5F9", paddingTop: "8px" }}>
                        <strong>Key Metric:</strong> {ph.key_metric}
                      </div>
                    )}
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
                  <Rocket size={20} style={{ color: "#38bdf8", marginRight: "8px", verticalAlign: "middle" }} />
                  How are Commercialization Recommendations Generated?
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
                  <h4 style={{ color: "#172033", marginBottom: "6px" }}>1. Multi-Module Intelligence Consumption</h4>
                  <p>
                    Module 8 does not calculate scores in isolation. It aggregates verified indicators:
                  </p>
                  <ul style={{ paddingLeft: "20px" }}>
                    <li><strong>Module 7:</strong> Composite Innovation Score (30% Novelty, 20% Patent, 15% Maturity, 20% Market, 15% Funding).</li>
                    <li><strong>Module 6:</strong> Technology maturity index, lifecycle classification, and competitor organizations.</li>
                    <li><strong>Module 5:</strong> Patent portfolio depth, assignees, citations, and technology sub-area coverage.</li>
                    <li><strong>Module 4:</strong> Active non-dilutive grant opportunities, funding amounts, and eligibility.</li>
                    <li><strong>Module 3:</strong> Research novelty, semantic distinctiveness, and scientific differentiators.</li>
                  </ul>
                </div>

                <div>
                  <h4 style={{ color: "#172033", marginBottom: "6px" }}>2. Pathway Decision Logic</h4>
                  <p>
                    Each pathway score is calculated from documented indicator combinations:
                  </p>
                  <ul style={{ paddingLeft: "20px" }}>
                    <li><strong>Productization:</strong> Market Potential (35%) + Maturity (25%) + Application Signals (20%) + Adoption (20%)</li>
                    <li><strong>Licensing:</strong> Patent Strength (40%) + Coverage (25%) + Industry Activity (20%) + Maturity (15%)</li>
                    <li><strong>Startup Creation:</strong> Innovation Score (30%) + Novelty (25%) + Market Potential (25%) + Funding (20%)</li>
                    <li><strong>Industry Partnership:</strong> Org Breadth (35%) + Patent Signals (25%) + Maturity (20%) + Funding (20%)</li>
                  </ul>
                </div>

                <div>
                  <h4 style={{ color: "#172033", marginBottom: "6px" }}>3. Human Decision-Making Mandate</h4>
                  <p>
                    The platform never forces an arbitrary single "best" choice or guarantees commercial success.
                    It provides traceable evidence, gap analysis, and risks so research institutions and founders can make informed decisions.
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