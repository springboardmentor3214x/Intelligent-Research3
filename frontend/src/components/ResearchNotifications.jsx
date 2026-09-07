import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { mockResearchProfile } from '../data/mockResearchProfile';
import './ResearchNotifications.css';

const PROFILE_KEY = 'researchProfile';

function getPublications() {
  try {
    return (JSON.parse(localStorage.getItem(PROFILE_KEY)) || mockResearchProfile).publications || [];
  } catch {
    return [];
  }
}

export default function ResearchNotifications() {
  const [open, setOpen] = useState(false);
  const [publications, setPublications] = useState(getPublications);

  useEffect(() => {
    const handleNotificationClick = () => {
      setPublications(getPublications().slice(0, 3));
      setOpen((current) => !current);
    };
    const handleDocumentClick = (event) => {
      if (event.target.closest('button[aria-label="Notifications"]')) handleNotificationClick();
    };
    document.addEventListener('click', handleDocumentClick, true);
    return () => document.removeEventListener('click', handleDocumentClick, true);
  });

  if (!open) return null;
  return <div className="research-notifications" role="dialog" aria-label="Research notifications">
    <div className="research-notifications-head"><strong>Research updates</strong><small>{publications.length} paper{publications.length === 1 ? '' : 's'}</small></div>
    {publications.length ? publications.map((paper) => <button key={paper.id} className="research-notification-item" onClick={() => setOpen(false)}><FileText size={15} /><span><strong>{paper.title}</strong><small>Publication record{paper.publicationDate ? ` · ${paper.publicationDate}` : ''}</small></span></button>) : <p className="research-notifications-empty">No research-paper updates yet.</p>}
  </div>;
}
