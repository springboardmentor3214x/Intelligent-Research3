import { useState, useEffect } from 'react';
import { fetchPatents, clusterPatentsByTechnology } from '../../services/patentService';
import PatentCard from '../../components/patents/PatentCard';
import { Network, Layers, Sparkles, Building2 } from 'lucide-react';

export default function PatentClustering({
  onSelectDetails,
  onToggleSave,
  savedPatentIds = new Set(),
}) {
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatentClusters();
  }, []);

  const loadPatentClusters = async () => {
    setLoading(true);
    try {
      const pats = await fetchPatents('Artificial Intelligence Medical Quantum Energy Security', { limit: 20 });
      const groupResults = clusterPatentsByTechnology(pats);
      setClusters(groupResults);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="ri-page-header">
        <h1 className="ri-page-title">Patent Technology Clustering</h1>
        <p className="ri-page-subtitle">
          Automated grouping of patent literature into cohesive technology clusters based on title, abstract, and IPC similarity.
        </p>
      </div>

      {/* Info Banner */}
      <div style={{ background: '#F5F3FF', border: '1px solid #DDD6FE', padding: '16px 20px', borderRadius: 10, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
        <Network size={24} color="var(--ri-purple)" style={{ flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#5B21B6', marginBottom: 2 }}>
            TF-IDF &amp; Cosine Text Similarity Pipeline
          </div>
          <div style={{ fontSize: 13, color: '#6D28D9' }}>
            Extracted themes cluster related patent claims and assignees into actionable innovation domains.
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ background: '#fff', padding: 32, borderRadius: 10, border: '1px solid var(--ri-border-subtle)' }}>
          <div className="ri-skeleton" style={{ height: 24, width: '40%', marginBottom: 16 }} />
          <div className="ri-skeleton" style={{ height: 160, width: '100%' }} />
        </div>
      ) : clusters.length === 0 ? (
        <div className="ri-empty-state">
          <Network size={32} className="ri-empty-icon" color="var(--ri-purple)" />
          <h3 className="ri-empty-title">Insufficient patent data for clustering</h3>
        </div>
      ) : (
        <div>
          {clusters.map((cluster) => (
            <div key={cluster.cluster_id} className="ri-cluster-card">
              <div className="ri-cluster-header">
                <div>
                  <div style={{ fontSize: 11, color: 'var(--ri-purple)', fontWeight: 700, textTransform: 'uppercase' }}>
                    {cluster.cluster_id} · {cluster.count} Patent Specifications
                  </div>
                  <h3 className="ri-cluster-title">{cluster.title}</h3>
                </div>

                <div style={{ display: 'flex', gap: 6 }}>
                  {cluster.top_assignees.map((assignee, i) => (
                    <span key={i} className="ri-meta-pill" style={{ background: 'var(--ri-purple-bg)', color: 'var(--ri-purple)', fontWeight: 600 }}>
                      <Building2 size={12} style={{ display: 'inline', marginRight: 4 }} />
                      {assignee}
                    </span>
                  ))}
                </div>
              </div>

              {/* Cluster Patents Grid */}
              <div className="ri-papers-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                {cluster.patents.map((pat) => (
                  <PatentCard
                    key={pat.id}
                    patent={pat}
                    onSelectDetails={onSelectDetails}
                    onToggleSave={onToggleSave}
                    isSaved={savedPatentIds.has(pat.id) || savedPatentIds.has(pat.external_id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
