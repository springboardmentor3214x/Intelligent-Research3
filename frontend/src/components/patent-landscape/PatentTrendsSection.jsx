import React from "react";
import { TrendingUp, BarChart3, Inbox } from "lucide-react";

export default function PatentTrendsSection({
  trends = [],
  totalPatents = 0,
  domain = "ALL",
  setDomain,
  availableDomains = [],
  loading = false,
}) {
  const maxCount = Math.max(...trends.map((t) => t.count), 1);

  return (
    <div className="patent-card">
      <div className="patent-section-header">
        <div className="patent-section-title-group">
          <h3>
            <TrendingUp size={20} className="stat-icon-emerald" />
            SECTION 4: Patent Trend Analysis (Filing Date over Time)
          </h3>
          <p>
            Real patent filings aggregated by year calculated directly from database records.
          </p>
        </div>

        {/* Filter by Domain */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Domain:</label>
          <select
            className="patent-filter-select"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            style={{ padding: "4px 8px" }}
          >
            <option value="ALL">All Domains</option>
            {availableDomains.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="patent-empty-state">
          <div className="patent-empty-text">Calculating filing trends...</div>
        </div>
      ) : trends.length === 0 ? (
        <div className="patent-empty-state">
          <Inbox size={40} className="patent-empty-icon" />
          <div className="patent-empty-text">No patent filing data available for this selection.</div>
        </div>
      ) : (
        <div className="patent-trend-chart-box">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Filing Year vs. Patent Count</span>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#a5b4fc" }}>
              Total Analyzed: {totalPatents} Patents
            </span>
          </div>

          <div className="patent-trend-bars">
            {trends.map((t) => {
              const heightPercent = Math.round((t.count / maxCount) * 100);
              return (
                <div key={t.year} className="patent-trend-bar-col">
                  <span className="patent-trend-bar-val">{t.count}</span>
                  <div
                    className="patent-trend-bar-fill"
                    style={{ height: `${Math.max(heightPercent, 8)}%` }}
                    title={`Year ${t.year}: ${t.count} patents`}
                  />
                  <span className="patent-trend-bar-label">{t.year}</span>
                </div>
              );
            })}
          </div>

          {/* Simple Data Table Row */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              marginTop: "16px",
              paddingTop: "12px",
              borderTop: "1px dashed var(--clr-border, #1e293b)",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            {trends.map((t) => (
              <div key={t.year} style={{ textAlign: "center", minWidth: "60px" }}>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{t.year}</div>
                <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#f8fafc" }}>
                  {t.count}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
