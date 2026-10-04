import { apiRequest } from "./api";

/**
 * Module 4 - Funding Intelligence API Service
 */

export async function getFunding(params = {}) {
  const query = new URLSearchParams();
  if (params.query) query.append("query", params.query);
  if (params.researchArea) query.append("research_area", params.researchArea);
  if (params.organization && params.organization !== "ALL") query.append("organization", params.organization);
  if (params.status && params.status !== "ALL") query.append("status", params.status);
  if (params.minAmount) query.append("min_amount", params.minAmount);
  if (params.maxAmount) query.append("max_amount", params.maxAmount);
  if (params.page) query.append("page", params.page);
  if (params.pageSize) query.append("page_size", params.pageSize);

  const qs = query.toString();
  return apiRequest(`/api/funding${qs ? `?${qs}` : ""}`);
}

export async function getFundingStats() {
  return apiRequest("/api/funding/stats");
}

export async function getFundingMatching(limit = 20) {
  return apiRequest(`/api/funding/matching?limit=${limit}`);
}

export async function syncFunding(keywords = [], limit = 15) {
  const query = new URLSearchParams();
  if (keywords.length > 0) {
    keywords.forEach((kw) => query.append("keywords", kw));
  }
  query.append("limit", limit);
  return apiRequest(`/api/funding/sync?${query.toString()}`, {
    method: "POST",
  });
}

export async function getFundingById(id) {
  return apiRequest(`/api/funding/${id}`);
}
