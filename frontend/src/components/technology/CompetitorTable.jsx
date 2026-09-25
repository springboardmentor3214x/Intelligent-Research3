import React from 'react';
import { Building2, Award, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import DataSourceBadge from './DataSourceBadge';

/**
 * Competitive and Organizational Monitoring Table
 */
export default function CompetitorTable({ competitors = [] }) {
  if (!competitors || competitors.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--clr-text-muted)', fontSize: '0.85rem' }}>
        No organization or competitor data recorded for this technology.
      </div>
    );
  }

  const getMomentumIcon = (direction) => {
    switch ((direction || '').toLowerCase()) {
      case 'increasing':
      case 'high':
        return <TrendingUp size={14} color="#34d399" />;
      case 'decreasing':
      case 'low':
        return <TrendingDown size={14} color="#f87171" />;
      default:
        return <Minus size={14} color="#94a3b8" />;
    }
  };

  return (
    <div className="competitors-table-wrap">
      <table className="competitors-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Organization / Institution</th>
            <th>Type</th>
            <th>Papers</th>
            <th>Patents</th>
            <th>Activity Share</th>
            <th>Trend</th>
            <th>Source</th>
          </tr>
        </thead>
        <tbody>
          {competitors.map((comp, idx) => (
            <tr key={comp.id || `${comp.organization_name}-${idx}`}>
              <td style={{ color: 'var(--clr-text-muted)', fontWeight: 600 }}>
                #{idx + 1}
              </td>
              <td className="org-name-cell">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Building2 size={15} color="var(--clr-primary)" />
                  <span>{comp.organization_name}</span>
                </div>
              </td>
              <td style={{ textTransform: 'capitalize', fontSize: '0.8rem' }}>
                {comp.organization_type || 'Institution'}
              </td>
              <td>{comp.paper_count?.toLocaleString() || 0}</td>
              <td>{comp.patent_count?.toLocaleString() || 0}</td>
              <td>
                {comp.share_of_activity !== undefined && comp.share_of_activity !== null
                  ? `${Math.round(comp.share_of_activity * 100)}%`
                  : '—'}
              </td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {getMomentumIcon(comp.momentum)}
                  <span style={{ fontSize: '0.78rem' }}>{comp.momentum || 'Stable'}</span>
                </div>
              </td>
              <td>
                <DataSourceBadge isDemo={comp.is_demo} source="OpenAlex / PatentsView" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
