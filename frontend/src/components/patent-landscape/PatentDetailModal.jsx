import React from "react";
import { X, ExternalLink, Building, Calendar, Quote, Layers, ShieldCheck, FileText } from "lucide-react";

export default function PatentDetailModal({ patent, onClose }) {
  if (!patent) return null;

  const assigneeText = patent.assignee_normalized || patent.assignee || "Not available";
  const filingDateText = patent.filing_date || "Not available";
  const classText = patent.patent_classification || "Not available";
  const domainText = patent.technology_domain || "Not available";
  const citationsText = patent.citation_count !== null && patent.citation_count !== undefined ? `${patent.citation_count} Citations` : "Not available";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--clr-bg-surface, #0f172a)",
          border: "1px solid var(--clr-border, #1e293b)",
          borderRadius: "16px",
          maxWidth: "720px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "24px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
          <div>
            {patent.patent_number && (
              <span style={{ fontSize: "0.8rem", color: "#818cf8", fontFamily: "monospace" }}>
                {patent.patent_number}
              </span>
            )}
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#f8fafc", margin: "4px 0 0" }}>
              {patent.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              padding: "4px",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Badges / Metadata Row */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
          <span className="patent-domain-badge">{domainText}</span>
          <span className="patent-class-pill">Classification: {classText}</span>
          <span className="patent-citation-pill">
            <Quote size={12} /> {citationsText}
          </span>
        </div>

        {/* Info Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "12px",
            background: "var(--clr-bg-base, #0b0f19)",
            padding: "14px 16px",
            borderRadius: "10px",
            fontSize: "0.85rem",
          }}
        >
          <div>
            <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem" }}>Assignee</span>
            <strong style={{ color: "#f1f5f9" }}>{assigneeText}</strong>
          </div>
          <div>
            <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem" }}>Filing Date</span>
            <strong style={{ color: "#f1f5f9" }}>{filingDateText}</strong>
          </div>
          <div>
            <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem" }}>Country / Source</span>
            <strong style={{ color: "#f1f5f9" }}>{patent.country || "US"} ({patent.source?.toUpperCase()})</strong>
          </div>
          {patent.publication_date && (
            <div>
              <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem" }}>Publication Date</span>
              <strong style={{ color: "#f1f5f9" }}>{patent.publication_date}</strong>
            </div>
          )}
        </div>

        {/* Abstract */}
        {patent.abstract ? (
          <div>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
              Abstract
            </span>
            <p style={{ fontSize: "0.875rem", color: "#cbd5e1", lineHeight: 1.6, marginTop: "6px" }}>
              {patent.abstract}
            </p>
          </div>
        ) : (
          <div>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
              Abstract
            </span>
            <p style={{ fontSize: "0.875rem", color: "#64748b", fontStyle: "italic", marginTop: "4px" }}>
              Not available
            </p>
          </div>
        )}

        {/* Claims (when available from SerpApi details) */}
        {patent.claims_text && (
          <div>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
              Patent Claims
            </span>
            <div
              style={{
                fontSize: "0.82rem",
                color: "#94a3b8",
                lineHeight: 1.5,
                marginTop: "6px",
                maxHeight: "160px",
                overflowY: "auto",
                background: "var(--clr-bg-base, #0b0f19)",
                padding: "10px",
                borderRadius: "8px",
                whiteSpace: "pre-wrap",
              }}
            >
              {patent.claims_text}
            </div>
          </div>
        )}

        {/* Source Link */}
        {patent.source_url && (
          <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: "8px" }}>
            <a
              href={patent.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="patent-btn-primary"
              style={{ textDecoration: "none", fontSize: "0.85rem" }}
            >
              <ExternalLink size={14} /> Open Google Patents Page
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
