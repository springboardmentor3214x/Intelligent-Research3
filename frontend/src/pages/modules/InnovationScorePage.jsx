import React, { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import {
  Award,
  ShieldCheck,
  Zap,
  Sparkles,
  TrendingUp,
  DollarSign,
  RefreshCw,
} from "lucide-react";

import { fetchTechnologies } from "../../services/technologyService";
import {
  fetchInnovationScore,
  fetchInnovationScoreBreakdown,
  fetchInnovationScoreExplanation,
} from "../../services/innovationScoreService";

const FACTOR_CONFIG = [
  {
    key: "research_novelty",
    label: "Research Novelty",
    weight: 30,
    icon: Sparkles,
  },
  {
    key: "patent_strength",
    label: "Patent Strength",
    weight: 20,
    icon: ShieldCheck,
  },
  {
    key: "technology_maturity",
    label: "Technology Maturity",
    weight: 15,
    icon: Zap,
  },
  {
    key: "market_potential",
    label: "Market Potential",
    weight: 20,
    icon: TrendingUp,
  },
  {
    key: "funding_relevance",
    label: "Funding Relevance",
    weight: 15,
    icon: DollarSign,
  },
];

export default function InnovationScorePage() {
  const [technologies, setTechnologies] = useState([]);
  const [selectedTechId, setSelectedTechId] = useState("");

  const [scoreData, setScoreData] = useState(null);
  const [breakdownData, setBreakdownData] = useState(null);
  const [explanationData, setExplanationData] = useState(null);

  const [loadingTechnologies, setLoadingTechnologies] = useState(true);
  const [loadingScore, setLoadingScore] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadTechnologies();
  }, []);

  async function loadTechnologies() {
    try {
      setLoadingTechnologies(true);
      setError("");

      const response = await fetchTechnologies();

      const list = Array.isArray(response)
        ? response
        : response?.technologies || response?.items || [];

      setTechnologies(list);

      if (list.length > 0) {
        const firstId =
          list[0].technology_id ||
          list[0].technologyId ||
          list[0].id;

        if (firstId) {
          setSelectedTechId(String(firstId));
        }
      }
    } catch (err) {
      setError(err.message || "Failed to load technologies.");
    } finally {
      setLoadingTechnologies(false);
    }
  }

  useEffect(() => {
    if (!selectedTechId) return;

    loadInnovationScore(selectedTechId);
  }, [selectedTechId]);

  async function loadInnovationScore(technologyId) {
    try {
      setLoadingScore(true);
      setError("");

      const [score, breakdown, explanation] = await Promise.all([
        fetchInnovationScore(technologyId),
        fetchInnovationScoreBreakdown(technologyId),
        fetchInnovationScoreExplanation(technologyId),
      ]);

      setScoreData(score);
      setBreakdownData(breakdown);
      setExplanationData(explanation);
    } catch (err) {
      setScoreData(null);
      setBreakdownData(null);
      setExplanationData(null);

      setError(
        err.message ||
          "Innovation score is not available for this technology yet."
      );
    } finally {
      setLoadingScore(false);
    }
  }

  const selectedTechnology = useMemo(() => {
    return technologies.find(
      (technology) =>
        String(
          technology.technology_id ||
            technology.technologyId ||
            technology.id
        ) === String(selectedTechId)
    );
  }, [technologies, selectedTechId]);

  const factors = useMemo(() => {
    return FACTOR_CONFIG.map((config) => ({
      ...config,

      score:
        scoreData?.[config.key] ??
        breakdownData?.factors?.[config.key]?.score ??
        null,
    }));
  }, [scoreData, breakdownData]);

  const innovationScore =
    scoreData?.innovation_score ??
    breakdownData?.innovation_score ??
    null;

  const status =
    scoreData?.status ||
    breakdownData?.status ||
    explanationData?.status ||
    "not_available";

  const missingFactors =
    scoreData?.missing_factors ||
    breakdownData?.missing_factors ||
    [];

  const explanation =
    explanationData?.explanation ||
    scoreData?.explanation ||
    breakdownData?.explanation ||
    "";

  const methodologyVersion =
    scoreData?.methodology_version ||
    breakdownData?.methodology_version ||
    "innovation_v1";

  return (
    <DashboardLayout
      pageTitle="Innovation Scoring Engine"
      breadcrumbs={[
        "Research Intelligence",
        "Module 7",
        "Innovation Score",
      ]}
    >
      <div className="tab-pane-content">
        <div className="tab-pane-header">
          <div>
            <h3 className="tab-section-title">
              Composite Innovation Scoring Engine
            </h3>

            <p className="tab-section-desc">
              Evidence-based evaluation using research novelty, patent
              strength, technology maturity, market potential, and funding
              relevance.
            </p>
          </div>
        </div>

        {/* Technology Selection */}
        <div className="form-card-panel">
          <h4 className="form-card-title">
            Technology Selection
          </h4>

          {loadingTechnologies ? (
            <p>Loading technologies...</p>
          ) : technologies.length === 0 ? (
            <p>No technologies available.</p>
          ) : (
            <select
              value={selectedTechId}
              onChange={(event) =>
                setSelectedTechId(event.target.value)
              }
              className="form-input"
            >
              {technologies.map((technology) => {
                const id =
                  technology.technology_id ||
                  technology.technologyId ||
                  technology.id;

                const name =
                  technology.name ||
                  technology.technology_name ||
                  technology.technologyName ||
                  id;

                return (
                  <option key={id} value={id}>
                    {name}
                  </option>
                );
              })}
            </select>
          )}

          {selectedTechnology && (
            <p
              className="tab-section-desc"
              style={{ marginTop: "10px" }}
            >
              Technology ID:{" "}
              {selectedTechnology.technology_id ||
                selectedTechnology.technologyId ||
                selectedTechnology.id}
            </p>
          )}
        </div>

        {error && (
          <div className="form-card-panel">
            <p>{error}</p>

            {selectedTechId && (
              <button
                type="button"
                onClick={() => loadInnovationScore(selectedTechId)}
              >
                <RefreshCw size={15} />
                Retry
              </button>
            )}
          </div>
        )}

        {loadingScore ? (
          <div className="form-card-panel">
            <p>Loading innovation score...</p>
          </div>
        ) : (
          <>
            {/* Overview */}
            <div className="overview-stats-grid">
              <div className="overview-stat-card">
                <div className="stat-card-header">
                  <span className="stat-label">
                    Innovation Score
                  </span>

                  <Award
                    size={18}
                    className="stat-icon-blue"
                  />
                </div>

                <div className="stat-val">
                  {innovationScore !== null
                    ? `${Number(innovationScore).toFixed(2)} / 100`
                    : "Not available"}
                </div>

                <span className="stat-nav-hint">
                  Status: {status.replaceAll("_", " ")}
                </span>
              </div>

              <div className="overview-stat-card">
                <div className="stat-card-header">
                  <span className="stat-label">
                    Data Quality
                  </span>

                  <ShieldCheck
                    size={18}
                    className="stat-icon-emerald"
                  />
                </div>

                <div className="stat-val">
                  {missingFactors.length === 0
                    ? "Complete"
                    : `${missingFactors.length} Missing`}
                </div>

                <span className="stat-nav-hint">
                  {missingFactors.length === 0
                    ? "All five factors available"
                    : "Missing factors are not treated as zero"}
                </span>
              </div>

              <div className="overview-stat-card">
                <div className="stat-card-header">
                  <span className="stat-label">
                    Methodology
                  </span>

                  <Zap
                    size={18}
                    className="stat-icon-amber"
                  />
                </div>

                <div className="stat-val">
                  {methodologyVersion}
                </div>

                <span className="stat-nav-hint">
                  Versioned scoring methodology
                </span>
              </div>
            </div>

            {/* Factor Breakdown */}
            <div className="form-card-panel">
              <h4 className="form-card-title">
                Score Dimensions Breakdown
              </h4>

              <div className="expertise-bars-list">
                {factors.map((factor) => {
                  const Icon = factor.icon;
                  const hasScore = factor.score !== null;

                  return (
                    <div
                      key={factor.key}
                      className="expertise-bar-row"
                    >
                      <div className="expertise-meta">
                        <span className="expertise-name">
                          <Icon
                            size={16}
                            style={{ marginRight: "6px" }}
                          />

                          {factor.label}
                        </span>

                        <div className="expertise-tags">
                          <span className="badge-category">
                            Weight: {factor.weight}%
                          </span>

                          <span className="badge-level">
                            {hasScore
                              ? "Available"
                              : "Missing"}
                          </span>

                          <span className="expertise-pct">
                            {hasScore
                              ? `${Number(
                                  factor.score
                                ).toFixed(2)}%`
                              : "N/A"}
                          </span>
                        </div>
                      </div>

                      <div className="expertise-track">
                        {hasScore && (
                          <div
                            className="expertise-fill"
                            style={{
                              width: `${Math.max(
                                0,
                                Math.min(
                                  100,
                                  Number(factor.score)
                                )
                              )}%`,
                            }}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Missing Data */}
            {missingFactors.length > 0 && (
              <div className="form-card-panel">
                <h4 className="form-card-title">
                  Data Quality
                </h4>

                <p>
                  The following factors were unavailable:
                </p>

                <ul>
                  {missingFactors.map((factor) => (
                    <li key={factor}>
                      {factor
                        .replaceAll("_", " ")
                        .replace(/\b\w/g, (letter) =>
                          letter.toUpperCase()
                        )}
                    </li>
                  ))}
                </ul>

                <p className="tab-section-desc">
                  Missing factors are excluded and the available
                  weights are normalized according to the scoring
                  methodology.
                </p>
              </div>
            )}

            {/* Explanation */}
            {explanation && (
              <div className="form-card-panel">
                <h4 className="form-card-title">
                  Why This Score Was Produced
                </h4>

                <p>{explanation}</p>
              </div>
            )}

            {/* Source / Metadata */}
            <div className="form-card-panel">
              <h4 className="form-card-title">
                Score Information
              </h4>

              <p>
                <strong>Technology:</strong>{" "}
                {selectedTechnology?.name ||
                  selectedTechnology?.technology_name ||
                  selectedTechnology?.technologyName ||
                  selectedTechId ||
                  "Not selected"}
              </p>

              <p>
                <strong>Methodology:</strong>{" "}
                {methodologyVersion}
              </p>

              <p>
                <strong>Status:</strong>{" "}
                {status.replaceAll("_", " ")}
              </p>

              {scoreData?.created_at && (
                <p>
                  <strong>Calculated:</strong>{" "}
                  {new Date(
                    scoreData.created_at
                  ).toLocaleString()}
                </p>
              )}

              {scoreData?.updated_at && (
                <p>
                  <strong>Last Updated:</strong>{" "}
                  {new Date(
                    scoreData.updated_at
                  ).toLocaleString()}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}