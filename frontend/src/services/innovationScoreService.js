/**
 * Innovation Score Service – Module 7 Innovation Scoring Engine
 * Frontend API service for deterministic multi-factor innovation evaluation.
 */

import { apiRequest } from './api';

export async function fetchInnovationScore(technologyId) {
  try {
    return await apiRequest(`/api/innovation-score/${encodeURIComponent(technologyId)}`);
  } catch (err) {
    // Fallback to legacy member5 route if needed
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
  return apiRequest('/api/innovation-score/calculate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}