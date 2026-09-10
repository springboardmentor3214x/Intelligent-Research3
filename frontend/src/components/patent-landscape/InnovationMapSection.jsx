import React from "react";
import { Compass, Layers, Building, Tag, Inbox } from "lucide-react";

export default function InnovationMapSection({
  domains = [],
  totalPatents = 0,
  loading = false,
}) {
  return (
    <div className="patent-card">
      <div className="patent-section-header">
        <div className="patent-section-title-group">
          <h3>
            <Compass size={20} className="stat-icon-amber" />
            SECTION 6: Innovation Mapping
          </h3>
          <p>
            Concentration map connecting Technology Domains to Patent Classifications (IPC/CPC) and owning Assignees.
          </p>
        </div>
        <div className="patent-section-badge">
          {domains.length} Domains Mapped
        </div>
      </div>

      {loading ? (
        <div className="patent-empty-state">
          <div className="patent-empty-text">Generating innovation map...</div>
        </div>
      ) : domains.length === 0 ? (
        <div className="patent-empty-state">
          <Inbox size={40} className="patent-empty-icon" />
          <div className="patent-empty-text">No innovation mapping data available.</div>
        </div>
      ) : (
        <div className="patent-innovation-grid">
          {domains.map((d) => (
            <div key={d.domain} className="patent-innovation-card">
              {/* Domain Header */}
              <div className="patent-inno-header">
                <div className="patent-inno-domain">{d.domain}</div>
                <div className="patent-inno-count">{d.patent_count} Patents</div>
              </div>

              {/* Top Classifications */}
              <div>
                <div className="patent-inno-section-title">
                  <Layers size={11} style={{ display: "inline", marginRight: "4px" }} />
                  Patent Classifications:
                </div>
                <div className="patent-inno-chips">
                  {d.top_classifications && d.top_classifications.length > 0 ? (
                    d.top_classifications.map((c) => (
                      <span key={c.classification} className="patent-inno-chip">
                        <code style={{ color: "#fbbf24" }}>{c.classification}</code>
                        <span style={{ color: "#64748b" }}>({c.count})</span>
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>None recorded</span>
                  )}
                </div>
              </div>

              {/* Top Assignees */}
              <div>
                <div className="patent-inno-section-title">
                  <Building size={11} style={{ display: "inline", marginRight: "4px" }} />
                  Concentrated Assignees:
                </div>
                <div className="patent-inno-chips">
                  {d.top_assignees && d.top_assignees.length > 0 ? (
                    d.top_assignees.map((a) => (
                      <span key={a.assignee} className="patent-inno-chip">
                        <span>{a.assignee}</span>
                        <strong style={{ color: "#818cf8" }}>({a.count})</strong>
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>None recorded</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
