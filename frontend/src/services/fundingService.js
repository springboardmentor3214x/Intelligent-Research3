import { apiRequest } from './api';

export const fundingService = {
  /**
   * List funding opportunities with query params
   */
  async getFunding({
    q = '',
    agency = '',
    funding_type = '',
    country = '',
    is_active = true,
    page = 1,
    page_size = 10,
  } = {}) {
    const params = new URLSearchParams();
    if (q) params.append('query', q);
    if (agency) params.append('organization', agency);
    if (funding_type) params.append('funding_type', funding_type);
    if (country) params.append('country', country);
    if (is_active !== null && is_active !== undefined) {
      params.append('status', is_active ? 'open' : '');
    }
    if (page) params.append('page', String(page));
    if (page_size) params.append('page_size', String(page_size));

    const qs = params.toString();
    const res = await apiRequest(`/api/funding${qs ? `?${qs}` : ''}`);
    return res?.data ?? res;
  },

  /**
   * Advanced multi-filter search for funding opportunities
   */
  async searchFunding(searchPayload) {
    const res = await apiRequest('/api/funding/search', {
      method: 'POST',
      body: JSON.stringify(searchPayload),
    });
    return res?.data ?? res;
  },

  /**
   * Get single funding opportunity by ID
   */
  async getFundingById(id) {
    const res = await apiRequest(`/api/funding/${id}`);
    return res?.data ?? res;
  },

  /**
   * Get user's saved/bookmarked funding opportunities
   */
  async getSavedFunding({ page = 1, page_size = 10 } = {}) {
    const params = new URLSearchParams();
    if (page) params.append('page', String(page));
    if (page_size) params.append('page_size', String(page_size));
    const qs = params.toString();
    const res = await apiRequest(`/api/funding/saved${qs ? `?${qs}` : ''}`);
    return res?.data ?? res;
  },

  /**
   * Bookmark a funding opportunity
   */
  async saveFunding(opportunityId, notes = '') {
    const res = await apiRequest('/api/funding/save', {
      method: 'POST',
      body: JSON.stringify({
        funding_id: Number(opportunityId),
      }),
    });
    return res?.data ?? res;
  },

  /**
   * Remove a saved funding opportunity by opportunity ID
   */
  async unsaveFunding(opportunityId) {
    const res = await apiRequest(`/api/funding/saved/${opportunityId}`, {
      method: 'DELETE',
    });
    return res?.data ?? res;
  },

  /**
   * Get funding recommendations based on user's research profile
   */
  async getRecommendations({ page = 1, page_size = 10, limit = 10, min_score = 0 } = {}) {
    const params = new URLSearchParams();
    const size = page_size || limit || 10;
    if (page) params.append('page', String(page));
    if (size) params.append('page_size', String(size));
    if (min_score) params.append('min_score', String(min_score));
    const qs = params.toString();
    const res = await apiRequest(`/api/funding/recommendations${qs ? `?${qs}` : ''}`);
    const d = res?.data ?? res;
    const rawItems = Array.isArray(d) ? d : (d?.items ?? []);
    return rawItems.map((item) => ({
      ...item,
      opportunity: item.opportunity || item,
      overall_score: item.overall_score ?? item.match_score ?? 0.85,
    }));
  },

  /**
   * Calculate match score for a specific funding opportunity
   */
  async matchOpportunity({ opportunity_id, custom_keywords = [], custom_areas = [] }) {
    const res = await apiRequest('/api/funding/match', {
      method: 'POST',
      body: JSON.stringify({
        funding_id: Number(opportunity_id),
        research_areas: custom_areas,
        keywords: custom_keywords,
      }),
    });
    const d = res?.data ?? res;
    // Normalize breakdown fields for component display
    if (d && d.match_score !== undefined) {
      d.overall_score = d.match_score;
      if (d.score_breakdown) {
        d.breakdown = {
          research_area_score: d.score_breakdown.area_score,
          keyword_score: d.score_breakdown.keyword_score,
          country_score: d.score_breakdown.country_score,
          funding_type_score: d.score_breakdown.type_score,
          matched_areas: d.matched_areas,
          matched_keywords: d.matched_keywords,
        };
      }
    }
    return d;
  },

  /**
   * Compare multiple funding opportunities side-by-side
   */
  async compareOpportunities(ids = []) {
    const params = new URLSearchParams();
    if (ids && ids.length > 0) {
      params.append('ids', ids.join(','));
    }
    const qs = params.toString();
    const res = await apiRequest(`/api/funding/compare${qs ? `?${qs}` : ''}`);
    const d = res?.data ?? res;
    return {
      opportunities: d?.items ?? (d?.opportunities ?? []),
      comparison_fields: d?.comparison_fields ?? [],
      ...d,
    };
  },
};

export default fundingService;
