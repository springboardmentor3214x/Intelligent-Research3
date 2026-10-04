import React from "react";

/**
 * SVG Radar Chart for 5 Factor Innovation Scoring
 * Optimized for clean enterprise light dashboard styling.
 */
export default function RadarChart({
  data = [],
  size = 320,
  maxValue = 100,
  theme = "light",
}) {
  const center = size / 2;
  const radius = (size / 2) - 48;
  const total = data.length || 5;

  if (total < 3) return null;

  const isLight = theme === "light";

  // Compute coordinate for a given angle and value
  const getCoordinates = (value, index) => {
    const angle = (Math.PI * 2 / total) * index - Math.PI / 2;
    const distance = (Math.max(0, Math.min(maxValue, value || 0)) / maxValue) * radius;
    return {
      x: center + distance * Math.cos(angle),
      y: center + distance * Math.sin(angle),
    };
  };

  // Compute outer label coordinates
  const getLabelCoordinates = (index) => {
    const angle = (Math.PI * 2 / total) * index - Math.PI / 2;
    const distance = radius + 28;
    return {
      x: center + distance * Math.cos(angle),
      y: center + distance * Math.sin(angle),
    };
  };

  // Grid levels (20%, 40%, 60%, 80%, 100%)
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

  const gridPolygons = gridLevels.map((lvl) => {
    const points = Array.from({ length: total }).map((_, i) => {
      const angle = (Math.PI * 2 / total) * i - Math.PI / 2;
      const d = radius * lvl;
      return `${center + d * Math.cos(angle)},${center + d * Math.sin(angle)}`;
    });
    return points.join(" ");
  });

  // Data points polygon
  const dataPoints = data.map((d, i) => getCoordinates(d.value, i));
  const polygonPointsStr = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="radarPolyGradLight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.10" />
          </linearGradient>
          <filter id="radarGlowLight" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Concentric Grid Pentagons */}
        {gridPolygons.map((pts, idx) => (
          <polygon
            key={idx}
            points={pts}
            fill="none"
            stroke={isLight ? "#E2E8F0" : "#1e293b"}
            strokeWidth="1.2"
            strokeDasharray={idx < 4 ? "3,3" : "none"}
          />
        ))}

        {/* Grid Axis Lines from Center to Vertices */}
        {Array.from({ length: total }).map((_, i) => {
          const angle = (Math.PI * 2 / total) * i - Math.PI / 2;
          const endX = center + radius * Math.cos(angle);
          const endY = center + radius * Math.sin(angle);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={endX}
              y2={endY}
              stroke={isLight ? "#CBD5E1" : "#223049"}
              strokeWidth="1.2"
            />
          );
        })}

        {/* Value Polygon with Gradient */}
        <polygon
          points={polygonPointsStr}
          fill="url(#radarPolyGradLight)"
          stroke={isLight ? "#2563eb" : "#60a5fa"}
          strokeWidth="2.5"
          filter="url(#radarGlowLight)"
        />

        {/* Vertices Data Points */}
        {dataPoints.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="4.5"
            fill="#ffffff"
            stroke="#2563eb"
            strokeWidth="2.5"
          />
        ))}

        {/* Factor Labels & Scores */}
        {data.map((d, i) => {
          const labelCoord = getLabelCoordinates(i);
          return (
            <text
              key={i}
              x={labelCoord.x}
              y={labelCoord.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="11"
              fontWeight="600"
              fill={isLight ? "#172033" : "#cbd5e1"}
            >
              {d.label}
              <tspan x={labelCoord.x} dy="13" fontSize="10.5" fontWeight="700" fill="#2563eb">
                {d.value !== null && d.value !== undefined ? `${Math.round(d.value)}%` : "N/A"}
              </tspan>
            </text>
          );
        })}
      </svg>
    </div>
  );
}
