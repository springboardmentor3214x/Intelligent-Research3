/**
 * INNOVATION SCORING ENGINE API SERVICE (MODULE 7)
 * Connects directly to FastAPI backend:
 * POST /api/innovation/innovation-score
 * GET  /api/innovation/innovation-score/{technology_id}
 * GET  /api/innovation/innovation-score/{technology_id}/breakdown
 * GET  /api/innovation/innovation-score/{technology_id}/explanation
 *
 * Implements exact weighted formula:
 * Novelty: 30% | Patent: 20% | Maturity: 15% | Market: 20% | Funding: 15%
 */

import { DEMO_INNOVATIONS } from '../data/demo/innovationDemoData';

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

const FACTOR_WEIGHTS = {
  research_novelty: 0.30,
  patent_strength: 0.20,
  technology_maturity: 0.15,
  market_potential: 0.20,
  funding_relevance: 0.15,
};

/**
 * Local transparent calculation strictly mirroring backend module7_member5_service.py
 */
export function calculateLocalScore(factors) {
  const available = {};
  const missing = [];

  Object.entries(FACTOR_WEIGHTS).forEach(([key, weight]) => {
    const val = factors[key];
    if (val !== undefined && val !== null && !isNaN(Number(val))) {
      available[key] = Number(val);
    } else {
      missing.push(key);
    }
  });

  if (Object.keys(available).length < 3) {
    return {
      innovation_score: null,
      status: 'insufficient_data',
      missing_factors: missing,
      explanation: 'Innovation score could not be calculated because fewer than three factor scores are available.',
    };
  }

  const availableWeight = Object.keys(available).reduce((sum, k) => sum + FACTOR_WEIGHTS[k], 0);
  const weightedSum = Object.entries(available).reduce(
    (sum, [k, val]) => sum + val * FACTOR_WEIGHTS[k],
    0
  );

  const finalScore = Number((weightedSum / availableWeight).toFixed(2));
  const isComplete = missing.length === 0;

  let explanation = '';
  if (isComplete) {
    const strongest = Object.entries(available).reduce((max, curr) => (curr[1] > max[1] ? curr : max));
    const factorNames = {
      research_novelty: 'Research Novelty',
      patent_strength: 'Patent Strength',
      technology_maturity: 'Technology Maturity',
      market_potential: 'Market Potential',
      funding_relevance: 'Funding Relevance',
    };
    explanation = `Innovation score is ${finalScore}. Research Novelty scored ${available.research_novelty}, Patent Strength scored ${available.patent_strength}, Technology Maturity scored ${available.technology_maturity}, Market Potential scored ${available.market_potential}, and Funding Relevance scored ${available.funding_relevance}. The strongest factor is ${factorNames[strongest[0]]} (${strongest[1]}).`;
  } else {
    explanation = `Innovation score was calculated using the available factor scores. Missing factors (${missing.join(', ')}) were excluded and the remaining weights were normalized.`;
  }

  return {
    innovation_score: finalScore,
    status: isComplete ? 'complete' : 'calculated_with_adjusted_weights',
    missing_factors: missing,
    explanation,
    weights: FACTOR_WEIGHTS,
  };
}

/**
 * Submit and calculate Innovation Score
 */
export async function submitInnovationScore(payload) {
  // First attempt real FastAPI backend
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/innovation/innovation-score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        technology_id: payload.technology_id || `tech-custom-${Date.now()}`,
        research_novelty: payload.research_novelty !== undefined ? Number(payload.research_novelty) : null,
        patent_strength: payload.patent_strength !== undefined ? Number(payload.patent_strength) : null,
        technology_maturity: payload.technology_maturity !== undefined ? Number(payload.technology_maturity) : null,
        market_potential: payload.market_potential !== undefined ? Number(payload.market_potential) : null,
        funding_relevance: payload.funding_relevance !== undefined ? Number(payload.funding_relevance) : null,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        data,
        isLiveBackend: true,
      };
    }
  } catch (err) {
    console.warn('Backend API unavailable, executing client-side transparent scoring:', err.message);
  }

  // Fallback to local deterministic calculation
  const calc = calculateLocalScore(payload);
  const result = {
    technology_id: payload.technology_id,
    research_novelty: payload.research_novelty,
    patent_strength: payload.patent_strength,
    technology_maturity: payload.technology_maturity,
    market_potential: payload.market_potential,
    funding_relevance: payload.funding_relevance,
    innovation_score: calc.innovation_score,
    explanation: calc.explanation,
    status: calc.status,
    methodology_version: 'innovation_v1',
    missing_factors: calc.missing_factors,
  };

  return {
    data: result,
    isLiveBackend: false,
  };
}

/**
 * Fetch saved innovation assessments
 */
export async function getInnovationAssessments() {
  // Return preloaded assessments
  return {
    data: DEMO_INNOVATIONS,
    total: DEMO_INNOVATIONS.length,
    isDemo: true,
  };
}

/**
 * Fetch a single innovation assessment by ID
 */
export async function getInnovationAssessmentById(id) {
  // First attempt backend
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/innovation/innovation-score/${id}`);
    if (res.ok) {
      const data = await res.json();
      return { data, isLiveBackend: true };
    }
  } catch (err) {}

  const found = DEMO_INNOVATIONS.find((inv) => inv.id === id || inv.technology_id === id) || DEMO_INNOVATIONS[0];
  return {
    data: found,
    isLiveBackend: false,
  };
}

/**
 * Fetch factor breakdown
 */
export async function getScoreBreakdown(id) {
  try {
    const res = await fetch(`${BACKEND_BASE_URL}/api/innovation/innovation-score/${id}/breakdown`);
    if (res.ok) {
      const data = await res.json();
      return { data, isLiveBackend: true };
    }
  } catch (err) {}

  const { data: inv } = await getInnovationAssessmentById(id);
  return {
    data: {
      technology_id: inv.technology_id,
      factors: {
        research_novelty: { score: inv.research_novelty, weight: 30, contribution: (inv.research_novelty * 0.3).toFixed(1) },
        patent_strength: { score: inv.patent_strength, weight: 20, contribution: (inv.patent_strength * 0.2).toFixed(1) },
        technology_maturity: { score: inv.technology_maturity, weight: 15, contribution: (inv.technology_maturity * 0.15).toFixed(1) },
        market_potential: { score: inv.market_potential, weight: 20, contribution: (inv.market_potential * 0.2).toFixed(1) },
        funding_relevance: { score: inv.funding_relevance, weight: 15, contribution: (inv.funding_relevance * 0.15).toFixed(1) },
      },
      innovation_score: inv.overall_score || inv.innovation_score,
      status: inv.status,
    },
    isLiveBackend: false,
  };
}

/**
 * Compare 2 to 3 innovations
 */
export async function compareInnovations(ids = []) {
  const all = DEMO_INNOVATIONS;
  const filtered = ids.length > 0 ? all.filter((inv) => ids.includes(inv.id)) : all.slice(0, 3);
  return {
    data: filtered,
    isDemo: true,
  };
}
