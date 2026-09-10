import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import FundingCard from "../../components/funding/FundingCard";
import fundingService from "../../services/fundingService";
import {
  Search,
  DollarSign,
  Building,
  CheckCircle,
  Filter,
  RefreshCw,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Globe
} from "lucide-react";

export default function FundingOpportunitiesPage() {
  const navigate = useNavigate();

  const [opportunities, setOpportunities] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [query, setQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [agency, setAgency] = useState("");
  const [fundingType, setFundingType] = useState("");
  const [country, setCountry] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [savingId, setSavingId] = useState(null);

  const fetchOpportunities = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fundingService.getFunding({
        q: searchQuery,
        agency,
        funding_type: fundingType,
        country,
        is_active: isActive,
        page,
        page_size: 10,
      });

      setOpportunities(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      console.error("Failed to load funding opportunities:", err);
      setError(err.message || "Failed to load funding opportunities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, [searchQuery, agency, fundingType, country, isActive, page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearchQuery(query.trim());
  };

  const handleClearFilters = () => {
    setQuery("");
    setSearchQuery("");
    setAgency("");
    setFundingType("");
    setCountry("");
    setIsActive(true);
    setPage(1);
  };

  const handleToggleSave = async (oppId, currentSaved) => {
    setSavingId(oppId);
    try {
      if (currentSaved) {
        await fundingService.unsaveFunding(oppId);
      } else {
        await fundingService.saveFunding(oppId);
      }
      setOpportunities((prev) =>
        prev.map((o) => (o.id === oppId ? { ...o, is_saved: !currentSaved } : o))
      );
    } catch (err) {
      console.error("Failed to update save status:", err);
    } finally {
      setSavingId(null);
    }
  };

  const totalCeilingInView = opportunities.reduce(
    (acc, o) => acc + (o.award_ceiling || 0),
    0
  );

  return (
    <DashboardLayout
      pageTitle="Funding Opportunities Discovery"
      breadcrumbs={["Platform", "Module 4", "Funding Opportunities Discovery"]}
    >
      <div className="tab-pane-content">
        <div className="tab-pane-header">
          <div>
            <h3 className="tab-section-title">Funding Opportunities Discovery</h3>
            <p className="tab-section-desc">
              Search and discover grants, research councils, innovation funds, and funding calls.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="overview-stats-grid">
          <div className="overview-stat-card">
            <div className="stat-card-header">
              <span className="stat-label">Total Indexed Grants</span>
              <Search size={18} className="stat-icon-blue" />
            </div>
            <div className="stat-val">{total.toLocaleString()}</div>
            <span className="stat-nav-hint">Across funding sources</span>
          </div>

          <div className="overview-stat-card">
            <div className="stat-card-header">
              <span className="stat-label">Results On Page</span>
              <DollarSign size={18} className="stat-icon-emerald" />
            </div>
            <div className="stat-val">{opportunities.length}</div>
            <span className="stat-nav-hint">Displayed on page {page}</span>
          </div>

          <div className="overview-stat-card">
            <div className="stat-card-header">
              <span className="stat-label">Active Filter Scope</span>
              <Filter size={18} className="stat-icon-purple" />
            </div>
            <div className="stat-val">
              {agency || fundingType || (country ? `Country: ${country}` : "Global Calls")}
            </div>
            <span className="stat-nav-hint">
              {isActive ? "Open & active calls" : "All status calls"}
            </span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <form onSubmit={handleSearch} className="filter-controls-bar">
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search grants by keyword, topic, agency, CFDA..."
              className="filter-search-input"
            />
          </div>

          <div className="filter-selects-row">
            <div className="filter-select-group">
              <span className="filter-label">Agency:</span>
              <select
                value={agency}
                onChange={(e) => {
                  setAgency(e.target.value);
                  setPage(1);
                }}
                className="filter-select"
              >
                <option value="">All Agencies</option>
                <option value="National Science Foundation">National Science Foundation</option>
                <option value="National Institutes of Health">National Institutes of Health</option>
                <option value="Department of Energy">Department of Energy</option>
                <option value="DARPA">DARPA</option>
                <option value="European Innovation Council">European Innovation Council</option>
                <option value="SERB">SERB India</option>
              </select>
            </div>

            <div className="filter-select-group">
              <span className="filter-label">Type:</span>
              <select
                value={fundingType}
                onChange={(e) => {
                  setFundingType(e.target.value);
                  setPage(1);
                }}
                className="filter-select"
              >
                <option value="">All Types</option>
                <option value="Grant">Grant</option>
                <option value="Cooperative Agreement">Cooperative Agreement</option>
                <option value="Fellowship">Fellowship</option>
                <option value="Contract">Contract / RFP</option>
              </select>
            </div>

            <div className="filter-select-group">
              <span className="filter-label">Country:</span>
              <select
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  setPage(1);
                }}
                className="filter-select"
              >
                <option value="">All Countries</option>
                <option value="United States">United States</option>
                <option value="European Union">European Union</option>
                <option value="India">India</option>
                <option value="International">International</option>
              </select>
            </div>

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "0.78rem",
                color: "#334155",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => {
                  setIsActive(e.target.checked);
                  setPage(1);
                }}
                style={{ accentColor: "#1e40af" }}
              />
              Active Only
            </label>

            <button type="submit" className="btn-action-primary" style={{ padding: "7px 14px" }}>
              <Search size={14} /> Search
            </button>

            {(searchQuery || agency || fundingType || country || !isActive) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="btn-action-secondary"
                style={{ padding: "7px 12px", fontSize: "0.8rem" }}
              >
                Reset
              </button>
            )}
          </div>
        </form>

        {/* Comparison floating/bottom action banner */}
        {selectedForCompare.length > 0 && (
          <div
            style={{
              background: "#1e1b4b",
              color: "#ffffff",
              borderRadius: "8px",
              padding: "12px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 4px 14px rgba(0, 0, 0, 0.15)",
              animation: "fadeIn 0.2s ease-out",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <GitCompare size={18} style={{ color: "#a5b4fc" }} />
              <span style={{ fontSize: "0.88rem", fontWeight: 600 }}>
                {selectedForCompare.length} grant opportunity{selectedForCompare.length > 1 ? "ies" : "y"} selected for comparison
              </span>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setSelectedForCompare([])}
                style={{
                  background: "transparent",
                  border: "1px solid #4338ca",
                  color: "#c7d2fe",
                  borderRadius: "6px",
                  padding: "6px 12px",
                  fontSize: "0.8rem",
                  cursor: "pointer",
                }}
              >
                Clear Selection
              </button>

              <button
                type="button"
                onClick={handleGoToCompare}
                style={{
                  background: "#4f46e5",
                  border: "none",
                  color: "#ffffff",
                  borderRadius: "6px",
                  padding: "6px 16px",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                Compare Side-by-Side <GitCompare size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Opportunities List */}
        {loading ? (
          <div className="form-card-panel" style={{ textAlign: "center", padding: "48px" }}>
            <RefreshCw size={28} className="animate-spin" style={{ color: "#2563eb", margin: "0 auto 12px" }} />
            <p style={{ margin: 0, color: "#64748b" }}>Loading funding opportunities...</p>
          </div>
        ) : error ? (
          <div className="form-card-panel" style={{ textAlign: "center", padding: "36px", borderColor: "#fecaca" }}>
            <AlertCircle size={28} style={{ color: "#ef4444", margin: "0 auto 8px" }} />
            <p style={{ color: "#b91c1c", fontWeight: 600, margin: "0 0 8px" }}>{error}</p>
            <button type="button" onClick={fetchOpportunities} className="btn-action-primary">
              Retry
            </button>
          </div>
        ) : opportunities.length === 0 ? (
          <div className="form-card-panel" style={{ textAlign: "center", padding: "48px" }}>
            <DollarSign size={36} style={{ color: "#94a3b8", margin: "0 auto 12px" }} />
            <h4 style={{ margin: "0 0 6px", color: "#0f172a" }}>No Funding Opportunities Found</h4>
            <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: "0.88rem" }}>
              Try broadening your search or unchecking "Active Only".
            </p>
            <button type="button" onClick={handleClearFilters} className="btn-action-secondary">
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="publications-stream">
            {opportunities.map((opp) => (
              <FundingCard
                key={opp.id}
                opportunity={opp}
                onToggleSave={handleToggleSave}
                saving={savingId === opp.id}
                isSelectedForCompare={selectedForCompare.includes(opp.id)}
                onToggleCompare={handleToggleCompare}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "12px",
              marginTop: "20px",
            }}
          >
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="btn-action-secondary btn-sm"
            >
              <ChevronLeft size={16} /> Prev
            </button>

            <span style={{ fontSize: "0.85rem", color: "#475569" }}>
              Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({total} grants)
            </span>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="btn-action-secondary btn-sm"
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}