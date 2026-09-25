/**
 * Innovation Score Service – Module 7 Member 5
 * Frontend API calls for innovation scoring.
 */

import { apiRequest } from './api';

export async function calculateInnovationScore(payload) {
  return apiRequest('/api/innovation/innovation-score', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchInnovationScore(technologyId) {
  return apiRequest(
    `/api/innovation/innovation-score/${technologyId}`
  );
}

export async function fetchInnovationScoreBreakdown(technologyId) {
  return apiRequest(
    `/api/innovation/innovation-score/${technologyId}/breakdown`
  );
}

export async function fetchInnovationScoreExplanation(technologyId) {
  return apiRequest(
    `/api/innovation/innovation-score/${technologyId}/explanation`
  );
}