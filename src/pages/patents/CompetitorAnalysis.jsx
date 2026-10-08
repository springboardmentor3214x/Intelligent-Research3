import { useState, useEffect } from 'react';
import { fetchPatents, extractCompetitorAnalysis } from '../../services/patentService';
import PatentCard from '../../components/patents/PatentCard';
import { Building2, FileText, Layers, Search, CheckCircle2 } from 'lucide-react';

export default function CompetitorAnalysis({
  onSelectDetails,
  onToggleSave,
  savedPatentIds = new Set(),
}) {
  const [competitors, setCompetitors] = useState([]);
  const [selectedAssignee, setSelectedAssignee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCompetitors();
  }, []);

  const loadCompetitors = async () => {
    setLoading(true);
    try {
      const data = await fetchPatents('Artificial Intelligence Quantum Energy Biotech Security', { limit: 20 });
      const compList = extractCompetitorAnalysis(data);
      setCompetitors(compList);
      if (compList.length > 0) {
        setSelectedAssignee(compList[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="ri-page-header">
        <h1 className="ri-page-title">Competitor Patent Analysis</h1>
        <p className="ri-page-subtitle">
          Factual analysis of corporate and institutional patent portfolios, technology distributions, and active IPC filings.
        </p>
      </div>

      {/* Assignee Selector */}
      <div className="ri-selector-card">
        <div className="ri-selector-label">
          <Building2 size={18} color="var(--ri-purple)" />
          <span>Select Assignee / Organization:</span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {competitors.map((comp) => {
            const isSelected = selectedAssignee?.name === comp.name;
            return (
              <button
                key={comp.name}
                onClick={() => setSelectedAssignee(comp)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: isSelected ? '2px solid var(--ri-purple)' : '1px solid var(--ri-border-subtle)',
                  background: isSelected ? 'var(--ri-purple-bg)' : '#ffffff',
                  color: isSelected ? 'var(--ri-purple)' : 'var(--ri-text-secondary)',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {isSelected && <CheckCircle2 size={14} color="var(--ri-purple)" />}
                <span>{comp.name} ({comp.patent_count} patents)</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Portfolio Analysis */}
      {selectedAssignee && (
        <div>
          {/* Overview Cards */}
          <div className="ri-stats-grid" style={{ marginBottom: 20 }}>
            <div className="ri-stat-card">
              <div>
                <div className="ri-stat-label">Indexed Portfolio Size</div>
                <div className="ri-stat-value">{selectedAssignee.patent_count}</div>
                <div className="ri-stat-desc">Factual Patent Specifications</div>
              </div>
              <div className="ri-stat-icon-wrap ri-stat-icon-purple">
                <FileText size={20} />
              </div>
            </div>

            <div className="ri-stat-card">
              <div>
                <div className="ri-stat-label">Technology Domains</div>
                <div className="ri-stat-value">{selectedAssignee.domains.length}</div>
                <div className="ri-stat-desc">{selectedAssignee.domains.join(', ')}</div>
              </div>
              <div className="ri-stat-icon-wrap ri-stat-icon-blue">
                <Layers size={20} />
              </div>
            </div>

            <div className="ri-stat-card">
              <div>
                <div className="ri-stat-label">Top IPC Classifications</div>
                <div className="ri-stat-value">{selectedAssignee.classifications.length}</div>
                <div className="ri-stat-desc">{selectedAssignee.classifications.join(', ')}</div>
              </div>
              <div className="ri-stat-icon-wrap ri-stat-icon-green">
                <Building2 size={20} />
              </div>
            </div>
          </div>

          {/* Patent List */}
          <div className="ri-section-head">
            <h2 className="ri-section-title">Patent Specifications for {selectedAssignee.name}</h2>
          </div>

          <div className="ri-papers-grid">
            {selectedAssignee.recent_patents.map((pat) => (
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
      )}
    </div>
  );
}
