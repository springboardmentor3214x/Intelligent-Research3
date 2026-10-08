/**
 * MODULE 11: REPORTS & EXPORT SYSTEM
 * Complete, production-ready reports dashboard.
 * Consumes reportService.js which delegates to Module 3-8 services.
 * Never independently calculates module values.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  FileBarChart2, Download, Plus, RefreshCw, Trash2, Eye,
  TrendingUp, DollarSign, FileText, Cpu, Award, Rocket,
  Clock, CheckCircle2, AlertCircle, Loader2, X, Search,
  ChevronRight, ChevronDown, Filter, Calendar, Database,
  FileSpreadsheet, FileDown, BarChart3, AlertTriangle,
  Info, Shield, Layers, RotateCcw, ExternalLink, BookOpen,
} from 'lucide-react';

import EnterpriseLayout from '../components/layout/EnterpriseLayout';
import { useAuth } from '../context/AuthContext';
import {
  REPORT_TYPES, REPORT_STATUSES, REPORT_VERSION,
  getReportHistory, deleteReport, getAllowedReportTypes,
  generateDefaultTitle, createReportJob, executeReport, regenerateReport, getReportById,
  generateExcelData, generatePDFStructure,
} from '../services/reportService';
import '../styles/reports.css';

// ─── Icon map ──────────────────────────────────────────────
const ICON_MAP = {
  DollarSign, FileText, TrendingUp, Cpu, Award, Rocket, FileBarChart2,
};

const MODULE_COLORS = {
  research: '#1D4ED8', funding: '#059669', patents: '#8B5CF6',
  technology: '#0284C7', innovation: '#D97706', commercialization: '#0D9488', comprehensive: '#123B72',
};

// ─── Status display config ─────────────────────────────────
const STATUS_CONFIG = {
  queued: { label: 'Queued', icon: Clock, className: 'rpt-badge-queued' },
  generating: { label: 'Generating', icon: Loader2, className: 'rpt-badge-generating' },
  completed: { label: 'Completed', icon: CheckCircle2, className: 'rpt-badge-completed' },
  failed: { label: 'Failed', icon: AlertCircle, className: 'rpt-badge-failed' },
  expired: { label: 'Expired', icon: Clock, className: 'rpt-badge-expired' },
};

// ─── Helper: download text as file ────────────────────────
function downloadTextFile(filename, content, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Helper: generate CSV from 2D array ───────────────────
function arraysToCSV(arr) {
  return arr.map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
}

// ─── COMPONENT: Report Type Card ──────────────────────────
function ReportTypeCard({ type, onSelect }) {
  const Icon = ICON_MAP[type.icon] || FileBarChart2;
  return (
    <div
      className="rpt-type-card"
      style={{ color: type.color }}
      onClick={() => onSelect(type)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(type)}
      id={`report-type-${type.id}`}
    >
      <div className="rpt-type-icon" style={{ background: type.bg }}>
        <Icon size={20} color={type.color} />
      </div>
      <span className="rpt-type-module-badge" style={{ background: type.bg, color: type.color }}>
        {type.module}
      </span>
      <h3 className="rpt-type-title">{type.label}</h3>
      <p className="rpt-type-desc">{type.description}</p>
      <div className="rpt-type-meta">
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Clock size={11} />{type.estimatedTime}
        </span>
        {type.isComprehensive && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#D97706' }}>
            <Layers size={11} />Executive
          </span>
        )}
      </div>
    </div>
  );
}

// ─── COMPONENT: Status Badge ───────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.queued;
  const Icon = cfg.icon;
  return (
    <span className={`rpt-badge ${cfg.className}`}>
      {status === 'generating'
        ? <span className="rpt-badge-dot" />
        : <Icon size={10} />}
      {cfg.label}
    </span>
  );
}

// ─── COMPONENT: Report Builder Modal ──────────────────────
function ReportBuilderModal({ onClose, onGenerate, allowedTypes, userProfile }) {
  const [step, setStep] = useState(1); // 1=type, 2=filters, 3=config
  const [selectedType, setSelectedType] = useState(null);
  const [filters, setFilters] = useState({});
  const [config, setConfig] = useState({ title: '', description: '' });

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setConfig((prev) => ({ ...prev, title: generateDefaultTitle(type.id, filters) }));
    setStep(2);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    if (selectedType) {
      setConfig((prev) => ({ ...prev, title: prev.title || generateDefaultTitle(selectedType.id, newFilters) }));
    }
  };

  const handleGenerate = () => {
    onGenerate(selectedType.id, filters, config);
    onClose();
  };

  const RESEARCH_AREAS = ['Artificial Intelligence & Machine Learning', 'Biotechnology & Life Sciences', 'Quantum Computing', 'Clean Energy & Environment', 'Cybersecurity & Data Privacy', 'Materials Science & Engineering'];
  const DOMAINS = ['All', 'Artificial Intelligence', 'Biotechnology', 'Quantum Computing', 'Clean Energy', 'Cybersecurity', 'Materials Science'];

  const renderFiltersForType = () => {
    if (!selectedType) return null;
    const typeFilters = selectedType.filters || [];

    return (
      <div>
        {typeFilters.includes('domain') && (
          <div className="rpt-field">
            <label>Research Domain</label>
            <select value={filters.domain || ''} onChange={(e) => handleFilterChange('domain', e.target.value)}>
              <option value="">All Domains</option>
              {DOMAINS.filter((d) => d !== 'All').map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
        )}
        {typeFilters.includes('keyword') && (
          <div className="rpt-field">
            <label>Search Keywords</label>
            <input type="text" placeholder="e.g. Generative AI, protein folding..." value={filters.keyword || ''} onChange={(e) => handleFilterChange('keyword', e.target.value)} />
          </div>
        )}
        {typeFilters.includes('research_area') && (
          <div className="rpt-field">
            <label>Research Area</label>
            <select value={filters.research_area || ''} onChange={(e) => handleFilterChange('research_area', e.target.value)}>
              <option value="">All Areas</option>
              {RESEARCH_AREAS.map((a) => <option key={a}>{a}</option>)}
            </select>
          </div>
        )}
        {typeFilters.includes('technology') && (
          <div className="rpt-field">
            <label>Technology</label>
            <input type="text" placeholder="e.g. Autonomous AI Agents, Neuromorphic..." value={filters.technology || ''} onChange={(e) => handleFilterChange('technology', e.target.value)} />
          </div>
        )}
        {typeFilters.includes('funding_type') && (
          <div className="rpt-field">
            <label>Funding Type</label>
            <select value={filters.funding_type || ''} onChange={(e) => handleFilterChange('funding_type', e.target.value)}>
              <option value="">All Types</option>
              <option>Standard Grant</option>
              <option>Cooperative Agreement</option>
              <option>Broad Agency Announcement (BAA)</option>
              <option>SBIR / STTR</option>
              <option>Blended Finance / Grant + Equity</option>
            </select>
          </div>
        )}
        {typeFilters.includes('agency') && (
          <div className="rpt-field">
            <label>Funding Agency</label>
            <input type="text" placeholder="e.g. NSF, NIH, DARPA..." value={filters.agency || ''} onChange={(e) => handleFilterChange('agency', e.target.value)} />
          </div>
        )}
        {typeFilters.includes('country') && (
          <div className="rpt-field">
            <label>Country</label>
            <select value={filters.country || ''} onChange={(e) => handleFilterChange('country', e.target.value)}>
              <option value="">All Countries</option>
              <option>United States</option>
              <option>European Union</option>
              <option>United Kingdom</option>
              <option>Germany</option>
              <option>Japan</option>
            </select>
          </div>
        )}
        {typeFilters.includes('maturity') && (
          <div className="rpt-field">
            <label>Technology Maturity Stage</label>
            <select value={filters.maturity || ''} onChange={(e) => handleFilterChange('maturity', e.target.value)}>
              <option value="">All Stages</option>
              <option>Early Stage</option>
              <option>Developing</option>
              <option>Adoption</option>
              <option>Mature</option>
            </select>
          </div>
        )}
        {(typeFilters.includes('score_min') || typeFilters.includes('score_max')) && (
          <div className="rpt-field-row">
            <div className="rpt-field">
              <label>Innovation Score (Min)</label>
              <input type="number" min={0} max={100} placeholder="0" value={filters.score_min ?? ''} onChange={(e) => handleFilterChange('score_min', Number(e.target.value))} />
            </div>
            <div className="rpt-field">
              <label>Innovation Score (Max)</label>
              <input type="number" min={0} max={100} placeholder="100" value={filters.score_max ?? ''} onChange={(e) => handleFilterChange('score_max', Number(e.target.value))} />
            </div>
          </div>
        )}
        {typeFilters.includes('date_range') && (
          <div className="rpt-field-row">
            <div className="rpt-field">
              <label>Date Range: From</label>
              <input type="date" value={filters.dateRange?.start || ''} onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, start: e.target.value })} />
            </div>
            <div className="rpt-field">
              <label>Date Range: To</label>
              <input type="date" value={filters.dateRange?.end || ''} onChange={(e) => handleFilterChange('dateRange', { ...filters.dateRange, end: e.target.value })} />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="rpt-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="rpt-modal" role="dialog" aria-modal="true" aria-label="Generate New Report">
        <div className="rpt-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, background: '#EFF6FF', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={16} color="#1D4ED8" />
            </div>
            <h2>Generate New Report</h2>
          </div>
          <button className="rpt-btn rpt-btn-ghost rpt-btn-sm" onClick={onClose} id="close-report-builder"><X size={16} /></button>
        </div>

        <div className="rpt-modal-body">
          {/* Steps */}
          <div className="rpt-steps">
            {[{ n: 1, label: 'Report Type' }, { n: 2, label: 'Configure Filters' }, { n: 3, label: 'Title & Options' }].map((s, i) => (
              <div key={s.n} style={{ display: 'flex', alignItems: 'center' }}>
                <div className={`rpt-step ${step === s.n ? 'active' : step > s.n ? 'completed' : ''}`}>
                  <span className="rpt-step-num">{step > s.n ? '✓' : s.n}</span>
                  <span>{s.label}</span>
                </div>
                {i < 2 && <span className="rpt-step-arrow">›</span>}
              </div>
            ))}
          </div>

          {/* Step 1: Select Type */}
          {step === 1 && (
            <div>
              <p className="rpt-section-label" style={{ margin: '0 0 12px' }}>Select a report type to generate</p>
              <div className="rpt-types-grid">
                {allowedTypes.map((type) => (
                  <ReportTypeCard key={type.id} type={type} onSelect={handleTypeSelect} />
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Filters */}
          {step === 2 && selectedType && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, background: selectedType.bg, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {(() => { const Icon = ICON_MAP[selectedType.icon]; return <Icon size={18} color={selectedType.color} />; })()}
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: '#0F172A' }}>{selectedType.label}</p>
                  <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>{selectedType.module} — Apply filters to refine the report data</p>
                </div>
              </div>
              <div className="rpt-section-label">Filter Options <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 11, color: '#94A3B8' }}>(all filters are optional)</span></div>
              {renderFiltersForType()}
              <div className="rpt-section-alert rpt-alert-info">
                <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>Data will be retrieved from the {selectedType.module} service layer. Leaving filters empty will return all available data.</span>
              </div>
            </div>
          )}

          {/* Step 3: Title & Config */}
          {step === 3 && selectedType && (
            <div>
              <div className="rpt-section-label">Report Configuration</div>
              <div className="rpt-field">
                <label>Report Title <span style={{ color: '#DC2626' }}>*</span></label>
                <input id="report-title-input" type="text" value={config.title} onChange={(e) => setConfig((p) => ({ ...p, title: e.target.value }))} placeholder="Enter report title..." />
              </div>
              <div className="rpt-field">
                <label>Description (optional)</label>
                <textarea value={config.description} onChange={(e) => setConfig((p) => ({ ...p, description: e.target.value }))} placeholder="Brief description of this report's purpose..." />
              </div>
              <div className="rpt-section-label" style={{ marginTop: 16 }}>Sections to Include</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(selectedType.sections || []).map((s) => (
                  <span key={s} style={{ background: '#EFF6FF', color: '#1D4ED8', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                    <CheckCircle2 size={10} style={{ marginRight: 4 }} />{s}
                  </span>
                ))}
              </div>
              {selectedType.isComprehensive && (
                <div className="rpt-section-alert rpt-alert-warn" style={{ marginTop: 14 }}>
                  <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                  <span>This is a comprehensive multi-module report. Generation may take 30–90 seconds. If a module encounters an error, the report will still complete with available data.</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="rpt-modal-footer">
          {step > 1 && <button className="rpt-btn rpt-btn-secondary" onClick={() => setStep((s) => s - 1)}>← Back</button>}
          <button className="rpt-btn rpt-btn-secondary" onClick={onClose}>Cancel</button>
          {step === 1 && <span style={{ fontSize: 12, color: '#94A3B8', marginRight: 'auto' }}>Click a report type to continue</span>}
          {step === 2 && (
            <button id="next-to-config" className="rpt-btn rpt-btn-primary" onClick={() => { setConfig((p) => ({ ...p, title: p.title || generateDefaultTitle(selectedType.id, filters) })); setStep(3); }}>
              Next: Configure →
            </button>
          )}
          {step === 3 && (
            <button id="generate-report-btn" className="rpt-btn rpt-btn-primary" onClick={handleGenerate} disabled={!config.title.trim()}>
              <Plus size={14} />Generate Report
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── COMPONENT: Report Preview Modal ──────────────────────
function ReportPreviewModal({ report, onClose, onExportPDF, onExportExcel }) {
  const data = report?.data;

  if (!data) {
    return (
      <div className="rpt-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="rpt-modal">
          <div className="rpt-modal-header">
            <h2>Report Preview</h2>
            <button className="rpt-btn rpt-btn-ghost rpt-btn-sm" onClick={onClose}><X size={16} /></button>
          </div>
          <div className="rpt-empty" style={{ padding: 40 }}>
            <div className="rpt-empty-icon"><AlertCircle size={28} color="#94A3B8" /></div>
            <h3>No Preview Available</h3>
            <p>This report has not been generated yet or data is unavailable.</p>
          </div>
        </div>
      </div>
    );
  }

  const renderResearchSection = () => {
    const src = data.report_type === 'comprehensive' ? data.research : data;
    if (!src || src.status === 'error') return <div className="rpt-section-alert rpt-alert-error"><AlertCircle size={14} />Research data unavailable: {src?.error || 'Unknown error'}</div>;
    return (
      <div>
        <div className="rpt-summary-kpis">
          {[
            { label: 'Publications', value: src.summary?.total_papers ?? 'N/A' },
            { label: 'Total Citations', value: src.summary?.total_citations ?? 'N/A' },
            { label: 'Avg Citations', value: src.summary?.avg_citations ?? 'N/A' },
            { label: 'Open Access', value: src.summary?.open_access_pct != null ? `${src.summary.open_access_pct}%` : 'N/A' },
          ].map((k) => <div key={k.label} className="rpt-summary-kpi"><span className="rpt-summary-kpi-label">{k.label}</span><span className="rpt-summary-kpi-value">{k.value}</span></div>)}
        </div>
        {src.papers?.length > 0 ? (
          <div className="rpt-table-wrap">
            <table className="rpt-table">
              <thead><tr><th>Title</th><th>Authors</th><th>Year</th><th>Citations</th><th>Source</th></tr></thead>
              <tbody>
                {src.papers.slice(0, 6).map((p, i) => (
                  <tr key={i}>
                    <td style={{ maxWidth: 260 }}><a href={p.paper_url} target="_blank" rel="noopener noreferrer" style={{ color: '#1D4ED8', fontWeight: 600 }}>{p.title}</a></td>
                    <td style={{ maxWidth: 160 }}>{(p.authors || []).slice(0, 2).join(', ')}{p.authors?.length > 2 ? ' et al.' : ''}</td>
                    <td>{p.year}</td>
                    <td style={{ fontWeight: 600 }}>{p.citations_count ?? 0}</td>
                    <td><span style={{ fontSize: 11, background: '#F1F5F9', padding: '2px 7px', borderRadius: 4 }}>{p.source}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="rpt-section-alert rpt-alert-warn"><AlertTriangle size={14} />No publications found for the selected filters or query.</div>}
      </div>
    );
  };

  const renderFundingSection = () => {
    const src = data.report_type === 'comprehensive' ? data.funding : data;
    if (!src || src.status === 'error') return <div className="rpt-section-alert rpt-alert-error"><AlertCircle size={14} />Funding data unavailable: {src?.error || 'Unknown error'}</div>;
    return (
      <div>
        <div className="rpt-summary-kpis">
          {[
            { label: 'Opportunities', value: src.summary?.total_opportunities ?? 'N/A' },
            { label: 'Agencies', value: src.summary?.by_agency?.length ?? 'N/A' },
            { label: 'Countries', value: src.summary?.by_country?.length ?? 'N/A' },
          ].map((k) => <div key={k.label} className="rpt-summary-kpi"><span className="rpt-summary-kpi-label">{k.label}</span><span className="rpt-summary-kpi-value">{k.value}</span></div>)}
        </div>
        {src.opportunities?.length > 0 ? (
          <div className="rpt-table-wrap">
            <table className="rpt-table">
              <thead><tr><th>Title</th><th>Agency</th><th>Amount</th><th>Close Date</th><th>Country</th></tr></thead>
              <tbody>
                {src.opportunities.slice(0, 6).map((o, i) => (
                  <tr key={i}>
                    <td><a href={o.official_url} target="_blank" rel="noopener noreferrer" style={{ color: '#059669', fontWeight: 600 }}>{o.title}</a></td>
                    <td style={{ fontSize: 12 }}>{o.agency}</td>
                    <td style={{ fontWeight: 600, color: '#059669', whiteSpace: 'nowrap' }}>{o.funding_amount}</td>
                    <td style={{ fontSize: 12, whiteSpace: 'nowrap' }}>{o.close_date}</td>
                    <td style={{ fontSize: 11 }}>{o.country}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="rpt-section-alert rpt-alert-warn"><AlertTriangle size={14} />No funding opportunities found for the selected filters.</div>}
      </div>
    );
  };

  const renderPatentsSection = () => {
    const src = data.report_type === 'comprehensive' ? data.patents : data;
    if (!src || src.status === 'error') return <div className="rpt-section-alert rpt-alert-error"><AlertCircle size={14} />Patent data unavailable: {src?.error || 'Unknown error'}</div>;
    return (
      <div>
        <div className="rpt-summary-kpis">
          {[
            { label: 'Patents', value: src.summary?.total_patents ?? 'N/A' },
            { label: 'Clusters', value: src.summary?.total_clusters ?? 'N/A' },
            { label: 'Competitors', value: src.summary?.total_competitors ?? 'N/A' },
            { label: 'Total Citations', value: src.summary?.total_citations ?? 'N/A' },
          ].map((k) => <div key={k.label} className="rpt-summary-kpi"><span className="rpt-summary-kpi-label">{k.label}</span><span className="rpt-summary-kpi-value">{k.value}</span></div>)}
        </div>
        {src.patents?.length > 0 ? (
          <div className="rpt-table-wrap">
            <table className="rpt-table">
              <thead><tr><th>Title</th><th>Assignee</th><th>Patent #</th><th>Status</th><th>Citations</th></tr></thead>
              <tbody>
                {src.patents.slice(0, 5).map((p, i) => (
                  <tr key={i}>
                    <td><a href={p.patent_url} target="_blank" rel="noopener noreferrer" style={{ color: '#8B5CF6', fontWeight: 600 }}>{p.title}</a></td>
                    <td style={{ fontSize: 12 }}>{p.assignee?.split('/')[0].trim()}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{p.patent_number}</td>
                    <td><span style={{ fontSize: 11, background: p.status === 'Granted' ? '#ECFDF5' : '#FEF9C3', color: p.status === 'Granted' ? '#059669' : '#92400E', padding: '2px 7px', borderRadius: 4, fontWeight: 600 }}>{p.status}</span></td>
                    <td style={{ fontWeight: 600 }}>{p.citations}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="rpt-section-alert rpt-alert-warn"><AlertTriangle size={14} />No patents found for the selected filters.</div>}
      </div>
    );
  };

  const renderTechnologySection = () => {
    const src = data.report_type === 'comprehensive' ? data.technology : data;
    if (!src || src.status === 'error') return <div className="rpt-section-alert rpt-alert-error"><AlertCircle size={14} />Technology data unavailable: {src?.error || 'Unknown error'}</div>;
    return (
      <div>
        <div className="rpt-summary-kpis">
          {[
            { label: 'Technologies', value: src.summary?.total_technologies ?? 'N/A' },
            { label: 'Maturity Stages', value: src.summary?.by_maturity?.length ?? 'N/A' },
            { label: 'Domains', value: src.summary?.by_domain?.length ?? 'N/A' },
          ].map((k) => <div key={k.label} className="rpt-summary-kpi"><span className="rpt-summary-kpi-label">{k.label}</span><span className="rpt-summary-kpi-value">{k.value}</span></div>)}
        </div>
        {src.technologies?.length > 0 ? (
          <div className="rpt-table-wrap">
            <table className="rpt-table">
              <thead><tr><th>Technology</th><th>Domain</th><th>Maturity</th><th>Growth Rate</th><th>Adoption</th></tr></thead>
              <tbody>
                {src.technologies.slice(0, 5).map((t, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600, color: '#0F172A' }}>{t.name}</td>
                    <td style={{ fontSize: 12 }}>{t.domain}</td>
                    <td><span style={{ fontSize: 11, background: '#E0F2FE', color: '#0284C7', padding: '2px 7px', borderRadius: 4, fontWeight: 600 }}>{t.maturity_level}</span></td>
                    <td style={{ fontWeight: 700, color: '#059669' }}>+{t.growth_rate}%</td>
                    <td style={{ fontSize: 12 }}>{t.adoption_level}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <div className="rpt-section-alert rpt-alert-warn"><AlertTriangle size={14} />No technology records found for the selected filters.</div>}
      </div>
    );
  };

  const renderInnovationSection = () => {
    const src = data.report_type === 'comprehensive' ? data.innovation : data;
    if (!src || src.status === 'error') return <div className="rpt-section-alert rpt-alert-error"><AlertCircle size={14} />Innovation data unavailable: {src?.error || 'Unknown error'}</div>;
    return (
      <div>
        {src.methodology && (
          <div className="rpt-methodology-box">
            <strong>Methodology: </strong>Official Module 7 Weighted Formula —
            Research Novelty (30%) + Patent Strength (20%) + Technology Maturity (15%) + Market Potential (20%) + Funding Relevance (15%).
            <br />{src.methodology.note}
          </div>
        )}
        <div className="rpt-summary-kpis">
          {[
            { label: 'Assessments', value: src.summary?.total_assessments ?? 'N/A' },
            { label: 'Avg Score', value: src.summary?.average_score != null ? `${src.summary.average_score}/100` : 'N/A' },
          ].map((k) => <div key={k.label} className="rpt-summary-kpi"><span className="rpt-summary-kpi-label">{k.label}</span><span className="rpt-summary-kpi-value" style={{ color: '#D97706' }}>{k.value}</span></div>)}
        </div>
        {src.assessments?.length > 0 ? src.assessments.map((a, i) => (
          <div key={i} className="rpt-score-card">
            <div className="rpt-score-header">
              <div>
                <div className="rpt-score-title">{a.title}</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>{a.domain}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="rpt-score-total">{a.overall_score ?? a.innovation_score ?? 'N/A'}</div>
                <div style={{ fontSize: 10, color: '#94A3B8' }}>/ 100</div>
              </div>
            </div>
            {a.factors && Object.entries(a.factors).map(([key, factor]) => {
              const names = { research_novelty: 'Research Novelty', patent_strength: 'Patent Strength', technology_maturity: 'Tech Maturity', market_potential: 'Market Potential', funding_relevance: 'Funding Relevance' };
              return (
                <div key={key} className="rpt-score-bar-wrap">
                  <span className="rpt-score-factor-name">{names[key] || key}</span>
                  <div className="rpt-score-bar-bg"><div className="rpt-score-bar-fill" style={{ width: `${factor.score || 0}%` }} /></div>
                  <span className="rpt-score-factor-val">{factor.score}</span>
                  <span className="rpt-score-weight">×{(factor.weight * 100).toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        )) : <div className="rpt-section-alert rpt-alert-warn"><AlertTriangle size={14} />No innovation assessments found for the selected filters.</div>}
      </div>
    );
  };

  const renderCommercializationSection = () => {
    const src = data.report_type === 'comprehensive' ? data.commercialization : data;
    if (!src || src.status === 'error') return <div className="rpt-section-alert rpt-alert-error"><AlertCircle size={14} />Commercialization data unavailable: {src?.error || 'Unknown error'}</div>;
    const pathways = Object.entries(src.pathways || {});
    const pathwayLabels = { productization: 'Potential Productization', licensing: 'Potential Licensing', startup: 'Potential Startup', industry_partnership: 'Potential Industry Partnership' };
    const pathwayColors = { productization: '#0284C7', licensing: '#8B5CF6', startup: '#059669', industry_partnership: '#D97706' };
    return (
      <div>
        <div className="rpt-section-alert rpt-alert-info"><Info size={14} />All opportunities below are analytical assessments — not guaranteed business outcomes. Label: "Potential Opportunity".</div>
        {pathways.length > 0 ? pathways.map(([key, pathway]) => (
          <div key={key} className="rpt-pathway-card">
            <div className="rpt-pathway-header">
              <div className="rpt-pathway-title">{pathwayLabels[key] || key}: {pathway.title}</div>
              <span className="rpt-pathway-potential" style={{ background: (pathwayColors[key] || '#64748B') + '18', color: pathwayColors[key] || '#64748B' }}>{pathway.potential}</span>
            </div>
            <div className="rpt-pathway-evidence">{pathway.evidence}</div>
            {pathway.recommended_next_step && (
              <div className="rpt-pathway-next"><ChevronRight size={13} />Next Step: {pathway.recommended_next_step}</div>
            )}
          </div>
        )) : <div className="rpt-section-alert rpt-alert-warn"><AlertTriangle size={14} />No commercialization pathways found.</div>}
      </div>
    );
  };

  const renderSection = (sectionKey) => {
    switch (sectionKey) {
      case 'research': return renderResearchSection();
      case 'funding': return renderFundingSection();
      case 'patents': return renderPatentsSection();
      case 'technology': return renderTechnologySection();
      case 'innovation': return renderInnovationSection();
      case 'commercialization': return renderCommercializationSection();
      default: return null;
    }
  };

  const isComprehensive = data.report_type === 'comprehensive';
  const sections = isComprehensive
    ? ['research', 'funding', 'patents', 'technology', 'innovation', 'commercialization']
    : [data.report_type];

  const sectionLabels = { research: 'Research Intelligence', funding: 'Funding Intelligence', patents: 'Patent Landscape', technology: 'Technology Intelligence', innovation: 'Innovation Assessment', commercialization: 'Commercialization Opportunities' };

  return (
    <div className="rpt-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="rpt-modal" style={{ maxWidth: 820 }} role="dialog" aria-modal="true" aria-label="Report Preview">
        <div className="rpt-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, background: '#EFF6FF', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Eye size={16} color="#1D4ED8" /></div>
            <h2>Report Preview</h2>
          </div>
          <button className="rpt-btn rpt-btn-ghost rpt-btn-sm" onClick={onClose} id="close-preview"><X size={16} /></button>
        </div>

        <div style={{ overflowY: 'auto', maxHeight: 'calc(90vh - 140px)' }}>
          {/* Cover */}
          <div className="rpt-preview-header">
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>
              Research Funding & Innovation Intelligence Platform
            </div>
            <div className="rpt-preview-cover-title">{report.title}</div>
            <div className="rpt-preview-cover-meta">
              <span><Calendar size={11} style={{ marginRight: 4 }} />Generated: {new Date(report.generated_at || Date.now()).toLocaleDateString()}</span>
              <span>Period: {data.analysis_period || 'All Available Data'}</span>
              <span>By: {report.user_name} · {report.organization}</span>
              <span>Version: {report.report_version}</span>
            </div>
          </div>

          <div className="rpt-preview-body">
            {/* Partial failure alerts (comprehensive) */}
            {isComprehensive && data.failed_sections?.length > 0 && (
              <div className="rpt-section-alert rpt-alert-warn">
                <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                <span>The following sections encountered data retrieval issues and are shown as unavailable: <strong>{data.failed_sections.join(', ')}</strong>. The remainder of the report is complete.</span>
              </div>
            )}

            {/* Executive Summary (comprehensive) */}
            {isComprehensive && data.executive_summary && (
              <div className="rpt-preview-section">
                <div className="rpt-preview-section-title"><BarChart3 size={15} color="#123B72" />Executive Summary</div>
                <div className="rpt-summary-kpis">
                  {[
                    { label: 'Modules Covered', value: data.executive_summary.report_coverage || 'N/A' },
                    { label: 'Research Papers', value: data.executive_summary.total_research_papers ?? 'N/A' },
                    { label: 'Funding Opportunities', value: data.executive_summary.total_funding_opportunities ?? 'N/A' },
                    { label: 'Patents Analyzed', value: data.executive_summary.total_patents ?? 'N/A' },
                    { label: 'Technologies', value: data.executive_summary.total_technologies ?? 'N/A' },
                    { label: 'Avg Innovation Score', value: data.executive_summary.avg_innovation_score != null ? `${data.executive_summary.avg_innovation_score}/100` : 'N/A' },
                    { label: 'Comm. Pathways', value: data.executive_summary.commercialization_pathways ?? 'N/A' },
                  ].map((k) => <div key={k.label} className="rpt-summary-kpi"><span className="rpt-summary-kpi-label">{k.label}</span><span className="rpt-summary-kpi-value">{k.value}</span></div>)}
                </div>
              </div>
            )}

            {/* Report Sections */}
            {sections.map((sectionKey) => {
              const label = sectionLabels[sectionKey] || sectionKey;
              const color = MODULE_COLORS[sectionKey] || '#334155';
              return (
                <div key={sectionKey} className="rpt-preview-section">
                  <div className="rpt-preview-section-title" style={{ color }}>
                    {renderSectionIcon(sectionKey)}
                    {label}
                    {isComprehensive && data.section_statuses?.[sectionKey] === 'error' && (
                      <span className="rpt-badge rpt-badge-failed" style={{ marginLeft: 8 }}>Data Unavailable</span>
                    )}
                  </div>
                  {renderSection(sectionKey)}
                </div>
              );
            })}

            {/* Key Insights (comprehensive) */}
            {isComprehensive && data.key_insights?.length > 0 && (
              <div className="rpt-preview-section">
                <div className="rpt-preview-section-title"><Award size={15} color="#D97706" />Key Insights</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {data.key_insights.map((ins, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 14px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: MODULE_COLORS[ins.module.toLowerCase()] || '#334155', width: 100, flexShrink: 0 }}>{ins.module}</span>
                      <span style={{ fontSize: 12.5, color: '#334155', lineHeight: 1.5 }}>{ins.insight}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Risks (comprehensive) */}
            {isComprehensive && data.risks_and_limitations?.length > 0 && (
              <div className="rpt-preview-section">
                <div className="rpt-preview-section-title"><Shield size={15} color="#64748B" />Risks & Limitations</div>
                <ul style={{ paddingLeft: 20, margin: 0 }}>
                  {data.risks_and_limitations.map((r, i) => <li key={i} style={{ fontSize: 12.5, color: '#475569', marginBottom: 6, lineHeight: 1.5 }}>{r}</li>)}
                </ul>
              </div>
            )}

            {/* Data Sources */}
            <div className="rpt-preview-section">
              <div className="rpt-preview-section-title"><Database size={15} color="#64748B" />Data Sources & Methodology</div>
              <div className="rpt-sources-grid">
                {(data.data_sources || []).map((s, i) => (
                  <div key={i} className="rpt-source-chip"><Database size={12} color="#94A3B8" />{s}</div>
                ))}
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: '#94A3B8' }}>Report Version: {report.report_version} · Generated: {new Date(report.generated_at || Date.now()).toLocaleString()}</div>
            </div>
          </div>
        </div>

        <div className="rpt-preview-actions">
          <button id="export-pdf-btn" className="rpt-btn rpt-btn-primary" onClick={() => onExportPDF(report)}>
            <FileText size={14} />Generate PDF
          </button>
          <button id="export-excel-btn" className="rpt-btn rpt-btn-success" onClick={() => onExportExcel(report)}>
            <FileSpreadsheet size={14} />Export Excel
          </button>
          <button className="rpt-btn rpt-btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function renderSectionIcon(sectionKey) {
  const icons = { research: <TrendingUp size={15} />, funding: <DollarSign size={15} />, patents: <FileText size={15} />, technology: <Cpu size={15} />, innovation: <Award size={15} />, commercialization: <Rocket size={15} /> };
  return icons[sectionKey] || <BookOpen size={15} />;
}

// ─── COMPONENT: History Row ────────────────────────────────
function ReportHistoryRow({ report, onView, onExportPDF, onExportExcel, onRegenerate, onDelete }) {
  const typeInfo = REPORT_TYPES.find((t) => t.id === report.report_type);
  const color = typeInfo?.color || '#64748B';
  const bg = typeInfo?.bg || '#F1F5F9';
  const Icon = ICON_MAP[typeInfo?.icon] || FileBarChart2;

  const elapsed = report.generation_time_ms
    ? report.generation_time_ms < 1000 ? `${report.generation_time_ms}ms` : `${(report.generation_time_ms / 1000).toFixed(1)}s`
    : null;

  return (
    <div className="rpt-history-row">
      <div className="rpt-history-icon" style={{ background: bg }}>
        <Icon size={16} color={color} />
      </div>
      <div className="rpt-history-info">
        <p className="rpt-history-title" title={report.title}>{report.title}</p>
        <div className="rpt-history-meta">
          <span>{typeInfo?.label || report.report_type}</span>
          <span>·</span>
          <span>{new Date(report.created_at).toLocaleDateString()}</span>
          {elapsed && <><span>·</span><span>{elapsed}</span></>}
          {report.file_size && <><span>·</span><span>{report.file_size}</span></>}
          {report.sections_failed?.length > 0 && (
            <span style={{ color: '#D97706', display: 'flex', alignItems: 'center', gap: 3 }}>
              <AlertTriangle size={10} />{report.sections_failed.length} section(s) failed
            </span>
          )}
        </div>
      </div>
      <StatusBadge status={report.status} />
      <div className="rpt-history-actions">
        {report.status === 'completed' && (
          <>
            <button className="rpt-btn rpt-btn-secondary rpt-btn-sm" id={`view-${report.id}`} onClick={() => onView(report)} title="Preview Report"><Eye size={13} /></button>
            <button className="rpt-btn rpt-btn-secondary rpt-btn-sm" id={`pdf-${report.id}`} onClick={() => onExportPDF(report)} title="Export PDF"><FileText size={13} /></button>
            <button className="rpt-btn rpt-btn-success rpt-btn-sm" id={`excel-${report.id}`} onClick={() => onExportExcel(report)} title="Export Excel"><FileSpreadsheet size={13} /></button>
          </>
        )}
        {(report.status === 'completed' || report.status === 'failed') && (
          <button className="rpt-btn rpt-btn-secondary rpt-btn-sm" id={`regen-${report.id}`} onClick={() => onRegenerate(report.id)} title="Regenerate"><RotateCcw size={13} /></button>
        )}
        <button className="rpt-btn rpt-btn-danger rpt-btn-sm" id={`delete-${report.id}`} onClick={() => onDelete(report.id)} title="Delete"><Trash2 size={13} /></button>
      </div>
    </div>
  );
}

// ─── COMPONENT: Generation Progress ───────────────────────
function GenerationProgress({ report }) {
  const steps = ['Initializing report', 'Connecting to module services', 'Aggregating data', 'Computing analytics', 'Building report structure', 'Finalizing'];
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((s) => (s < steps.length - 1 ? s + 1 : s));
    }, 600);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rpt-progress-wrap">
      <div className="rpt-progress-spinner" />
      <p style={{ fontWeight: 700, fontSize: 14, color: '#0F172A', margin: '0 0 4px' }}>Generating Report…</p>
      <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 12px' }}>{report?.title}</p>
      <div className="rpt-progress-steps">
        {steps.map((s, i) => (
          <div key={i} className={`rpt-progress-step-item ${i < activeStep ? 'done' : i === activeStep ? 'active' : ''}`}>
            {i < activeStep ? <CheckCircle2 size={13} /> : i === activeStep ? <Loader2 size={13} style={{ animation: 'rptSpin 0.9s linear infinite' }} /> : <span style={{ width: 13, height: 13, borderRadius: 50, border: '1.5px solid #E2E8F0', display: 'inline-block', flexShrink: 0 }} />}
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN: Reports Page ────────────────────────────────────
export default function ReportsPage() {
  const { user, profile } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [history, setHistory] = useState([]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [previewReport, setPreviewReport] = useState(null);
  const [generatingReportId, setGeneratingReportId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState(null);

  const userId = user?.id;
  const allowedTypes = getAllowedReportTypes(profile);

  // Load history on mount
  useEffect(() => {
    if (userId) setHistory(getReportHistory(userId));
  }, [userId]);

  const refreshHistory = useCallback(() => {
    if (userId) setHistory(getReportHistory(userId));
  }, [userId]);

  const showNotif = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleGenerate = async (reportType, filters, config) => {
    if (!userId) { showNotif('You must be signed in to generate reports.', 'error'); return; }
    const record = await createReportJob(userId, profile, reportType, filters, config);
    refreshHistory();
    setGeneratingReportId(record.id);
    setActiveTab('history');
    showNotif(`Report "${record.title}" queued for generation.`);

    const result = await executeReport(userId, record.id);
    setGeneratingReportId(null);
    refreshHistory();
    if (result.success) {
      showNotif(`Report "${result.report.title}" generated successfully.`);
    } else {
      showNotif(`Report generation failed: ${result.error}`, 'error');
    }
  };

  const handleRegenerate = async (reportId) => {
    if (!userId) return;
    setGeneratingReportId(reportId);
    refreshHistory();
    const result = await regenerateReport(userId, reportId);
    setGeneratingReportId(null);
    refreshHistory();
    if (result.success) showNotif('Report regenerated successfully.');
    else showNotif(`Regeneration failed: ${result.error}`, 'error');
  };

  const handleDelete = (reportId) => {
    if (!userId) return;
    deleteReport(userId, reportId);
    refreshHistory();
    showNotif('Report deleted.');
  };

  const handleExportPDF = (report) => {
    if (!report?.data) { showNotif('No report data available to export.', 'error'); return; }
    const structure = generatePDFStructure(report);
    if (!structure) { showNotif('Could not generate PDF structure.', 'error'); return; }

    // Generate a structured text-based PDF representation
    // (In production, integrate jsPDF, pdfmake, or a backend PDF renderer)
    const lines = [
      '='.repeat(70),
      `  ${structure.metadata.platform.toUpperCase()}`,
      '='.repeat(70),
      '',
      `REPORT TITLE:       ${structure.metadata.title}`,
      `REPORT TYPE:        ${structure.metadata.report_type}`,
      `GENERATED BY:       ${structure.metadata.user_name}`,
      `ORGANIZATION:       ${structure.metadata.organization}`,
      `ROLE:               ${structure.metadata.user_role}`,
      `GENERATED DATE:     ${structure.metadata.generated_at}`,
      `ANALYSIS PERIOD:    ${structure.metadata.period}`,
      `REPORT VERSION:     ${structure.metadata.report_version}`,
      '',
      '='.repeat(70),
      '',
    ];

    structure.sections.forEach((section) => {
      lines.push(`── ${section.title.toUpperCase()} ──`);
      lines.push('');
      if (section.type === 'table' && Array.isArray(section.data)) {
        section.data.slice(0, 10).forEach((row, i) => {
          if (typeof row === 'object') {
            const cols = section.columns || Object.keys(row);
            lines.push(`  ${i + 1}. ${cols.map((c) => String(row[c] ?? 'N/A')).join(' | ')}`);
          }
        });
      } else if (section.type === 'summary' && section.data) {
        Object.entries(section.data).forEach(([k, v]) => {
          if (typeof v !== 'object') lines.push(`  ${k}: ${v ?? 'N/A'}`);
        });
      } else if (section.type === 'innovation_list' && Array.isArray(section.data)) {
        section.data.slice(0, 5).forEach((a) => {
          lines.push(`  ${a.title}`);
          lines.push(`    Score: ${a.overall_score ?? a.innovation_score ?? 'N/A'}/100 | Domain: ${a.domain}`);
          lines.push('');
        });
      } else if (section.type === 'pathways' && section.data) {
        Object.entries(section.data).forEach(([key, p]) => {
          lines.push(`  Pathway: ${p.title}`);
          lines.push(`  Evidence: ${p.evidence}`);
          lines.push('');
        });
      } else if (Array.isArray(section.data)) {
        section.data.slice(0, 8).forEach((item) => {
          if (typeof item === 'string') lines.push(`  • ${item}`);
          else if (item?.insight) lines.push(`  [${item.module}] ${item.insight}`);
        });
      }
      lines.push('');
      lines.push('-'.repeat(70));
      lines.push('');
    });

    lines.push('='.repeat(70));
    lines.push('  END OF REPORT');
    lines.push(`  Generated by Research Funding & Innovation Intelligence Platform v${REPORT_VERSION}`);
    lines.push('='.repeat(70));

    const content = lines.join('\n');
    const filename = `${report.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf.txt`;
    downloadTextFile(filename, content, 'text/plain');
    showNotif('PDF structure exported. For a rendered PDF, connect a PDF rendering library.');
  };

  const handleExportExcel = (report) => {
    if (!report?.data) { showNotif('No report data available to export.', 'error'); return; }
    const sheets = generateExcelData(report);
    if (!sheets) { showNotif('Could not generate Excel data.', 'error'); return; }

    // Generate a multi-sheet CSV representation
    // (In production, use SheetJS/xlsx library for proper Excel format)
    const parts = [];
    Object.entries(sheets).forEach(([sheetName, rows]) => {
      parts.push(`\n\n===== SHEET: ${sheetName} =====`);
      parts.push(arraysToCSV(rows));
    });

    const filename = `${report.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
    downloadTextFile(filename, parts.join('\n'), 'text/csv');
    showNotif('Excel data exported as CSV. For native .xlsx format, connect SheetJS library.');
  };

  // Filter history
  const filteredHistory = history.filter((r) => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (searchQuery && !r.title.toLowerCase().includes(searchQuery.toLowerCase()) && !r.report_type.includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Stats
  const stats = {
    total: history.length,
    completed: history.filter((r) => r.status === 'completed').length,
    generating: history.filter((r) => r.status === 'generating').length,
    failed: history.filter((r) => r.status === 'failed').length,
  };

  const SIDEBAR_TABS = [
    { id: 'dashboard', label: 'Reports Dashboard', icon: FileBarChart2 },
    { id: 'history', label: 'Report History', icon: Clock },
  ];

  return (
    <EnterpriseLayout
      activeModule="reports"
      moduleTitle="Intelligence Reports"
      activeView={activeTab}
      onViewChange={setActiveTab}
      tabs={SIDEBAR_TABS}
      breadcrumbs={['Reports & Export']}
    >
      <div className="rpt-dashboard">
        {/* Notification */}
        {notification && (
          <div className={`rpt-section-alert ${notification.type === 'error' ? 'rpt-alert-error' : 'rpt-alert-success'}`}
            style={{ position: 'sticky', top: 0, zIndex: 50 }}>
            {notification.type === 'error' ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
            {notification.msg}
            <button onClick={() => setNotification(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><X size={14} /></button>
          </div>
        )}

        {/* ── HEADER ── */}
        <div className="rpt-header">
          <div className="rpt-header-text">
            <h1>Intelligence Reports & Export</h1>
            <p>Turn platform intelligence into professional reports — PDF, Excel, and structured data exports.</p>
          </div>
          <div className="rpt-header-actions">
            <button id="generate-new-report" className="rpt-btn rpt-btn-primary" onClick={() => setShowBuilder(true)}>
              <Plus size={15} />Generate New Report
            </button>
            <button className="rpt-btn rpt-btn-secondary" onClick={refreshHistory} title="Refresh history">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* ── KPI Row ── */}
        <div className="rpt-kpi-grid">
          {[
            { label: 'Total Reports', value: stats.total, color: '#1D4ED8', bg: '#EFF6FF', icon: FileBarChart2 },
            { label: 'Completed', value: stats.completed, color: '#059669', bg: '#ECFDF5', icon: CheckCircle2 },
            { label: 'Generating', value: stats.generating, color: '#2563EB', bg: '#DBEAFE', icon: Loader2 },
            { label: 'Failed', value: stats.failed, color: '#DC2626', bg: '#FEF2F2', icon: AlertCircle },
          ].map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="rpt-kpi-card">
                <div className="rpt-kpi-icon" style={{ background: kpi.bg }}><Icon size={18} color={kpi.color} /></div>
                <div className="rpt-kpi-info">
                  <span className="rpt-kpi-label">{kpi.label}</span>
                  <span className="rpt-kpi-value" style={{ color: kpi.color }}>{kpi.value}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── TABS ── */}
        <div className="rpt-tabs">
          <button className={`rpt-tab ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')} id="tab-dashboard">
            <FileBarChart2 size={14} />Report Types
          </button>
          <button className={`rpt-tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')} id="tab-history">
            <Clock size={14} />Report History
            {stats.total > 0 && <span style={{ background: '#E2E8F0', color: '#64748B', padding: '1px 6px', borderRadius: 8, fontSize: 10, fontWeight: 700 }}>{stats.total}</span>}
          </button>
        </div>

        {/* ── DASHBOARD TAB ── */}
        {activeTab === 'dashboard' && (
          <div>
            <p className="rpt-section-label" style={{ marginBottom: 14 }}>
              Available Report Types ({allowedTypes.length})
              <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: 6, color: '#94A3B8', fontSize: 11 }}>— based on your role: {profile?.role || 'Researcher'}</span>
            </p>
            <div className="rpt-types-grid">
              {allowedTypes.map((type) => (
                <ReportTypeCard key={type.id} type={type} onSelect={() => setShowBuilder(true)} />
              ))}
            </div>

            {/* Recent completed reports */}
            {history.filter((r) => r.status === 'completed').length > 0 && (
              <div style={{ marginTop: 28 }}>
                <p className="rpt-section-label" style={{ marginBottom: 12 }}>Recently Generated</p>
                <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
                  {history.filter((r) => r.status === 'completed').slice(0, 3).map((rep) => (
                    <ReportHistoryRow
                      key={rep.id} report={rep}
                      onView={setPreviewReport}
                      onExportPDF={handleExportPDF}
                      onExportExcel={handleExportExcel}
                      onRegenerate={handleRegenerate}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Currently generating */}
            {history.filter((r) => r.status === 'generating').map((rep) => (
              <div key={rep.id} style={{ marginTop: 16, background: '#FFFFFF', border: '1px solid #BFDBFE', borderRadius: 12, overflow: 'hidden' }}>
                <GenerationProgress report={rep} />
              </div>
            ))}

            {history.length === 0 && (
              <div className="rpt-empty" style={{ marginTop: 24 }}>
                <div className="rpt-empty-icon"><FileBarChart2 size={26} color="#94A3B8" /></div>
                <h3>No reports generated yet</h3>
                <p>Click "Generate New Report" to create your first intelligence report from platform data.</p>
                <button className="rpt-btn rpt-btn-primary" onClick={() => setShowBuilder(true)}><Plus size={14} />Generate New Report</button>
              </div>
            )}
          </div>
        )}

        {/* ── HISTORY TAB ── */}
        {activeTab === 'history' && (
          <div>
            <div className="rpt-filters-bar">
              <div className="rpt-search-box">
                <Search size={14} color="#94A3B8" />
                <input id="search-reports" type="text" placeholder="Search reports..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              {['all', 'completed', 'generating', 'queued', 'failed'].map((s) => (
                <button key={s} className={`rpt-filter-chip ${filterStatus === s ? 'active' : ''}`} onClick={() => setFilterStatus(s)}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                  {s !== 'all' && <span style={{ marginLeft: 4, fontWeight: 700, fontSize: 11 }}>{history.filter((r) => r.status === s).length}</span>}
                </button>
              ))}
            </div>

            {filteredHistory.length > 0 ? (
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '10px 18px 10px', background: '#F8FAFC', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {filteredHistory.length} report{filteredHistory.length !== 1 ? 's' : ''}
                  </span>
                  <span style={{ fontSize: 11, color: '#94A3B8' }}>Reports are stored locally for 30 days</span>
                </div>
                {filteredHistory.map((rep) => (
                  <ReportHistoryRow
                    key={rep.id} report={rep}
                    onView={setPreviewReport}
                    onExportPDF={handleExportPDF}
                    onExportExcel={handleExportExcel}
                    onRegenerate={handleRegenerate}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            ) : (
              <div className="rpt-empty">
                <div className="rpt-empty-icon"><Clock size={26} color="#94A3B8" /></div>
                <h3>No reports found</h3>
                <p>{searchQuery || filterStatus !== 'all' ? 'No reports match your current filters.' : 'Generated reports will appear here.'}</p>
                {!searchQuery && filterStatus === 'all' && (
                  <button className="rpt-btn rpt-btn-primary" onClick={() => setShowBuilder(true)}><Plus size={14} />Generate First Report</button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showBuilder && (
        <ReportBuilderModal
          onClose={() => setShowBuilder(false)}
          onGenerate={handleGenerate}
          allowedTypes={allowedTypes}
          userProfile={profile}
        />
      )}

      {previewReport && (
        <ReportPreviewModal
          report={previewReport}
          onClose={() => setPreviewReport(null)}
          onExportPDF={handleExportPDF}
          onExportExcel={handleExportExcel}
        />
      )}
    </EnterpriseLayout>
  );
}
