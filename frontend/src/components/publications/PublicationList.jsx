import React, { useState, useMemo } from "react";
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  ExternalLink,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  Quote,
  Calendar,
  Layers,
  Sparkles
} from "lucide-react";
import PublicationModal from "./PublicationModal";
import "./Publications.css";

export default function PublicationList({
  publications = [],
  onAddPublication,
  onUpdatePublication,
  onDeletePublication,
  onToast
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPub, setEditingPub] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedYear, setSelectedYear] = useState("ALL");
  const [sortBy, setSortBy] = useState("citations_desc");
  const [expandedId, setExpandedId] = useState(null);

  // Extract unique years
  const availableYears = useMemo(() => {
    const years = new Set();
    publications.forEach((p) => {
      if (p.publicationDate) {
        years.add(p.publicationDate.slice(0, 4));
      }
    });
    return Array.from(years).sort().reverse();
  }, [publications]);

  // Filter & Sort
  const filteredPublications = useMemo(() => {
    return publications
      .filter((p) => {
        const q = searchQuery.toLowerCase();
        const matchesQuery =
          !q ||
          p.title?.toLowerCase().includes(q) ||
          p.journal?.toLowerCase().includes(q) ||
          (Array.isArray(p.authors) ? p.authors.join(" ") : p.authors || "").toLowerCase().includes(q) ||
          p.keywords?.toLowerCase().includes(q);

        const matchesType = selectedType === "ALL" || p.type === selectedType;
        const matchesYear =
          selectedYear === "ALL" ||
          (p.publicationDate && p.publicationDate.startsWith(selectedYear));

        return matchesQuery && matchesType && matchesYear;
      })
      .sort((a, b) => {
        if (sortBy === "citations_desc") {
          return (b.citationCount || 0) - (a.citationCount || 0);
        }
        if (sortBy === "date_desc") {
          return (b.publicationDate || "").localeCompare(a.publicationDate || "");
        }
        if (sortBy === "title_asc") {
          return (a.title || "").localeCompare(b.title || "");
        }
        return 0;
      });
  }, [publications, searchQuery, selectedType, selectedYear, sortBy]);

  function handleOpenAdd() {
    setEditingPub(null);
    setModalOpen(true);
  }

  function handleOpenEdit(pub) {
    setEditingPub(pub);
    setModalOpen(true);
  }

  async function handleSave(formData) {
    try {
      if (editingPub) {
        await onUpdatePublication(editingPub.id, formData);
        onToast("✓ Publication updated successfully", "success");
      } else {
        await onAddPublication(formData);
        onToast("✓ Publication added successfully", "success");
      }
      setModalOpen(false);
    } catch (err) {
      onToast("Failed to save publication", "error");
    }
  }

  async function handleDelete(id, title) {
    if (!window.confirm(`Delete publication "${title}"? This cannot be undone.`)) return;
    try {
      await onDeletePublication(id);
      onToast("✓ Publication deleted successfully", "info");
    } catch (err) {
      onToast("Failed to delete publication", "error");
    }
  }

  return (
    <div className="tab-pane-content">
      {/* ── Header ── */}
      <div className="tab-pane-header">
        <div>
          <h3 className="tab-section-title">
            Publications Record ({publications.length})
          </h3>
          <p className="tab-section-desc">
            Peer-reviewed journals, conference proceedings, preprints, and workshop manuscripts.
          </p>
        </div>
        <button
          type="button"
          className="btn-action-primary"
          onClick={handleOpenAdd}
        >
          <Plus size={16} />
          <span>Add Publication</span>
        </button>
      </div>

      {/* ── Search, Filters, Sort Bar ── */}
      <div className="filter-controls-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search papers by title, author, journal, or keyword..."
            className="filter-search-input"
          />
        </div>

        <div className="filter-selects-row">
          <div className="filter-select-group">
            <span className="filter-label">Type:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="filter-select"
            >
              <option value="ALL">All Types</option>
              <option value="Journal">Journal</option>
              <option value="Conference">Conference</option>
              <option value="Book Chapter">Book Chapter</option>
              <option value="Workshop">Workshop</option>
              <option value="Preprint">Preprint</option>
              <option value="Technical Report">Technical Report</option>
            </select>
          </div>

          <div className="filter-select-group">
            <span className="filter-label">Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="filter-select"
            >
              <option value="ALL">All Years</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
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
              <option value="date_desc">Newest First</option>
              <option value="title_asc">Title (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Publications List ── */}
      {filteredPublications.length === 0 ? (
        <div className="empty-state-panel">
          <BookOpen size={40} className="empty-state-icon" />
          <h4 className="empty-state-title">
            {publications.length === 0
              ? "No Publications Added Yet"
              : "No Publications Match Your Filters"}
          </h4>
          <p className="empty-state-text">
            {publications.length === 0
              ? "Add your published research articles to strengthen your academic profile and grant readiness score."
              : "Try adjusting your search query or reset the filter dropdowns."}
          </p>
          {publications.length === 0 ? (
            <button
              type="button"
              className="btn-action-primary"
              onClick={handleOpenAdd}
            >
              <Plus size={16} /> Add First Publication
            </button>
          ) : (
            <button
              type="button"
              className="btn-action-secondary"
              onClick={() => {
                setSearchQuery("");
                setSelectedType("ALL");
                setSelectedYear("ALL");
              }}
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="publications-stream">
          {filteredPublications.map((pub) => {
            const isExpanded = expandedId === pub.id;
            const authorsList = Array.isArray(pub.authors)
              ? pub.authors.join(", ")
              : pub.authors || "Authors not specified";

            return (
              <article key={pub.id} className="publication-entry-card">
                <div className="pub-card-header">
                  <div className="pub-card-main-info">
                    <div className="pub-badge-row">
                      <span className={`badge-pub-type type-${(pub.type || "journal").toLowerCase().replace(/\s+/g, "-")}`}>
                        {pub.type || "Journal"}
                      </span>
                      {pub.publicationDate && (
                        <span className="pub-date-text">
                          <Calendar size={13} /> {pub.publicationDate}
                        </span>
                      )}
                      {pub.researchDomain && (
                        <span className="pub-domain-text">
                          <Layers size={13} /> {pub.researchDomain}
                        </span>
                      )}
                    </div>

                    <h4 className="pub-entry-title">{pub.title}</h4>
                    <p className="pub-entry-authors">{authorsList}</p>
                    <p className="pub-entry-venue">
                      <strong>{pub.journal}</strong>
                      {pub.doi && <span className="pub-doi">DOI: {pub.doi}</span>}
                    </p>
                  </div>

                  <div className="pub-card-right-stats">
                    <div className="citation-count-badge">
                      <Quote size={14} />
                      <span className="cite-num">{pub.citationCount || 0}</span>
                      <small className="cite-text">Citations</small>
                    </div>

                    <div className="pub-card-actions">
                      <button
                        type="button"
                        className="btn-icon-ghost"
                        onClick={() => handleOpenEdit(pub)}
                        title="Edit publication"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn-icon-danger"
                        onClick={() => handleDelete(pub.id, pub.title)}
                        title="Delete publication"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {pub.keywords && (
                  <div className="pub-keywords-strip">
                    <span className="keywords-label">Keywords:</span>
                    <span className="keywords-val">{pub.keywords}</span>
                  </div>
                )}

                {/* Abstract Accordion */}
                {pub.abstract && (
                  <div className="pub-abstract-section">
                    <button
                      type="button"
                      className="btn-toggle-abstract"
                      onClick={() => setExpandedId(isExpanded ? null : pub.id)}
                    >
                      <span>{isExpanded ? "Hide Abstract" : "Read Abstract"}</span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {isExpanded && (
                      <p className="pub-abstract-text animate-fade-in">{pub.abstract}</p>
                    )}
                  </div>
                )}

                {pub.url && (
                  <div className="pub-footer-link">
                    <a
                      href={pub.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pub-external-link"
                    >
                      <span>View Publication</span>
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
      <PublicationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        editingPublication={editingPub}
      />
    </div>
  );
}