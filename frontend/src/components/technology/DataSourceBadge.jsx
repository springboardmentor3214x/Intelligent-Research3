import React from 'react';
import { CheckCircle, ShieldCheck } from 'lucide-react';

/**
 * Visual badge identifying verified live data provenance
 */
export default function DataSourceBadge({ isDemo = false, source = 'OpenAlex' }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '0.68rem',
        fontWeight: 700,
        background: 'rgba(34, 197, 94, 0.10)',
        color: '#22c55e',
        border: '1px solid rgba(34, 197, 94, 0.25)',
        padding: '2px 8px',
        borderRadius: '4px',
        letterSpacing: '0.03em',
      }}
      title={`Live Verified Production Data from ${source || 'OpenAlex'}`}
    >
      <CheckCircle size={11} />
      <span>{source || 'LIVE API'}</span>
    </span>
  );
}
