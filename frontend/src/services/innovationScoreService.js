/**
 * Innovation Score Service – Module 7 Innovation Scoring Engine
 * Dual-routing API service supporting both Master Engine & Member 5 endpoints.
 */

import { apiRequest } from './api';

export async function fetchInnovationScore(technologyId) {
  try {
    return await apiRequest(`/api/innovation-score/${encodeURIComponent(technologyId)}`);
  } catch (err) {
    return await apiRequest(`/api/innovation/innovation-score/${encodeURIComponent(technologyId)}`);
  }
}

export async function recalculateInnovationScore(technologyId) {
  try {
    return await apiRequest('/api/innovation-score/calculate', {
      method: 'POST',
      body: JSON.stringify({ technology_id: technologyId, force_refresh: true }),
    });
  } catch (err) {
    return await apiRequest(`/api/innovation/innovation-score/${encodeURIComponent(technologyId)}/calculate-from-modules`);
  }
}

export async function fetchInnovationScoreBreakdown(technologyId) {
  try {
    return await apiRequest(`/api/innovation-score/${encodeURIComponent(technologyId)}/breakdown`);
  } catch (err) {
    return await apiRequest(`/api/innovation/innovation-score/${encodeURIComponent(technologyId)}/breakdown`);
  }
}

export async function fetchInnovationScoreExplanation(technologyId) {
  try {
    return await apiRequest(`/api/innovation-score/${encodeURIComponent(technologyId)}/explanation`);
  } catch (err) {
    return await apiRequest(`/api/innovation/innovation-score/${encodeURIComponent(technologyId)}/explanation`);
  }
}

export async function fetchInnovationScoreEvidence(technologyId) {
  return apiRequest(`/api/innovation-score/${encodeURIComponent(technologyId)}/evidence`);
}

export async function fetchInnovationScoreHistory(technologyId) {
  return apiRequest(`/api/innovation-score/${encodeURIComponent(technologyId)}/history`);
}

export async function calculateScoreFromModules(technologyId) {
  return recalculateInnovationScore(technologyId);
}

export async function calculateInnovationScore(payload) {
  try {
    return await apiRequest('/api/innovation-score/calculate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (err) {
    return await apiRequest('/api/innovation/innovation-score', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}