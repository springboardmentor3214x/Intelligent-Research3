import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import DashboardLayout from "../../../components/layout/DashboardLayout";
import MatchScore from "../../../components/funding/MatchScore";
import fundingService from "../../../services/fundingService";
import {
  ArrowLeft,
  DollarSign,
  Building,
  Calendar,
  Globe,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  XCircle,
  GitCompare,
  FileText,
  Sliders
} from "lucide-react";

export default function FundingDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [opp, setOpp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Match state
  const [matchResult, setMatchResult] = useState(null);
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [customKeywords, setCustomKeywords] = useState("");
  const [customAreas, setCustomAreas] = useState("");

  const formatCurrency = (amount, currency = "USD") => {
    if (!amount) return "Discretionary / Not specified";
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency || "USD",
        maximumFractionDigits: 0,
      }).format(amount);
    } catch {
      return `$${Number(amount).toLocaleString()}`;
    }
  };

  const loadOpportunity = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fundingService.getFundingById(id);
      const normalized = {
        ...data,
        agency: data.organization || data.agency,
        close_date: data.deadline || data.close_date,
        award_ceiling: data.funding_amount_max || data.funding_amount || data.award_ceiling,
        award_floor: (data.funding_amount_max && data.funding_amount) ? data.funding_amount : data.award_floor,
        research_categories: data.research_areas || data.research_categories || [],
        eligibility_description: data.eligibility || data.eligibility_description,
        is_active: data.status ? data.status === 'open' : (data.is_active ?? true),
      };
      setOpp(normalized);
      // Also fetch match score
      fetchMatchScore(data.id);
    } catch (err) {
      console.error("Failed to load funding details:", err);
      setError(err.message || "Failed to load funding opportunity");
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchScore = async (opportunityId, customKws = [], customArs = []) => {
    setMatchingLoading(true);
    try {
      const res = await fundingService.matchOpportunity({
        opportunity_id: opportunityId,
        custom_keywords: customKws,
        custom_areas: customArs,
      });
      setMatchResult(res);
    } catch (err) {
      console.warn("Could not compute match score (user may not have a profile yet):", err);
    } finally {
      setMatchingLoading(false);
    }
  };

  useEffect(() => {
    loadOpportunity();
  }, [id]);

  const handleToggleSave = async () => {
    if (!opp) return;
    setSaving(true);
    try {
      if (opp.is_saved) {
        await fundingService.unsaveFunding(opp.id);
        setOpp((prev) => ({ ...prev, is_saved: false }));
      } else {
        await fundingService.saveFunding(opp.id);
        setOpp((prev) => ({ ...prev, is_saved: true }));
      }
    } catch (err) {
      console.error("Save error:", err);
      alert(err.message || "Failed to bookmark opportunity");
    } finally {
      setSaving(false);
    }
  };

  const handleRecalculateMatch = (e) => {
    e.preventDefault();
    const kws = customKeywords.split(",").map((k) => k.trim()).filter(Boolean);
    const ars = customAreas.split(",").map((a) => a.trim()).filter(Boolean);
    fetchMatchScore(opp.id, kws, ars);
  };

  if (loading) {
    return (
      <DashboardLayout
        pageTitle="Funding Opportunity Details"
        breadcrumbs={["Research Intelligence", "Module 4", "Grant Details"]}
      >
        <div className="tab-pane-content">
          <div className="form-card-panel" style={{ textAlign: "center", padding: "60px" }}>
            <RefreshCw size={32} className="animate-spin" style={{ color: "#2563eb", margin: "0 auto 12px" }} />
            <p style={{ margin: 0, color: "#64748b" }}>Loading grant specifications & RFP intelligence...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !opp) {
    return (
      <DashboardLayout
        pageTitle="Funding Opportunity Not Found"
        breadcrumbs={["Research Intelligence", "Module 4", "Grant Details"]}
      >
        <div className="tab-pane-content">
          <div className="form-card-panel" style={{ textAlign: "center", padding: "40px", borderColor: "#fecaca" }}>
            <AlertCircle size={32} style={{ color: "#ef4444", margin: "0 auto 10px" }} />
            <h4 style={{ color: "#b91c1c", margin: "0 0 8px" }}>Grant Record Error</h4>
            <p style={{ color: "#64748b", margin: "0 0 16px" }}>{error || "Opportunity not found."}</p>
            <button type="button" onClick={() => navigate("/funding")} className="btn-action-primary">
              <ArrowLeft size={14} /> Back to Funding Discovery
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const breakdown = matchResult?.breakdown;

  return (
    <DashboardLayout
      pageTitle={opp.title}
      breadcrumbs={["Platform", "Module 3", "Funding Opportunity Discovery"]}
    >
      <div className="tab-pane-content">

        {/* Top Action Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-action-secondary btn-sm"
          >
            <ArrowLeft size={14} /> Back to Opportunities
          </button>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={() => navigate(`/funding/compare?ids=${opp.id}`)}
              className="btn-action-secondary"
            >
              <GitCompare size={15} /> Compare with Others
            </button>

            <button
              type="button"
              onClick={handleToggleSave}
              disabled={saving}
              className="btn-action-secondary"
              style={{
                background: opp.is_saved ? "#eff6ff" : "#ffffff",
                borderColor: opp.is_saved ? "#93c5fd" : "#cbd5e1",
                color: opp.is_saved ? "#1e40af" : "#334155",
              }}
            >
              {opp.is_saved ? (
                <>
                  <BookmarkCheck size={16} style={{ color: "#2563eb" }} /> Saved in Profile
                </>
              ) : (
                <>
                  <Bookmark size={16} /> Bookmark Grant
                </>
              )}
            </button>

            {opp.source_url && (
              <a
                href={opp.source_url}
                target="_blank"
                rel="noreferrer"
                className="btn-action-primary"
                style={{ textDecoration: "none" }}
              >
                Official Application Portal <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>

        {/* Primary Opportunity Header Card */}
        <div className="form-card-panel">
          <div className="pub-badge-row" style={{ marginBottom: "12px" }}>
            <span className="badge-pub-type type-journal">{opp.funding_type || "Grant Opportunity"}</span>
            <span className="badge-pub-type type-conference">{opp.agency || "Global Funder"}</span>
            {opp.country && (
              <span className="pub-domain-text">
                <Globe size={14} /> {opp.country}
              </span>
            )}
            {opp.close_date && (
              <span className="pub-date-text">
                <Calendar size={14} /> Deadline: {opp.close_date}
              </span>
            )}
          </div>

          <h2 style={{ fontSize: "1.45rem", fontWeight: 800, color: "#0f172a", marginBottom: "12px", lineHeight: 1.3 }}>
            {opp.title}
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "16px" }}>
            <div>
              <span style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "#64748b", fontWeight: 700 }}>
                Award Ceiling
              </span>
              <p style={{ margin: "2px 0 0", fontSize: "1.1rem", fontWeight: 800, color: "#16a34a" }}>
                {formatCurrency(opp.award_ceiling, opp.currency)}
              </p>
            </div>

            <div>
              <span style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "#64748b", fontWeight: 700 }}>
                Award Floor
              </span>
              <p style={{ margin: "2px 0 0", fontSize: "1.05rem", fontWeight: 700, color: "#0f172a" }}>
                {formatCurrency(opp.award_floor, opp.currency)}
              </p>
            </div>

            <div>
              <span style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "#64748b", fontWeight: 700 }}>
                Opportunity Number
              </span>
              <p style={{ margin: "2px 0 0", fontSize: "0.95rem", fontWeight: 700, color: "#1e40af" }}>
                {opp.opportunity_number || "Discretionary"}
              </p>
            </div>

            <div>
              <span style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "#64748b", fontWeight: 700 }}>
                CFDA / Assistance Listing
              </span>
              <p style={{ margin: "2px 0 0", fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>
                {opp.cfda_number || "N/A"}
              </p>
            </div>
          </div>

          {/* Eligibility Section */}
          <div style={{ marginBottom: "16px" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
              Eligibility Criteria
            </span>
            <p style={{ margin: 0, fontSize: "0.88rem", color: "#334155", background: "#ffffff", padding: "12px 14px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
              {opp.eligibility_description || "Open to eligible university researchers, non-profit institutions, and research consortiums."}
            </p>
          </div>

          {/* Description */}
          <div>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
              Program Description & Scope
            </span>
            <p style={{ margin: 0, fontSize: "0.9rem", color: "#334155", lineHeight: 1.7, whiteSpace: "pre-line", background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              {opp.description || "No full description provided in the initial notice."}
            </p>
          </div>

          {/* Research categories & keywords */}
          {opp.research_categories && opp.research_categories.length > 0 && (
            <div style={{ marginTop: "16px" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                Target Research Disciplines
              </span>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {opp.research_categories.map((cat, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontSize: "0.76rem",
                      background: "#eff6ff",
                      color: "#1e40af",
                      padding: "3px 10px",
                      borderRadius: "6px",
                      border: "1px solid #bfdbfe",
                      fontWeight: 600,
                    }}
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* AI Grant Matching & Profile Alignment Engine */}
        <div className="form-card-panel" style={{ border: "1.5px solid #bbf7d0", background: "#fcfdfc" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "6px", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Sparkles size={16} style={{ color: "#166534" }} />
                </div>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "#14532d" }}>
                  Deterministic Grant Alignment & Fit Analysis
                </h3>
              </div>
              <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "#166534" }}>
                Multi-factor compatibility scoring (Domain Area 40% + Technical Keyword 40% + Country Eligibility 10% + Funding Type 10%).
              </p>
            </div>

            {matchResult && (
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#16a34a", lineHeight: 1 }}>
                  {Math.round(matchResult.overall_score * 100)}%
                </div>
                <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#166534", textTransform: "uppercase" }}>
                  Profile Match Score
                </span>
              </div>
            )}
          </div>

          {matchingLoading ? (
            <div style={{ textAlign: "center", padding: "24px" }}>
              <RefreshCw size={24} className="animate-spin" style={{ color: "#16a34a", margin: "0 auto 8px" }} />
              <p style={{ margin: 0, color: "#64748b", fontSize: "0.86rem" }}>Evaluating profile vectors against opportunity...</p>
            </div>
          ) : matchResult ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Factor Breakdown Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "10px" }}>
                {/* Domain Area Alignment */}
                <div style={{ background: "#ffffff", padding: "12px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#334155" }}>
                      Domain Areas (40%)
                    </span>
                    <strong style={{ fontSize: "0.82rem", color: "#0f172a" }}>
                      {Math.round((breakdown?.research_area_score || 0) * 100)}%
                    </strong>
                  </div>
                  <div style={{ height: "6px", background: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${Math.round((breakdown?.research_area_score || 0) * 100)}%`,
                        height: "100%",
                        background: "#2563eb",
                      }}
                    />
                  </div>
                  {breakdown?.matched_areas && breakdown.matched_areas.length > 0 && (
                    <span style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "4px", display: "block" }}>
                      Matched: {breakdown.matched_areas.join(", ")}
                    </span>
                  )}
                </div>

                {/* Keyword Alignment */}
                <div style={{ background: "#ffffff", padding: "12px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#334155" }}>
                      Keywords (40%)
                    </span>
                    <strong style={{ fontSize: "0.82rem", color: "#0f172a" }}>
                      {Math.round((breakdown?.keyword_score || 0) * 100)}%
                    </strong>
                  </div>
                  <div style={{ height: "6px", background: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${Math.round((breakdown?.keyword_score || 0) * 100)}%`,
                        height: "100%",
                        background: "#16a34a",
                      }}
                    />
                  </div>
                  {breakdown?.matched_keywords && breakdown.matched_keywords.length > 0 && (
                    <span style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "4px", display: "block" }}>
                      Matched: {breakdown.matched_keywords.join(", ")}
                    </span>
                  )}
                </div>

                {/* Country Compatibility */}
                <div style={{ background: "#ffffff", padding: "12px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#334155" }}>
                      Country Scope (10%)
                    </span>
                    <strong style={{ fontSize: "0.82rem", color: "#0f172a" }}>
                      {Math.round((breakdown?.country_score || 0) * 100)}%
                    </strong>
                  </div>
                  <div style={{ height: "6px", background: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${Math.round((breakdown?.country_score || 0) * 100)}%`,
                        height: "100%",
                        background: "#9333ea",
                      }}
                    />
                  </div>
                </div>

                {/* Funding Type Compatibility */}
                <div style={{ background: "#ffffff", padding: "12px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#334155" }}>
                      Funding Type (10%)
                    </span>
                    <strong style={{ fontSize: "0.82rem", color: "#0f172a" }}>
                      {Math.round((breakdown?.funding_type_score || 0) * 100)}%
                    </strong>
                  </div>
                  <div style={{ height: "6px", background: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${Math.round((breakdown?.funding_type_score || 0) * 100)}%`,
                        height: "100%",
                        background: "#d97706",
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Reasons / Explanation */}
              {matchResult.reasons && matchResult.reasons.length > 0 && (
                <div style={{ background: "#ffffff", padding: "12px 16px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#0f172a", display: "block", marginBottom: "6px" }}>
                    Match Alignment Justifications:
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    {matchResult.reasons.map((r, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem", color: "#334155" }}>
                        <CheckCircle2 size={13} style={{ color: "#16a34a" }} />
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ padding: "16px", background: "#ffffff", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "0.85rem", color: "#64748b" }}>
              To view automatic alignment scores, set up your research profile or test with custom inputs below.
            </div>
          )}

          {/* Interactive Simulation / Custom Overrides */}
          <form onSubmit={handleRecalculateMatch} style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#334155", display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
              <Sliders size={14} /> Test Custom Parameters & What-If Simulation
            </span>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
              <div>
                <input
                  type="text"
                  value={customAreas}
                  onChange={(e) => setCustomAreas(e.target.value)}
                  placeholder="Custom areas (comma separated, e.g. Artificial Intelligence, Healthcare)"
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.82rem",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <input
                  type="text"
                  value={customKeywords}
                  onChange={(e) => setCustomKeywords(e.target.value)}
                  placeholder="Custom keywords (comma separated, e.g. neural networks, genomics)"
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.82rem",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            <button type="submit" className="btn-action-primary btn-sm" disabled={matchingLoading}>
              <RefreshCw size={13} className={matchingLoading ? "animate-spin" : ""} /> Recalculate Alignment
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
