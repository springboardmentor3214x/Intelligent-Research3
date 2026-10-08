/**
 * TECHNOLOGY INTELLIGENCE API SERVICE (MODULE 6)
 * Follows demo/mock data policy: Clearly separated, local demo dataset used
 * when backend endpoint is not yet provided. Real API contracts ready.
 */

import { DEMO_TECHNOLOGIES, DEMO_ORGANIZATIONS } from '../data/demo/technologyDemoData';

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

/**
 * Fetch all tracked technologies with optional filters
 */
export async function getTechnologies(filters = {}) {
  // If backend implements /api/technologies in future, fetch here:
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/technologies`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      const result = await res.json();
      return { data: result.data || result, total: result.total || 0, isDemo: false };
    }
  } catch (err) {
    // Graceful fallback to isolated demo dataset
  }

  // Filter local demo dataset
  let results = [...DEMO_TECHNOLOGIES];

  if (filters.search) {
    const q = filters.search.toLowerCase();
    results = results.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.domain.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
    );
  }

  if (filters.domain && filters.domain !== 'All Domains') {
    results = results.filter((t) => t.domain === filters.domain);
  }

  if (filters.maturity && filters.maturity !== 'All Stages') {
    results = results.filter((t) => t.maturity_level.toLowerCase() === filters.maturity.toLowerCase());
  }

  if (filters.growth && filters.growth !== 'All') {
    if (filters.growth === 'high') {
      results = results.filter((t) => t.growth_rate >= 50);
    } else if (filters.growth === 'medium') {
      results = results.filter((t) => t.growth_rate >= 30 && t.growth_rate < 50);
    }
  }

  return {
    data: results,
    total: results.length,
    isDemo: true,
  };
}

/**
 * Fetch a single technology by ID with deep metrics
 */
export async function getTechnologyById(techId) {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/technologies/${techId}`);
    if (res.ok) {
      const data = await res.json();
      return { data, isDemo: false };
    }
  } catch (err) {}

  const found = DEMO_TECHNOLOGIES.find((t) => t.id === techId) || DEMO_TECHNOLOGIES[0];
  return {
    data: found,
    isDemo: true,
  };
}

/**
 * Fetch maturity progression and 6 explainable factors
 */
export async function getMaturityAnalysis(techId) {
  const { data: tech } = await getTechnologyById(techId);
  return {
    technology_id: tech.id,
    technology_name: tech.name,
    progression_stage: tech.progression_stage || 'Developing',
    stages: ['Research', 'Prototype', 'Developing', 'Adoption', 'Mature'],
    factors: tech.maturity_factors || {},
    explanation: tech.maturity_factors?.assessment || 'System-generated maturity assessment based on multi-signal indicators.',
    isDemo: true,
  };
}

/**
 * Fetch adoption tracking data across 5yr or 10yr horizons
 */
export async function getAdoptionSignals(techId, timeRange = '5yr') {
  const { data: tech } = await getTechnologyById(techId);
  const trends = tech.historical_trends?.[timeRange] || tech.historical_trends?.['5yr'] || [];
  return {
    technology_id: tech.id,
    technology_name: tech.name,
    timeRange,
    trends,
    signals: {
      research_velocity: `${tech.growth_rate}% YoY Publication Velocity`,
      patent_acceleration: `${tech.patent_activity} Active Priority Filings`,
      organization_diversity: `${tech.organizations?.length || 5} Major Global R&D Consortia`,
    },
    isDemo: true,
  };
}

/**
 * Fetch innovation opportunities for a technology
 */
export async function getInnovationOpportunities(techId = null) {
  if (techId) {
    const { data: tech } = await getTechnologyById(techId);
    return {
      opportunities: tech.opportunities || [],
      isDemo: true,
    };
  }

  // Aggregate all opportunities
  const allOpps = DEMO_TECHNOLOGIES.flatMap((t) =>
    (t.opportunities || []).map((o) => ({ ...o, technology_name: t.name, technology_id: t.id, domain: t.domain }))
  );
  return {
    opportunities: allOpps,
    total: allOpps.length,
    isDemo: true,
  };
}

/**
 * Fetch competitive organizations and technology focus
 */
export async function getCompetitiveOrganizations() {
  return {
    data: DEMO_ORGANIZATIONS,
    isDemo: true,
  };
}

/**
 * Fetch detailed metrics for a specific organization
 */
export async function getOrganizationDetails(orgId) {
  const found = DEMO_ORGANIZATIONS.find((o) => o.id === orgId) || DEMO_ORGANIZATIONS[0];
  return {
    data: found,
    isDemo: true,
  };
}
