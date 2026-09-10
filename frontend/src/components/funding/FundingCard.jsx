import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Building,
  Calendar,
  DollarSign,
  Globe,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  ArrowRight,
  GitCompare,
  Sparkles
} from "lucide-react";
import MatchScore from "./MatchScore";

export default function FundingCard({
  opportunity,
  matchResult,
  isSaved,
  onToggleSave,
  saving,
  isSelectedForCompare,
  onToggleCompare,
}) {
  const navigate = useNavigate();

  const rawOpp = opportunity || matchResult?.opportunity || matchResult;
  if (!rawOpp) return null;

  const opp = {
    ...rawOpp,
    agency: rawOpp.organization || rawOpp.agency,
    close_date: rawOpp.deadline || rawOpp.close_date,
    award_ceiling: rawOpp.funding_amount_max || rawOpp.funding_amount || rawOpp.award_ceiling,
    award_floor: (rawOpp.funding_amount_max && rawOpp.funding_amount) ? rawOpp.funding_amount : rawOpp.award_floor,
    research_categories: rawOpp.research_areas || rawOpp.research_categories || [],
    eligibility_description: rawOpp.eligibility || rawOpp.eligibility_description,
    is_active: rawOpp.status ? rawOpp.status === 'open' : (rawOpp.is_active ?? true),
  };

  const score = matchResult?.overall_score ?? matchResult?.match_score ?? opp?.match_score;
  const breakdown = matchResult?.breakdown ?? matchResult?.score_breakdown;

  const formatCurrency = (amount, currency = "USD") => {
    if (!amount) return "Not specified / Discretionary";
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

  const calculateDaysRemaining = (deadline) => {
    if (!deadline) return null;
    const now = new Date();
    const d = new Date(deadline);
    const diff = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
    if (diff < 0) return "Closed";
    if (diff === 0) return "Due Today";
    return `${diff} days left`;
  };

  const daysLeft = calculateDaysRemaining(opp.close_date);

  return (
    <div className="publication-entry-card" style={{ position: "relative" }}>
      <div className="pub-card-header">
        <div className="pub-card-main-info">
          {/* Badge Row */}
          <div className="pub-badge-row">
            <span className="badge-pub-type type-journal">
              {opp.funding_type || "Grant Opportunity"}
            </span>

            {opp.agency && (
              <span className="pub-domain-text">
                <Building size={13} /> {opp.agency}
              </span>
            )}

            {opp.close_date && (
              <span className="pub-date-text">
                <Calendar size={13} /> Deadline: {opp.close_date}
                {daysLeft && (
                  <span
                    style={{
                      marginLeft: "6px",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      color: daysLeft === "Closed" ? "#dc2626" : "#059669",
                    }}
                  >
                    ({daysLeft})
                  </span>
                )}
              </span>
            )}

            {opp.country && (
              <span className="pub-domain-text">
                <Globe size={13} /> {opp.country}
              </span>
            )}
          </div>

          {/* Title */}
          <Link to={`/funding/${opp.id}`} style={{ textDecoration: "none" }}>
            <h4
              className="pub-entry-title"
              style={{ color: "#1e40af", cursor: "pointer", fontSize: "1.05rem" }}
            >
              {opp.title}
            </h4>
          </Link>

          {/* Agency and Opportunity Number */}
          <p className="pub-entry-authors" style={{ margin: "4px 0" }}>
            {opp.opportunity_number && (
              <span>
                <strong>Opp #:</strong> {opp.opportunity_number} •{" "}
              </span>
            )}
            {opp.cfda_number && (
              <span>
                <strong>CFDA / Assistance #:</strong> {opp.cfda_number} •{" "}
              </span>
            )}
            {opp.eligibility_description && (
              <span>
                <strong>Eligibility:</strong> {opp.eligibility_description}
              </span>
            )}
          </p>

          {/* Description Snippet */}
          {opp.description && (
            <p
              style={{
                fontSize: "0.84rem",
                color: "#475569",
                margin: "6px 0 10px",
                lineHeight: "1.5",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {opp.description}
            </p>
          )}

          {/* Research categories */}
          {opp.research_categories && opp.research_categories.length > 0 && (
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px" }}>
              {opp.research_categories.map((cat, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: "0.72rem",
                    background: "#f1f5f9",
                    color: "#334155",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  {cat}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right side stats & actions */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "10px" }}>
          {score !== undefined && score !== null ? (
            <MatchScore score={score} breakdown={breakdown} />
          ) : (
            <div className="citation-count-badge">
              <span className="cite-num" style={{ fontSize: "0.88rem" }}>
                {opp.is_active ? "Active" : "Archived"}
              </span>
              <small className="cite-text">Status</small>
            </div>
          )}

          <div style={{ display: "flex", gap: "6px" }}>
            {onToggleCompare && (
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "0.74rem",
                  color: "#64748b",
                  cursor: "pointer",
                  background: isSelectedForCompare ? "#eff6ff" : "#ffffff",
                  padding: "5px 8px",
                  borderRadius: "6px",
                  border: isSelectedForCompare ? "1px solid #93c5fd" : "1px solid #cbd5e1",
                }}
              >
                <input
                  type="checkbox"
                  checked={!!isSelectedForCompare}
                  onChange={() => onToggleCompare(opp.id)}
                  style={{ accentColor: "#1e40af" }}
                />
                Compare
              </label>
            )}

            {onToggleSave && (
              <button
                type="button"
                onClick={() => onToggleSave(opp.id, isSaved ?? opp.is_saved)}
                disabled={saving}
                className="btn-action-secondary"
                style={{
                  padding: "5px 10px",
                  fontSize: "0.78rem",
                  background: (isSaved ?? opp.is_saved) ? "#eff6ff" : "#ffffff",
                  borderColor: (isSaved ?? opp.is_saved) ? "#93c5fd" : "#cbd5e1",
                  color: (isSaved ?? opp.is_saved) ? "#1e40af" : "#475569",
                }}
              >
                {(isSaved ?? opp.is_saved) ? (
                  <BookmarkCheck size={14} style={{ color: "#2563eb" }} />
                ) : (
                  <Bookmark size={14} />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer bar */}
      <div
        className="pub-footer-link"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid #f1f5f9",
          paddingTop: "10px",
          marginTop: "10px",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#16a34a" }}>
          Ceiling: {formatCurrency(opp.award_ceiling, opp.currency)}
          {opp.award_floor && (
            <span style={{ color: "#64748b", fontWeight: "500", marginLeft: "6px", fontSize: "0.78rem" }}>
              (Floor: {formatCurrency(opp.award_floor, opp.currency)})
            </span>
          )}
        </span>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            onClick={() => navigate(`/funding/${opp.id}`)}
            className="btn-action-primary btn-sm"
          >
            <Sparkles size={13} /> Grant Details & Match Analysis
          </button>

          {opp.source_url && (
            <a
              href={opp.source_url}
              target="_blank"
              rel="noreferrer"
              className="btn-action-secondary btn-sm"
              style={{ textDecoration: "none" }}
            >
              Apply Portal <ExternalLink size={13} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
