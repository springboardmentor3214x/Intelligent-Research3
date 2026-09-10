import React from "react";
import { Building2, Quote, Layers, Inbox } from "lucide-react";

export default function PatentCompetitorsSection({
  competitors = [],
  loading = false,
}) {
  return (
    <div className="patent-card">
      <div className="patent-section-header">
        <div className="patent-section-title-group">
          <h3>
            <Building2 size={20} className="stat-icon-indigo" />
            SECTION 5: Competitor Patent Analysis (Assignee Activity)
          </h3>
          <p>
            Identifies patent-owning organizations and companies derived directly from the database ASSIGNEE field.
          </p>
        </div>
        <div className="patent-section-badge">
          {competitors.length} Key Assignees
        </div>
      </div>

      {loading ? (
        <div className="patent-empty-state">
          <div className="patent-empty-text">Analyzing competitor assignee portfolios...</div>
        </div>
      ) : competitors.length === 0 ? (
        <div className="patent-empty-state">
          <Inbox size={40} className="patent-empty-icon" />
          <div className="patent-empty-text">No assignee data available.</div>
        </div>
      ) : (
        <div className="patent-competitors-list">
          {competitors.map((c, index) => (
            <div key={c.assignee} className="patent-competitor-row">
              {/* Left: Rank & Name */}
              <div className="patent-comp-name-group">
                <div className="patent-comp-rank">#{index + 1}</div>
                <div>
                  <div className="patent-comp-name">{c.assignee}</div>
                  {c.primary_classification && (
                    <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                      Primary Class: <code style={{ color: "#fbbf24" }}>{c.primary_classification}</code>
                    </span>
                  )}
                </div>
              </div>

              {/* Right: Stats (Patent Count, Citations, Timeline, Domain distribution) */}
              <div className="patent-comp-stats">
                {/* Domain Distribution */}
                {c.domain_distribution && c.domain_distribution.length > 0 && (
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", maxWidth: "260px" }}>
                    {c.domain_distribution.slice(0, 2).map((d) => (
                      <span key={d.domain} className="patent-domain-badge" style={{ fontSize: "0.7rem" }}>
                        {d.domain} ({d.count})
                      </span>
                    ))}
                  </div>
                )}

                {/* Filing activity over time */}
                {c.filing_timeline && c.filing_timeline.length > 0 && (
                  <div className="patent-comp-stat-item">
                    <span className="patent-comp-stat-label">Timeline</span>
                    <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                      {c.filing_timeline.map((t) => `${t.year}:${t.count}`).join(", ")}
                    </span>
                  </div>
                )}

                {/* Citation Count */}
                <div className="patent-comp-stat-item">
                  <span className="patent-comp-stat-label">Citations</span>
                  <div className="patent-comp-stat-value" style={{ color: "#34d399", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Quote size={12} />
                    {c.citation_count}
                  </div>
                </div>

                {/* Actual Patent Count */}
                <div className="patent-comp-stat-item">
                  <span className="patent-comp-stat-label">Patents</span>
                  <div className="patent-comp-stat-value" style={{ color: "#818cf8" }}>
                    {c.patent_count}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
