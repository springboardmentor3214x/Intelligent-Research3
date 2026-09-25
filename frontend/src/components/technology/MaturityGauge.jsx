import React from 'react';

/**
 * Pure SVG Semicircular Maturity Gauge
 * Displays maturity score (0–100) and stage classification.
 */
export default function MaturityGauge({
  score = 0,
  stage = 'Emerging',
  confidence = 0.85,
}) {
  const clampedScore = Math.max(0, Math.min(100, Math.round(score || 0)));

  // Gauge geometry: center (110, 105), radius 80
  const cx = 110;
  const cy = 95;
  const r = 75;
  const strokeWidth = 14;

  // Semicircle from PI (180deg) to 0 (0deg)
  const circumference = Math.PI * r;
  const strokeDashoffset = circumference * (1 - clampedScore / 100);

  const getStageColor = (stg) => {
    switch ((stg || '').toLowerCase()) {
      case 'emerging':
        return '#38bdf8'; // Cyan
      case 'growth':
        return '#818cf8'; // Indigo
      case 'mature':
        return '#fbbf24'; // Amber
      case 'saturated':
        return '#94a3b8'; // Slate
      default:
        return '#64748b';
    }
  };

  const stageColor = getStageColor(stage);

  return (
    <div className="gauge-wrapper">
      <svg viewBox="0 0 220 120" className="gauge-svg">
        <defs>
          <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="35%" stopColor="#818cf8" />
            <stop offset="70%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f87171" />
          </linearGradient>
        </defs>

        {/* Background track (semicircle) */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="var(--clr-bg-elevated)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Value arc */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={stageColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />

        {/* Center score */}
        <text
          x={cx}
          y={cy - 12}
          textAnchor="middle"
          fill="var(--clr-text-primary)"
          style={{ fontSize: '26px', fontWeight: '700', fontFamily: 'var(--font-heading)' }}
        >
          {clampedScore}
        </text>
        <text
          x={cx}
          y={cy + 8}
          textAnchor="middle"
          fill="var(--clr-text-muted)"
          style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em' }}
        >
          Score / 100
        </text>
      </svg>

      <div className="gauge-stage-label" style={{ color: stageColor }}>
        {stage} Stage
      </div>

      <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', marginTop: 4 }}>
        Confidence: {Math.round((confidence || 0.85) * 100)}%
      </div>
    </div>
  );
}
