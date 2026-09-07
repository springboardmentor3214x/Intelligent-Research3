import React, { useState, useMemo } from "react";
import {
  FileKey,
  Plus,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  Building,
  Quote,
  ShieldAlert,
  Award
} from "lucide-react";
import PatentModal from "./PatentModal";
import "./Patents.css";

export default function PatentList({
  patents = [],
  onAddPatent,
  onUpdatePatent,
  onDeletePatent,
  onToast
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPat, setEditingPat] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedDomain, setSelectedDomain] = useState("ALL");
  const [sortBy, setSortBy] = useState("citations_desc");
  const [expandedId, setExpandedId] = useState(null);

  // Extract unique domains
  const availableDomains = useMemo(() => {
    const domains = new Set();
    patents.forEach((p) => {
      if (p.technologyDomain) domains.add(p.technologyDomain);
    });
    return Array.from(domains);
  }, [patents]);

  // Filter & Sort
  const filteredPatents = useMemo(() => {
    return patents
      .filter((p) => {
        const q = searchQuery.toLowerCase();
        const matchesQuery =
          !q ||
          p.title?.toLowerCase().includes(q) ||
          p.patentNumber?.toLowerCase().includes(q) ||
          (Array.isArray(p.inventors) ? p.inventors.join(" ") : p.inventors || "").toLowerCase().includes(q) ||
          p.classification?.toLowerCase().includes(q);

        const matchesStatus =
          selectedStatus === "ALL" ||
          (p.status || "").toLowerCase() === selectedStatus.toLowerCase();
        const matchesDomain =
          selectedDomain === "ALL" || p.technologyDomain === selectedDomain;

        return matchesQuery && matchesStatus && matchesDomain;
      })
      .sort((a, b) => {
        if (sortBy === "citations_desc") {
          return (b.citationCount || 0) - (a.citationCount || 0);
        }
        if (sortBy === "filing_desc") {
          return (b.filingDate || "").localeCompare(a.filingDate || "");
        }
        if (sortBy === "title_asc") {
          return (a.title || "").localeCompare(b.title || "");
        }
        return 0;
      });
  }, [patents, searchQuery, selectedStatus, selectedDomain, sortBy]);

  function handleOpenAdd() {
    setEditingPat(null);
    setModalOpen(true);
  }

  function handleOpenEdit(pat) {
    setEditingPat(pat);
    setModalOpen(true);
  }

  async function handleSave(formData) {
    try {
      if (editingPat) {
        await onUpdatePatent(editingPat.id, formData);
        onToast("✓ Patent updated successfully", "success");
      } else {
        await onAddPatent(formData);
        onToast("✓ Patent registered successfully", "success");
      }
      setModalOpen(false);
    } catch (err) {
      onToast("Failed to save patent", "error");
    }
  }

  async function handleDelete(id, title) {
    if (!window.confirm(`Delete patent "${title}"? This cannot be undone.`)) return;
    try {
      await onDeletePatent(id);
      onToast("✓ Patent record deleted", "info");
    } catch (err) {
      onToast("Failed to delete patent", "error");
    }
  }

  return (
    <div className="tab-pane-content">
      {/* ── Header ── */}
      <div className="tab-pane-header">
        <div>
          <h3 className="tab-section-title">
            Patents & Intellectual Property ({patents.length})
          </h3>
          <p className="tab-section-desc">
            Granted patents, published applications, and international PCT priority filings.
          </p>
        </div>
        <button
          type="button"
          className="btn-action-primary"
          onClick={handleOpenAdd}
        >
          <Plus size={16} />
          <span>Add Patent</span>
        </button>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="filter-controls-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patents by title, patent number, inventors, classification..."
            className="filter-search-input"
          />
        </div>

        <div className="filter-selects-row">
          <div className="filter-select-group">
            <span className="filter-label">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="filter-select"
            >
              <option value="ALL">All Statuses</option>
              <option value="Granted">Granted</option>
              <option value="Published">Published</option>
              <option value="Pending">Pending</option>
              <option value="Filed">Filed</option>
              <option value="Expired">Expired</option>
            </select>
          </div>

          <div className="filter-select-group">
            <span className="filter-label">Domain:</span>
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="filter-select"
            >
              <option value="ALL">All Domains</option>
              {availableDomains.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-select-group">
            <span className="filter-label">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="filter-select"
            >
              <option value="citations_desc">Most Citations</option>
              <option value="filing_desc">Newest Filing</option>
              <option value="title_asc">Title (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Patent Cards ── */}
      {filteredPatents.length === 0 ? (
        <div className="empty-state-panel">
          <FileKey size={40} className="empty-state-icon" />
          <h4 className="empty-state-title">
            {patents.length === 0 ? "No Patents Registered Yet" : "No Patents Match Filters"}
          </h4>
          <p className="empty-state-text">
            {patents.length === 0
              ? "Register your intellectual property assets to boost your Innovation Score and commercialization rating."
              : "Adjust your search terms or reset the status filters."}
          </p>
          {patents.length === 0 ? (
            <button
              type="button"
              className="btn-action-primary"
              onClick={handleOpenAdd}
            >
              <Plus size={16} /> Add First Patent
            </button>
          ) : (
            <button
              type="button"
              className="btn-action-secondary"
              onClick={() => {
                setSearchQuery("");
                setSelectedStatus("ALL");
                setSelectedDomain("ALL");
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="patents-stream">
          {filteredPatents.map((pat) => {
            const isExpanded = expandedId === pat.id;
            const inventorsList = Array.isArray(pat.inventors)
              ? pat.inventors.join(", ")
              : pat.inventors || "Inventors not specified";

            return (
              <article key={pat.id} className="patent-entry-card">
                <div className="patent-card-header">
                  <div className="patent-card-main-info">
                    <div className="patent-badge-row">
                      <span className={`patent-status-chip status-${(pat.status || "pending").toLowerCase()}`}>
                        {pat.status || "Pending"}
                      </span>
                      <span className="patent-num-badge">{pat.patentNumber}</span>
                      {pat.technologyDomain && (
                        <span className="patent-tech-tag">
                          <Layers size={13} /> {pat.technologyDomain}
                        </span>
                      )}
                    </div>

                    <h4 className="patent-entry-title">{pat.title}</h4>

                    <div className="patent-meta-items">
                      <span className="patent-meta-entry">
                        <strong>Inventors:</strong> {inventorsList}
                      </span>
                      {pat.assignee && (
                        <span className="patent-meta-entry">
                          <Building size={13} /> <strong>Assignee:</strong> {pat.assignee}
                        </span>
                      )}
                      {pat.classification && (
                        <span className="patent-meta-entry">
                          <strong>Classification:</strong> {pat.classification}
                        </span>
                      )}
                      <span className="patent-meta-entry">
                        <Calendar size={13} /> Filed: {pat.filingDate}
                        {pat.grantDate && ` • Granted: ${pat.grantDate}`}
                      </span>
                    </div>
                  </div>

                  <div className="patent-card-right-stats">
                    <div className="citation-count-badge">
                      <Quote size={14} />
                      <span className="cite-num">{pat.citationCount || 0}</span>
                      <small className="cite-text">Citations</small>
                    </div>

                    <div className="patent-card-actions">
                      <button
                        type="button"
                        className="btn-icon-ghost"
                        onClick={() => handleOpenEdit(pat)}
                        title="Edit patent"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn-icon-danger"
                        onClick={() => handleDelete(pat.id, pat.title)}
                        title="Delete patent"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Description Accordion */}
                {pat.description && (
                  <div className="patent-desc-section">
                    <button
                      type="button"
                      className="btn-toggle-abstract"
                      onClick={() => setExpandedId(isExpanded ? null : pat.id)}
                    >
                      <span>{isExpanded ? "Hide Description" : "View Claims & Abstract"}</span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {isExpanded && (
                      <p className="patent-desc-text animate-fade-in">{pat.description}</p>
                    )}
                  </div>
                )}

                {pat.patentUrl && (
                  <div className="patent-footer-link">
                    <a
                      href={pat.patentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pub-external-link"
                    >
                      <span>View Patent Repository Record</span>
                      <ExternalLink size={13} />
                    </a>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      <PatentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        editingPatent={editingPat}
      />
    </div>
  );
}