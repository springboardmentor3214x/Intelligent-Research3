import React from "react";

export default function MatchScore({ score, breakdown }) {
  if (score === undefined || score === null) return null;

  const pct = Math.round(score * 100);

  let badgeColor = "#16a34a"; // green
  let bgColor = "#ecfdf5";
  let borderColor = "#a7f3d0";

  if (pct < 50) {
    badgeColor = "#dc2626"; // red
    bgColor = "#fef2f2";
    borderColor = "#fecaca";
  } else if (pct < 75) {
    badgeColor = "#d97706"; // amber
    bgColor = "#fffbeb";
    borderColor = "#fde68a";
  }

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-end", gap: "3px" }}>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "4px",
          background: bgColor,
          border: `1px solid ${borderColor}`,
          color: badgeColor,
          padding: "3px 8px",
          borderRadius: "6px",
          fontSize: "0.8rem",
          fontWeight: 700,
        }}
      >
        <span>{pct}%</span>
        <span style={{ fontSize: "0.7rem", fontWeight: 600, opacity: 0.85 }}>Match</span>
      </div>

      {breakdown && (
        <div style={{ fontSize: "0.68rem", color: "#64748b" }}>
          Areas: {Math.round((breakdown.research_area_score || 0) * 100)}% | Keywords: {Math.round((breakdown.keyword_score || 0) * 100)}%
        </div>
      )}
    </div>
  );
}
