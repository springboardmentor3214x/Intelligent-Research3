import { apiRequest } from './api';

export const patentService = {
  /**
   * Search real patents with filtering and pagination
   */
  async searchPatents({
    q = '',
    assignee = '',
    domain = '',
    classification = '',
    year_min = null,
    year_max = null,
    page = 1,
    page_size = 20,
    sort_by = 'filing_date',
    sort_order = 'desc',
  } = {}) {
    const params = new URLSearchParams();
    if (q) params.append('q', q);
    if (assignee) params.append('assignee', assignee);
    if (domain && domain !== 'ALL') params.append('domain', domain);
    if (classification) params.append('classification', classification);
    if (year_min) params.append('year_min', String(year_min));
    if (year_max) params.append('year_max', String(year_max));
    if (page) params.append('page', String(page));
    if (page_size) params.append('page_size', String(page_size));
    if (sort_by) params.append('sort_by', sort_by);
    if (sort_order) params.append('sort_order', sort_order);

    const qs = params.toString();
    return await apiRequest(`/api/patent-landscape/search${qs ? `?${qs}` : ''}`);
  },

  /**
   * Get detail for a single patent record
   */
  async getPatentById(id) {
    return await apiRequest(`/api/patent-landscape/${id}`);
  },

  /**
   * Get filing trends over time (Year -> Count)
   */
  async getTrends({ domain = '', assignee = '', q = '' } = {}) {
    const params = new URLSearchParams();
    if (domain && domain !== 'ALL') params.append('domain', domain);
    if (assignee) params.append('assignee', assignee);
    if (q) params.append('q', q);

    const qs = params.toString();
    return await apiRequest(`/api/patent-landscape/trends${qs ? `?${qs}` : ''}`);
  },

  /**
   * Get competitor patent analysis (top assignees, filing timeline, domain distribution)
   */
  async getCompetitors({ domain = '', q = '', limit = 10 } = {}) {
    const params = new URLSearchParams();
    if (domain && domain !== 'ALL') params.append('domain', domain);
    if (q) params.append('q', q);
    if (limit) params.append('limit', String(limit));

    const qs = params.toString();
    return await apiRequest(`/api/patent-landscape/competitors${qs ? `?${qs}` : ''}`);
  },

  /**
   * Get technology / innovation mapping (Domain -> Classification -> Assignee)
   */
  async getInnovationMap({ domain = '' } = {}) {
    const params = new URLSearchParams();
    if (domain && domain !== 'ALL') params.append('domain', domain);

    const qs = params.toString();
    return await apiRequest(`/api/patent-landscape/innovation-map${qs ? `?${qs}` : ''}`);
  },

  /**
   * Run semantic clustering on available patent records
   */
  async clusterPatents({ n_clusters = 5, domain_filter = null, min_patents = 5 } = {}) {
    return await apiRequest('/api/patent-landscape/cluster', {
      method: 'POST',
      body: JSON.stringify({
        n_clusters,
        domain_filter: domain_filter === 'ALL' ? null : domain_filter,
        min_patents,
      }),
    });
  },

  /**
   * GET clusters for available records
   */
  async getClusters({ domain = '', n_clusters = 5 } = {}) {
    const params = new URLSearchParams();
    if (domain && domain !== 'ALL') params.append('domain', domain);
    if (n_clusters) params.append('n_clusters', String(n_clusters));

    const qs = params.toString();
    return await apiRequest(`/api/patent-landscape/clusters${qs ? `?${qs}` : ''}`);
  },

  /**
   * Synchronize real patents from external provider
   */
  async syncPatents({ query, source = 'uspto', limit = 25 } = {}) {
    const params = new URLSearchParams();
    params.append('query', query);
    if (source) params.append('source', source);
    if (limit) params.append('limit', String(limit));

    return await apiRequest(`/api/patent-landscape/sync?${params.toString()}`, {
      method: 'POST',
    });
  },

  /**
   * Get distinct technology domains
   */
  async getDomains() {
    return await apiRequest('/api/patent-landscape/domains');
  },
};

export default patentService;

