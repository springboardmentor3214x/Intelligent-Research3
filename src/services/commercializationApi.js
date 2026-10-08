/**
 * COMMERCIALIZATION RECOMMENDATION API SERVICE (MODULE 8)
 * Connects cross-module intelligence into 4 core pathways:
 * 1. Productization
 * 2. Licensing
 * 3. Startup Opportunity
 * 4. Industry Partnership
 */

import { DEMO_COMMERCIALIZATION } from '../data/demo/commercializationDemoData';

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

export async function getCommercializationOverview(innovationId = 'inno-multi-agent-robotics') {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/commercialization/${innovationId}`);
    if (res.ok) {
      const data = await res.json();
      return { data, isDemo: false };
    }
  } catch (err) {}

  const item = DEMO_COMMERCIALIZATION[innovationId] || DEMO_COMMERCIALIZATION['inno-multi-agent-robotics'];
  return {
    data: item,
    isDemo: true,
  };
}

export async function getProductizationDetails(innovationId = 'inno-multi-agent-robotics') {
  const { data } = await getCommercializationOverview(innovationId);
  return {
    data: data.pathways?.productization || {},
    isDemo: true,
  };
}

export async function getLicensingCandidates(innovationId = 'inno-multi-agent-robotics') {
  const { data } = await getCommercializationOverview(innovationId);
  return {
    data: data.pathways?.licensing || {},
    candidates: data.pathways?.licensing?.candidates || [],
    isDemo: true,
  };
}

export async function getStartupOpportunity(innovationId = 'inno-multi-agent-robotics') {
  const { data } = await getCommercializationOverview(innovationId);
  return {
    data: data.pathways?.startup || {},
    details: data.pathways?.startup?.details || {},
    isDemo: true,
  };
}

export async function getIndustryPartnerships(innovationId = 'inno-multi-agent-robotics') {
  const { data } = await getCommercializationOverview(innovationId);
  return {
    data: data.pathways?.industry_partnership || {},
    organizations: data.pathways?.industry_partnership?.organizations || [],
    isDemo: true,
  };
}

export async function getRecommendationDetails(innovationId = 'inno-multi-agent-robotics') {
  const { data } = await getCommercializationOverview(innovationId);
  return {
    recommendations: data.recommendations || [],
    isDemo: true,
  };
}
