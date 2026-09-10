import React from "react";
import {
  FileText,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Quote,
  Building,
  Calendar,
  Layers,
  Inbox,
} from "lucide-react";

export default function PatentResultsSection({
  patents = [],
  total = 0,
  page = 1,
  pageSize = 20,
  totalPages = 1,
  onPageChange,
  onSelectPatent,
  loading = false,
}) {
  if (loading) {
    return (
      <div className="patent-card">
        <div className="patent-section-header">
          <div className="patent-section-title-group">
            <h3>SECTION 2: Patent Results</h3>
          </div>
        </div>
        <div className="patent-empty-state">
          <div className="patent-empty-text">Loading patent records...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="patent-card">
      <div className="patent-section-header">
        <div className="patent-section-title-group">
          <h3>
            <FileText size={20} className="stat-icon-blue" />
            SECTION 2: Patent Results
          </h3>
          <p>
            Showing {patents.length} of {total} real patent records
          </p>
        </div>
        <div className="patent-section-badge">
          {total} Records Found
        </div>
      </div>

      {patents.length === 0 ? (
        <div className="patent-empty-state">
          <Inbox size={48} className="patent-empty-icon" />
          <div className="patent-empty-text">No patent data available.</div>
          <div className="patent-empty-subtext">
            Try adjusting your search terms, changing filters, or syncing new patent records from the provider.
          </div>
        </div>
      ) : (
        <>
          <div className="patent-table-wrap">
            <table className="patent-table">
              <thead>
                <tr>
                  <th>Patent Title</th>
                  <th>Assignee</th>
                  <th>Filing Date</th>
                  <th>Patent Classification</th>
                  <th>Technology Domain</th>
                  <th>Citation Count</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {patents.map((p) => (
                  <tr key={p.id}>
                    {/* 1. Patent Title */}
                    <td className="patent-title-cell">
                      <div
                        style={{ cursor: "pointer", color: "#f8fafc" }}
                        onClick={() => onSelectPatent && onSelectPatent(p)}
                        title="Click to view full patent details"
                      >
                        {p.title}
                      </div>
                      {p.patent_number && (
                        <span className="patent-sub-id">{p.patent_number}</span>
                      )}
                    </td>

                    {/* 2. Assignee */}
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Building size={14} color="#94a3b8" />
                        <span>{p.assignee_normalized || p.assignee || "Not available"}</span>
                      </div>
                    </td>

                    {/* 3. Filing Date */}
                    <td style={{ whiteSpace: "nowrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <Calendar size={14} color="#94a3b8" />
                        <span>{p.filing_date || "Not available"}</span>
                      </div>
                    </td>

                    {/* 4. Patent Classification */}
                    <td>
                      {p.patent_classification && p.patent_classification !== "Not available" ? (
                        <span className="patent-class-pill">
                          {p.patent_classification}
                        </span>
                      ) : (
                        <span style={{ color: "#64748b", fontSize: "0.8rem" }}>Not available</span>
                      )}
                    </td>

                    {/* 5. Technology Domain */}
                    <td>
                      <span className="patent-domain-badge">
                        {p.technology_domain || "Not available"}
                      </span>
                    </td>

                    {/* 6. Citation Count */}
                    <td>
                      {p.citation_count !== null && p.citation_count !== undefined ? (
                        <span className="patent-citation-pill">
                          <Quote size={12} />
                          {p.citation_count}
                        </span>
                      ) : (
                        <span style={{ color: "#64748b", fontSize: "0.8rem" }}>Not available</span>
                      )}
                    </td>

                    {/* Source link */}
                    <td style={{ textAlign: "center" }}>
                      {p.source_url ? (
                        <a
                          href={p.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="patent-ext-link"
                          title="Open patent on official registry"
                        >
                          <ExternalLink size={15} />
                        </a>
                      ) : (
                        <span style={{ color: "#64748b" }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="patent-pagination">
            <span className="patent-pagination-info">
              Page {page} of {totalPages || 1} ({total} total patents)
            </span>
            <div className="patent-pagination-btns">
              <button
                type="button"
                className="patent-btn-secondary"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <button
                type="button"
                className="patent-btn-secondary"
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
