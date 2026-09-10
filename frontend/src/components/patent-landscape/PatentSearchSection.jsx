import React, { useState } from "react";
import { Search, Filter, RefreshCw, X, ArrowDownUp } from "lucide-react";

export default function PatentSearchSection({
  query,
  setQuery,
  assignee,
  setAssignee,
  domain,
  setDomain,
  classification,
  setClassification,
  yearMin,
  setYearMin,
  yearMax,
  setYearMax,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  availableDomains = [],
  onSearch,
  onReset,
  onSync,
  syncLoading = false,
  syncSummary = null,
}) {
  const [showFilters, setShowFilters] = useState(false);
  const [syncQuery, setSyncQuery] = useState("");
  const [syncSource, setSyncSource] = useState("uspto");
  const [showSyncPanel, setShowSyncPanel] = useState(false);

  const handleSyncSubmit = (e) => {
    e.preventDefault();
    if (!syncQuery.trim()) return;
    onSync(syncQuery.trim(), syncSource);
  };

  return (
    <div className="patent-card">
      <div className="patent-section-header">
        <div className="patent-section-title-group">
          <h3>
            <Search size={20} className="stat-icon-amber" />
            SECTION 1: Patent Search & Ingestion
          </h3>
          <p>
            Search real patent records by technology terms, assignees, or classification codes.
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            type="button"
            className="patent-btn-secondary"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={15} />
            {showFilters ? "Hide Filters" : "Filters"}
          </button>
          <button
            type="button"
            className="patent-btn-secondary"
            onClick={() => setShowSyncPanel(!showSyncPanel)}
          >
            <RefreshCw size={14} className={syncLoading ? "spin" : ""} />
            Sync Real Source
          </button>
        </div>
      </div>

      {/* Main Search Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSearch();
        }}
        className="patent-search-bar-row"
      >
        <div className="patent-search-input-wrap">
          <Search size={18} className="patent-search-icon" />
          <input
            type="text"
            className="patent-search-input"
            placeholder="Search patents (e.g. 'Artificial Intelligence', 'Machine Learning', 'Medical Imaging', 'Battery Technology')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <button type="submit" className="patent-btn-primary">
          <Search size={16} /> Search
        </button>

        {(query || assignee || domain !== "ALL" || classification || yearMin || yearMax) && (
          <button
            type="button"
            className="patent-btn-secondary"
            onClick={onReset}
            title="Reset all search filters"
          >
            <X size={15} /> Clear
          </button>
        )}
      </form>

      {/* Filter Row */}
      {showFilters && (
        <div className="patent-filter-grid">
          <div className="patent-filter-item">
            <label className="patent-filter-label">Technology Domain</label>
            <select
              className="patent-filter-select"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            >
              <option value="ALL">All Domains</option>
              {availableDomains.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="patent-filter-item">
            <label className="patent-filter-label">Assignee / Organization</label>
            <input
              type="text"
              className="patent-filter-input"
              placeholder="e.g. Google, Tesla, Siemens..."
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
            />
          </div>

          <div className="patent-filter-item">
            <label className="patent-filter-label">Patent Classification (IPC/CPC)</label>
            <input
              type="text"
              className="patent-filter-input"
              placeholder="e.g. G06N, A61B, H01M..."
              value={classification}
              onChange={(e) => setClassification(e.target.value)}
            />
          </div>

          <div className="patent-filter-item">
            <label className="patent-filter-label">Filing Year (From — To)</label>
            <div style={{ display: "flex", gap: "6px" }}>
              <input
                type="number"
                className="patent-filter-input"
                placeholder="Min Year"
                value={yearMin || ""}
                onChange={(e) => setYearMin(e.target.value ? Number(e.target.value) : null)}
                style={{ width: "50%" }}
              />
              <input
                type="number"
                className="patent-filter-input"
                placeholder="Max Year"
                value={yearMax || ""}
                onChange={(e) => setYearMax(e.target.value ? Number(e.target.value) : null)}
                style={{ width: "50%" }}
              />
            </div>
          </div>

          <div className="patent-filter-item">
            <label className="patent-filter-label">Sort Order</label>
            <div style={{ display: "flex", gap: "6px" }}>
              <select
                className="patent-filter-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{ width: "65%" }}
              >
                <option value="filing_date">Filing Date</option>
                <option value="citation_count">Citation Count</option>
                <option value="title">Patent Title</option>
              </select>
              <button
                type="button"
                className="patent-btn-secondary"
                onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                style={{ width: "35%", justifyContent: "center" }}
              >
                <ArrowDownUp size={14} /> {sortOrder.toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real Provider Ingestion / Sync Drawer */}
      {showSyncPanel && (
        <div
          style={{
            marginTop: "16px",
            padding: "16px",
            borderRadius: "10px",
            background: "rgba(99, 102, 241, 0.07)",
            border: "1px dashed rgba(99, 102, 241, 0.3)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#a5b4fc" }}>
              Sync Fresh Patents from Supported Source (USPTO Open Data Portal / The Lens)
            </span>
            <button
              type="button"
              onClick={() => setShowSyncPanel(false)}
              style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}
            >
              <X size={14} />
            </button>
          </div>

          <form onSubmit={handleSyncSubmit} style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <input
              type="text"
              className="patent-search-input"
              style={{ flex: 1, minWidth: "240px" }}
              placeholder="Topic or query to sync (e.g. 'autonomous robotics', 'quantum computing')..."
              value={syncQuery}
              onChange={(e) => setSyncQuery(e.target.value)}
            />
            <select
              className="patent-filter-select"
              value={syncSource}
              onChange={(e) => setSyncSource(e.target.value)}
              style={{ minWidth: "120px" }}
            >
              <option value="uspto">USPTO Public Data</option>
              <option value="lens">The Lens API</option>
            </select>
            <button type="submit" className="patent-btn-primary" disabled={syncLoading || !syncQuery.trim()}>
              <RefreshCw size={14} className={syncLoading ? "spin" : ""} />
              {syncLoading ? "Syncing..." : "Run Ingestion"}
            </button>
          </form>

          {syncSummary && (
            <div style={{ marginTop: "10px", fontSize: "0.8rem", color: "#cbd5e1" }}>
              <strong>Sync Result ({syncSummary.source}):</strong> Fetched: {syncSummary.fetched} | Inserted:{" "}
              {syncSummary.inserted} | Updated: {syncSummary.updated} | Skipped Duplicates:{" "}
              {syncSummary.skipped_duplicates}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
