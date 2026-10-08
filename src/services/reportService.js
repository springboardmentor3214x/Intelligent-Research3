/**
 * MODULE 11: REPORT SERVICE
 * Single-source-of-truth aggregation layer for report generation.
 * Delegates to existing module services (3-8). Never independently
 * calculates values that would conflict with module outputs.
 */

import { fetchResearchPapers } from './researchService.js';
import { fetchFundingOpportunities } from './fundingService.js';
import { fetchPatents, clusterPatentsByTechnology, extractCompetitorAnalysis } from './patentService.js';
import { getTechnologies } from './technologyApi.js';
import { getInnovationAssessments } from './innovationApi.js';
import { getCommercializationOverview } from './commercializationApi.js';
import { platformEventBus, EVENT_TYPES } from './eventBus.js';

export const REPORT_VERSION = '11.1.0';
export const METHODOLOGY_VERSION = 'innovation_v1';

export const REPORT_TYPES = [
  { id: 'funding', label: 'Funding Intelligence Report', description: 'Comprehensive analysis of funding opportunities matched to your profile.', module: 'Module 4', color: '#059669', bg: '#ECFDF5', icon: 'DollarSign', filters: ['domain', 'funding_type', 'agency', 'country', 'date_range'], sections: ['Summary', 'Funding Opportunities', 'Eligibility Analysis', 'Analytics'], estimatedTime: '< 30 seconds' },
  { id: 'patents', label: 'Patent Landscape Report', description: 'Patent mapping, assignee analysis, and technology cluster intelligence.', module: 'Module 5', color: '#8B5CF6', bg: '#F5F3FF', icon: 'FileText', filters: ['technology', 'domain', 'assignee', 'classification', 'date_range'], sections: ['Summary', 'Patent List', 'Assignee Analysis', 'Technology Clusters'], estimatedTime: '< 30 seconds' },
  { id: 'research', label: 'Research Trend Report', description: 'Publication activity, emerging topics, and research landscape analysis.', module: 'Module 3', color: '#1D4ED8', bg: '#EFF6FF', icon: 'TrendingUp', filters: ['domain', 'research_area', 'keyword', 'date_range'], sections: ['Summary', 'Publications', 'Trend Analysis', 'Emerging Topics'], estimatedTime: '< 30 seconds' },
  { id: 'technology', label: 'Technology Intelligence Report', description: 'Technology maturity, adoption signals, and competitive landscape.', module: 'Module 6', color: '#0284C7', bg: '#E0F2FE', icon: 'Cpu', filters: ['technology', 'maturity', 'adoption', 'domain', 'date_range'], sections: ['Summary', 'Technology Analysis', 'Maturity Assessment', 'Adoption Signals'], estimatedTime: '< 30 seconds' },
  { id: 'innovation', label: 'Innovation Intelligence Report', description: 'Innovation scoring breakdown with full factor analysis and evidence.', module: 'Module 7', color: '#D97706', bg: '#FEF3C7', icon: 'Award', filters: ['research_area', 'technology', 'score_min', 'score_max', 'date_range'], sections: ['Summary', 'Innovation Scores', 'Factor Breakdown', 'Evidence'], estimatedTime: '< 30 seconds' },
  { id: 'commercialization', label: 'Commercialization Report', description: 'Commercialization pathway analysis across four strategic dimensions.', module: 'Module 8', color: '#0D9488', bg: '#CCFBF1', icon: 'Rocket', filters: ['technology', 'pathway', 'domain', 'date_range'], sections: ['Summary', 'Productization', 'Licensing', 'Startup Opportunities', 'Industry Partnerships'], estimatedTime: '< 30 seconds' },
  { id: 'comprehensive', label: 'Comprehensive Intelligence Report', description: 'Executive-grade multi-module intelligence report combining all platform data.', module: 'Modules 3-8', color: '#123B72', bg: '#EFF6FF', icon: 'FileBarChart2', filters: ['domain', 'technology', 'keyword', 'date_range'], sections: ['Cover Page', 'Executive Summary', 'Research Intelligence', 'Funding Intelligence', 'Patent Landscape', 'Technology Intelligence', 'Innovation Assessment', 'Commercialization Opportunities', 'Key Insights', 'Risks & Limitations', 'Data Sources & Methodology'], estimatedTime: '30-90 seconds', isComprehensive: true },
];

export const REPORT_STATUSES = { QUEUED: 'queued', GENERATING: 'generating', COMPLETED: 'completed', FAILED: 'failed', EXPIRED: 'expired' };

const HISTORY_KEY = (userId) => `ri_report_history_${userId || 'guest'}`;

export function getReportHistory(userId) {
  try { const raw = localStorage.getItem(HISTORY_KEY(userId)); return raw ? JSON.parse(raw) : []; } catch { return []; }
}

function saveReportHistory(userId, history) {
  try { localStorage.setItem(HISTORY_KEY(userId), JSON.stringify(history)); } catch (e) { console.warn('Report history save error:', e); }
}

function updateReportInHistory(userId, reportId, updates) {
  const history = getReportHistory(userId);
  const idx = history.findIndex((r) => r.id === reportId);
  if (idx !== -1) { history[idx] = { ...history[idx], ...updates }; saveReportHistory(userId, history); return history[idx]; }
  return null;
}

export function deleteReport(userId, reportId) {
  const history = getReportHistory(userId);
  const filtered = history.filter((r) => r.id !== reportId);
  saveReportHistory(userId, filtered);
  return filtered;
}

export function canAccessReport(user, profile, reportRecord) {
  if (!user) return { allowed: false, reason: 'Authentication required.' };
  if (reportRecord.user_id && reportRecord.user_id !== user.id) {
    if (!(profile?.role || '').toLowerCase().includes('admin')) return { allowed: false, reason: 'Access denied. You do not own this report.' };
  }
  return { allowed: true };
}

export function getAllowedReportTypes(profile) {
  const role = (profile?.role || '').toLowerCase();
  if (role.includes('admin')) return REPORT_TYPES;
  if (role.includes('researcher')) return REPORT_TYPES.filter((t) => ['research', 'funding', 'patents', 'innovation', 'commercialization', 'comprehensive'].includes(t.id));
  if (role.includes('startup') || role.includes('founder')) return REPORT_TYPES.filter((t) => ['funding', 'patents', 'technology', 'innovation', 'commercialization', 'comprehensive'].includes(t.id));
  if (role.includes('manager')) return REPORT_TYPES.filter((t) => ['technology', 'innovation', 'funding', 'comprehensive', 'research', 'patents'].includes(t.id));
  return REPORT_TYPES;
}

function generateReportId() { return `rpt-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`; }

export function generateDefaultTitle(reportType, filters = {}) {
  const typeInfo = REPORT_TYPES.find((t) => t.id === reportType);
  const label = typeInfo?.label || 'Intelligence Report';
  const year = new Date().getFullYear();
  const domain = filters.domain && filters.domain !== 'All' ? `${filters.domain} ` : '';
  const dateStr = filters.dateRange ? ` ${filters.dateRange.start?.slice(0, 4) || year}-${filters.dateRange.end?.slice(0, 4) || year}` : ` ${year}`;
  return `${domain}${label}${dateStr}`;
}

async function aggregateResearchData(filters = {}) {
  const query = filters.keyword || filters.domain || filters.research_area || 'Artificial Intelligence';
  try {
    const papers = await fetchResearchPapers(query, { limit: 20 });
    const totalCitations = papers.reduce((sum, p) => sum + (p.citations_count || 0), 0);
    const avgCitations = papers.length > 0 ? (totalCitations / papers.length).toFixed(1) : 0;
    const openAccessCount = papers.filter((p) => p.open_access).length;
    const yearMap = {};
    papers.forEach((p) => { const yr = p.year || 'Unknown'; yearMap[yr] = (yearMap[yr] || 0) + 1; });
    const publicationsByYear = Object.entries(yearMap).sort(([a], [b]) => Number(a) - Number(b)).map(([year, count]) => ({ year, count }));
    const sourceMap = {};
    papers.forEach((p) => { sourceMap[p.source] = (sourceMap[p.source] || 0) + 1; });
    const kwMap = {};
    papers.forEach((p) => { (p.keywords || []).forEach((kw) => { kwMap[kw] = (kwMap[kw] || 0) + 1; }); });
    const topKeywords = Object.entries(kwMap).sort(([, a], [, b]) => b - a).slice(0, 8).map(([keyword, count]) => ({ keyword, count }));
    return {
      status: 'success', source_module: 'Module 3 - Research Intelligence', query,
      analysis_period: filters.dateRange ? `${filters.dateRange.start || 'All time'} to ${filters.dateRange.end || 'Present'}` : 'All Available Data',
      papers,
      summary: { total_papers: papers.length, total_citations: totalCitations, avg_citations: Number(avgCitations), open_access_count: openAccessCount, open_access_pct: papers.length > 0 ? Math.round((openAccessCount / papers.length) * 100) : 0 },
      analytics: { publications_by_year: publicationsByYear, source_distribution: Object.entries(sourceMap).map(([source, count]) => ({ source, count })), top_keywords: topKeywords },
      data_sources: ['OpenAlex', 'Semantic Scholar'], generated_at: new Date().toISOString(),
    };
  } catch { return { status: 'error', error: 'Research data could not be retrieved. Please try again.', source_module: 'Module 3 - Research Intelligence' }; }
}

async function aggregateFundingData(filters = {}) {
  const query = filters.keyword || filters.domain || filters.research_area || 'Artificial Intelligence';
  try {
    const opportunities = await fetchFundingOpportunities(query, { limit: 15 });
    let filtered = [...opportunities];
    if (filters.funding_type) filtered = filtered.filter((o) => o.funding_type?.toLowerCase().includes(filters.funding_type.toLowerCase()));
    if (filters.agency) filtered = filtered.filter((o) => o.agency?.toLowerCase().includes(filters.agency.toLowerCase()));
    if (filters.country) filtered = filtered.filter((o) => o.country?.toLowerCase().includes(filters.country.toLowerCase()));
    const agencyMap = {};
    filtered.forEach((o) => { const ag = o.agency?.split('(')[0]?.trim() || 'Unknown'; agencyMap[ag] = (agencyMap[ag] || 0) + 1; });
    const typeMap = {};
    filtered.forEach((o) => { const ft = o.funding_type || 'Unknown'; typeMap[ft] = (typeMap[ft] || 0) + 1; });
    const countryMap = {};
    filtered.forEach((o) => { const c = o.country || 'Unknown'; countryMap[c] = (countryMap[c] || 0) + 1; });
    return {
      status: 'success', source_module: 'Module 4 - Funding Intelligence', query,
      analysis_period: filters.dateRange ? `${filters.dateRange.start || 'All time'} to ${filters.dateRange.end || 'Present'}` : 'All Available Data',
      opportunities: filtered,
      summary: { total_opportunities: filtered.length, by_agency: Object.entries(agencyMap).map(([agency, count]) => ({ agency, count })), by_type: Object.entries(typeMap).map(([type, count]) => ({ type, count })), by_country: Object.entries(countryMap).map(([country, count]) => ({ country, count })) },
      data_sources: ['Grants.gov', 'Horizon Europe', 'Internal Funding Index'], generated_at: new Date().toISOString(),
    };
  } catch { return { status: 'error', error: 'Funding data could not be retrieved. Please try again.', source_module: 'Module 4 - Funding Intelligence' }; }
}

async function aggregatePatentData(filters = {}) {
  const query = filters.technology || filters.domain || filters.keyword || 'Artificial Intelligence';
  try {
    const patents = await fetchPatents(query, { limit: 15 });
    const clusters = clusterPatentsByTechnology(patents);
    const competitors = extractCompetitorAnalysis(patents);
    const totalCitations = patents.reduce((sum, p) => sum + (p.citations || 0), 0);
    const avgCitations = patents.length > 0 ? (totalCitations / patents.length).toFixed(1) : 0;
    const statusMap = {};
    patents.forEach((p) => { statusMap[p.status || 'Unknown'] = (statusMap[p.status || 'Unknown'] || 0) + 1; });
    const domainMap = {};
    patents.forEach((p) => { domainMap[p.technology_domain] = (domainMap[p.technology_domain] || 0) + 1; });
    return {
      status: 'success', source_module: 'Module 5 - Patent Landscape', query,
      analysis_period: filters.dateRange ? `${filters.dateRange.start || 'All time'} to ${filters.dateRange.end || 'Present'}` : 'All Available Data',
      patents, clusters, competitors,
      summary: { total_patents: patents.length, total_citations: totalCitations, avg_citations: Number(avgCitations), total_clusters: clusters.length, total_competitors: competitors.length, by_status: Object.entries(statusMap).map(([status, count]) => ({ status, count })), by_domain: Object.entries(domainMap).map(([domain, count]) => ({ domain, count })) },
      data_sources: ['EPO Open Patent Services', 'USPTO', 'Google Patents'], generated_at: new Date().toISOString(),
    };
  } catch { return { status: 'error', error: 'Patent data could not be retrieved. Please try again.', source_module: 'Module 5 - Patent Landscape' }; }
}

async function aggregateTechnologyData(filters = {}) {
  try {
    const { data: technologies, total } = await getTechnologies(filters);
    const maturityMap = {};
    technologies.forEach((t) => { maturityMap[t.maturity_level] = (maturityMap[t.maturity_level] || 0) + 1; });
    const domainMap = {};
    technologies.forEach((t) => { domainMap[t.domain] = (domainMap[t.domain] || 0) + 1; });
    const topByGrowth = [...technologies].sort((a, b) => (b.growth_rate || 0) - (a.growth_rate || 0)).slice(0, 5);
    return {
      status: 'success', source_module: 'Module 6 - Technology Intelligence',
      analysis_period: filters.dateRange ? `${filters.dateRange.start || 'All time'} to ${filters.dateRange.end || 'Present'}` : 'All Available Data',
      technologies,
      summary: { total_technologies: total, by_maturity: Object.entries(maturityMap).map(([maturity, count]) => ({ maturity, count })), by_domain: Object.entries(domainMap).map(([domain, count]) => ({ domain, count })), top_by_growth: topByGrowth.map((t) => ({ name: t.name, growth_rate: t.growth_rate, maturity: t.maturity_level, domain: t.domain })) },
      data_sources: ['Technology Intelligence Index', 'Module 6 Assessment Engine'], generated_at: new Date().toISOString(),
    };
  } catch { return { status: 'error', error: 'Technology data could not be retrieved. Please try again.', source_module: 'Module 6 - Technology Intelligence' }; }
}

// CRITICAL: Uses exact scores from Module 7 - never recalculates independently
async function aggregateInnovationData(filters = {}) {
  try {
    const { data: assessments } = await getInnovationAssessments();
    let filtered = [...(assessments || [])];
    if (filters.technology) { const q = filters.technology.toLowerCase(); filtered = filtered.filter((a) => a.title?.toLowerCase().includes(q) || a.domain?.toLowerCase().includes(q)); }
    if (filters.score_min !== undefined || filters.score_max !== undefined) {
      const min = filters.score_min ?? 0; const max = filters.score_max ?? 100;
      filtered = filtered.filter((a) => { const score = a.overall_score ?? a.innovation_score ?? 0; return score >= min && score <= max; });
    }
    const scoreDistribution = [{ range: '0-40', label: 'Early Stage', count: 0 }, { range: '41-60', label: 'Moderate', count: 0 }, { range: '61-75', label: 'Good', count: 0 }, { range: '76-90', label: 'High', count: 0 }, { range: '91-100', label: 'Exceptional', count: 0 }];
    filtered.forEach((a) => { const s = a.overall_score ?? a.innovation_score ?? 0; if (s <= 40) scoreDistribution[0].count++; else if (s <= 60) scoreDistribution[1].count++; else if (s <= 75) scoreDistribution[2].count++; else if (s <= 90) scoreDistribution[3].count++; else scoreDistribution[4].count++; });
    const avgScore = filtered.length > 0 ? (filtered.reduce((sum, a) => sum + (a.overall_score ?? a.innovation_score ?? 0), 0) / filtered.length).toFixed(1) : null;
    const topScoring = [...filtered].sort((a, b) => (b.overall_score ?? 0) - (a.overall_score ?? 0)).slice(0, 3).map((a) => ({ title: a.title, score: a.overall_score ?? a.innovation_score, domain: a.domain }));
    return {
      status: 'success', source_module: 'Module 7 - Innovation Scoring Engine',
      methodology: { version: METHODOLOGY_VERSION, weights: { research_novelty: '30%', patent_strength: '20%', technology_maturity: '15%', market_potential: '20%', funding_relevance: '15%' }, note: 'Innovation scores use the official Module 7 weighted formula. Values match the Innovation Dashboard exactly.' },
      assessments: filtered,
      summary: { total_assessments: filtered.length, average_score: avgScore ? Number(avgScore) : null, score_distribution: scoreDistribution, top_scoring: topScoring },
      data_sources: ['Module 7 Innovation Scoring Engine', 'Module 6 Technology Intelligence', 'Module 4 Funding Intelligence'], generated_at: new Date().toISOString(),
    };
  } catch { return { status: 'error', error: 'Innovation scoring data could not be retrieved. Please try again.', source_module: 'Module 7 - Innovation Scoring Engine' }; }
}

async function aggregateCommercializationData(filters = {}) {
  try {
    const innovationId = filters.innovation_id || 'inno-multi-agent-robotics';
    const { data, isDemo } = await getCommercializationOverview(innovationId);
    const pathways = Object.entries(data?.pathways || {}).map(([key, pathway]) => ({ id: key, ...pathway }));
    return {
      status: 'success', source_module: 'Module 8 - Commercialization Recommendation',
      innovation_context: { id: data?.innovation_id, title: data?.title, domain: data?.domain, innovation_score: data?.innovation_score, technology_stage: data?.technology_stage, adoption_level: data?.adoption_level, summary: data?.summary },
      pathways: data?.pathways || {}, recommendations: data?.recommendations || [],
      summary: { total_pathways: pathways.length, total_recommendations: (data?.recommendations || []).length, pathways_available: pathways.map((p) => p.id) },
      data_sources: ['Module 8 Commercialization Engine', 'Module 7 Innovation Scoring', 'Module 5 Patent Intelligence'],
      is_demo: isDemo, generated_at: new Date().toISOString(),
    };
  } catch { return { status: 'error', error: 'Commercialization data could not be retrieved. Please try again.', source_module: 'Module 8 - Commercialization Recommendation' }; }
}

function buildKeyInsights(research, funding, patents, technology, innovation, commercialization) {
  const insights = [];
  if (research?.status === 'success' && research.summary?.total_papers > 0) insights.push({ module: 'Research', insight: `${research.summary.total_papers} relevant publications identified. Average citation count: ${research.summary.avg_citations}.` });
  if (funding?.status === 'success' && funding.summary?.total_opportunities > 0) insights.push({ module: 'Funding', insight: `${funding.summary.total_opportunities} funding opportunities identified across ${funding.summary.by_agency?.length || 0} agencies.` });
  if (patents?.status === 'success' && patents.summary?.total_patents > 0) insights.push({ module: 'Patents', insight: `${patents.summary.total_patents} patents analyzed across ${patents.summary.total_clusters} technology clusters.` });
  if (technology?.status === 'success' && technology.technologies?.length > 0) { const topTech = technology.summary?.top_by_growth?.[0]; if (topTech) insights.push({ module: 'Technology', insight: `Highest-growth technology: ${topTech.name} (+${topTech.growth_rate}% YoY, Stage: ${topTech.maturity}).` }); }
  if (innovation?.status === 'success' && innovation.summary?.top_scoring?.length > 0) { const top = innovation.summary.top_scoring[0]; insights.push({ module: 'Innovation', insight: `Highest-scoring innovation: "${top.title}" with a score of ${top.score}/100 (Official Module 7 calculation).` }); }
  if (commercialization?.status === 'success') insights.push({ module: 'Commercialization', insight: `${commercialization.summary?.total_pathways || 0} commercialization pathways identified with ${commercialization.summary?.total_recommendations || 0} strategic recommendations.` });
  return insights;
}

async function aggregateComprehensiveData(filters = {}) {
  const results = await Promise.allSettled([
    aggregateResearchData(filters), aggregateFundingData(filters), aggregatePatentData(filters),
    aggregateTechnologyData(filters), aggregateInnovationData(filters), aggregateCommercializationData(filters),
  ]);
  const [research, funding, patents, technology, innovation, commercialization] = results.map((r) => r.status === 'fulfilled' ? r.value : { status: 'error', error: 'Section data unavailable.' });
  const sectionStatuses = { research: research.status, funding: funding.status, patents: patents.status, technology: technology.status, innovation: innovation.status, commercialization: commercialization.status };
  const failedSections = Object.entries(sectionStatuses).filter(([, s]) => s === 'error').map(([name]) => name);
  const completedSections = Object.entries(sectionStatuses).filter(([, s]) => s === 'success').map(([name]) => name);
  return {
    status: failedSections.length === 6 ? 'error' : 'success', report_type: 'comprehensive',
    section_statuses: sectionStatuses, failed_sections: failedSections, completed_sections: completedSections,
    executive_summary: { report_coverage: `${completedSections.length} of 6 intelligence modules`, failed_sections: failedSections, total_research_papers: research.summary?.total_papers ?? null, total_funding_opportunities: funding.summary?.total_opportunities ?? null, total_patents: patents.summary?.total_patents ?? null, total_technologies: technology.summary?.total_technologies ?? null, total_innovation_assessments: innovation.summary?.total_assessments ?? null, avg_innovation_score: innovation.summary?.average_score ?? null, commercialization_pathways: commercialization.summary?.total_pathways ?? null, top_innovation: innovation.summary?.top_scoring?.[0] ?? null, analysis_period: filters.dateRange ? `${filters.dateRange.start || 'All time'} to ${filters.dateRange.end || 'Present'}` : 'All Available Data' },
    research, funding, patents, technology, innovation, commercialization,
    key_insights: buildKeyInsights(research, funding, patents, technology, innovation, commercialization),
    risks_and_limitations: ['Report data reflects information available at time of generation.', 'Innovation scores use official Module 7 weighted formula; values match the Innovation Dashboard.', 'Funding opportunities are from Grants.gov; verify deadlines on official agency websites.', 'Patent data is indicative; professional IP counsel required for legal patent searches.', 'Commercialization pathways are analytical assessments - not guaranteed business outcomes.', ...(failedSections.length > 0 ? [`Note: The following sections encountered data retrieval issues: ${failedSections.join(', ')}.`] : [])],
    data_sources: ['OpenAlex Research Index', 'Semantic Scholar', 'Grants.gov', 'EPO Open Patent Services', 'USPTO Patent Database', 'Module 6 Technology Intelligence Index', 'Module 7 Innovation Scoring Engine', 'Module 8 Commercialization Engine'],
    generated_at: new Date().toISOString(),
  };
}

export async function generateReportPreview(reportType, filters = {}, config = {}) {
  const start = Date.now();
  let data;
  switch (reportType) {
    case 'research': data = await aggregateResearchData(filters); break;
    case 'funding': data = await aggregateFundingData(filters); break;
    case 'patents': data = await aggregatePatentData(filters); break;
    case 'technology': data = await aggregateTechnologyData(filters); break;
    case 'innovation': data = await aggregateInnovationData(filters); break;
    case 'commercialization': data = await aggregateCommercializationData(filters); break;
    case 'comprehensive': data = await aggregateComprehensiveData(filters); break;
    default: return { status: 'error', error: `Unknown report type: ${reportType}` };
  }
  return { ...data, report_type: reportType, report_version: REPORT_VERSION, filters, config, generation_time_ms: Date.now() - start, generated_at: new Date().toISOString() };
}

export async function createReportJob(userId, profile, reportType, filters = {}, config = {}) {
  const reportId = generateReportId();
  const now = new Date().toISOString();
  const typeInfo = REPORT_TYPES.find((t) => t.id === reportType);
  const title = config.title || generateDefaultTitle(reportType, filters);
  const reportRecord = { id: reportId, user_id: userId, user_name: profile?.fullName || 'Unknown User', user_role: profile?.role || 'Researcher', organization: profile?.organization || 'Unknown', report_type: reportType, report_type_label: typeInfo?.label || reportType, title, description: config.description || typeInfo?.description || '', status: REPORT_STATUSES.QUEUED, filters, config, filter_snapshot: { ...filters, captured_at: now }, report_version: REPORT_VERSION, methodology_version: METHODOLOGY_VERSION, created_at: now, updated_at: now, completed_at: null, expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), error: null, data: null, file_size: null, generation_time_ms: null, sections_completed: [], sections_failed: [] };
  const history = getReportHistory(userId);
  history.unshift(reportRecord);
  saveReportHistory(userId, history);
  return reportRecord;
}

export async function executeReport(userId, reportId) {
  updateReportInHistory(userId, reportId, { status: REPORT_STATUSES.GENERATING, updated_at: new Date().toISOString() });
  const history = getReportHistory(userId);
  const record = history.find((r) => r.id === reportId);
  if (!record) return { success: false, error: 'Report record not found.' };
  const start = Date.now();
  try {
    const data = await generateReportPreview(record.report_type, record.filters, record.config);
    const elapsed = Date.now() - start;
    const isError = data.status === 'error';
    const completed = updateReportInHistory(userId, reportId, {
      status: isError ? REPORT_STATUSES.FAILED : REPORT_STATUSES.COMPLETED,
      data,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      generation_time_ms: elapsed,
      error: isError ? data.error : null,
      sections_completed: data.completed_sections || [],
      sections_failed: data.failed_sections || [],
      file_size: `${Math.round(JSON.stringify(data).length / 1024)} KB`
    });

    // Emit event into platform event bus for Module 10 notification ingestion
    if (!isError) {
      platformEventBus.publish(EVENT_TYPES.REPORT_GENERATED, {
        source_module: 'reports',
        entity_id: reportId,
        payload: {
          id: reportId,
          report_name: record.title,
          report_type: record.report_type_label,
          action_url: '/reports',
          forceToast: true
        }
      });
    } else {
      platformEventBus.publish(EVENT_TYPES.REPORT_FAILED, {
        source_module: 'reports',
        entity_id: reportId,
        payload: {
          id: reportId,
          report_name: record.title,
          error_message: data.error || 'Compilation error',
          action_url: '/reports',
          forceToast: true
        }
      });
    }

    return { success: true, report: completed };
  } catch (err) {
    updateReportInHistory(userId, reportId, { status: REPORT_STATUSES.FAILED, error: err.message || 'Report generation failed.', updated_at: new Date().toISOString(), generation_time_ms: Date.now() - start });
    
    platformEventBus.publish(EVENT_TYPES.REPORT_FAILED, {
      source_module: 'reports',
      entity_id: reportId,
      payload: {
        id: reportId,
        report_name: record.title,
        error_message: err.message || 'Report generation failed',
        action_url: '/reports',
        forceToast: true
      }
    });

    return { success: false, error: err.message };
  }
}

export function getReportById(userId, reportId) {
  const history = getReportHistory(userId);
  const report = history.find((r) => r.id === reportId);
  if (!report) return { found: false, error: 'Report not found or access denied.' };
  if (report.user_id !== userId) return { found: false, error: 'Access denied.' };
  return { found: true, report };
}

export async function regenerateReport(userId, reportId) {
  const { found, report } = getReportById(userId, reportId);
  if (!found) return { success: false, error: 'Report not found.' };
  const newRecord = await createReportJob(userId, { fullName: report.user_name, role: report.user_role, organization: report.organization }, report.report_type, report.filter_snapshot || report.filters, { ...report.config, title: `${report.title} (Regenerated)` });
  return executeReport(userId, newRecord.id);
}

export function generateExcelData(report) {
  if (!report?.data) return null;
  const { data } = report;
  const sheets = {};
  const now = new Date().toLocaleDateString();
  sheets['Summary'] = [['Research & Innovation Intelligence Platform'], ['Report Title', report.title], ['Report Type', report.report_type_label], ['Generated By', report.user_name], ['Organization', report.organization], ['Generated Date', now], ['Report Version', report.report_version], []];
  switch (report.report_type) {
    case 'funding':
      if (data.opportunities) {
        sheets['Funding Opportunities'] = [['Title', 'Agency', 'Funding Type', 'Amount', 'Open Date', 'Close Date', 'Country', 'Source', 'URL'], ...data.opportunities.map((o) => [o.title, o.agency, o.funding_type, o.funding_amount, o.open_date, o.close_date, o.country, o.source, o.official_url])];
        sheets['Analytics'] = [['Agency', 'Count'], ...(data.summary?.by_agency || []).map((a) => [a.agency, a.count])];
      }
      break;
    case 'patents':
      if (data.patents) {
        sheets['Patents'] = [['Title', 'Patent Number', 'Assignee', 'Inventors', 'Filing Date', 'Publication Date', 'Status', 'Classification', 'Domain', 'Citations', 'URL'], ...data.patents.map((p) => [p.title, p.patent_number, p.assignee, (p.inventors || []).join('; '), p.filing_date, p.publication_date, p.status, p.classification, p.technology_domain, p.citations, p.patent_url])];
        if (data.clusters) sheets['Technology Clusters'] = [['Cluster', 'Domain', 'Patent Count', 'Top Assignees'], ...data.clusters.map((c) => [c.title, c.domain, c.count, (c.top_assignees || []).join('; ')])];
        if (data.competitors) sheets['Competitor Analysis'] = [['Assignee', 'Patent Count', 'Domains', 'Classifications'], ...data.competitors.map((c) => [c.name, c.patent_count, (c.domains || []).join('; '), (c.classifications || []).join('; ')])];
      }
      break;
    case 'research':
      if (data.papers) {
        sheets['Publications'] = [['Title', 'Authors', 'Year', 'Journal', 'Citations', 'DOI', 'Source', 'Open Access', 'URL'], ...data.papers.map((p) => [p.title, (p.authors || []).join('; '), p.year, p.journal, p.citations_count, p.doi, p.source, p.open_access ? 'Yes' : 'No', p.paper_url])];
        sheets['Keywords'] = [['Keyword', 'Count'], ...(data.analytics?.top_keywords || []).map((k) => [k.keyword, k.count])];
      }
      break;
    case 'technology':
      if (data.technologies) sheets['Technologies'] = [['Name', 'Domain', 'Maturity Level', 'Adoption Level', 'Growth Rate (%)', 'Research Activity', 'Patent Activity'], ...data.technologies.map((t) => [t.name, t.domain, t.maturity_level, t.adoption_level, t.growth_rate, t.research_activity, t.patent_activity])];
      break;
    case 'innovation':
      if (data.assessments) {
        sheets['Innovation Assessments'] = [['Title', 'Domain', 'Overall Score', 'Research Novelty', 'Patent Strength', 'Tech Maturity', 'Market Potential', 'Funding Relevance', 'Status'], ...data.assessments.map((a) => [a.title, a.domain, a.overall_score ?? a.innovation_score, a.research_novelty, a.patent_strength, a.technology_maturity, a.market_potential, a.funding_relevance, a.status])];
        sheets['Score Methodology'] = [['Factor', 'Weight', 'Description'], ['Research Novelty', '30%', 'Publication uniqueness, citation velocity, novelty index'], ['Patent Strength', '20%', 'Claims coverage, jurisdictional density, FTO analysis'], ['Technology Maturity', '15%', 'TRL level from Module 6 assessment'], ['Market Potential', '20%', 'Target industry spend, adoption signals'], ['Funding Relevance', '15%', 'Active grant alignment from Module 4'], [], ['Note', 'Scores match the Innovation Dashboard exactly (Module 7 weighted formula).']];
      }
      break;
    case 'commercialization':
      if (data.pathways) {
        sheets['Pathways'] = [['Pathway', 'Title', 'Potential Assessment', 'Evidence', 'Recommended Next Step'], ...Object.entries(data.pathways).map(([key, p]) => [key, p.title, p.potential, p.evidence, p.recommended_next_step])];
        if (data.recommendations) sheets['Recommendations'] = [['Recommendation', 'Evidence', 'Confidence', 'Next Action', 'Source Modules'], ...data.recommendations.map((r) => [r.recommendation, r.evidence, r.confidence, r.next_action, (r.source_modules || []).join('; ')])];
      }
      break;
    case 'comprehensive':
      if (data.research?.status === 'success') sheets['Research'] = [['Title', 'Authors', 'Year', 'Journal', 'Citations', 'Source'], ...(data.research.papers || []).map((p) => [p.title, (p.authors || []).join('; '), p.year, p.journal, p.citations_count, p.source])];
      if (data.funding?.status === 'success') sheets['Funding'] = [['Title', 'Agency', 'Amount', 'Deadline', 'Country'], ...(data.funding.opportunities || []).map((o) => [o.title, o.agency, o.funding_amount, o.close_date, o.country])];
      if (data.patents?.status === 'success') sheets['Patents'] = [['Title', 'Assignee', 'Status', 'Domain', 'Citations'], ...(data.patents.patents || []).map((p) => [p.title, p.assignee, p.status, p.technology_domain, p.citations])];
      if (data.technology?.status === 'success') sheets['Technology'] = [['Name', 'Maturity', 'Growth Rate', 'Domain'], ...(data.technology.technologies || []).map((t) => [t.name, t.maturity_level, t.growth_rate, t.domain])];
      if (data.innovation?.status === 'success') sheets['Innovation'] = [['Title', 'Score', 'Domain', 'Status'], ...(data.innovation.assessments || []).map((a) => [a.title, a.overall_score ?? a.innovation_score, a.domain, a.status])];
      if (data.key_insights) sheets['Key Insights'] = [['Module', 'Insight'], ...(data.key_insights || []).map((i) => [i.module, i.insight])];
      break;
  }
  sheets['Data Sources'] = [['Source', 'Module', 'Type'], ...(data.data_sources || []).map((s) => [s, '', 'External/Internal']), [], ['Report Version', report.report_version], ['Methodology Version', report.methodology_version || METHODOLOGY_VERSION], ['Generated At', report.generated_at || now]];
  return sheets;
}

export function generatePDFStructure(report) {
  if (!report?.data) return null;
  const { data } = report;
  return {
    metadata: { title: report.title, report_type: report.report_type_label, user_name: report.user_name, organization: report.organization, user_role: report.user_role, generated_at: new Date(report.generated_at || Date.now()).toLocaleDateString(), report_version: report.report_version, period: data.analysis_period || 'All Available Data', platform: 'Research Funding & Innovation Intelligence Platform' },
    sections: buildPDFSections(report.report_type, data),
  };
}

function buildPDFSections(reportType, data) {
  const sections = [];
  switch (reportType) {
    case 'funding': sections.push({ type: 'summary', title: 'Executive Summary', data: data.summary }, { type: 'table', title: 'Funding Opportunities', data: data.opportunities, columns: ['title', 'agency', 'funding_amount', 'close_date', 'country'] }, { type: 'chart', title: 'Opportunities by Agency', data: data.summary?.by_agency, chartType: 'bar' }); break;
    case 'patents': sections.push({ type: 'summary', title: 'Executive Summary', data: data.summary }, { type: 'table', title: 'Patent Records', data: data.patents, columns: ['title', 'patent_number', 'assignee', 'status', 'technology_domain'] }, { type: 'clusters', title: 'Technology Clusters', data: data.clusters }, { type: 'competitors', title: 'Competitor Analysis', data: data.competitors }); break;
    case 'research': sections.push({ type: 'summary', title: 'Executive Summary', data: data.summary }, { type: 'table', title: 'Publications', data: data.papers, columns: ['title', 'authors', 'year', 'journal', 'citations_count'] }, { type: 'chart', title: 'Publication Trend', data: data.analytics?.publications_by_year, chartType: 'line' }, { type: 'keywords', title: 'Top Research Keywords', data: data.analytics?.top_keywords }); break;
    case 'technology': sections.push({ type: 'summary', title: 'Executive Summary', data: data.summary }, { type: 'table', title: 'Technology Analysis', data: data.technologies, columns: ['name', 'maturity_level', 'growth_rate', 'adoption_level', 'domain'] }, { type: 'chart', title: 'Maturity Distribution', data: data.summary?.by_maturity, chartType: 'bar' }); break;
    case 'innovation': sections.push({ type: 'summary', title: 'Executive Summary', data: data.summary }, { type: 'methodology', title: 'Scoring Methodology', data: data.methodology }, { type: 'innovation_list', title: 'Innovation Assessments', data: data.assessments }); break;
    case 'commercialization': sections.push({ type: 'summary', title: 'Executive Summary', data: data.summary }, { type: 'pathways', title: 'Commercialization Pathways', data: data.pathways }, { type: 'recommendations', title: 'Strategic Recommendations', data: data.recommendations }); break;
    case 'comprehensive': sections.push({ type: 'executive_summary', title: 'Executive Summary', data: data.executive_summary }, { type: 'research_section', title: 'Research Intelligence', data: data.research }, { type: 'funding_section', title: 'Funding Intelligence', data: data.funding }, { type: 'patents_section', title: 'Patent Landscape', data: data.patents }, { type: 'technology_section', title: 'Technology Intelligence', data: data.technology }, { type: 'innovation_section', title: 'Innovation Assessment', data: data.innovation }, { type: 'commercialization_section', title: 'Commercialization Opportunities', data: data.commercialization }, { type: 'insights', title: 'Key Insights', data: data.key_insights }, { type: 'risks', title: 'Risks & Limitations', data: data.risks_and_limitations }, { type: 'data_sources', title: 'Data Sources & Methodology', data: data.data_sources }); break;
  }
  return sections;
}
