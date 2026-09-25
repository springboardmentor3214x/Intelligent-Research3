import React from 'react';
import { ArrowUpRight, TrendingUp, TrendingDown, Minus, Layers } from 'lucide-react';
import DataSourceBadge from './DataSourceBadge';

/**
 * Technology Overview Card
 */
export default function TechnologyCard({
  tech,
  isSelected = false,
  onSelect,
}) {
  if (!tech) return null;

  const getStageClass = (stage) => {
    switch ((stage || '').toLowerCase()) {
      case 'emerging':
        return 'emerging';
      case 'growth':
        return 'growth';
      case 'mature':
        return 'mature';
      case 'saturated':
        return 'saturated';
      default:
        return 'insufficient';
    }
  };

  const getAdoptionClass = (level) => {
    switch ((level || '').toLowerCase()) {
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      default:
        return 'low';
    }
  };

  const getDirectionIcon = (dir) => {
    if (dir === 'Increasing') return <TrendingUp size={13} color="#34d399" />;
    if (dir === 'Decreasing') return <TrendingDown size={13} color="#f87171" />;
    return <Minus size={13} color="#94a3b8" />;
  };

  return (
    <div
      className={`tech-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect && onSelect(tech.technology_id)}
    >
      <div className="tech-card-header">
        <div className="tech-card-title-group">
          <div className="tech-card-domain">{tech.domain || 'Technology'}</div>
          <h4>{tech.name}</h4>
        </div>
        <DataSourceBadge isDemo={tech.is_demo} />
      </div>

      <div className="tech-badges-row">
        <span className={`badge-stage ${getStageClass(tech.stage)}`}>
          <Layers size={11} /> {tech.stage || 'Evaluating'}
        </span>
        <span className={`badge-adoption ${getAdoptionClass(tech.adoption_level)}`}>
          Adoption: {tech.adoption_level || 'Low'}
        </span>
      </div>

      <div className="tech-card-desc">
        {tech.description || 'No description available for this technology.'}
      </div>

      <div className="tech-card-stats">
        <div className="tech-stat-item">
          <span className="tech-stat-label">Maturity</span>
          <span className="tech-stat-val">
            {tech.score !== undefined && tech.score !== null ? `${Math.round(tech.score)}/100` : '—'}
          </span>
        </div>
        <div className="tech-stat-item">
          <span className="tech-stat-label">Research</span>
          <span className="tech-stat-val" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {getDirectionIcon(tech.research_direction)}
            <span style={{ fontSize: '0.8rem' }}>{tech.research_direction || '—'}</span>
          </span>
        </div>
        <div className="tech-stat-item">
          <span className="tech-stat-label">Patents</span>
          <span className="tech-stat-val" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {getDirectionIcon(tech.patent_direction)}
            <span style={{ fontSize: '0.8rem' }}>{tech.patent_direction || '—'}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
