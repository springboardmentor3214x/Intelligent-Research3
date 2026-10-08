import { useState, useEffect } from 'react';
import { fetchPatents, buildInnovationMapData } from '../../services/patentService';
import { GitMerge, ArrowRight, Layers, Building2, Network, BookOpen } from 'lucide-react';

export default function InnovationMapping() {
  const [mapNodes, setMapNodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMap();
  }, []);

  const loadMap = async () => {
    setLoading(true);
    try {
      const data = await fetchPatents('Artificial Intelligence Quantum Energy Biotech Security', { limit: 20 });
      const nodes = buildInnovationMapData(data);
      setMapNodes(nodes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="ri-page-header">
        <h1 className="ri-page-title">Innovation Mapping Graph</h1>
        <p className="ri-page-subtitle">
          Visual mapping connecting Research Domains to Technology Vectors, Patent Clusters, and Assignees.
        </p>
      </div>

      {loading ? (
        <div style={{ background: '#fff', padding: 32, borderRadius: 10, border: '1px solid var(--ri-border-subtle)' }}>
          <div className="ri-skeleton" style={{ height: 24, width: '40%', marginBottom: 16 }} />
          <div className="ri-skeleton" style={{ height: 160, width: '100%' }} />
        </div>
      ) : (
        <div className="ri-map-container">
          {mapNodes.map((node, i) => (
            <div key={i} className="ri-map-node-row">
              {/* Node 1: Research Area */}
              <div className="ri-map-step-box" style={{ borderLeft: '4px solid var(--ri-blue-accent)' }}>
                <div className="ri-map-step-label">1. Research Domain (Mod 2)</div>
                <div className="ri-map-step-val" style={{ color: 'var(--ri-blue-accent)' }}>
                  {node.research_area}
                </div>
              </div>

              <ArrowRight size={20} className="ri-map-arrow" />

              {/* Node 2: Technology Domain */}
              <div className="ri-map-step-box" style={{ borderLeft: '4px solid var(--ri-success)' }}>
                <div className="ri-map-step-label">2. Technology Vector</div>
                <div className="ri-map-step-val" style={{ color: '#047857' }}>
                  {node.technology_domain}
                </div>
              </div>

              <ArrowRight size={20} className="ri-map-arrow" />

              {/* Node 3: Patent Cluster */}
              <div className="ri-map-step-box" style={{ borderLeft: '4px solid var(--ri-purple)' }}>
                <div className="ri-map-step-label">3. Patent Cluster (Mod 5)</div>
                <div className="ri-map-step-val" style={{ color: 'var(--ri-purple)' }}>
                  {node.cluster_name} ({node.count} patents)
                </div>
              </div>

              <ArrowRight size={20} className="ri-map-arrow" />

              {/* Node 4: Key Assignees */}
              <div className="ri-map-step-box" style={{ borderLeft: '4px solid var(--ri-warning)' }}>
                <div className="ri-map-step-label">4. Active Assignees</div>
                <div className="ri-map-step-val" style={{ color: '#B45309', fontSize: 12.5 }}>
                  {node.assignees.join(', ')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
