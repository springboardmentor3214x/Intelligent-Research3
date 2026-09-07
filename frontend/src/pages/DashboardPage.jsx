import { useEffect, useState } from 'react';
import { ArrowRight, Bell, BookOpen, ExternalLink, Lightbulb, Search, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../services/api';
import './DashboardPage.css';

const modules = [
  ['Research Profile', 'Manage your academic identity, expertise and research record.', BookOpen, '/research-profile', 'Open module'],
  ['Patent Intelligence', 'Track intellectual property and technology landscapes.', ShieldCheck, '#', 'Available soon'],
  ['Research Intelligence', 'Explore evidence-led trends, topics and profile relevance.', Lightbulb, '/research-intelligence', 'Open module'],
];

export default function DashboardPage() {
  const [query, setQuery] = useState('artificial intelligence');
  const [publications, setPublications] = useState([]);
  const [searchState, setSearchState] = useState('idle');
  const [searchError, setSearchError] = useState('');

  function searchPublications(event) {
    event?.preventDefault();
    setSearchState('loading');
    setSearchError('');
    apiRequest(`/api/research/publications/search?query=${encodeURIComponent(query.trim())}&from_publication_date=2019-01-01&to_publication_date=2019-12-31&per-page=3`)
      .then((result) => { setPublications(result.publications); setSearchState('success'); })
      .catch((error) => { setSearchError(error.message); setSearchState('error'); });
  }

  useEffect(() => { searchPublications(); }, []);

  return <div className="dashboard-page"><header className="dashboard-header"><div className="dashboard-brand"><span>RI</span><div><strong>Research<span>IQ</span></strong><small>Intelligence platform</small></div></div><div className="dashboard-header-actions"><button aria-label="Notifications"><Bell size={18} /><i /></button><span className="dashboard-avatar">PS</span><div><strong>Dr. Priya Sharma</strong><small>Researcher</small></div></div></header><main className="dashboard-content"><div className="dashboard-welcome"><div><p className="dashboard-eyebrow">Workspace overview</p><h1>Good afternoon, Priya</h1><p>Keep your research identity current and turn your work into actionable intelligence.</p></div><Link className="dashboard-primary" to="/research-profile">View research profile <ArrowRight size={16} /></Link></div><section className="dashboard-highlight"><div className="dashboard-highlight-icon"><BookOpen size={22} /></div><div><p className="dashboard-eyebrow">Your next best action</p><h2>Complete your research profile</h2><p>Your profile is ready to connect with research intelligence when the profile is complete.</p></div><Link to="/research-profile">Continue setup <ArrowRight size={15} /></Link></section><section className="dashboard-openalex"><div className="dashboard-openalex-head"><div><p className="dashboard-eyebrow">OpenAlex discovery</p><h2>Find relevant publications</h2><p>Search 2019 research literature with verified scholarly metadata.</p></div><span>2019 corpus</span></div><form className="dashboard-openalex-search" onSubmit={searchPublications}><label><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Publication search" /></label><button type="submit" disabled={searchState === 'loading'}>{searchState === 'loading' ? 'Searching...' : 'Search'}</button></form>{searchState === 'error' ? <p className="dashboard-openalex-message error">{searchError}</p> : searchState === 'loading' ? <p className="dashboard-openalex-message">Loading OpenAlex publications...</p> : publications.length ? <div className="dashboard-publication-list">{publications.map((publication) => <article className="dashboard-publication" key={publication.openalex_id}><div><h3>{publication.title}</h3><p>{publication.authors.slice(0, 3).join(', ')}{publication.authors.length > 3 ? ' et al.' : ''}</p><small>{publication.journal_or_conference || 'Source not listed'} · {publication.publication_date || 'Date unavailable'} · {publication.cited_by_count.toLocaleString()} citations</small></div>{publication.publication_link ? <a href={publication.publication_link} target="_blank" rel="noreferrer" aria-label={`Open ${publication.title}`}><ExternalLink size={16} /></a> : null}</article>)}</div> : <p className="dashboard-openalex-message">No publications found for this query.</p>}<Link className="dashboard-openalex-more" to="/research-intelligence">Open full research intelligence <ArrowRight size={14} /></Link></section><div className="dashboard-section-heading"><div><h2>Platform modules</h2><p>One workspace for your research and innovation journey.</p></div></div><section className="dashboard-grid">{modules.map(([title, description, Icon, href, action]) => <article className={`dashboard-module ${href === '#' ? 'disabled' : ''}`} key={title}><div className="dashboard-module-icon"><Icon size={19} /></div><h3>{title}</h3><p>{description}</p>{href === '#' ? <span className="dashboard-coming">{action}</span> : <Link to={href}>{action} <ArrowRight size={14} /></Link>}</article>)}</section></main></div>;
}