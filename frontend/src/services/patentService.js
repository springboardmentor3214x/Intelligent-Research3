import { apiRequest } from "./api";

/**
 * Module 5 - Patent Landscape Analysis API Service
 */

export async function getPatentLandscape() {
  return apiRequest("/api/patents/landscape");
}

export async function getPatentCompetitors(limit = 25) {
  return apiRequest(`/api/patents/competitors?limit=${limit}`);
}

export async function getPatentTrends() {
  return apiRequest("/api/patents/trends");
}

export async function getMyPatents() {
  return apiRequest("/api/patents");
}

export async function createMyPatent(data) {
  return apiRequest("/api/patents", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
