import { useState, useEffect } from 'react';
import { DollarSign, CheckCircle2, ArrowRight, ShieldCheck, ExternalLink } from 'lucide-react';
import { getInnovationAssessments } from '../../services/innovationApi';

export default function FundingAttractivenessView() {
  const [assessments, setAssessments] = useState([]);
  const [activeId, setActiveId] = useState('inno-multi-agent-robotics');

  useEffect(() => {
    async function load() {
      const { data } = await getInnovationAssessments();
      setAssessments(data);
      if (data.length > 0) setActiveId(data[0].id);
    }
    load();
  }, []);

  const active = assessments.find((a) => a.id === activeId) || assessments[0];
  const funding = active?.funding_attractiveness || {};

  return (
    <div className="fadeIn">
      {/* Header */}
      <div className="ent-module-header">
        <div className="ent-module-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1>Funding Attractiveness &amp; Grant Alignment</h1>
            <span className="ent-live-tag">
              <DollarSign size={12} />
              <span>Module 4 Grants.gov Integration</span>
            </span>
          </div>
          <p>
            Connected to Module 4 Funding Intelligence. Evaluates grant eligibility and federal non-dilutive award solicitation alignment.
          </p>
        </div>

        <select
          className="ent-select"
          value={active?.id}
          onChange={(e) => setActiveId(e.target.value)}
        >
          {assessments.map((a) => (
            <option key={a.id} value={a.id}>
              {a.title}
            </option>
          ))}
        </select>
      </div>

      {/* Factor Summary Card */}
      <div className="ent-card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>
              Funding Relevance Factor
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 36, fontWeight: 800, color: 'var(--ent-text-primary)' }}>
                {active?.funding_relevance}
              </span>
              <span style={{ fontSize: 14, color: 'var(--ent-text-muted)' }}>/ 100</span>
              <span style={{ marginLeft: 14, fontSize: 13, color: '#059669', fontWeight: 600 }}>
                Contribution: +{(active?.funding_relevance * 0.15).toFixed(1)} pts toward Innovation Score
              </span>
            </div>
          </div>

          <div style={{ padding: '8px 14px', background: '#ECFDF5', borderRadius: 8, border: '1px solid #A7F3D0' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#047857' }}>
              Status: {funding.eligibility_status || 'Verified Eligible'}
            </span>
          </div>
        </div>
      </div>

      {/* Matched Opportunities from Module 4 */}
      <div className="ent-card">
        <div className="ent-card-header">
          <h2 className="ent-card-title">
            <DollarSign size={17} color="#059669" />
            <span>Directly Matched Funding Opportunities</span>
          </h2>
          <span style={{ fontSize: 12, color: 'var(--ent-text-muted)' }}>Source: Module 4 Grants.gov Stream</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {funding.matched_grants?.map((grant) => (
            <div
              key={grant.id}
              style={{
                padding: 16,
                background: '#F8FAFC',
                borderRadius: 8,
                border: '1px solid var(--ent-border-light)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ent-text-muted)' }}>
                  {grant.id} · {grant.agency}
                </span>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--ent-text-primary)', margin: '4px 0' }}>
                  {grant.title}
                </h3>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#059669' }}>
                  {grant.amount}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span
                  style={{
                    padding: '4px 10px',
                    borderRadius: 4,
                    background: '#ECFDF5',
                    color: '#047857',
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                >
                  {grant.match_score} Match
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
