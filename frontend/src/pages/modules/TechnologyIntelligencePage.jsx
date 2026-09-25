import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  searchTechnologies,
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
  Zap,
  X,
  Database,
  Globe,
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

  // Live search state
  const [searchQuery, setSearchQuery] = useState('');
  const [liveSearchResults, setLiveSearchResults] = useState(null); // null = not active; [] = active with no results
  const [isSearching, setIsSearching] = useState(false);
  const [searchDataMode, setSearchDataMode] = useState('live');
  const searchDebounceRef = useRef(null);

  // Filters
  const [selectedDomain, setSelectedDomain] = useState('ALL');
  const [selectedStage, setSelectedStage] = useState('ALL');

  // Loading & Sync status
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState(null);
  const [syncStatusType, setSyncStatusType] = useState('info'); // 'info' | 'success' | 'error'
  const [error, setError] = useState(null);

  // ── Load initial catalog ──────────────────────────────────────────────────
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [techList, emergingList, oppsList] = await Promise.all([
        fetchTechnologies(),
        fetchEmergingTechnologies({ min_growth: 0.15, limit: 10 }),
        fetchAllOpportunities(),
      ]);

      const tList = Array.isArray(techList) ? techList : techList.technologies || techList.items || [];
      const eList = Array.isArray(emergingList) ? emergingList : emergingList.technologies || emergingList.items || [];
      const oList = Array.isArray(oppsList) ? oppsList : oppsList.items || [];

      setTechnologies(tList);
      setEmergingTechs(eList);
      setAllOpportunities(oList);

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

  // ── Live Search with Debounce ─────────────────────────────────────────────
  const executeLiveSearch = useCallback(async (query, domain, stage) => {
    if (!query || query.trim().length < 2) {
      setLiveSearchResults(null);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      const result = await searchTechnologies(query.trim(), {
        domain: domain !== 'ALL' ? domain : undefined,
        stage: stage !== 'ALL' ? stage : undefined,
      });
      const items = Array.isArray(result) ? result : result.technologies || result.items || [];
      setLiveSearchResults(items);
      setSearchDataMode(result.data_mode || 'live');
    } catch (err) {
      console.error('Live search error:', err);
      setLiveSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (!val.trim()) {
      setLiveSearchResults(null);
      setIsSearching(false);
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      return;
    }

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      executeLiveSearch(val, selectedDomain, selectedStage);
    }, 600);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchQuery.trim().length >= 2) {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      executeLiveSearch(searchQuery, selectedDomain, selectedStage);
    }
    if (e.key === 'Escape') {
      clearSearch();
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setLiveSearchResults(null);
    setIsSearching(false);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
  };

  // ── Search & Ingest (when no results found) ───────────────────────────────
  const handleSearchAndIngest = async () => {
    if (!searchQuery.trim()) return;
    setIsSyncing(true);
    setSyncStatusMsg(`Ingesting real-time intelligence for "${searchQuery}" from OpenAlex & Google Gemini AI...`);
    setSyncStatusType('info');
    try {
      await triggerTechnologySync([searchQuery.trim()]);
      setSyncStatusMsg(`✓ Data ingested for "${searchQuery}" — refreshing catalog...`);
      setSyncStatusType('success');
      await loadData();
      // Re-run search to show newly ingested results
      await executeLiveSearch(searchQuery, selectedDomain, selectedStage);
      setTimeout(() => setSyncStatusMsg(null), 5000);
    } catch (err) {
      setSyncStatusMsg(`Note: ${err.message}`);
      setSyncStatusType('error');
      setTimeout(() => setSyncStatusMsg(null), 6000);
    } finally {
      setIsSyncing(false);
    }
  };

  // ── Deep-dive loading ─────────────────────────────────────────────────────
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

  // ── Select tech + switch to detail ───────────────────────────────────────
  const handleSelectTechnology = (techId, switchToDetail = true) => {
    setSelectedTechId(techId);
    if (switchToDetail) setActiveTab('detail');
  };

  // ── Sync selected technology ──────────────────────────────────────────────
  const handleSyncData = async () => {
    if (!selectedTechId) return;
    setIsSyncing(true);
    setSyncStatusMsg('Ingesting real-time OpenAlex & Google Gemini AI data...');
    setSyncStatusType('info');
    try {
      await triggerTechnologySync(selectedTechId);
      await recalculateTechnology(selectedTechId);
      setSyncStatusMsg('✓ Sync & recalculation complete!');
      setSyncStatusType('success');
      await loadData();
      setTimeout(() => setSyncStatusMsg(null), 4000);
    } catch (err) {
      setSyncStatusMsg(`Sync note: ${err.message}`);
      setSyncStatusType('error');
      setTimeout(() => setSyncStatusMsg(null), 5000);
    } finally {
      setIsSyncing(false);
    }
  };

  // ── Filter on catalog (when no live search active) ────────────────────────
  const filteredCatalog = useMemo(() => {
    // If live search is active, use its results
    if (liveSearchResults !== null) return liveSearchResults;

    return technologies.filter((t) => {
      const matchesDomain = selectedDomain === 'ALL' || t.domain === selectedDomain;
      const matchesStage = selectedStage === 'ALL' || t.stage?.toLowerCase() === selectedStage.toLowerCase();
      return matchesDomain && matchesStage;
    });
  }, [technologies, liveSearchResults, selectedDomain, selectedStage]);

  // Distinct domains from catalog
  const availableDomains = useMemo(() => {
    const set = new Set(technologies.map((t) => t.domain).filter(Boolean));
    return Array.from(set);
  }, [technologies]);

  // Summary stats
  const summaryStats = useMemo(() => {
    const base = technologies;
    const total = base.length;
    const emergingCount = base.filter((t) => (t.stage || '').toLowerCase() === 'emerging').length;
    const avgScore =
      total > 0 ? Math.round(base.reduce((acc, t) => acc + (t.score || 0), 0) / total) : 0;
    const totalOpportunities = allOpportunities.length;
    return { total, emergingCount, avgScore, totalOpportunities };
  }, [technologies, allOpportunities]);

  const syncMsgColor = syncStatusType === 'success' ? '#34d399' : syncStatusType === 'error' ? '#f87171' : '#38bdf8';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout
      pageTitle="Technology Intelligence"
      breadcrumbs={['Research Intelligence', 'Module 6', 'Technology Intelligence']}
    >
      <div className="tech-intel-container">

        {/* ── Top Bar & Actions ── */}
        <div className="tech-topbar">
          <div className="tech-filters">
            {/* Live Search Input */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              {isSearching ? (
                <RefreshCw
                  size={15}
                  style={{ position: 'absolute', left: 10, color: '#38bdf8', animation: 'spin 1s linear infinite' }}
                />
              ) : (
                <Search size={15} style={{ position: 'absolute', left: 10, color: 'var(--clr-text-muted)' }} />
              )}
              <input
                type="text"
                placeholder="Search & ingest technologies (press Enter)..."
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                className="tech-search-input"
                style={{ paddingLeft: '34px', paddingRight: searchQuery ? '34px' : '12px', minWidth: '300px' }}
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  style={{
                    position: 'absolute', right: 8,
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--clr-text-muted)', padding: 0, display: 'flex',
                  }}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="tech-select"
            >
              <option value="ALL">All Domains</option>
              {availableDomains.map((d) => (
                <option key={d} value={d}>{d}</option>
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
              <span style={{ fontSize: '0.8rem', color: syncMsgColor, marginRight: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                {syncStatusType === 'info' && <RefreshCw size={12} className="spinning" />}
                {syncStatusMsg}
              </span>
            )}
            <button
              className="tech-btn tech-btn-secondary"
              onClick={loadData}
              disabled={loading}
              title="Refresh Catalog"
            >
              <RefreshCw size={14} className={loading ? 'spinning' : ''} />
              Refresh
            </button>
            {selectedTechId && (
              <button
                className="tech-btn tech-btn-primary"
                onClick={handleSyncData}
                disabled={isSyncing}
                title="Trigger real-time OpenAlex & PatentsView ingestion for the selected technology"
              >
                <Activity size={14} />
                {isSyncing ? 'Ingesting...' : 'Sync Live Data'}
              </button>
            )}
          </div>
        </div>

        {/* ── Live Search Active Banner ── */}
        {liveSearchResults !== null && searchQuery && (
          <div style={{
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.85rem',
            marginBottom: 4,
          }}>
            <span style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Globe size={14} />
              Live search: <strong>"{searchQuery}"</strong> — {liveSearchResults.length} result{liveSearchResults.length !== 1 ? 's' : ''} from database
              {searchDataMode && searchDataMode !== 'demo' && (
                <span style={{ background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', borderRadius: 4, padding: '1px 7px', marginLeft: 4, fontSize: '0.75rem' }}>
                  LIVE DATA
                </span>
              )}
            </span>
            <button onClick={clearSearch} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clr-text-muted)', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}>
              <X size={13} /> Clear
            </button>
          </div>
        )}

        {/* ── Data Provenance Notice ── */}
        <div className="tech-banner-demo">
          <div className="icon-col">
            <Database size={18} />
          </div>
          <div>
            <strong>Real-Time Data Provenance:</strong> Sourced live from{' '}
            <span style={{ color: '#fff', fontWeight: 600 }}>OpenAlex</span> (empirical research works) and{' '}
            <span style={{ color: '#00e5ff', fontWeight: 600 }}>Google Gemini AI</span> (real-time forecasting, maturity indicators & innovation signals).
            Search any technology to trigger instant live ingestion with zero mock data.
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
            <span className="tab-badge">{filteredCatalog.length}</span>
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
            {loading ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--clr-text-muted)' }}>
                <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
                <div>Loading technology catalog from database...</div>
              </div>
            ) : error ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#f87171' }}>
                <AlertTriangle size={24} style={{ marginBottom: 8 }} />
                <div>{error}</div>
                <button className="tech-btn tech-btn-secondary" onClick={loadData} style={{ marginTop: 12 }}>
                  <RefreshCw size={14} /> Retry
                </button>
              </div>
            ) : filteredCatalog.length === 0 ? (
              <div style={{
                padding: '60px 40px',
                textAlign: 'center',
                background: 'var(--clr-bg-surface)',
                border: '1px dashed var(--clr-border)',
                borderRadius: 'var(--radius-md)',
              }}>
                {isSearching ? (
                  <>
                    <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', color: '#38bdf8', marginBottom: 12 }} />
                    <div style={{ color: 'var(--clr-text-secondary)', marginBottom: 4 }}>
                      Searching OpenAlex database for "{searchQuery}"...
                    </div>
                  </>
                ) : (
                  <>
                    <Database size={36} style={{ color: 'var(--clr-text-muted)', marginBottom: 12, opacity: 0.5 }} />
                    <div style={{ color: 'var(--clr-text-primary)', fontWeight: 600, fontSize: '1.05rem', marginBottom: 6 }}>
                      {searchQuery ? `No results for "${searchQuery}"` : 'No technologies match your filters'}
                    </div>
                    <div style={{ color: 'var(--clr-text-secondary)', fontSize: '0.88rem', marginBottom: 20 }}>
                      {searchQuery
                        ? 'This technology is not yet in the database. Trigger live ingestion to fetch real-time data from OpenAlex & PatentsView.'
                        : 'Try resetting your domain or stage filter.'}
                    </div>
                    {searchQuery && (
                      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                          className="tech-btn tech-btn-primary"
                          onClick={handleSearchAndIngest}
                          disabled={isSyncing}
                          style={{ padding: '10px 20px', fontSize: '0.9rem' }}
                        >
                          <Zap size={15} />
                          {isSyncing ? 'Ingesting from OpenAlex...' : `Ingest "${searchQuery}" from Live APIs`}
                        </button>
                        <button className="tech-btn tech-btn-secondary" onClick={clearSearch}>
                          <X size={14} /> Clear Search
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : (
              <div className="tech-grid">
                {filteredCatalog.map((tech) => (
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

            {emergingTechs.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--clr-text-muted)' }}>
                <Compass size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
                <div>No emerging technologies detected yet.</div>
                <div style={{ fontSize: '0.85rem', marginTop: 6 }}>Search and ingest technologies in the Catalog tab to populate this radar.</div>
              </div>
            ) : (
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
            )}
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

            {allOpportunities.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--clr-text-muted)' }}>
                <Lightbulb size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
                <div>No opportunity signals detected yet.</div>
                <div style={{ fontSize: '0.85rem', marginTop: 6 }}>Opportunities are auto-detected after live data is ingested via the Sync button or Search & Ingest.</div>
              </div>
            ) : (
              <div className="opportunities-grid">
                {allOpportunities.map((opp, idx) => (
                  <OpportunityCard
                    key={opp.id || idx}
                    opportunity={opp}
                    onSelectTech={(id) => handleSelectTechnology(id, true)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB 4: Deep-Dive Technology Analysis ── */}
        {activeTab === 'detail' && selectedTechId && (
          <div className="tech-detail-view">
            {detailLoading && !techDetail ? (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--clr-text-muted)' }}>
                <RefreshCw size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: 12 }} />
                <div>Loading deep-dive technology intelligence...</div>
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
                        title="Fetch latest data from OpenAlex & PatentsView"
                      >
                        <RefreshCw size={13} className={isSyncing ? 'spinning' : ''} />
                        {isSyncing ? 'Syncing...' : 'Sync Data'}
                      </button>
                    </div>
                  </div>

                  {techDetail.description && (
                    <p style={{ color: 'var(--clr-text-secondary)', fontSize: '0.92rem', lineHeight: 1.6 }}>
                      {techDetail.description}
                    </p>
                  )}

                  {techDetail.keywords && techDetail.keywords.length > 0 && (
                    <div className="detail-keywords">
                      {techDetail.keywords.map((kw, i) => (
                        <span key={i} className="keyword-pill">#{kw}</span>
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
                        indicators={maturityData?.indicators || techDetail?.indicators || {}}
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

                    {historyData.length > 0 ? (
                      <MiniLineChart data={historyData} height={230} />
                    ) : (
                      <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--clr-text-muted)', fontSize: '0.85rem' }}>
                        No historical metrics yet. Click <strong>Sync Data</strong> to fetch live data from OpenAlex & PatentsView.
                      </div>
                    )}

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
                      Research & Patent Volume Leaders (OpenAlex)
                    </span>
                  </div>

                  {competitorsData.length > 0 ? (
                    <CompetitorTable competitors={competitorsData} />
                  ) : (
                    <div style={{ padding: '30px', textAlign: 'center', color: 'var(--clr-text-muted)', fontSize: '0.85rem' }}>
                      No organization data yet. Click <strong>Sync Data</strong> to fetch institution leaderboards from OpenAlex.
                    </div>
                  )}
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