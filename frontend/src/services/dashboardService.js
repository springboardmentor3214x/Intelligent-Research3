/**
 * Module 9 - Dashboard Analytics API Service
 * Wraps all /api/dashboard/* calls using the existing apiRequest utility.
 */
import { apiRequest } from './api';

/**
 * Fetch platform-wide KPI summary
 */
export async function getDashboardSummary() {
  return apiRequest('/api/dashboard/summary');
}

/**
 * Fetch research analytics (publications, areas, keywords)
 */
export async function getResearchAnalytics() {
  return apiRequest('/api/dashboard/research');
}

/**
 * Fetch patent analytics
 */
export async function getPatentAnalytics() {
  return apiRequest('/api/dashboard/patents');
}

/**
 * Fetch funding analytics
 */
export async function getFundingAnalytics() {
  return apiRequest('/api/dashboard/funding');
}

/**
 * Fetch innovation score analytics (Module 7)
 */
export async function getInnovationAnalytics() {
  return apiRequest('/api/dashboard/innovation');
}

/**
 * Fetch technology intelligence analytics (Module 6)
 */
export async function getTechnologyAnalytics() {
  return apiRequest('/api/dashboard/technology');
}

/**
 * Fetch commercialization analytics (Module 8)
 */
export async function getCommercializationAnalytics() {
  return apiRequest('/api/dashboard/commercialization');
}

/**
 * Fetch recent platform activity feed
 * @param {number} limit - max number of items (default 20)
 */
export async function getRecentActivity(limit = 20) {
  return apiRequest(`/api/dashboard/activity?limit=${limit}`);
}

/**
 * Fetch user & role analytics (admin only)
 */
export async function getUserAnalytics() {
  return apiRequest('/api/dashboard/users');
}

/**
 * Fetch all dashboard sections in parallel
 */
export async function fetchAllDashboardData() {
  const [summary, research, patents, funding, innovation, technology, commercialization, activity] =
    await Promise.allSettled([
      getDashboardSummary(),
      getResearchAnalytics(),
      getPatentAnalytics(),
      getFundingAnalytics(),
      getInnovationAnalytics(),
      getTechnologyAnalytics(),
      getCommercializationAnalytics(),
      getRecentActivity(15),
    ]);

  const extractValue = (result) =>
    result.status === 'fulfilled' ? result.value : null;

  return {
    summary: extractValue(summary),
    research: extractValue(research),
    patents: extractValue(patents),
    funding: extractValue(funding),
    innovation: extractValue(innovation),
    technology: extractValue(technology),
    commercialization: extractValue(commercialization),
    activity: extractValue(activity),
  };
}
