import { useState, useEffect } from 'react';
import {
  Award,
  Cpu,
  TrendingUp,
  FileText,
  Activity,
  DollarSign,
  Briefcase,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { submitInnovationScore, calculateLocalScore } from '../../services/innovationApi';
import { getTechnologies } from '../../services/technologyApi';

export default function NewAssessmentView({ preloadedTechId, onAssessmentComplete }) {
  const [techList, setTechList] = useState([]);
  const [technologyId, setTechnologyId] = useState(preloadedTechId || 'tech-ai-agents');
  const [title, setTitle] = useState('Autonomous Multi-Agent Robotics Framework');

  // 5 Factors
  const [researchNovelty, setResearchNovelty] = useState(88);
  const [patentStrength, setPatentStrength] = useState(75);
  const [technologyMaturity, setTechnologyMaturity] = useState(70);
  const [marketPotential, setMarketPotential] = useState(85);
  const [fundingRelevance, setFundingRelevance] = useState(90);

  const [submitting, setSubmitting] = useState(false);
  const [savedResult, setSavedResult] = useState(null);

  // Load technology options
  useEffect(() => {
    async function load() {
      const { data } = await getTechnologies();
      setTechList(data);
      if (preloadedTechId) {
        const found = data.find((t) => t.id === preloadedTechId);
        if (found) {
          setTechnologyId(found.id);
          setTitle(`${found.name} Commercial Translation`);
          setTechnologyMaturity(found.maturity_factors?.overall_maturity_score || 70);
        }
      }
    }
    load();
  }, [preloadedTechId]);

  // Handle tech dropdown change
  const handleTechChange = (id) => {
    setTechnologyId(id);
    const found = techList.find((t) => t.id === id);
    if (found) {
      setTitle(`${found.name} Assessment`);
      setTechnologyMaturity(found.maturity_factors?.overall_maturity_score || 70);
      setResearchNovelty(found.growth_rate > 50 ? 88 : 75);
    }
  };

  // Live client-side calculation
  const liveCalc = calculateLocalScore({
    research_novelty: researchNovelty,
    patent_strength: patentStrength,
    technology_maturity: technologyMaturity,
    market_potential: marketPotential,
    funding_relevance: fundingRelevance,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await submitInnovationScore({
        technology_id: technologyId,
        title,
        research_novelty: researchNovelty,
        patent_strength: patentStrength,
        technology_maturity: technologyMaturity,
        market_potential: marketPotential,
        funding_relevance: fundingRelevance,
      });

      setSavedResult(res);
      if (onAssessmentComplete) {
        onAssessmentComplete(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fadeIn">
      {/* Header */}
      <div className="ent-module-header">
        <div className="ent-module-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1>New Innovation Assessment</h1>
            <span className="ent-live-tag">
              <CheckCircle2 size={12} />
              <span>FastAPI Endpoint: /api/innovation/innovation-score</span>
            </span>
          </div>
          <p>
            Evaluate innovation potential using transparent evidence-based factors. Connects research literature, patent portfolios, technology maturity, and active funding streams.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 24 }}>
        {/* Left Form */}
        <form onSubmit={handleSubmit} className="ent-card">
          <div className="ent-card-header">
            <h2 className="ent-card-title">
              <Sparkles size={17} color="var(--ent-accent-innovation)" />
              <span>Assessment Configuration</span>
            </h2>
            <span style={{ fontSize: 12, color: 'var(--ent-text-muted)' }}>Multi-Module Inputs</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Title */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Innovation / Project Title
              </label>
              <input
                type="text"
                className="ent-input"
                style={{ width: '100%' }}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Select Technology from Module 6 */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Source Technology (Module 6)
              </label>
              <select
                className="ent-select"
                style={{ width: '100%' }}
                value={technologyId}
                onChange={(e) => handleTechChange(e.target.value)}
              >
                {techList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.domain})
                  </option>
                ))}
              </select>
            </div>

            {/* Factor 1: Research Novelty (30%) */}
            <div style={{ padding: 12, background: 'var(--ent-bg-subtle)', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ent-accent-research)' }}>
                  1. Research Novelty (30% weight)
                </span>
                <strong style={{ fontSize: 14 }}>{researchNovelty} / 100</strong>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={researchNovelty}
                onChange={(e) => setResearchNovelty(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--ent-accent-research)' }}
              />
              <span style={{ fontSize: 11, color: 'var(--ent-text-muted)' }}>
                Based on publication citation burst and topic uniqueness in indexed literature.
              </span>
            </div>

            {/* Factor 2: Patent Strength (20%) */}
            <div style={{ padding: 12, background: 'var(--ent-bg-subtle)', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ent-accent-patent)' }}>
                  2. Patent Strength (20% weight)
                </span>
                <strong style={{ fontSize: 14 }}>{patentStrength} / 100</strong>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={patentStrength}
                onChange={(e) => setPatentStrength(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--ent-accent-patent)' }}
              />
              <span style={{ fontSize: 11, color: 'var(--ent-text-muted)' }}>
                Freedom to operate, independent claim breath, and patent density from Module 5.
              </span>
            </div>

            {/* Factor 3: Technology Maturity (15%) */}
            <div style={{ padding: 12, background: 'var(--ent-bg-subtle)', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ent-accent-tech)' }}>
                  3. Technology Maturity (15% weight)
                </span>
                <strong style={{ fontSize: 14 }}>{technologyMaturity} / 100</strong>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={technologyMaturity}
                onChange={(e) => setTechnologyMaturity(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--ent-accent-tech)' }}
              />
              <span style={{ fontSize: 11, color: 'var(--ent-text-muted)' }}>
                Directly synchronized with Module 6 Technology Readiness &amp; Stage progression.
              </span>
            </div>

            {/* Factor 4: Market Potential (20%) */}
            <div style={{ padding: 12, background: 'var(--ent-bg-subtle)', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ent-accent-innovation)' }}>
                  4. Market Potential (20% weight)
                </span>
                <strong style={{ fontSize: 14 }}>{marketPotential} / 100</strong>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={marketPotential}
                onChange={(e) => setMarketPotential(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--ent-accent-innovation)' }}
              />
              <span style={{ fontSize: 11, color: 'var(--ent-text-muted)' }}>
                Addressable industrial market size, problem urgency, and customer willingness to pay.
              </span>
            </div>

            {/* Factor 5: Funding Relevance (15%) */}
            <div style={{ padding: 12, background: 'var(--ent-bg-subtle)', borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>
                  5. Funding Relevance (15% weight)
                </span>
                <strong style={{ fontSize: 14 }}>{fundingRelevance} / 100</strong>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={fundingRelevance}
                onChange={(e) => setFundingRelevance(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#059669' }}
              />
              <span style={{ fontSize: 11, color: 'var(--ent-text-muted)' }}>
                Directly aligns with Module 4 Grants.gov and regional non-dilutive solicitations.
              </span>
            </div>

            <button
              type="submit"
              className="ent-btn ent-btn-primary"
              disabled={submitting}
              style={{ padding: '10px 16px', fontSize: 14 }}
            >
              {submitting ? (
                <>
                  <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Computing via FastAPI...</span>
                </>
              ) : (
                <>
                  <Award size={16} />
                  <span>Calculate &amp; Store Innovation Score</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Right Live Preview Box */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Live Calculated Score Card */}
          <div
            className="ent-card"
            style={{
              background: 'linear-gradient(135deg, #0B1527 0%, #172B4D 100%)',
              color: '#FFFFFF',
              borderColor: 'rgba(255,255,255,0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: '#38BDF8' }}>
                Live Weighted Calculation
              </span>
              <span className="ent-live-tag" style={{ background: 'rgba(16,185,129,0.2)', color: '#34D399', borderColor: '#059669' }}>
                Status: {liveCalc.status}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '14px 0' }}>
              <span style={{ fontSize: 44, fontWeight: 800, color: '#FFFFFF', letterSpacing: -1 }}>
                {liveCalc.innovation_score}
              </span>
              <span style={{ fontSize: 16, color: '#94A3B8' }}>/ 100</span>
            </div>

            {/* Explanation box */}
            <div
              style={{
                background: 'rgba(255,255,255,0.06)',
                borderRadius: 8,
                padding: '12px 14px',
                fontSize: 12.5,
                color: '#CBD5E1',
                lineHeight: 1.5,
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {liveCalc.explanation}
            </div>

            {/* Contributions breakdown */}
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>Research Novelty (30%):</span>
                <strong>+{(researchNovelty * 0.3).toFixed(1)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>Patent Strength (20%):</span>
                <strong>+{(patentStrength * 0.2).toFixed(1)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>Technology Maturity (15%):</span>
                <strong>+{(technologyMaturity * 0.15).toFixed(1)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span>Market Potential (20%):</span>
                <strong>+{(marketPotential * 0.2).toFixed(1)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Funding Relevance (15%):</span>
                <strong>+{(fundingRelevance * 0.15).toFixed(1)}</strong>
              </div>
            </div>
          </div>

          {/* Success state if saved */}
          {savedResult && (
            <div
              className="ent-card scaleIn"
              style={{
                background: '#ECFDF5',
                borderColor: '#A7F3D0',
                padding: 18,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#047857', fontWeight: 700, marginBottom: 6 }}>
                <CheckCircle2 size={18} />
                <span>Assessment Saved Successfully</span>
              </div>
              <p style={{ fontSize: 13, color: '#065F46', margin: '0 0 12px 0' }}>
                Stored with technology ID <strong>{savedResult.data?.technology_id}</strong> in methodology version <strong>innovation_v1</strong>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
