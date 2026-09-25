import React from 'react';

/**
 * Breakdown of the 6 Normalized Maturity Indicators
 */
export default function IndicatorBreakdown({
  indicators = {},
  weights = {
    researchGrowth: 0.25,
    patentGrowth: 0.25,
    researchActivity: 0.15,
    patentActivity: 0.15,
    organizationParticipation: 0.10,
    applicationDiversity: 0.10,
  },
}) {
  const items = [
    {
      key: 'researchGrowth',
      snakeKey: 'research_growth_score',
      name: 'Research Growth Rate',
      weight: weights.researchGrowth,
      color: '#38bdf8',
      desc: 'Compound publication growth trend',
    },
    {
      key: 'patentGrowth',
      snakeKey: 'patent_growth_score',
      name: 'Patent Growth Rate',
      weight: weights.patentGrowth,
      color: '#818cf8',
      desc: 'Compound patent filing growth trend',
    },
    {
      key: 'researchActivity',
      snakeKey: 'research_activity_score',
      name: 'Research Activity Level',
      weight: weights.researchActivity,
      color: '#06b6d4',
      desc: 'Normalized publication volume',
    },
    {
      key: 'patentActivity',
      snakeKey: 'patent_activity_score',
      name: 'Patent Activity Level',
      weight: weights.patentActivity,
      color: '#a855f7',
      desc: 'Normalized patent grant volume',
    },
    {
      key: 'organizationParticipation',
      snakeKey: 'organization_score',
      name: 'Organization Participation',
      weight: weights.organizationParticipation,
      color: '#ec4899',
      desc: 'Institutional ecosystem diversity',
    },
    {
      key: 'applicationDiversity',
      snakeKey: 'diversity_score',
      name: 'Application Diversity',
      weight: weights.applicationDiversity,
      color: '#fbbf24',
      desc: 'Cross-domain sector adoption breadth',
    },
  ];

  return (
    <div className="indicators-list">
      {items.map((item) => {
        const rawVal = indicators[item.key] ?? indicators[item.snakeKey] ?? 0;
        const numVal = typeof rawVal === 'number' ? rawVal : parseFloat(rawVal) || 0;
        const scorePercent = Math.min(100, Math.max(0, Math.round(numVal <= 1 && numVal > 0 ? numVal * 100 : numVal)));
        const weightPercent = Math.round(item.weight * 100);

        return (
          <div key={item.key} className="indicator-row">
            <div className="indicator-meta">
              <span className="indicator-name">
                {item.name}
                <span className="indicator-weight">({weightPercent}% wt)</span>
              </span>
              <span className="indicator-val">{scorePercent}%</span>
            </div>
            <div className="indicator-bar-track">
              <div
                className="indicator-bar-fill"
                style={{
                  width: `${scorePercent}%`,
                  background: item.color,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
