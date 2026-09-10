import React, { useState } from "react";
import { Sparkles, Layers, RefreshCw, AlertCircle, Tag, Building } from "lucide-react";

export default function PatentClusteringSection({
  clusterData,
  onRunClustering,
  loading = false,
}) {
  const [numClusters, setNumClusters] = useState(4);

  const clusters = clusterData?.clusters || [];
  const totalClustered = clusterData?.total_records_clustered || 0;
  const isInsufficient = clusterData?.status === "insufficient_data" || totalClustered < 5;

  return (
    <div className="patent-card">
      <div className="patent-section-header">
        <div className="patent-section-title-group">
          <h3>
            <Sparkles size={20} className="stat-icon-amber" />
            SECTION 3: Patent Clustering (Sentence Transformers + Scikit-Learn)
          </h3>
          <p>
            Unsupervised semantic grouping of patent records based on embeddings generated from actual titles and abstracts.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Clusters (k):</span>
            <select
              className="patent-filter-select"
              style={{ width: "65px", padding: "4px 8px" }}
              value={numClusters}
              onChange={(e) => setNumClusters(Number(e.target.value))}
            >
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={5}>5</option>
              <option value={6}>6</option>
              <option value={8}>8</option>
            </select>
          </div>

          <button
            type="button"
            className="patent-btn-secondary"
            onClick={() => onRunClustering(numClusters)}
            disabled={loading}
          >
            <RefreshCw size={13} className={loading ? "spin" : ""} />
            {loading ? "Clustering..." : "Run Clustering"}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="patent-empty-state">
          <div className="patent-empty-text">Generating embeddings & computing clusters...</div>
          <div className="patent-empty-subtext">
            Encoding patent texts with SentenceTransformers and running Scikit-Learn KMeans clustering.
          </div>
        </div>
      ) : isInsufficient ? (
        <div className="patent-empty-state">
          <AlertCircle size={44} className="patent-empty-icon" />
          <div className="patent-empty-text">Not enough patent records for clustering.</div>
          <div className="patent-empty-subtext">
            Clustering requires at least 5 patent records in the system. Sync or search real patents to activate semantic clustering.
          </div>
        </div>
      ) : clusters.length === 0 ? (
        <div className="patent-empty-state">
          <Layers size={44} className="patent-empty-icon" />
          <div className="patent-empty-text">Click "Run Clustering" to group {totalClustered} patent records.</div>
        </div>
      ) : (
        <div className="patent-clusters-grid">
          {clusters.map((c) => (
            <div key={c.cluster_id} className="patent-cluster-card">
              <div className="patent-cluster-top">
                <h4 className="patent-cluster-title">{c.label}</h4>
                <span className="patent-cluster-count">{c.patent_count} Patents</span>
              </div>

              {/* Main technology domain */}
              <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                <span className="patent-domain-badge">{c.dominant_domain}</span>
                {c.dominant_classification && (
                  <span className="patent-class-pill">{c.dominant_classification}</span>
                )}
              </div>

              {/* Top Keywords extracted from actual text */}
              {c.top_keywords && c.top_keywords.length > 0 && (
                <div className="patent-cluster-keywords">
                  {c.top_keywords.map((kw, i) => (
                    <span key={i} className="patent-keyword-tag">
                      <Tag size={10} style={{ marginRight: "3px" }} />
                      {kw}
                    </span>
                  ))}
                </div>
              )}

              {/* Top Assignees in this cluster */}
              {c.top_assignees && c.top_assignees.length > 0 && (
                <div style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
                  <strong style={{ color: "#cbd5e1" }}>Top Assignees: </strong>
                  {c.top_assignees.join(", ")}
                </div>
              )}

              {/* Representative patent records */}
              {c.representative_patents && c.representative_patents.length > 0 && (
                <div className="patent-cluster-reps">
                  <span style={{ fontWeight: 600, color: "#94a3b8" }}>Representative Patents:</span>
                  <ul>
                    {c.representative_patents.map((p) => (
                      <li key={p.id} title={p.title}>
                        • {p.patent_number ? `[${p.patent_number}] ` : ""}
                        {p.title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
