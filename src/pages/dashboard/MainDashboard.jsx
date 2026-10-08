import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import EnterpriseLayout from '../../components/layout/EnterpriseLayout';
import { getDashboardData } from '../../services/dashboardService';
import { 
  Activity, Search, Zap, Cpu, Award, Rocket, TrendingUp, DollarSign, 
  FileText, ArrowRight, ShieldCheck, Users, Filter, RefreshCw, 
  Layers, CheckCircle, AlertCircle, Compass, BarChart2, BookOpen, Clock, Bell, Sparkles
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';
import '../../styles/dashboard.css';

export default function MainDashboard() {
  const { profile, user } = useAuth();
  const { notifications, unreadCount } = useNotifications();
  const navigate = useNavigate();
  
  // Evaluator / Role switcher state: defaults to profile role, but can be switched on the fly
  const [activeRole, setActiveRole] = useState(profile?.role || 'Researcher');
  const [domainFilter, setDomainFilter] = useState('All');
  const [timeRange, setTimeRange] = useState('5Y');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync activeRole if profile updates
  useEffect(() => {
    if (profile?.role) {
      setActiveRole(profile.role);
    }
  }, [profile]);

  // Load aggregated dashboard data safely with immediate state reset on perspective change
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      setData(null); // Clear previous data so stale mismatched role views never render
      try {
        const res = await getDashboardData(user?.id, activeRole, domainFilter, timeRange);
        if (isMounted) {
          setData(res.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [user, activeRole, domainFilter, timeRange]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await getDashboardData(user?.id, activeRole, domainFilter, timeRange);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const normalizedRole = (activeRole || 'researcher').toLowerCase();

  return (
    <EnterpriseLayout moduleTitle="Analytics Dashboard" activeModule="dashboard">
      <div className="dash-container fadeIn">
        
        {/* TOP COMMAND & FILTER BAR */}
        <div className="dash-command-header">
          <div className="dash-command-left">
            <div className="dash-title-group">
              <h1 className="dash-title">
                {getGreeting()}, {profile?.fullName?.split(' ')[0] || user?.name || 'Administrator'}
              </h1>
              <p className="dash-subtitle-text">
                Centralized cross-module intelligence consolidating Research (M3), Funding (M4), Patents (M5), Technology (M6), Innovation (M7), and Commercialization (M8).
              </p>
            </div>
            
            {/* Interactive Perspective / Role Switcher */}
            <div className="dash-perspective-switcher">
              <span className="dash-switcher-label">View Perspective:</span>
              <div className="dash-pills-group">
                {[
                  { key: 'Researcher', label: 'Researcher', icon: BookOpen },
                  { key: 'Startup Founder', label: 'Startup Founder', icon: Rocket },
                  { key: 'Innovation Manager', label: 'Innovation Manager', icon: Layers },
                  { key: 'Administrator', label: 'Administrator', icon: ShieldCheck }
                ].map(r => {
                  const Icon = r.icon;
                  const isActive = activeRole.toLowerCase().includes(r.key.toLowerCase().split(' ')[0]);
                  return (
                    <button
                      key={r.key}
                      className={`dash-pill-btn ${isActive ? 'active' : ''}`}
                      onClick={() => setActiveRole(r.key)}
                      title={`Switch to ${r.label} perspective`}
                    >
                      <Icon size={14} />
                      <span>{r.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Interactive Filters & Live Status */}
          <div className="dash-command-right">
            <div className="dash-filters-box">
              <div className="dash-filter-item">
                <label><Filter size={12} /> Domain:</label>
                <select 
                  value={domainFilter} 
                  onChange={(e) => setDomainFilter(e.target.value)}
                  className="dash-select"
                >
                  <option value="All">All Domains</option>
                  <option value="AI">Artificial Intelligence</option>
                  <option value="Biotech">Biotech & Healthcare</option>
                  <option value="CleanTech">Clean Energy</option>
                  <option value="Robotics">Robotics & IoT</option>
                </select>
              </div>

              <div className="dash-filter-item">
                <label><Clock size={12} /> Horizon:</label>
                <select 
                  value={timeRange} 
                  onChange={(e) => setTimeRange(e.target.value)}
                  className="dash-select"
                >
                  <option value="5Y">2022 - 2026 (5Y)</option>
                  <option value="3Y">2024 - 2026 (3Y)</option>
                  <option value="1Y">Last 12 Months</option>
                </select>
              </div>

              <button 
                className={`dash-refresh-btn ${isRefreshing ? 'spinning' : ''}`}
                onClick={handleRefresh}
                title="Refresh aggregated data from all modules"
              >
                <RefreshCw size={14} />
                <span>Sync</span>
              </button>
            </div>

            <div className="dash-sync-indicator">
              <span className="dash-sync-dot" />
              <span>Synced with Modules 3–8 • Live Index</span>
            </div>
          </div>
        </div>

        {/* LOADING SKELETON */}
        {loading || !data ? (
          <div className="dash-skeleton-container fadeIn">
            <div className="dash-skeleton-grid">
              <div className="dash-skeleton-card pulse" />
              <div className="dash-skeleton-card pulse" />
              <div className="dash-skeleton-card pulse" />
              <div className="dash-skeleton-card pulse" />
            </div>
            <div className="dash-skeleton-large pulse" style={{ marginTop: 20 }} />
          </div>
        ) : (
          <>
            {/* EXECUTIVE SUMMARY KPI STRIP */}
            <div className="dash-summary-row">
              {Object.entries(data?.summary || {}).map(([label, value]) => (
                <div className="dash-kpi-card" key={label}>
                  <div className="dash-kpi-val">{value}</div>
                  <div className="dash-kpi-lbl">{label}</div>
                  <div className="dash-kpi-status">
                    <span className="dash-kpi-badge">Validated</span>
                    <span className="dash-kpi-sub">Module Cross-Check</span>
                  </div>
                </div>
              ))}
            </div>

            {/* PROACTIVE INTELLIGENCE: WHAT NEEDS YOUR ATTENTION? (MODULE 10 INTEGRATION) */}
            {notifications && notifications.length > 0 && (
              <div style={{
                background: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: 12,
                padding: '18px 22px',
                marginBottom: 24,
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Bell size={17} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: '#0F172A' }}>
                        What Needs Your Attention?
                      </h3>
                      <span style={{ fontSize: 12, color: '#64748B' }}>
                        Proactive signals across funding deadlines, patent filings, and technology shifts
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/alerts')}
                    style={{
                      background: '#EFF6FF',
                      border: '1px solid #BFDBFE',
                      color: '#2563EB',
                      padding: '6px 14px',
                      borderRadius: 6,
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <span>Notification Center</span>
                    <ArrowRight size={13} />
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                  {notifications.slice(0, 3).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => navigate(n.action_url || '/alerts')}
                      style={{
                        padding: '12px 16px',
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderLeft: `4px solid ${n.priority === 'HIGH' ? '#F59E0B' : n.priority === 'CRITICAL' ? '#EF4444' : '#3B82F6'}`,
                        borderRadius: 8,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      className="cardHover"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', color: '#64748B' }}>
                          {n.category}
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 700, background: n.priority === 'HIGH' ? '#FEF3C7' : '#EFF6FF', color: n.priority === 'HIGH' ? '#B45309' : '#2563EB', padding: '1px 5px', borderRadius: 4 }}>
                          {n.priority}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {n.title}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#475569', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {n.message}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 1. RESEARCHER PERSPECTIVE (Modules 3, 4, 5, 7) */}
            {/* ========================================================================= */}
            {normalizedRole.includes('researcher') && (
              <div className="dash-role-content fadeIn">
                
                {/* ROW 1: Research Trends & Explainable Innovation Score */}
                <div className="dash-row-2col">
                  {/* Research Trends (Module 3) */}
                  <div className="dash-card">
                    <div className="dash-card-header">
                      <div className="dash-card-title-wrap">
                        <TrendingUp size={18} className="dash-icon-blue" />
                        <div>
                          <h2 className="dash-card-title">Research Trends & Publication Velocity</h2>
                          <p className="dash-card-subtitle">Module 3 Intelligence: Indexed academic output over time</p>
                        </div>
                      </div>
                      <button className="dash-link-btn" onClick={() => navigate('/research')}>
                        Explore Module 3 <ArrowRight size={13} />
                      </button>
                    </div>

                    <div className="dash-chart-wrapper">
                      <ResponsiveContainer width="100%" height={230}>
                        <LineChart data={data?.research_trends || []} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                          <XAxis dataKey="year" fontSize={11} tickLine={false} stroke="#64748B" />
                          <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="#64748B" />
                          <RechartsTooltip />
                          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 6 }} />
                          <Line type="monotone" name="Publications" dataKey="publications" stroke="#1D4ED8" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                          <Line type="monotone" name="Citations (Est.)" dataKey="citations" stroke="#059669" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="dash-subtopics-list">
                      <div className="dash-subtopics-head">Top Accelerating Research Subtopics:</div>
                      <div className="dash-subtopics-grid">
                        {(data?.trending_topics || []).map(t => (
                          <div className="dash-subtopic-tag" key={t.topic}>
                            <span className="dash-tag-name">{t.topic}</span>
                            <span className="dash-tag-growth">{t.growth}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Explainable Innovation Score (Module 7) */}
                  <div className="dash-card">
                    <div className="dash-card-header">
                      <div className="dash-card-title-wrap">
                        <Award size={18} className="dash-icon-amber" />
                        <div>
                          <h2 className="dash-card-title">Explainable Innovation Score</h2>
                          <p className="dash-card-subtitle">Module 7 Intelligence: 5-Factor Weighted Assessment</p>
                        </div>
                      </div>
                      <button className="dash-link-btn" onClick={() => navigate('/innovation')}>
                        View Scoring Engine <ArrowRight size={13} />
                      </button>
                    </div>

                    <div className="dash-score-hero">
                      <div className="dash-score-badge-circle">
                        <span className="dash-score-num">{data?.innovation_score?.total || 78}</span>
                        <span className="dash-score-den">/ 100</span>
                      </div>
                      <div className="dash-score-meta">
                        <h4 className="dash-score-status">{data?.innovation_score?.status || 'High Potential'}</h4>
                        <p className="dash-score-expl">
                          Score is explainable across 5 weighted dimensions combining prior art novelty, patent claims strength, technology readiness, market pull, and grant relevance.
                        </p>
                      </div>
                    </div>

                    <div className="dash-factors-stack">
                      {(data?.innovation_score?.factors || []).map(f => (
                        <div className="dash-factor-row" key={f.name}>
                          <div className="dash-factor-labels">
                            <span className="dash-factor-title">{f.name} <span className="dash-factor-weight">({f.weight}% wt)</span></span>
                            <span className="dash-factor-score">{f.value}/100</span>
                          </div>
                          <div className="dash-progress-track">
                            <div className="dash-progress-bar" style={{ width: `${f.value}%` }} />
                          </div>
                          <div className="dash-factor-desc">{f.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ROW 2: Funding Opportunities & Patent Insights */}
                <div className="dash-row-2col" style={{ marginTop: 24 }}>
                  {/* Funding Recommendations (Module 4) */}
                  <div className="dash-card">
                    <div className="dash-card-header">
                      <div className="dash-card-title-wrap">
                        <DollarSign size={18} className="dash-icon-green" />
                        <div>
                          <h2 className="dash-card-title">Targeted Funding Recommendations</h2>
                          <p className="dash-card-subtitle">Module 4 Intelligence: Grant matching engine</p>
                        </div>
                      </div>
                      <button className="dash-link-btn" onClick={() => navigate('/funding')}>
                        All Grants <ArrowRight size={13} />
                      </button>
                    </div>

                    <div className="dash-grants-list">
                      {(data?.funding_opportunities || []).map(grant => (
                        <div className="dash-grant-card" key={grant.id}>
                          <div className="dash-grant-top">
                            <div>
                              <h4 className="dash-grant-title">{grant.title}</h4>
                              <p className="dash-grant-org">{grant.org} • <span className="dash-grant-domain">{grant.domain}</span></p>
                            </div>
                            <div className="dash-grant-stat">
                              <span className="dash-grant-amount">{grant.amount}</span>
                              <span className="dash-grant-match">{grant.match} Match</span>
                            </div>
                          </div>
                          <p className="dash-grant-eligibility">
                            <strong>Eligibility:</strong> {grant.eligibility}
                          </p>
                          <div className="dash-grant-footer">
                            <span className="dash-grant-deadline"><Clock size={12} /> {grant.deadline}</span>
                            <button className="dash-btn-sm" onClick={() => navigate('/funding')}>Apply / View Call</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Patent Insights (Module 5) */}
                  <div className="dash-card">
                    <div className="dash-card-header">
                      <div className="dash-card-title-wrap">
                        <FileText size={18} className="dash-icon-purple" />
                        <div>
                          <h2 className="dash-card-title">Patent Landscape & Assignee Velocity</h2>
                          <p className="dash-card-subtitle">Module 5 Intelligence: Prior art & competitive filings</p>
                        </div>
                      </div>
                      <button className="dash-link-btn" onClick={() => navigate('/patents')}>
                        Patent Analytics <ArrowRight size={13} />
                      </button>
                    </div>

                    <div className="dash-patent-metrics">
                      <div className="dash-patent-metric-item">
                        <span className="dash-pm-lbl">Total Relevant Patents</span>
                        <span className="dash-pm-val">{data?.patent_insights?.total || 1240}</span>
                      </div>
                      <div className="dash-patent-metric-item">
                        <span className="dash-pm-lbl">Patent Filing Trend</span>
                        <span className="dash-pm-val dash-trend-up">{data?.patent_insights?.trend || 'Increasing'}</span>
                      </div>
                    </div>

                    <div className="dash-chart-wrapper" style={{ marginTop: 12 }}>
                      <ResponsiveContainer width="100%" height={140}>
                        <BarChart data={data?.patent_insights?.timeline || []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                          <XAxis dataKey="year" fontSize={11} tickLine={false} stroke="#64748B" />
                          <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="#64748B" />
                          <RechartsTooltip />
                          <Bar dataKey="patents" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Patents Filed" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="dash-patent-assignees">
                      <div className="dash-subtopics-head">Major Patent Assignees in Domain:</div>
                      <div className="dash-assignee-badges">
                        {(data?.patent_insights?.top_assignees || []).map(a => (
                          <span className="dash-assignee-badge" key={a}>{a}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ROW 3: Publication Analytics & Citation Profile */}
                <div className="dash-card" style={{ marginTop: 24 }}>
                  <div className="dash-card-header">
                    <div className="dash-card-title-wrap">
                      <BookOpen size={18} className="dash-icon-blue" />
                      <div>
                        <h2 className="dash-card-title">Publication & Citation Domain Distribution</h2>
                        <p className="dash-card-subtitle">Module 3 Analytics: Corpus distribution across research vectors</p>
                      </div>
                    </div>
                    <div className="dash-h-metrics">
                      <span className="dash-h-tag">Total Citations: <strong>{data?.publication_analytics?.total_citations?.toLocaleString() || '18,420'}</strong></span>
                      <span className="dash-h-tag">h-Index: <strong>{data?.publication_analytics?.h_index || 48}</strong></span>
                    </div>
                  </div>

                  <div className="dash-domain-bars">
                    {(data?.publication_analytics?.domains || []).map(d => (
                      <div className="dash-domain-bar-item" key={d.domain}>
                        <div className="dash-domain-bar-top">
                          <span className="dash-domain-name">{d.domain}</span>
                          <span className="dash-domain-count">{d.count} publications ({d.percentage}%)</span>
                        </div>
                        <div className="dash-domain-track">
                          <div className="dash-domain-fill" style={{ width: `${d.percentage}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* ========================================================================= */}
            {/* 2. STARTUP FOUNDER PERSPECTIVE (Modules 4, 5, 6, 8) */}
            {/* ========================================================================= */}
            {normalizedRole.includes('startup') && (
              <div className="dash-role-content fadeIn">
                
                {/* Emerging Technology Opportunities (Module 6) */}
                <div className="dash-card">
                  <div className="dash-card-header">
                    <div className="dash-card-title-wrap">
                      <Cpu size={18} className="dash-icon-blue" />
                      <div>
                        <h2 className="dash-card-title">High-Growth Emerging Technology Opportunities</h2>
                        <p className="dash-card-subtitle">Module 6 Intelligence: Commercial opportunity rationale & growth velocity</p>
                      </div>
                    </div>
                    <button className="dash-link-btn" onClick={() => navigate('/technology')}>
                      View Technology Intelligence <ArrowRight size={13} />
                    </button>
                  </div>

                  <div className="dash-table-container">
                    <table className="dash-data-table">
                      <thead>
                        <tr>
                          <th>Technology Vector</th>
                          <th>Research Growth</th>
                          <th>Patent Velocity</th>
                          <th>Adoption Stage</th>
                          <th>Commercial Business Opportunity</th>
                          <th>Key Competitors</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(data?.technology_opportunities || []).map(tech => (
                          <tr key={tech.name}>
                            <td className="dash-td-primary"><strong>{tech.name}</strong></td>
                            <td><span className="dash-growth-tag high">{tech.research_growth}</span></td>
                            <td><span className="dash-growth-tag moderate">{tech.patent_growth}</span></td>
                            <td><span className="dash-status-pill">{tech.adoption}</span></td>
                            <td className="dash-td-desc">{tech.opportunity}</td>
                            <td className="dash-td-competitors">{tech.competitors}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ROW: Commercialization Pathways & Patent Intelligence */}
                <div className="dash-row-2col" style={{ marginTop: 24 }}>
                  
                  {/* Commercialization Insights (Module 8) */}
                  <div className="dash-card">
                    <div className="dash-card-header">
                      <div className="dash-card-title-wrap">
                        <Rocket size={18} className="dash-icon-teal" />
                        <div>
                          <h2 className="dash-card-title">Commercialization Pathways & Go-To-Market</h2>
                          <p className="dash-card-subtitle">Module 8 Intelligence: Productization, licensing & spin-off validation</p>
                        </div>
                      </div>
                      <button className="dash-link-btn" onClick={() => navigate('/commercialization')}>
                        Module 8 Details <ArrowRight size={13} />
                      </button>
                    </div>

                    <div className="dash-comm-list">
                      {(data?.commercialization_insights || []).map(c => (
                        <div className="dash-comm-card" key={c.path}>
                          <div className="dash-comm-head">
                            <h4 className="dash-comm-title">{c.path}</h4>
                            <div className="dash-comm-confidence">
                              <span>Confidence:</span>
                              <strong>{c.confidence}%</strong>
                            </div>
                          </div>
                          <p className="dash-comm-desc">{c.desc}</p>
                          <div className="dash-comm-meta">
                            <span className="dash-comm-evidence"><strong>Evidence:</strong> {c.evidence}</span>
                            <span className="dash-comm-time"><Clock size={12} /> {c.timeframe}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Patent Intelligence & Freedom to Operate (Module 5) */}
                  <div className="dash-card">
                    <div className="dash-card-header">
                      <div className="dash-card-title-wrap">
                        <FileText size={18} className="dash-icon-purple" />
                        <div>
                          <h2 className="dash-card-title">Competitor Patent Intelligence & FTO</h2>
                          <p className="dash-card-subtitle">Module 5 Intelligence: Competitor filings and white-space risk</p>
                        </div>
                      </div>
                      <button className="dash-link-btn" onClick={() => navigate('/patents')}>
                        Freedom to Operate <ArrowRight size={13} />
                      </button>
                    </div>

                    <div className="dash-fto-summary">
                      <span className="dash-fto-label">Freedom to Operate Status:</span>
                      <span className="dash-fto-badge">{data?.patent_intelligence?.freedom_to_operate || 'Evaluated'}</span>
                    </div>

                    <div className="dash-table-container" style={{ marginTop: 12 }}>
                      <table className="dash-data-table compact">
                        <thead>
                          <tr>
                            <th>Assignee / Competitor</th>
                            <th>2025 Filings</th>
                            <th>Filing Focus</th>
                            <th>Threat Level</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(data?.patent_intelligence?.competitor_activity || []).map(item => (
                            <tr key={item.assignee}>
                              <td><strong>{item.assignee}</strong></td>
                              <td>{item.filed_2025}</td>
                              <td>{item.focus}</td>
                              <td>
                                <span className={`dash-risk-tag ${item.risk?.toLowerCase()}`}>
                                  {item.risk} Risk
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="dash-funding-box" style={{ marginTop: 16 }}>
                      <div className="dash-subtopics-head">Startup Non-Dilutive Capital Calls:</div>
                      {(data?.funding_opportunities || []).slice(0, 2).map(f => (
                        <div className="dash-grant-card" key={f.id} style={{ padding: '12px 14px', marginBottom: 8 }}>
                          <div className="dash-grant-top">
                            <div>
                              <h5 style={{ margin: 0, fontSize: 13, color: '#0F172A' }}>{f.title}</h5>
                              <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748B' }}>{f.org} • {f.type}</p>
                            </div>
                            <span className="dash-grant-amount" style={{ fontSize: 13 }}>{f.amount}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                  </div>
                </div>

              </div>
            )}

            {/* ========================================================================= */}
            {/* 3. INNOVATION MANAGER PERSPECTIVE (Portfolio, Pipeline, Trends, Funding) */}
            {/* ========================================================================= */}
            {normalizedRole.includes('manager') && (
              <div className="dash-role-content fadeIn">
                
                {/* Visual Innovation Pipeline Tracking */}
                <div className="dash-card">
                  <div className="dash-card-header">
                    <div className="dash-card-title-wrap">
                      <Layers size={18} className="dash-icon-blue" />
                      <div>
                        <h2 className="dash-card-title">Innovation Pipeline Tracking (Journey from Idea to Commercialization)</h2>
                        <p className="dash-card-subtitle">End-to-end lifecycle throughput monitoring</p>
                      </div>
                    </div>
                    <span className="dash-sync-badge">5 Stages Active</span>
                  </div>

                  <div className="dash-pipeline-flow">
                    {(data?.pipeline || []).map((stage, idx) => (
                      <div className="dash-pipeline-node" key={stage.stage}>
                        <div className="dash-pipeline-count" style={{ borderColor: stage.color, color: stage.color }}>
                          {stage.count}
                        </div>
                        <div className="dash-pipeline-info">
                          <h4 className="dash-pipeline-title">{stage.stage}</h4>
                          <p className="dash-pipeline-desc">{stage.desc}</p>
                        </div>
                        {idx < (data?.pipeline || []).length - 1 && (
                          <div className="dash-pipeline-arrow">→</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Portfolio Analytics Matrix */}
                <div className="dash-card" style={{ marginTop: 24 }}>
                  <div className="dash-card-header">
                    <div className="dash-card-title-wrap">
                      <BarChart2 size={18} className="dash-icon-purple" />
                      <div>
                        <h2 className="dash-card-title">Institutional Portfolio Analytics</h2>
                        <p className="dash-card-subtitle">Cross-project tracking across technology domains, readiness, and scoring</p>
                      </div>
                    </div>
                    <button className="dash-link-btn" onClick={() => navigate('/innovation')}>
                      Manage Portfolio <ArrowRight size={13} />
                    </button>
                  </div>

                  <div className="dash-table-container">
                    <table className="dash-data-table">
                      <thead>
                        <tr>
                          <th>Project Identifier</th>
                          <th>Principal Lead</th>
                          <th>Technology Domain</th>
                          <th>Innovation Score (M7)</th>
                          <th>Pipeline Stage</th>
                          <th>Maturity (TRL)</th>
                          <th>Funding Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(data?.portfolio_projects || []).map(proj => (
                          <tr key={proj.id}>
                            <td><strong>{proj.name}</strong> <span className="dash-id-dim">({proj.id})</span></td>
                            <td>{proj.lead}</td>
                            <td>{proj.domain}</td>
                            <td>
                              <span className={`dash-score-tag ${proj.score >= 80 ? 'high' : 'medium'}`}>
                                {proj.score}/100
                              </span>
                            </td>
                            <td><span className="dash-stage-badge">{proj.stage}</span></td>
                            <td><span className="dash-trl-badge">{proj.maturity}</span></td>
                            <td><span className="dash-funding-status">{proj.funding}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ROW: Technology Trend Monitoring & Funding Analytics */}
                <div className="dash-row-2col" style={{ marginTop: 24 }}>
                  
                  {/* Technology Trend Monitoring (Module 6) */}
                  <div className="dash-card">
                    <div className="dash-card-header">
                      <div className="dash-card-title-wrap">
                        <Cpu size={18} className="dash-icon-blue" />
                        <div>
                          <h2 className="dash-card-title">Technology Trend Monitoring</h2>
                          <p className="dash-card-subtitle">Module 6: Trajectory classification & maturity indicators</p>
                        </div>
                      </div>
                      <button className="dash-link-btn" onClick={() => navigate('/technology')}>
                        Trend Monitor <ArrowRight size={13} />
                      </button>
                    </div>

                    <div className="dash-tech-trends-list">
                      {(data?.technology_trends || []).map(t => (
                        <div className="dash-trend-row" key={t.technology}>
                          <div className="dash-trend-col-left">
                            <span className={`dash-arrow-dir ${t.direction === '↑' ? 'up' : t.direction === '↓' ? 'down' : 'stable'}`}>
                              {t.direction}
                            </span>
                            <div>
                              <h4 className="dash-trend-tech-name">{t.technology}</h4>
                              <p className="dash-trend-stage">{t.trend} • {t.maturity}</p>
                            </div>
                          </div>
                          <div className="dash-trend-col-right">
                            <span className="dash-trend-growth">{t.growth}</span>
                            <span className="dash-trend-act">Activity: {t.commercialActivity}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Funding Analytics by Domain (Module 4) */}
                  <div className="dash-card">
                    <div className="dash-card-header">
                      <div className="dash-card-title-wrap">
                        <DollarSign size={18} className="dash-icon-green" />
                        <div>
                          <h2 className="dash-card-title">Portfolio Funding Analytics</h2>
                          <p className="dash-card-subtitle">Module 4: Grant pool allocation & multi-consortium opportunities</p>
                        </div>
                      </div>
                      <button className="dash-link-btn" onClick={() => navigate('/funding')}>
                        Funding Intelligence <ArrowRight size={13} />
                      </button>
                    </div>

                    <div className="dash-domain-bars">
                      <div className="dash-subtopics-head" style={{ marginBottom: 12 }}>
                        Total Available Grant Pool: <strong>{data?.funding_analytics?.total_available || '$38.2M'}</strong>
                      </div>
                      {(data?.funding_analytics?.domain_breakdown || []).map(d => (
                        <div className="dash-domain-bar-item" key={d.domain}>
                          <div className="dash-domain-bar-top">
                            <span className="dash-domain-name">{d.domain}</span>
                            <span className="dash-domain-count">${d.amount}M ({d.percentage}%)</span>
                          </div>
                          <div className="dash-domain-track">
                            <div className="dash-domain-fill" style={{ width: `${d.percentage}%`, backgroundColor: '#059669' }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="dash-upcoming-calls" style={{ marginTop: 20 }}>
                      <div className="dash-subtopics-head">Major Active Institutional Calls:</div>
                      {(data?.funding_analytics?.upcoming_calls || []).map(call => (
                        <div className="dash-call-item" key={call.program}>
                          <div>
                            <h5 className="dash-call-title">{call.program}</h5>
                            <p className="dash-call-meta">Pool: {call.grantPool} • Closes in {call.deadline}</p>
                          </div>
                          <span className="dash-call-rel">{call.relevance} Relevance</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* ========================================================================= */}
            {/* 4. ADMINISTRATOR PERSPECTIVE (Platform Analytics, User Management, Reports) */}
            {/* ========================================================================= */}
            {normalizedRole.includes('admin') && (
              <div className="dash-role-content fadeIn">
                
                {/* Platform Analytics & Search Telemetry */}
                <div className="dash-row-2col">
                  
                  {/* Search Activity by Module */}
                  <div className="dash-card">
                    <div className="dash-card-header">
                      <div className="dash-card-title-wrap">
                        <Activity size={18} className="dash-icon-blue" />
                        <div>
                          <h2 className="dash-card-title">Platform Intelligence Telemetry</h2>
                          <p className="dash-card-subtitle">Aggregate user queries across modules 3–8</p>
                        </div>
                      </div>
                      <span className="dash-sync-badge">32,840 Total Searches</span>
                    </div>

                    <div className="dash-domain-bars">
                      {(data?.platform_analytics?.search_activity || []).map(s => (
                        <div className="dash-domain-bar-item" key={s.category}>
                          <div className="dash-domain-bar-top">
                            <span className="dash-domain-name">{s.category}</span>
                            <span className="dash-domain-count">{s.count?.toLocaleString()} searches ({s.pct}%)</span>
                          </div>
                          <div className="dash-domain-track">
                            <div className="dash-domain-fill" style={{ width: `${s.pct}%`, backgroundColor: '#1D4ED8' }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="dash-chart-wrapper" style={{ marginTop: 20 }}>
                      <ResponsiveContainer width="100%" height={150}>
                        <BarChart data={data?.platform_analytics?.timeline || []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                          <XAxis dataKey="day" fontSize={11} tickLine={false} stroke="#64748B" />
                          <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="#64748B" />
                          <RechartsTooltip />
                          <Bar dataKey="searches" fill="#3B82F6" name="Module Searches" radius={[3, 3, 0, 0]} />
                          <Bar dataKey="recommendations" fill="#10B981" name="Recommendations" radius={[3, 3, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Recommendation Monitoring & Effectiveness */}
                  <div className="dash-card">
                    <div className="dash-card-header">
                      <div className="dash-card-title-wrap">
                        <Zap size={18} className="dash-icon-amber" />
                        <div>
                          <h2 className="dash-card-title">Recommendation Engine Monitoring</h2>
                          <p className="dash-card-subtitle">Generated volume, adoption rates, and algorithmic accuracy</p>
                        </div>
                      </div>
                      <span className="dash-sync-badge">41,200 Served</span>
                    </div>

                    <div className="dash-table-container">
                      <table className="dash-data-table compact">
                        <thead>
                          <tr>
                            <th>Recommendation Stream</th>
                            <th>Total Generated</th>
                            <th>User CTR / Action</th>
                            <th>Avg Match Score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(data?.recommendation_monitoring?.breakdown || []).map(rec => (
                            <tr key={rec.type}>
                              <td><strong>{rec.type}</strong></td>
                              <td>{rec.generated?.toLocaleString()}</td>
                              <td><span className="dash-growth-tag moderate">{rec.ctr}</span></td>
                              <td><span className="dash-score-tag high">{rec.avgScore}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* System Infrastructure Health */}
                    <div className="dash-sys-reports" style={{ marginTop: 24 }}>
                      <div className="dash-subtopics-head">Infrastructure Health & Latency:</div>
                      <div className="dash-sys-grid">
                        <div className="dash-sys-card">
                          <span className="dash-sys-lbl">API Latency</span>
                          <span className="dash-sys-val">{data?.system_reports?.api_latency || '38 ms'}</span>
                        </div>
                        <div className="dash-sys-card">
                          <span className="dash-sys-lbl">Database Pool</span>
                          <span className="dash-sys-val" style={{ color: '#059669' }}>{data?.system_reports?.database_status || 'Healthy'}</span>
                        </div>
                        <div className="dash-sys-card">
                          <span className="dash-sys-lbl">Cache Hit Rate</span>
                          <span className="dash-sys-val">{data?.system_reports?.cache_hit_rate || '94.2%'}</span>
                        </div>
                        <div className="dash-sys-card">
                          <span className="dash-sys-lbl">Worker Queue</span>
                          <span className="dash-sys-val">{data?.system_reports?.worker_queue || 'Idle'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* User Management & Access Directory */}
                <div className="dash-card" style={{ marginTop: 24 }}>
                  <div className="dash-card-header">
                    <div className="dash-card-title-wrap">
                      <Users size={18} className="dash-icon-blue" />
                      <div>
                        <h2 className="dash-card-title">User Directory & Role-Based Access Control</h2>
                        <p className="dash-card-subtitle">Active platform constituents segmented across the four personas</p>
                      </div>
                    </div>
                    <div className="dash-role-dist-badges">
                      {(data?.user_management?.by_role || []).map(r => (
                        <span className="dash-role-pill" key={r.role}>
                          <span className="dash-dot-indicator" style={{ backgroundColor: r.color }} />
                          {r.role}: <strong>{r.count}</strong> ({r.percentage}%)
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="dash-table-container">
                    <table className="dash-data-table">
                      <thead>
                        <tr>
                          <th>User ID</th>
                          <th>Full Name</th>
                          <th>Email Address</th>
                          <th>Assigned Role</th>
                          <th>Affiliation / Org</th>
                          <th>Last Activity</th>
                          <th>Access Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(data?.user_management?.recent_users || []).map(u => (
                          <tr key={u.id}>
                            <td className="dash-id-dim">{u.id}</td>
                            <td><strong>{u.name}</strong></td>
                            <td>{u.email}</td>
                            <td><span className="dash-role-badge">{u.role}</span></td>
                            <td>{u.org}</td>
                            <td>{u.lastActive}</td>
                            <td>
                              <span className="dash-active-status">
                                <span className="dash-status-dot" /> {u.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* ========================================================================= */}
            {/* ACTIONABLE DIRECTIVES & INTELLIGENCE SIGNALS (Universal) */}
            {/* ========================================================================= */}
            <div className="dash-card dash-actionable-card" style={{ marginTop: 24 }}>
              <div className="dash-card-header">
                <div className="dash-card-title-wrap">
                  <Zap size={18} className="dash-icon-amber" />
                  <div>
                    <h2 className="dash-card-title">Key Signals & Recommended Next Actions</h2>
                    <p className="dash-card-subtitle">Synthesized insights based on cross-module event monitoring</p>
                  </div>
                </div>
                <span className="dash-sync-badge">Action Required</span>
              </div>

              <div className="dash-signals-list">
                {(data?.actionable_insights || []).map((insight, idx) => (
                  <div className="dash-signal-item" key={idx}>
                    <div className="dash-signal-icon-wrap">
                      <CheckCircle size={16} className="dash-icon-green" />
                    </div>
                    <div className="dash-signal-content">
                      <p className="dash-signal-text">{insight}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </>
        )}

      </div>
    </EnterpriseLayout>
  );
}
