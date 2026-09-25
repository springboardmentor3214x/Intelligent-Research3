import React from 'react';
import { AlertTriangle, Database, CheckCircle } from 'lucide-react';

/**
 * Visual badge identifying data provenance (Demo vs Real External Source)
 */
export default function DataSourceBadge({ isDemo = false, source = 'OpenAlex' }) {
  if (isDemo) {
    return (
      <span
        className="badge-source demo"
        title="⚠️ Synthetic Demo Data: used for local benchmarking, not live production telemetry"
      >
        <AlertTriangle size={11} />
        DEMO DATA
      </span>
    );
  }

  return (
    <span
      className="badge-source real"
      title={`Live Production Data from ${source}`}
    >
      <CheckCircle size={11} />
      {source || 'LIVE API'}
    </span>
  );
}
