import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
  fetchTechnologies,
  fetchEmergingTechnologies,
  fetchTechnologyDetail,
  fetchTechnologyHistory,
  fetchTechnologyMaturity,
  fetchTechnologyAdoption,
  fetchTechnologyOpportunities,
  fetchAllOpportunities,
  fetchTechnologyCompetitors,
  triggerTechnologySync,
  recalculateTechnology,
} from '../../services/technologyService';

import TechnologyCard from '../../components/technology/TechnologyCard';
import MiniLineChart from '../../components/technology/MiniLineChart';
import MaturityGauge from '../../components/technology/MaturityGauge';
import IndicatorBreakdown from '../../components/technology/IndicatorBreakdown';
import OpportunityCard from '../../components/technology/OpportunityCard';
import CompetitorTable from '../../components/technology/CompetitorTable';
import DataSourceBadge from '../../components/technology/DataSourceBadge';
import '../../components/technology/Technology.css';

import {
  Cpu,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Search,
  RefreshCw,
  Layers,
  Building2,
  BookOpen,
  Info,
  CheckCircle2,
  Compass,
  FileText,
  Activity,
} from 'lucide-react';

export default function TechnologyIntelligencePage() {
  const { techId: routeTechId } = useParams();

  // Navigation & State
  const [activeTab, setActiveTab] = useState(routeTechId ? 'detail' : 'catalog');
  const [technologies, setTechnologies] = useState([]);
  const [emergingTechs, setEmergingTechs] = useState([]);
  const [allOpportunities, setAllOpportunities] = useState([]);
  const [selectedTechId, setSelectedTechId] = useState(routeTechId || null);

  // Deep-dive detail data
  const [techDetail, setTechDetail] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [maturityData, setMaturityData] = useState(null);
  const [adoptionData, setAdoptionData] = useState(null);
  const [opportunitiesData, setOpportunitiesData] = useState([]);
  const [competitorsData, setCompetitorsData] = useState([]);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('ALL');
  const [selectedStage, setSelectedStage] = useState('ALL');

  // Loading & Sync status
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState(null);
  const [error, setError] = useState(null);

  // Load initial technology catalog and opportunities
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [techList, emergingList, oppsList] = await Promise.all([
        fetchTechnologies(),
        fetchEmergingTechnologies({ min_growth: 0.15, limit: 10 }),
        fetchAllOpportunities(),
      ]);

      const tList = Array.isArray(techList) ? techList : techList.items || [];
      const eList = Array.isArray(emergingList) ? emergingList : emergingList.items || [];
      const oList = Array.isArray(oppsList) ? oppsList : oppsList.items || [];

      setTechnologies(tList);
      setEmergingTechs(eList);
      setAllOpportunities(oList);

      // If no tech selected yet, select the first one if available
      if (!selectedTechId && tList.length > 0) {
        setSelectedTechId(tList[0].technology_id);
      }
    } catch (err) {
      console.error('Failed to load technology intelligence data:', err);
      setError(err.message || 'Could not connect to technology intelligence service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Load deep dive data when selectedTechId changes
  useEffect(() => {
    if (!selectedTechId) return;

    let isMounted = true;
    const fetchDetailData = async () => {
      setDetailLoading(true);
      try {
        const [detail, history, maturity, adoption, opps, comps] = await Promise.allSettled([
          fetchTechnologyDetail(selectedTechId),
          fetchTechnologyHistory(selectedTechId),
          fetchTechnologyMaturity(selectedTechId),
          fetchTechnologyAdoption(selectedTechId),
          fetchTechnologyOpportunities(selectedTechId),
          fetchTechnologyCompetitors(selectedTechId),
        ]);

        if (isMounted) {
          if (detail.status === 'fulfilled') setTechDetail(detail.value);
          if (history.status === 'fulfilled') {
            const hItems = Array.isArray(history.value) ? history.value : history.value.metrics || [];
            setHistoryData(hItems);
          }
          if (maturity.status === 'fulfilled') setMaturityData(maturity.value);
          if (adoption.status === 'fulfilled') setAdoptionData(adoption.value);
          if (opps.status === 'fulfilled') {
            const oItems = Array.isArray(opps.value) ? opps.value : opps.value.opportunities || [];
            setOpportunitiesData(oItems);
          }
          if (comps.status === 'fulfilled') {
            const cItems = Array.isArray(comps.value) ? comps.value : comps.value.competitors || [];
            setCompetitorsData(cItems);
          }
        }
      } catch (err) {
        console.error('Error loading deep dive for technology:', err);
      } finally {
        if (isMounted) setDetailLoading(false);
      }
    };

    fetchDetailData();
    return () => {
      isMounted = false;
    };
  }, [selectedTechId]);

  // Handle tech selection & switch to detail view
  const handleSelectTechnology = (techId, switchToDetail = true) => {
    setSelectedTechId(techId);
    if (switchToDetail) {
      setActiveTab('detail');
    }
  };

  // Trigger sync / refresh
  const handleSyncData = async () => {
    if (!selectedTechId) return;
    setIsSyncing(true);
    setSyncStatusMsg('Ingesting real-time OpenAlex & patent data...');
    try {
      await triggerTechnologySync(selectedTechId);
      await recalculateTechnology(selectedTechId);
      setSyncStatusMsg('Sync & recalculation complete!');
      await loadData();
      setTimeout(() => setSyncStatusMsg(null), 4000);
    } catch (err) {
      setSyncStatusMsg(`Sync note: ${err.message}`);
      setTimeout(() => setSyncStatusMsg(null), 5000);
    } finally {
      setIsSyncing(false);
    }
  };

  // Filtered technologies
  const filteredTechnologies = useMemo(() => {
    return technologies.filter((t) => {
      const matchesSearch =
        !searchQuery ||
        t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.domain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.keywords && t.keywords.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase())));

      const matchesDomain = selectedDomain === 'ALL' || t.domain === selectedDomain;
      const matchesStage = selectedStage === 'ALL' || t.stage?.toLowerCase() === selectedStage.toLowerCase();

      return matchesSearch && matchesDomain && matchesStage;
    });
  }, [technologies, searchQuery, selectedDomain, selectedStage]);

  // Distinct domains
  const availableDomains = useMemo(() => {
    const set = new Set(technologies.map((t) => t.domain).filter(Boolean));
    return Array.from(set);
  }, [technologies]);

  // Summary Metrics
  const summaryStats = useMemo(() => {
    const total = technologies.length;
    const emergingCount = technologies.filter((t) => (t.stage || '').toLowerCase() === 'emerging').length;
    const avgScore = total > 0
      ? Math.round(technologies.reduce((acc, t) => acc + (t.score || 0), 0) / total)
      : 0;
    const totalOpportunities = allOpportunities.length;
    return { total, emergingCount, avgScore, totalOpportunities };
  }, [technologies, allOpportunities]);

  return (
    <DashboardLayout
      pageTitle="Technology Intelligence"
      breadcrumbs={['Research Intelligence', 'Module 6', 'Technology Intelligence']}
    >
      <div className="tech-intel-container">
        {/* ── Top Bar & Actions ── */}
        <div className="tech-topbar">
          <div className="tech-filters">
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={16} style={{ position: 'absolute', left: 10, color: 'var(--clr-text-muted)' }} />
              <input
                type="text"
                placeholder="Search technologies, domains, keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="tech-search-input"
                style={{ paddingLeft: '34px', minWidth: '260px' }}
              />
            </div>

            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="tech-select"
            >
              <option value="ALL">All Domains</option>
              {availableDomains.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="tech-select"
            >
              <option value="ALL">All Maturity Stages</option>
              <option value="emerging">Emerging</option>
              <option value="growth">Growth</option>
              <option value="mature">Mature</option>
              <option value="saturated">Saturated</option>
            </select>
          </div>

          <div className="tech-actions">
            {syncStatusMsg && (
              <span style={{ fontSize: '0.8rem', color: '#38bdf8', marginRight: 8 }}>
                {syncStatusMsg}
              </span>
            )}
            <button
              className="tech-btn tech-btn-secondary"
              onClick={loadData}
              disabled={loading}
              title="Refresh Data"
            >
              <RefreshCw size={14} className={loading ? 'spinning' : ''} />
              Refresh
            </button>
            {selectedTechId && (
              <button
                className="tech-btn tech-btn-primary"
                onClick={handleSyncData}
                disabled={isSyncing}
                title="Synchronize live research and patent data via OpenAlex & PatentsView"
              >
                <Activity size={14} />
                {isSyncing ? 'Ingesting...' : 'Sync Live Ingestion'}
              </button>
            )}
          </div>
        </div>

        {/* ── Demo Data Transparency Notice ── */}
        <div className="tech-banner-demo">
          <div className="icon-col">
            <AlertTriangle size={20} />
          </div>
          <div>
            <strong>Transparent Data Provenance:</strong> This system uses real scholarly and patent telemetry via{' '}
            <span style={{ color: '#fff', fontWeight: 600 }}>OpenAlex</span> and{' '}
            <span style={{ color: '#fff', fontWeight: 600 }}>PatentsView</span> APIs. For seeded bootstrap entries lacking live network feeds, synthetic metrics are clearly labeled with the{' '}
            <span className="badge-source demo" style={{ margin: '0 4px' }}>DEMO DATA</span> badge and excluded from live clinical/commercial reliance.
          </div>
        </div>

        {/* ── High-Level Overview Stats ── */}
        <div className="overview-stats-grid">
          <div className="overview-stat-card">
            <div className="stat-card-header">
              <span className="stat-label">Monitored Technologies</span>
              <Cpu size={18} className="stat-icon-cyan" />
            </div>
            <div className="stat-val">{summaryStats.total} Stack Domains</div>
            <span className="stat-nav-hint">Across AI, Quantum, Bio & Edge</span>
          </div>

          <div className="overview-stat-card">
            <div className="stat-card-header">
              <span className="stat-label">Emerging Signals</span>
              <Compass size={18} className="stat-icon-blue" />
            </div>
            <div className="stat-val">{summaryStats.emergingCount} Fast-Movers</div>
            <span className="stat-nav-hint">&gt;15% Compound research/patent growth</span>
          </div>

          <div className="overview-stat-card">
            <div className="stat-card-header">
              <span className="stat-label">Avg Maturity Score</span>
              <Activity size={18} className="stat-icon-amber" />
            </div>
            <div className="stat-val">{summaryStats.avgScore} / 100</div>
            <span className="stat-nav-hint">6-indicator weighted composite</span>
          </div>

          <div className="overview-stat-card">
            <div className="stat-card-header">
              <span className="stat-label">Innovation Opportunities</span>
              <Lightbulb size={18} className="stat-icon-emerald" />
            </div>
            <div className="stat-val">{summaryStats.totalOpportunities} Detected</div>
            <span className="stat-nav-hint">Adoption gaps & commercial windows</span>
          </div>
        </div>

        {/* ── Navigation Tabs ── */}
        <div className="tech-nav-tabs">
          <button
            className={`tech-tab-btn ${activeTab === 'catalog' ? 'active' : ''}`}
            onClick={() => setActiveTab('catalog')}
          >
            <Layers size={16} />
            Technology Catalog
            <span className="tab-badge">{filteredTechnologies.length}</span>
          </button>

          <button
            className={`tech-tab-btn ${activeTab === 'emerging' ? 'active' : ''}`}
            onClick={() => setActiveTab('emerging')}
          >
            <Compass size={16} />
            Emerging Tech Radar
            <span className="tab-badge">{emergingTechs.length}</span>
          </button>

          <button
            className={`tech-tab-btn ${activeTab === 'opportunities' ? 'active' : ''}`}
            onClick={() => setActiveTab('opportunities')}
          >
            <Lightbulb size={16} />
            Innovation Opportunity Signals
            <span className="tab-badge">{allOpportunities.length}</span>
          </button>

          {selectedTechId && (
            <button
              className={`tech-tab-btn ${activeTab === 'detail' ? 'active' : ''}`}
              onClick={() => setActiveTab('detail')}
            >
              <FileText size={16} />
              Deep-Dive: {techDetail?.name || selectedTechId}
            </button>
          )}
        </div>

        {/* ── TAB 1: Technology Catalog ── */}
        {activeTab === 'catalog' && (
          <div>
            {filteredTechnologies.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--clr-text-muted)' }}>
                No technologies match your filter criteria. Try resetting the domain or search term.
              </div>
            ) : (
              <div className="tech-grid">
                {filteredTechnologies.map((tech) => (
                  <TechnologyCard
                    key={tech.technology_id}
                    tech={tech}
                    isSelected={selectedTechId === tech.technology_id}
                    onSelect={(id) => handleSelectTechnology(id, true)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: Emerging Technologies Radar ── */}
        {activeTab === 'emerging' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div
              style={{
                background: 'var(--clr-bg-surface)',
                border: '1px solid var(--clr-border)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-lg)',
              }}
            >
              <h3 style={{ fontSize: '1.15rem', color: 'var(--clr-text-primary)', marginBottom: 6 }}>
                🚀 Emerging Technology Radar
              </h3>
              <p style={{ color: 'var(--clr-text-secondary)', fontSize: '0.88rem' }}>
                Technologies exhibiting accelerating publication and patent trajectories with early organizational entry.
                Qualifies when either publication growth &gt; 20%, patent growth &gt; 15%, or multi-year acceleration slope is positive.
              </p>
            </div>

            <div className="tech-grid">
              {emergingTechs.map((tech) => (
                <TechnologyCard
                  key={tech.technology_id}
                  tech={tech}
                  isSelected={selectedTechId === tech.technology_id}
                  onSelect={(id) => handleSelectTechnology(id, true)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 3: Innovation Opportunity Signals ── */}
        {activeTab === 'opportunities' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <div
              style={{
                background: 'var(--clr-bg-surface)',
                border: '1px solid var(--clr-border)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-lg)',
              }}
            >
              <h3 style={{ fontSize: '1.15rem', color: 'var(--clr-text-primary)', marginBottom: 6 }}>
                💡 Detected Innovation Opportunity Signals
              </h3>
              <p style={{ color: 'var(--clr-text-secondary)', fontSize: '0.88rem' }}>
                Algorithmic opportunity signals flag potential white spaces, adoption gaps, and commercialization windows based on divergences between research activity, patent filings, and market deployment.
              </p>
            </div>

            <div className="opportunities-grid">
              {allOpportunities.map((opp, idx) => (
                <OpportunityCard
                  key={opp.id || idx}
                  opportunity={opp}
                  onSelectTech={(id) => handleSelectTechnology(id, true)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 4: Deep-Dive Technology Analysis ── */}
        {activeTab === 'detail' && selectedTechId && (
          <div className="tech-detail-view">
            {detailLoading && !techDetail ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--clr-text-muted)' }}>
                Loading deep-dive technology intelligence...
              </div>
            ) : techDetail ? (
              <>
                {/* Header Information Card */}
                <div className="detail-header-card">
                  <div className="detail-header-top">
                    <div className="detail-title-area">
                      <div className="tech-card-domain">{techDetail.domain}</div>
                      <h2>{techDetail.name}</h2>
                      <div className="tech-badges-row" style={{ marginTop: 8 }}>
                        <span className={`badge-stage ${(techDetail.stage || 'emerging').toLowerCase()}`}>
                          <Layers size={13} /> {techDetail.stage || 'Evaluating'}
                        </span>
                        <span className="badge-adoption">
                          Adoption: {techDetail.adoption_level || 'Low'}
                        </span>
                        <DataSourceBadge isDemo={techDetail.is_demo} />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="tech-btn tech-btn-secondary"
                        onClick={handleSyncData}
                        disabled={isSyncing}
                      >
                        <RefreshCw size={13} className={isSyncing ? 'spinning' : ''} />
                        {isSyncing ? 'Syncing...' : 'Sync Data'}
                      </button>
                    </div>
                  </div>

                  <p style={{ color: 'var(--clr-text-secondary)', fontSize: '0.92rem', lineHeight: 1.6 }}>
                    {techDetail.description}
                  </p>

                  {techDetail.keywords && techDetail.keywords.length > 0 && (
                    <div className="detail-keywords">
                      {techDetail.keywords.map((kw, i) => (
                        <span key={i} className="keyword-pill">
                          #{kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Split Section: Maturity Score & Indicators */}
                <div className="tech-analytics-split">
                  {/* Left: Maturity Scoring & Classification */}
                  <div className="analytics-card">
                    <div className="analytics-card-title">
                      <h3>
                        <Activity size={18} color="var(--clr-primary)" />
                        Technology Maturity Score (0–100)
                      </h3>
                      <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>
                        Composite Index
                      </span>
                    </div>

                    <MaturityGauge
                      score={maturityData?.score ?? techDetail.score ?? 0}
                      stage={maturityData?.stage ?? techDetail.stage ?? 'Emerging'}
                      confidence={maturityData?.confidence ?? techDetail.confidence ?? 0.85}
                    />

                    {/* Breakdown of the 6 Indicators */}
                    <div style={{ marginTop: 'var(--space-md)' }}>
                      <h4 style={{ fontSize: '0.86rem', color: 'var(--clr-text-primary)', marginBottom: 12 }}>
                        6-Indicator Weighted Assessment
                      </h4>
                      <IndicatorBreakdown
                        indicators={maturityData?.indicators || {}}
                        weights={maturityData?.weights || undefined}
                      />
                    </div>

                    {/* Separate Adoption Highlight Box */}
                    <div className="adoption-box">
                      <div className="adoption-box-title">
                        <span>Adoption Tracking (Separately Evaluated)</span>
                        <span
                          className={`badge-adoption ${(adoptionData?.level || techDetail.adoption_level || 'low').toLowerCase()}`}
                        >
                          {adoptionData?.level || techDetail.adoption_level || 'Low'} Adoption
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-secondary)', margin: 0 }}>
                        Adoption is tracked independently from academic & patent growth. A technology may have explosive research discovery while remaining in early adoption phases. Trend:{' '}
                        <strong>{adoptionData?.trend || 'Stable'}</strong>.
                      </p>
                    </div>
                  </div>

                  {/* Right: Multi-year Trends & Chart */}
                  <div className="analytics-card">
                    <div className="analytics-card-title">
                      <h3>
                        <TrendingUp size={18} color="#38bdf8" />
                        Research Papers vs. Patent Filings Timeline
                      </h3>
                    </div>

                    <p style={{ fontSize: '0.82rem', color: 'var(--clr-text-secondary)', margin: 0 }}>
                      Comparison of academic dissemination (OpenAlex) and commercial patent grants (PatentsView) across active recorded years.
                    </p>

                    <MiniLineChart data={historyData} height={230} />

                    {/* Evidence & Explanation Block */}
                    {maturityData?.explanation && (
                      <div className="evidence-section">
                        <div className="evidence-title">
                          <CheckCircle2 size={15} color="#34d399" />
                          Evidence-Based Assessment Rationale
                        </div>
                        <p style={{ fontSize: '0.82rem', color: 'var(--clr-text-secondary)', marginBottom: 8 }}>
                          {maturityData.explanation.summary}
                        </p>
                        {maturityData.explanation.evidence && (
                          <ul className="evidence-list">
                            {maturityData.explanation.evidence.map((ev, i) => (
                              <li key={i}>{ev}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Competitive & Institutional Monitoring */}
                <div className="analytics-card">
                  <div className="analytics-card-title">
                    <h3>
                      <Building2 size={18} color="#ec4899" />
                      Top Institutional & Commercial Competitors
                    </h3>
                    <span style={{ fontSize: '0.78rem', color: 'var(--clr-text-muted)' }}>
                      Research & Patent Volume Leaders
                    </span>
                  </div>

                  <CompetitorTable competitors={competitorsData} />
                </div>

                {/* Technology-Specific Opportunity Signals */}
                {opportunitiesData.length > 0 && (
                  <div className="analytics-card">
                    <div className="analytics-card-title">
                      <h3>
                        <Lightbulb size={18} color="#fbbf24" />
                        Technology-Specific Innovation Signals
                      </h3>
                      <span className="tab-badge">{opportunitiesData.length}</span>
                    </div>

                    <div className="opportunities-grid">
                      {opportunitiesData.map((opp, idx) => (
                        <OpportunityCard key={opp.id || idx} opportunity={opp} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--clr-text-muted)' }}>
                No technology selected or details could not be retrieved.
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}