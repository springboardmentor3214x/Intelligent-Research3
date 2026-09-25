import React, { useState } from 'react';

/**
 * Pure SVG Multi-line Chart for Yearly Technology Metrics
 * Displays Research Papers (Cyan) and Patents (Purple) trends.
 */
export default function MiniLineChart({
  data = [],
  height = 200,
  showPatents = true,
  showResearch = true,
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--clr-text-muted)', fontSize: '0.85rem' }}>
        No yearly history available
      </div>
    );
  }

  // Sort ascending by year
  const sorted = [...data].sort((a, b) => a.year - b.year);

  const padding = { top: 20, right: 30, bottom: 35, left: 50 };
  const width = 500; // viewBox width

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxVal = Math.max(
    ...sorted.flatMap((d) => [
      showResearch ? (d.research_papers || 0) : 0,
      showPatents ? (d.patents || 0) : 0,
    ]),
    10
  );

  const getX = (index) => {
    if (sorted.length <= 1) return padding.left + chartWidth / 2;
    return padding.left + (index / (sorted.length - 1)) * chartWidth;
  };

  const getY = (val) => {
    return padding.top + chartHeight - (val / maxVal) * chartHeight;
  };

  // Build SVG path strings
  const researchPoints = sorted.map((d, i) => ({
    x: getX(i),
    y: getY(d.research_papers || 0),
    val: d.research_papers || 0,
    year: d.year,
  }));

  const patentPoints = sorted.map((d, i) => ({
    x: getX(i),
    y: getY(d.patents || 0),
    val: d.patents || 0,
    year: d.year,
  }));

  const makePath = (points) => {
    if (points.length === 0) return '';
    return points.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, '');
  };

  const makeAreaPath = (points) => {
    if (points.length === 0) return '';
    const line = makePath(points);
    const lastX = points[points.length - 1].x;
    const firstX = points[0].x;
    const baseY = padding.top + chartHeight;
    return `${line} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
  };

  // Y axis ticks (3 ticks)
  const yTicks = [0, Math.round(maxVal / 2), maxVal];

  return (
    <div className="chart-container">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="chart-svg"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="researchGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="patentGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal gridlines */}
        {yTicks.map((tickVal, i) => {
          const y = getY(tickVal);
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                className="chart-grid-line"
              />
              <text
                x={padding.left - 8}
                y={y + 3}
                textAnchor="end"
                className="chart-axis-label"
              >
                {tickVal >= 1000 ? `${(tickVal / 1000).toFixed(1)}k` : tickVal}
              </text>
            </g>
          );
        })}

        {/* X axis years */}
        {sorted.map((d, i) => {
          const x = getX(i);
          return (
            <text
              key={d.year}
              x={x}
              y={height - 10}
              textAnchor="middle"
              className="chart-axis-label"
            >
              {d.year}
            </text>
          );
        })}

        {/* Research Area and Line */}
        {showResearch && (
          <>
            <path d={makeAreaPath(researchPoints)} fill="url(#researchGrad)" />
            <path d={makePath(researchPoints)} className="chart-line-research" />
            {researchPoints.map((p, i) => (
              <circle
                key={`r-${i}`}
                cx={p.x}
                cy={p.y}
                r={hoveredIndex === i ? 5 : 3.5}
                fill="#38bdf8"
                stroke="#0f172a"
                strokeWidth={2}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{ cursor: 'pointer', transition: 'r 0.2s' }}
              />
            ))}
          </>
        )}

        {/* Patent Area and Line */}
        {showPatents && (
          <>
            <path d={makeAreaPath(patentPoints)} fill="url(#patentGrad)" />
            <path d={makePath(patentPoints)} className="chart-line-patent" />
            {patentPoints.map((p, i) => (
              <circle
                key={`p-${i}`}
                cx={p.x}
                cy={p.y}
                r={hoveredIndex === i ? 5 : 3.5}
                fill="#a855f7"
                stroke="#0f172a"
                strokeWidth={2}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{ cursor: 'pointer', transition: 'r 0.2s' }}
              />
            ))}
          </>
        )}

        {/* Hover vertical line and tooltip */}
        {hoveredIndex !== null && (
          <line
            x1={getX(hoveredIndex)}
            y1={padding.top}
            x2={getX(hoveredIndex)}
            y2={padding.top + chartHeight}
            stroke="#94a3b8"
            strokeWidth={1}
            strokeDasharray="2 2"
          />
        )}
      </svg>

      {/* Tooltip display */}
      {hoveredIndex !== null && sorted[hoveredIndex] && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--clr-bg-elevated)',
            border: '1px solid var(--clr-border)',
            borderRadius: 'var(--radius-sm)',
            padding: '4px 10px',
            fontSize: '0.78rem',
            display: 'flex',
            gap: '12px',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          <span><strong>{sorted[hoveredIndex].year}</strong></span>
          {showResearch && (
            <span style={{ color: '#38bdf8' }}>
              Papers: {sorted[hoveredIndex].research_papers?.toLocaleString() || 0}
            </span>
          )}
          {showPatents && (
            <span style={{ color: '#a855f7' }}>
              Patents: {sorted[hoveredIndex].patents?.toLocaleString() || 0}
            </span>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="chart-legend">
        {showResearch && (
          <div className="legend-item">
            <span className="legend-dot" style={{ background: '#38bdf8' }} />
            <span>Research Papers</span>
          </div>
        )}
        {showPatents && (
          <div className="legend-item">
            <span className="legend-dot" style={{ background: '#a855f7' }} />
            <span>Patent Filings</span>
          </div>
        )}
      </div>
    </div>
  );
}
