/**
 * Commercialization Service – Module 8 Commercialization Recommendation Engine
 * Frontend API service for evidence-based pathway recommendations.
 */

import { apiRequest } from './api';

export async function fetchCommercializationAnalysis(technologyId) {
  return apiRequest(`/api/commercialization/${encodeURIComponent(technologyId)}`);
}

export async function recalculateCommercialization(technologyId) {
  return apiRequest('/api/commercialization/analyze', {
    method: 'POST',
    body: JSON.stringify({ technology_id: technologyId, force_refresh: true }),
  });
}

export async function fetchProductizationDetails(technologyId) {
  return apiRequest(`/api/commercialization/${encodeURIComponent(technologyId)}/productization`);
}

export async function fetchLicensingDetails(technologyId) {
  return apiRequest(`/api/commercialization/${encodeURIComponent(technologyId)}/licensing`);
}

export async function fetchStartupDetails(technologyId) {
  return apiRequest(`/api/commercialization/${encodeURIComponent(technologyId)}/startup`);
}

export async function fetchPartnershipDetails(technologyId) {
  return apiRequest(`/api/commercialization/${encodeURIComponent(technologyId)}/industry-partnership`);
}

export async function fetchCommercializationRoadmap(technologyId) {
  return apiRequest(`/api/commercialization/${encodeURIComponent(technologyId)}/roadmap`);
}

export async function fetchCommercializationRisks(technologyId) {
  return apiRequest(`/api/commercialization/${encodeURIComponent(technologyId)}/risks`);
}

export async function fetchCommercializationGaps(technologyId) {
  return apiRequest(`/api/commercialization/${encodeURIComponent(technologyId)}/gaps`);
}
