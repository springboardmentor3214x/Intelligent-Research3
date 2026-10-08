import { useState, useEffect } from 'react';
import { X, Sparkles, ExternalLink, Bookmark, BookmarkCheck, AlertCircle, Loader2, CheckCircle2, FileQuestion, ArrowRight } from 'lucide-react';
import { analyzeResearchPaper } from '../../services/aiService';

export default function PaperDetailsModal({
  paper,
  onClose,
  initialTab = 'details', // 'details' | 'ai'
  onToggleSave,
  isSaved = false,
  userId = null,
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [analysis, setAnalysis] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState(null);

  useEffect(() => {
    if (paper && (initialTab === 'ai' || activeTab === 'ai')) {
      handleTriggerAi();
    }
  }, [paper, initialTab, activeTab]);

  const handleTriggerAi = async () => {
    if (analysis || loadingAi) return;
    setLoadingAi(true);
    setAiError(null);
    try {
      const res = await analyzeResearchPaper(paper, userId);
      setAnalysis(res);
    } catch (err) {
      console.error('AI Analysis failed:', err);
      setAiError('Unable to generate AI analysis. Please check your network or try again.');
    } finally {
      setLoadingAi(false);
    }
  };

  if (!paper) return null;

  return (
    <div className="ri-modal-backdrop" onClick={onClose}>
      <div className="ri-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ri-modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className={`ri-paper-source-badge ${paper.source === 'Semantic Scholar' ? 'semantic' : ''}`}>
                {paper.source}
              </span>
              <span style={{ fontSize: 12, color: 'var(--ri-text-muted)', fontWeight: 600 }}>
                {paper.year || '2026'} · {paper.research_area || 'Research Intelligence'}
              </span>
            </div>
            <h2 className="ri-modal-title">{paper.title}</h2>
          </div>
          <button className="ri-btn-close" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Tab Controls */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--ri-border-subtle)', padding: '0 24px', background: '#FAFCFE' }}>
          <button
            onClick={() => setActiveTab('details')}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: 'transparent',
              fontSize: 13.5,
              fontWeight: activeTab === 'details' ? 700 : 500,
              color: activeTab === 'details' ? 'var(--ri-blue-accent)' : 'var(--ri-text-muted)',
              borderBottom: activeTab === 'details' ? '2px solid var(--ri-blue-accent)' : '2px solid transparent',
              cursor: 'pointer',
            }}
          >
            Publication Details
          </button>
          <button
            onClick={() => {
              setActiveTab('ai');
              handleTriggerAi();
            }}
            style={{
              padding: '12px 16px',
              border: 'none',
              background: 'transparent',
              fontSize: 13.5,
              fontWeight: activeTab === 'ai' ? 700 : 500,
              color: activeTab === 'ai' ? 'var(--ri-blue-accent)' : 'var(--ri-text-muted)',
              borderBottom: activeTab === 'ai' ? '2px solid var(--ri-blue-accent)' : '2px solid transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Sparkles size={15} color="var(--ri-blue-accent)" />
            AI Research Analysis
          </button>
        </div>

        {/* Body Content */}
        <div className="ri-modal-body">
          {activeTab === 'details' ? (
            <div>
              {/* Metadata Grid */}
              <div className="ri-modal-meta-grid">
                <div>
                  <span className="ri-meta-item-label">Authors: </span>
                  <span className="ri-meta-item-val">
                    {Array.isArray(paper.all_authors || paper.authors)
                      ? (paper.all_authors || paper.authors).join(', ')
                      : paper.authors}
                  </span>
                </div>
                <div>
                  <span className="ri-meta-item-label">Publication Date: </span>
                  <span className="ri-meta-item-val">{paper.publication_date || paper.year || '2026'}</span>
                </div>
                <div>
                  <span className="ri-meta-item-label">Venue / Journal: </span>
                  <span className="ri-meta-item-val">{paper.journal || paper.conference || 'Academic Repository'}</span>
                </div>
                <div>
                  <span className="ri-meta-item-label">Citations: </span>
                  <span className="ri-meta-item-val">{paper.citations_count || 0} indexed citations</span>
                </div>
                {paper.doi && (
                  <div>
                    <span className="ri-meta-item-label">DOI: </span>
                    <span className="ri-meta-item-val">{paper.doi}</span>
                  </div>
                )}
                {paper.open_access && (
                  <div>
                    <span className="ri-meta-item-label">Access Status: </span>
                    <span className="ri-meta-item-val" style={{ color: 'var(--ri-success)', fontWeight: 600 }}>
                      Open Access Available
                    </span>
                  </div>
                )}
              </div>

              {/* Keywords */}
              {paper.keywords && paper.keywords.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ri-text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>
                    Indexed Keywords &amp; Concepts
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {paper.keywords.map((kw, i) => (
                      <span key={i} className="ri-tag-pill keyword">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Abstract */}
              <div style={{ marginBottom: 24 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ri-navy-primary)', marginBottom: 8 }}>
                  Abstract
                </h4>
                <p style={{ fontSize: 14, color: 'var(--ri-text-secondary)', lineHeight: 1.6, background: '#FAFCFE', padding: '16px', borderRadius: '8px', border: '1px solid var(--ri-border-subtle)' }}>
                  {paper.abstract}
                </p>
              </div>

              {/* Action Banner to Trigger AI */}
              <div style={{ background: 'var(--ri-blue-light)', border: '1px solid var(--ri-border-accent)', borderRadius: '8px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--ri-blue-hover)' }}>
                    Looking for a concise synthesis?
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--ri-text-secondary)' }}>
                    Generate structured problem, methodology, findings, and limitation breakdown.
                  </div>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('ai');
                    handleTriggerAi();
                  }}
                  className="ri-btn-card-action ai-btn"
                  style={{ padding: '8px 16px' }}
                >
                  <Sparkles size={14} /> Run AI Analysis
                </button>
              </div>
            </div>
          ) : (
            /* AI Analysis Tab */
            <div>
              {loadingAi ? (
                <div style={{ textAlign: 'center', padding: '48px 0' }}>
                  <Loader2 size={36} color="var(--ri-blue-accent)" className="spinning-loader" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px auto' }} />
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ri-navy-primary)', marginBottom: 6 }}>
                    Synthesizing Research Analysis...
                  </h4>
                  <p style={{ fontSize: 13, color: 'var(--ri-text-muted)' }}>
                    Extracting problem statement, methodology, key findings, and research directions from available publication text.
                  </p>
                </div>
              ) : aiError ? (
                <div style={{ textAlign: 'center', padding: '36px 0' }}>
                  <AlertCircle size={32} color="#DC2626" style={{ margin: '0 auto 12px auto' }} />
                  <p style={{ color: '#DC2626', fontSize: 14, marginBottom: 12 }}>{aiError}</p>
                  <button onClick={handleTriggerAi} className="ri-btn-refresh" style={{ margin: '0 auto' }}>
                    Retry Analysis
                  </button>
                </div>
              ) : analysis ? (
                <div className="ri-ai-section">
                  {/* AI Header with Disclaimer Badge */}
                  <div className="ri-ai-section-header">
                    <div className="ri-ai-title-wrap">
                      <Sparkles size={18} />
                      <span>AI Research Analysis</span>
                    </div>
                    <div className="ri-ai-disclaimer-badge">
                      <AlertCircle size={12} />
                      <span>AI Generated Analysis</span>
                    </div>
                  </div>

                  {/* 1. Short Summary */}
                  <div className="ri-ai-block">
                    <div className="ri-ai-block-title">
                      <CheckCircle2 size={15} color="var(--ri-blue-accent)" />
                      <span>Executive Summary</span>
                    </div>
                    <div className="ri-ai-block-content">{analysis.summary}</div>
                  </div>

                  {/* 2. Problem Addressed */}
                  <div className="ri-ai-block">
                    <div className="ri-ai-block-title">
                      <FileQuestion size={15} color="var(--ri-purple)" />
                      <span>Problem Addressed</span>
                    </div>
                    <div className="ri-ai-block-content">{analysis.problem}</div>
                  </div>

                  {/* 3. Methodology */}
                  <div className="ri-ai-block">
                    <div className="ri-ai-block-title">
                      <ArrowRight size={15} color="var(--ri-navy-primary)" />
                      <span>Methodology &amp; Architecture</span>
                    </div>
                    <div className="ri-ai-block-content">{analysis.methodology}</div>
                  </div>

                  {/* 4. Key Findings */}
                  <div className="ri-ai-block">
                    <div className="ri-ai-block-title">
                      <CheckCircle2 size={15} color="var(--ri-success)" />
                      <span>Key Findings &amp; Outcomes</span>
                    </div>
                    <div className="ri-ai-block-content">{analysis.keyFindings}</div>
                  </div>

                  {/* 5. Limitations */}
                  <div className="ri-ai-block">
                    <div className="ri-ai-block-title">
                      <AlertCircle size={15} color="var(--ri-warning)" />
                      <span>Noted Constraints &amp; Limitations</span>
                    </div>
                    <div className="ri-ai-block-content">{analysis.limitations}</div>
                  </div>

                  {/* 6. Future Directions */}
                  <div className="ri-ai-block" style={{ marginBottom: 0 }}>
                    <div className="ri-ai-block-title">
                      <Sparkles size={15} color="var(--ri-blue-hover)" />
                      <span>Future Research Directions &amp; Translation</span>
                    </div>
                    <div className="ri-ai-block-content">{analysis.futureDirections}</div>
                  </div>

                  <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--ri-border-subtle)', fontSize: 11.5, color: 'var(--ri-text-light)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Engine: {analysis.model || 'Research Intelligence AI'}</span>
                    <span>Analyzed from: {paper.source} metadata</span>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--ri-border-subtle)', background: '#FAFCFE', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={() => onToggleSave(paper)}
            className={`ri-btn-card-action ${isSaved ? 'saved' : ''}`}
            style={{ padding: '8px 16px' }}
          >
            {isSaved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
            <span>{isSaved ? 'Saved in My Library' : 'Save to Library'}</span>
          </button>

          <div style={{ display: 'flex', gap: 12 }}>
            {paper.paper_url && paper.paper_url !== '#' && (
              <a
                href={paper.paper_url}
                target="_blank"
                rel="noreferrer"
                className="ri-btn-refresh"
                style={{ textDecoration: 'none', padding: '8px 16px' }}
              >
                <ExternalLink size={15} />
                <span>Open Original Publication</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="ri-btn-card-action"
              style={{ padding: '8px 16px' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
