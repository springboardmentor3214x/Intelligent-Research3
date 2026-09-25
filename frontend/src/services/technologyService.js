/**
 * Technology Intelligence Service – Module 6
 * Frontend API calls for technologies, maturity, adoption, opportunities, and competitors.
 */
import { apiRequest } from './api';

export async function fetchTechnologies(params = {}) {
  const query = new URLSearchParams();
  if (params.domain) query.set('domain', params.domain);
  if (params.stage) query.set('stage', params.stage);
  if (params.search) query.set('search', params.search);
  const qStr = query.toString();
  return apiRequest(`/api/technologies${qStr ? `?${qStr}` : ''}`);
}

export async function fetchEmergingTechnologies(params = {}) {
  const query = new URLSearchParams();
  if (params.min_growth !== undefined) query.set('min_growth', params.min_growth);
  if (params.limit) query.set('limit', params.limit);
  const qStr = query.toString();
  return apiRequest(`/api/technologies/emerging${qStr ? `?${qStr}` : ''}`);
}

export async function fetchTechnologyDetail(techId) {
  return apiRequest(`/api/technologies/${techId}`);
}

export async function fetchTechnologyHistory(techId) {
  return apiRequest(`/api/technologies/${techId}/history`);
}

export async function fetchTechnologyMaturity(techId) {
  return apiRequest(`/api/technologies/${techId}/maturity`);
}

export async function fetchTechnologyAdoption(techId) {
  return apiRequest(`/api/technologies/${techId}/adoption`);
}

export async function fetchTechnologyOpportunities(techId) {
  return apiRequest(`/api/technologies/${techId}/opportunities`);
}

export async function fetchAllOpportunities(params = {}) {
  const query = new URLSearchParams();
  if (params.min_confidence !== undefined) query.set('min_confidence', params.min_confidence);
  const qStr = query.toString();
  return apiRequest(`/api/opportunities${qStr ? `?${qStr}` : ''}`);
}

export async function fetchTechnologyCompetitors(techId, limit = 10) {
  return apiRequest(`/api/technologies/${techId}/competitors?limit=${limit}`);
}

export async function fetchTechnologySources(techId) {
  return apiRequest(`/api/technologies/${techId}/sources`);
}

export async function searchTechnologies(query, params = {}) {
  const qParams = new URLSearchParams();
  qParams.set('q', query);
  if (params.domain && params.domain !== 'ALL') qParams.set('domain', params.domain);
  if (params.stage && params.stage !== 'ALL') qParams.set('stage', params.stage);
  return apiRequest(`/api/technologies/search?${qParams.toString()}`);
}

export async function triggerTechnologySync(techTarget) {
  let body = {};
  if (Array.isArray(techTarget)) {
    body = { technology_names: techTarget };
  } else if (typeof techTarget === 'string') {
    if (techTarget.startsWith('TECH_')) {
      // It's a technology ID — only pass the ID; backend will resolve the name
      body = { technology_id: techTarget };
    } else {
      body = { technology_names: [techTarget] };
    }
  } else if (techTarget && typeof techTarget === 'object') {
    // Object with name and/or technology_id
    const name = techTarget.name;
    const tid = techTarget.technology_id;
    body = {
      technology_names: name && !name.startsWith('TECH_') ? [name] : undefined,
      technology_id: tid || undefined,
    };
    // Clean up undefined keys
    if (!body.technology_names) delete body.technology_names;
    if (!body.technology_id) delete body.technology_id;
  }
  return apiRequest('/api/technologies/sync', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function recalculateTechnology(techId) {
  return apiRequest(`/api/technologies/${techId}/recalculate`, {
    method: 'POST',
  });
}

