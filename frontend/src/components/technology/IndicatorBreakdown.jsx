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
      name: 'Research Growth Rate',
      weight: weights.researchGrowth,
      color: '#38bdf8',
      desc: 'Compound publication growth trend',
    },
    {
      key: 'patentGrowth',
      name: 'Patent Growth Rate',
      weight: weights.patentGrowth,
      color: '#818cf8',
      desc: 'Compound patent filing growth trend',
    },
    {
      key: 'researchActivity',
      name: 'Research Activity Level',
      weight: weights.researchActivity,
      color: '#06b6d4',
      desc: 'Normalized publication volume',
    },
    {
      key: 'patentActivity',
      name: 'Patent Activity Level',
      weight: weights.patentActivity,
      color: '#a855f7',
      desc: 'Normalized patent grant volume',
    },
    {
      key: 'organizationParticipation',
      name: 'Organization Participation',
      weight: weights.organizationParticipation,
      color: '#ec4899',
      desc: 'Institutional ecosystem diversity',
    },
    {
      key: 'applicationDiversity',
      name: 'Application Diversity',
      weight: weights.applicationDiversity,
      color: '#fbbf24',
      desc: 'Cross-domain sector adoption breadth',
    },
  ];

  return (
    <div className="indicators-list">
      {items.map((item) => {
        const rawVal = indicators[item.key] ?? 0;
        const scorePercent = Math.min(100, Math.max(0, Math.round(rawVal * 100)));
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
