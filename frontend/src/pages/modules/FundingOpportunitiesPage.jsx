import React, { useState, useEffect } from "react";
import "./modules-shared.css";
import DashboardLayout from "../../components/layout/DashboardLayout";
import {
  Search,
  Filter,
  DollarSign,
  Calendar,
  Building,
  CheckCircle,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Award,
  Clock,
  Layers,
  Globe,
  SlidersHorizontal,
  X,
  AlertCircle,
} from "lucide-react";
import {
  getFunding,
  getFundingStats,
  getFundingMatching,
  syncFunding,
} from "../../services/fundingService";

export default function FundingOpportunitiesPage() {
  const [activeTab, setActiveTab] = useState("all"); // "all" | "matched"
  const [grants, setGrants] = useState([]);
  const [matchedGrants, setMatchedGrants] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  // Filters
  const [query, setQuery] = useState("");
  const [selectedOrg, setSelectedOrg] = useState("ALL");
  const [minAmount, setMinAmount] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Selected Detail Modal
  const [selectedGrant, setSelectedGrant] = useState(null);

  function showToast(msg) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 4500);
  }

  async function loadData() {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        getFunding({
          query,
          organization: selectedOrg,
          minAmount: minAmount ? Number(minAmount) : undefined,
          page,
          pageSize: 20,
        }),
        getFundingStats(),
      ]);

      if (listRes && listRes.items) {
        setGrants(listRes.items);
        setTotalCount(listRes.total || 0);
      }
      if (statsRes) {
        setStats(statsRes);
      }
    } catch (err) {
      console.error("Failed to load funding data", err);
    } finally {
      setLoading(false);
    }
  }

  async function loadMatched() {
    try {
      const matchRes = await getFundingMatching(30);
      if (matchRes && matchRes.matches) {
        setMatchedGrants(matchRes.matches);
      }
    } catch (err) {
      console.warn("Matching load error", err);
    }
  }

  useEffect(() => {
    loadData();
  }, [query, selectedOrg, minAmount, page]);

  useEffect(() => {
    if (activeTab === "matched" && matchedGrants.length === 0) {
      loadMatched();
    }
  }, [activeTab]);

  async function handleLiveSync() {
    setSyncing(true);
    try {
      const res = await syncFunding([], 15);
      showToast(res.message || "NIH RePORTER data ingestion completed successfully!");
      await loadData();
      if (activeTab === "matched") await loadMatched();
    } catch (err) {
      console.error(err);
      showToast("Live sync encountered an issue. Check network connection.");
    } finally {
      setSyncing(false);
    }
  }

  const organizationsList = stats?.top_organizations || [];

  return (
    <DashboardLayout
      pageTitle="Funding Opportunities Discovery"
      breadcrumbs={["Intelligence Platform", "Module 4", "Funding Intelligence"]}
    >
      <div className="tab-pane-content" style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
        {/* Toast Alert */}
        {toastMsg && (
          <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", padding: "12px 18px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "space-between", fontWeight: "600", fontSize: "0.86rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Sparkles size={16} />
              <span>{toastMsg}</span>
            </div>
            <button type="button" onClick={() => setToastMsg("")} style={{ background: "none", border: "none", color: "#065f46", cursor: "pointer" }}>
              <X size={15} />
            </button>
          </div>
        )}

        {/* Header Title & Actions */}
        <div className="tab-pane-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h3 className="tab-section-title">Funding Opportunity Intelligence & Grant Matching</h3>
            <p className="tab-section-desc">
              Live automated indexing of federal calls, NIH RePORTER, and global research grants matched to your profile.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              className="btn-action-primary"
              onClick={handleLiveSync}
              disabled={syncing}
              style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "9px 16px", borderRadius: "8px", fontWeight: "600", fontSize: "0.84rem", cursor: "pointer" }}
            >
              <RefreshCw size={15} className={syncing ? "spin-icon" : ""} />
              <span>{syncing ? "Ingesting Live Grants..." : "Sync Live Grants (NIH)"}</span>
            </button>
          </div>
        </div>

        {/* Overview Stats Cards */}
        <div className="overview-stats-grid">
          <div className="overview-stat-card">
            <div className="stat-card-header">
              <span className="stat-label">Active Grant Calls</span>
              <DollarSign size={18} className="stat-icon-emerald" />
            </div>
            <div className="stat-val">{stats?.total_opportunities || totalCount}</div>
            <span className="stat-nav-hint">Ingested from NIH RePORTER</span>
          </div>

          <div className="overview-stat-card">
            <div className="stat-card-header">
              <span className="stat-label">Total Funding Volume</span>
              <Award size={18} className="stat-icon-blue" />
            </div>
            <div className="stat-val">
              ${((stats?.total_funding_volume || 0) / 1000000).toFixed(1)}M
            </div>
            <span className="stat-nav-hint">Available research capital</span>
          </div>

          <div className="overview-stat-card">
            <div className="stat-card-header">
              <span className="stat-label">Leading Agency</span>
              <Building size={18} className="stat-icon-purple" />
            </div>
            <div className="stat-val" style={{ fontSize: "1.1rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {organizationsList[0]?.name ? organizationsList[0].name.slice(0, 22) + "..." : "Federal Agencies"}
            </div>
            <span className="stat-nav-hint">{organizationsList[0]?.count || 0} active calls indexed</span>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="module-tab-strip">
          <button
            type="button"
            className={`module-tab-btn ${activeTab === "all" ? "is-active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            <Layers size={16} />
            <span>All Live Opportunities ({totalCount})</span>
          </button>

          <button
            type="button"
            className={`module-tab-btn ${activeTab === "matched" ? "is-active" : ""}`}
            onClick={() => setActiveTab("matched")}
          >
            <Sparkles size={16} />
            <span>Profile Relevance Matches</span>
          </button>
        </div>

        {/* Filter Controls (for All view) */}
        {activeTab === "all" && (
          <div className="module-search-bar" style={{ flexWrap: "wrap", gap: "10px" }}>
            <div className="module-search-input-wrap" style={{ minWidth: "260px" }}>
              <Search size={16} className="search-icon" />
              <input
                type="text"
                className="module-search-input"
                placeholder="Search grant title, keyword, or organization..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <select
                className="module-select"
                value={selectedOrg}
                onChange={(e) => setSelectedOrg(e.target.value)}
              >
                <option value="ALL">All Organizations</option>
                {organizationsList.map((org) => (
                  <option key={org.name} value={org.name}>
                    {org.name.slice(0, 30)} ({org.count})
                  </option>
                ))}
              </select>

              <select
                className="module-select"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
              >
                <option value="">Any Funding Amount</option>
                <option value="50000">$50,000+</option>
                <option value="150000">$150,000+</option>
                <option value="500000">$500,000+</option>
                <option value="1000000">$1,000,000+</option>
              </select>
            </div>
          </div>
        )}

        {/* Opportunity Stream */}
        <div className="publications-stream">
          {loading ? (
            <div className="module-loading">
              <RefreshCw size={26} className="spin-icon" style={{ color: "#22c55e" }} />
              <p>Retrieving live funding opportunities from database...</p>
            </div>
          ) : activeTab === "all" ? (
            grants.length === 0 ? (
              <div className="module-empty">
                <DollarSign size={32} className="module-empty-icon" />
                <h4 style={{ margin: "0 0 6px", color: "#ffffff" }}>No funding opportunities found</h4>
                <p style={{ margin: "0 0 16px", color: "#71717a", fontSize: "0.85rem" }}>
                  Trigger a live sync from NIH RePORTER to ingest official grant calls into the platform.
                </p>
                <button type="button" className="btn-action-primary" onClick={handleLiveSync} disabled={syncing}>
                  <RefreshCw size={14} className={syncing ? "spin-icon" : ""} />
                  <span>Sync Grants from NIH RePORTER</span>
                </button>
              </div>
            ) : (
              grants.map((g) => {
                const deadlineFormatted = g.deadline
                  ? new Date(g.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  : "Open Call / Rolling";

                return (
                  <div key={g.id} className="publication-entry-card">
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap", marginBottom: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span className="tag tag-green">
                          {g.funding_type || "GRANT"}
                        </span>
                        <span style={{ fontSize: "0.74rem", color: "#a1a1aa", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <Building size={13} />
                          <strong style={{ color: "#ffffff" }}>{g.organization || "National Research Institute"}</strong>
                        </span>
                      </div>

                      <span className="tag tag-amber" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <Calendar size={13} />
                        Deadline: {deadlineFormatted}
                      </span>
                    </div>

                    <h4 style={{ margin: "0 0 8px", fontSize: "1.05rem", fontWeight: "700", color: "#ffffff", lineHeight: "1.3" }}>
                      {g.title}
                    </h4>

                    {g.description && (
                      <p style={{ margin: "0 0 12px", fontSize: "0.85rem", color: "var(--charcoal-600)", lineHeight: "1.5", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {g.description}
                      </p>
                    )}

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px", borderTop: "1px solid var(--border-light)", paddingTop: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <span style={{ fontSize: "1.05rem", fontWeight: "800", color: "var(--green)" }}>
                          {g.funding_amount ? `$${Number(g.funding_amount).toLocaleString()} ${g.currency || "USD"}` : "Discretionary Award"}
                        </span>
                        {g.research_areas && g.research_areas.length > 0 && (
                          <span className="tag tag-gray">
                            {g.research_areas[0]}
                          </span>
                        )}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <button
                          type="button"
                          className="btn-action-secondary"
                          onClick={() => setSelectedGrant(g)}
                        >
                          View Details
                        </button>
                        {g.source_url && (
                          <a
                            href={g.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-action-primary"
                          >
                            <span>Official Call</span>
                            <ExternalLink size={13} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )
          ) : (
            /* Matched Tab View */
            matchedGrants.length === 0 ? (
              <div className="module-empty">
                <Sparkles size={32} style={{ color: "var(--green)", marginBottom: "10px" }} />
                <h4 style={{ margin: "0 0 6px", color: "var(--charcoal-900)" }}>Calculating Profile Matches...</h4>
                <p style={{ margin: "0", color: "var(--charcoal-500)", fontSize: "0.85rem" }}>
                  Comparing your research domain, keywords, and publication areas against live grants.
                </p>
              </div>
            ) : (
              matchedGrants.map((item) => {
                const g = item.opportunity;
                const deadlineFormatted = g.deadline
                  ? new Date(g.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                  : "Open Call / Rolling";

                return (
                  <div key={g.id} className="publication-entry-card" style={{ borderColor: "var(--green-border)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span className="tag tag-green" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <Sparkles size={13} /> {item.match_score}% Profile Relevance
                        </span>
                        <span style={{ fontSize: "0.74rem", color: "var(--charcoal-500)" }}>
                          {g.organization}
                        </span>
                      </div>

                      <span className="tag tag-gray">
                        Deadline: {deadlineFormatted}
                      </span>
                    </div>

                    <h4 style={{ margin: "0 0 6px", fontSize: "1.05rem", fontWeight: "700", color: "var(--charcoal-900)" }}>
                      {g.title}
                    </h4>

                    <p style={{ margin: "0 0 10px", fontSize: "0.82rem", color: "var(--green)", fontWeight: "600" }}>
                      ✓ {item.reasoning}
                    </p>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--border-light)", paddingTop: "12px" }}>
                      <span style={{ fontSize: "1.05rem", fontWeight: "800", color: "var(--green)" }}>
                        {g.funding_amount ? `$${Number(g.funding_amount).toLocaleString()} USD` : "Discretionary Award"}
                      </span>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <button
                          type="button"
                          className="btn-action-secondary"
                          onClick={() => setSelectedGrant(g)}
                        >
                          View Details
                        </button>
                        {g.source_url && (
                          <a
                            href={g.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-action-primary"
                          >
                            <span>Apply Call</span>
                            <ExternalLink size={13} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>

        {/* Detail Modal */}
        {selectedGrant && (
          <div className="notif-modal-backdrop" onClick={() => setSelectedGrant(null)}>
            <div className="notif-modal-card" style={{ maxWidth: "600px" }} onClick={(e) => e.stopPropagation()}>
              <div className="notif-modal-header">
                <span className="notif-modal-title">Funding Opportunity Details</span>
                <button type="button" onClick={() => setSelectedGrant(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#71717a" }}>
                  <X size={18} />
                </button>
              </div>
              <div className="notif-modal-body">
                <h4 style={{ margin: "0 0 10px", color: "#ffffff", fontSize: "1.1rem" }}>{selectedGrant.title}</h4>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "16px" }}>
                  <span className="tag tag-gray">
                    Agency: <strong style={{ color: "#ffffff", marginLeft: "4px" }}>{selectedGrant.organization || "National Agency"}</strong>
                  </span>
                  <span className="tag tag-green">
                    Award: ${selectedGrant.funding_amount ? Number(selectedGrant.funding_amount).toLocaleString() : "TBD"}
                  </span>
                  <span className="tag tag-amber">
                    Deadline: {selectedGrant.deadline ? new Date(selectedGrant.deadline).toLocaleDateString() : "Rolling"}
                  </span>
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "#a1a1aa" }}>Description & Scope:</span>
                  <p style={{ fontSize: "0.86rem", color: "#cccccc", lineHeight: "1.6", marginTop: "4px" }}>
                    {selectedGrant.description || "Detailed RFP documentation available via source portal."}
                  </p>
                </div>

                {selectedGrant.eligibility && (
                  <div style={{ marginBottom: "16px" }}>
                    <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "#a1a1aa" }}>Eligibility Criteria:</span>
                    <p style={{ fontSize: "0.86rem", color: "#cccccc", lineHeight: "1.6", marginTop: "4px" }}>
                      {selectedGrant.eligibility}
                    </p>
                  </div>
                )}

                {selectedGrant.keywords && selectedGrant.keywords.length > 0 && (
                  <div>
                    <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "#a1a1aa" }}>Extracted Keywords:</span>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "6px" }}>
                      {selectedGrant.keywords.map((k) => (
                        <span key={k} className="tag tag-blue">
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="notif-modal-footer">
                <button type="button" className="btn-action-secondary" onClick={() => setSelectedGrant(null)}>
                  Close
                </button>
                {selectedGrant.source_url && (
                  <a href={selectedGrant.source_url} target="_blank" rel="noopener noreferrer" className="btn-action-primary">
                    <span>Open NIH Portal</span>
                    <ExternalLink size={13} />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}