import { apiRequest } from "./api";

/**
 * Module 3 - Research Paper Intelligence API Service
 */

export async function getResearchPapers(params = {}) {
  const query = new URLSearchParams();
  if (params.keyword) query.append("keyword", params.keyword);
  if (params.year) query.append("year", params.year);
  if (params.author) query.append("author", params.author);
  if (params.researchArea) query.append("research_area", params.researchArea);
  if (params.page) query.append("page", params.page);
  if (params.pageSize) query.append("page_size", params.pageSize);
  if (params.sortBy) query.append("sort_by", params.sortBy);
  if (params.sortOrder) query.append("sort_order", params.sortOrder);

  const qs = query.toString();
  return apiRequest(`/api/research-papers${qs ? `?${qs}` : ""}`);
}

export async function getResearchTrends() {
  return apiRequest("/api/research-papers/trends");
}

export async function getResearchStats() {
  return apiRequest("/api/research-papers/stats");
}

export async function syncResearchPapers(query, perPage = 15) {
  return apiRequest(`/api/research-papers/sync?query=${encodeURIComponent(query)}&per_page=${perPage}`, {
    method: "POST",
  });
}
