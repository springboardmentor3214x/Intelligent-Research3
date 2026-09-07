import { useEffect, useState } from 'react';
import { Brain, RefreshCw, Sparkles, TrendingUp } from 'lucide-react';
import { apiRequest } from '../services/api';
import './ResearchIntelligence.css';

export default function ResearchIntelligence() {
  const [data, setData] = useState({ trends: null, insights: null, recommendations: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      apiRequest('/api/research/trends'),
      apiRequest('/api/research/insights'),
      apiRequest('/api/research/recommendations'),
    ])
      .then(([trends, insights, recommendations]) => setData({ trends, insights, recommendations }))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <main className="intelligence-page"><div className="intelligence-state">Loading research intelligence...</div></main>;
  if (error) return <main className="intelligence-page"><div className="intelligence-state intelligence-error">{error}</div></main>;

  const trends = data.trends.publication_trends;
  const maxCount = Math.max(...trends.map((item) => item.count), 1);
  return <main className="intelligence-page">
    <header className="intelligence-header">
      <div><p className="intelligence-eyebrow">Module 3 / evidence workspace</p><h1>Research intelligence</h1><p>Evidence-led signals from your publication record.</p></div>
      <button className="intelligence-refresh" onClick={() => window.location.reload()} aria-label="Refresh intelligence"><RefreshCw size={17} /> Refresh</button>
    </header>
    <section className="intelligence-grid">
      <article className="intelligence-panel intelligence-trends"><div className="panel-heading"><div><span className="panel-kicker">Corpus signal</span><h2>Publication activity</h2></div><TrendingUp size={20} /></div>
        {trends.length ? <div className="trend-chart">{trends.map((item) => <div className="trend-column" key={item.year}><strong>{item.count}</strong><div className="trend-bar" style={{ height: `${Math.max(12, item.count / maxCount * 150)}px` }} /><small>{item.year}</small></div>)}</div> : <p className="empty-copy">Add publications to see activity over time.</p>}
      </article>
      <article className="intelligence-panel"><div className="panel-heading"><div><span className="panel-kicker">Observed topics</span><h2>Top research themes</h2></div><Sparkles size={20} /></div><div className="topic-list">{data.trends.top_topics.length ? data.trends.top_topics.slice(0, 6).map((topic) => <div className="topic-row" key={topic.topic}><span>{topic.topic}</span><strong>{topic.paper_count}</strong></div>) : <p className="empty-copy">No topic metadata is available yet.</p>}</div></article>
      <article className="intelligence-panel intelligence-wide"><div className="panel-heading"><div><span className="panel-kicker">Profile relevance</span><h2>Recommended papers</h2></div><Brain size={20} /></div>{data.recommendations.recommendations.length ? <div className="recommendation-list">{data.recommendations.recommendations.map((item) => <div className="recommendation-row" key={item.paper_id}><div><strong>{item.title}</strong><small>{item.reasons.join(' · ')}</small></div><span>{Math.round(item.relevance_score * 100)}%</span></div>)}</div> : <p className="empty-copy">Complete your research profile to activate recommendations.</p>}</article>
    </section>
  </main>;
}
