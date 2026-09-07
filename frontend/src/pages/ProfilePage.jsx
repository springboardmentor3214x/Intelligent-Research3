import { useEffect, useState } from 'react';

import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import './ProfilePage.css';

const profileDefaults = {
  name: '', organization: '', department: '', designation: '', country: '', research_domain: '',
  research_areas: [], research_interests: [], research_keywords: [], technology_areas: [],
};
const profileFields = [
  ['name', 'Name', true], ['organization', 'Organization', false], ['department', 'Department', false],
  ['designation', 'Designation', false], ['country', 'Country', false], ['research_domain', 'Research Domain', false],
];
const listFields = [
  ['research_areas', 'Research Areas'], ['research_interests', 'Research Interests'],
  ['research_keywords', 'Research Keywords'], ['technology_areas', 'Technology Areas'],
];
const publicationDefaults = {
  publication_title: '', authors: '', publication_date: '', journal_or_conference: '', publication_type: '',
  research_domain: '', keywords: '', doi: '', publication_link: '',
};
const patentDefaults = {
  patent_title: '', patent_number: '', inventor: '', filing_date: '', publication_date: '',
  patent_status: '', patent_domain: '', patent_link: '',
};

function normalizeProfile(user) {
  return {
    ...profileDefaults,
    ...user,
    research_areas: Array.isArray(user.research_areas) ? user.research_areas : [],
    research_interests: Array.isArray(user.research_interests) ? user.research_interests : [],
    research_keywords: Array.isArray(user.research_keywords) ? user.research_keywords : [],
    technology_areas: Array.isArray(user.technology_areas) ? user.technology_areas : [],
  };
}

function Tags({ values, onRemove }) {
  if (!values.length) return <p className="empty-inline">No entries yet</p>;
  return <div className="tag-list">{values.map((value) => <span className="tag" key={value}>{value}{onRemove ? <button type="button" aria-label={`Remove ${value}`} onClick={() => onRemove(value)}>x</button> : null}</span>)}</div>;
}

function RecordForm({ type, value, onChange, onCancel, onSave, busy }) {
  const publication = type === 'publication';
  const fields = publication ? [
    ['publication_title', 'Publication title', 'text', true], ['authors', 'Authors', 'text', true], ['publication_date', 'Publication date', 'date', false],
    ['journal_or_conference', 'Journal / Conference', 'text', false], ['publication_type', 'Publication type', 'text', false], ['research_domain', 'Research domain', 'text', false],
    ['keywords', 'Keywords', 'text', false], ['doi', 'DOI', 'text', false], ['publication_link', 'Publication link', 'url', false],
  ] : [
    ['patent_title', 'Patent title', 'text', true], ['patent_number', 'Patent number', 'text', true], ['inventor', 'Inventor', 'text', true],
    ['filing_date', 'Filing date', 'date', false], ['publication_date', 'Publication date', 'date', false], ['patent_status', 'Patent status', 'text', false],
    ['patent_domain', 'Patent domain', 'text', false], ['patent_link', 'Patent link', 'url', false],
  ];
  return <form className="record-form" onSubmit={(event) => { event.preventDefault(); onSave(); }}><div className="record-form-grid">{fields.map(([name, label, inputType, required]) => <label className="form-field" key={name}><span>{label}{required ? ' *' : ''}</span><input type={inputType} value={value[name] || ''} required={required} onChange={(event) => onChange({ ...value, [name]: event.target.value })} /></label>)}</div><div className="record-actions"><button className="button button-primary" type="submit" disabled={busy}>{busy ? 'Saving...' : 'Save'}</button><button className="button button-secondary" type="button" onClick={onCancel} disabled={busy}>Cancel</button></div></form>;
}

function RecordsSection({ type, records, onRefresh, onMessage, onError }) {
  const publication = type === 'publication';
  const label = publication ? 'Publication' : 'Patent';
  const [editor, setEditor] = useState(null);
  const [busy, setBusy] = useState(false);
  const defaults = publication ? publicationDefaults : patentDefaults;
  const endpoint = publication ? '/publications' : '/patents';

  async function save() {
    setBusy(true); onError('');
    try {
      const method = editor.value.id ? 'PUT' : 'POST';
      const path = editor.value.id ? `${endpoint}/${editor.value.id}` : endpoint;
      await apiRequest(path, { method, body: JSON.stringify(editor.value) });
      setEditor(null); await onRefresh(); onMessage(`${label} saved successfully.`);
    } catch (requestError) { onError(requestError.message || `Unable to save ${label.toLowerCase()}.`); }
    finally { setBusy(false); }
  }

  async function remove(id) {
    if (!window.confirm(`Delete this ${label.toLowerCase()}? This cannot be undone.`)) return;
    setBusy(true); onError('');
    try { await apiRequest(`${endpoint}/${id}`, { method: 'DELETE' }); await onRefresh(); onMessage(`${label} deleted successfully.`); }
    catch (requestError) { onError(requestError.message || `Unable to delete ${label.toLowerCase()}.`); }
    finally { setBusy(false); }
  }

  return <section className="content-card records-card"><div className="card-heading"><div><h2>{publication ? 'Publications' : 'Patents'}</h2><p>{publication ? 'Your published research record.' : 'Your intellectual property record.'}</p></div><button className="button button-primary" type="button" onClick={() => setEditor({ value: { ...defaults } })} disabled={busy}>Add {label}</button></div>{editor ? <RecordForm type={type} value={editor.value} onChange={(value) => setEditor({ value })} onCancel={() => setEditor(null)} onSave={save} busy={busy} /> : null}{records.length ? <div className="record-list">{records.map((record) => <article className="record-item" key={record.id}><div className="record-content"><h3>{publication ? record.publication_title : record.patent_title}</h3><p>{publication ? [record.authors, record.journal_or_conference, record.publication_type].filter(Boolean).join(' · ') : [record.patent_number, record.inventor, record.patent_status].filter(Boolean).join(' · ')}</p><small>{record.publication_date || record.filing_date || 'Date not provided'}</small></div><div className="record-actions"><button className="button button-secondary" type="button" onClick={() => setEditor({ value: { ...record } })} disabled={busy}>Edit</button><button className="button button-danger" type="button" onClick={() => remove(record.id)} disabled={busy}>Delete</button></div></article>)}</div> : <div className="empty-state"><strong>No {publication ? 'publications' : 'patents'} added</strong><span>Add a record to keep your profile complete.</span></div>}</section>;
}

export default function ProfilePage() {
  const { token, login } = useAuth();
  const [profile, setProfile] = useState(profileDefaults);
  const [savedProfile, setSavedProfile] = useState(profileDefaults);
  const [publications, setPublications] = useState([]);
  const [patents, setPatents] = useState([]);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tagDrafts, setTagDrafts] = useState({});

  async function loadProfile() {
    const user = await apiRequest('/profile');
    const nextProfile = normalizeProfile(user);
    setProfile(nextProfile); setSavedProfile(nextProfile);
    setPublications(Array.isArray(user.publications) ? user.publications : []);
    setPatents(Array.isArray(user.patents) ? user.patents : []);
  }

  useEffect(() => {
    let active = true;
    async function load() {
      try { await loadProfile(); }
      catch (requestError) { if (active) setError(requestError.message || 'Unable to load your profile.'); }
      finally { if (active) setLoading(false); }
    }
    if (token) load();
    return () => { active = false; };
  }, [token]);

  async function saveProfile(event) {
    event.preventDefault(); setSaving(true); setError(''); setSuccess('');
    try {
      const updated = await apiRequest('/profile', { method: 'PUT', body: JSON.stringify(profile) });
      const nextProfile = normalizeProfile(updated);
      setProfile(nextProfile); setSavedProfile(nextProfile); login(token, updated); setEditing(false); setSuccess('Profile changes saved successfully.');
    } catch (requestError) { setError(requestError.message || 'Unable to save your profile.'); }
    finally { setSaving(false); }
  }

  function addTag(key) {
    const value = (tagDrafts[key] || '').trim();
    if (!value || profile[key].some((item) => item.toLowerCase() === value.toLowerCase())) return;
    setProfile((current) => ({ ...current, [key]: [...current[key], value] })); setTagDrafts((current) => ({ ...current, [key]: '' }));
  }

  function cancelProfileEdit() { setProfile(savedProfile); setEditing(false); setError(''); }
  async function refreshRecords() { await loadProfile(); }
  function message(value) { setError(''); setSuccess(value); }

  if (loading) return <main className="profile-page"><p className="page-loading" role="status">Loading research profile...</p></main>;
  return <main className="profile-page"><div className="profile-shell"><header className="page-header"><div><p className="eyebrow">Research intelligence platform</p><h1>Research Profile</h1><p className="page-description">Manage your researcher identity, expertise, publications, and patents.</p></div><button className="button button-primary" type="button" disabled={saving} onClick={() => editing ? cancelProfileEdit() : setEditing(true)}>{editing ? 'Cancel' : 'Edit profile'}</button></header>
    {error ? <p className="notice notice-error" role="alert">{error}</p> : null}{success ? <p className="notice notice-success" role="status">{success}</p> : null}
    <form onSubmit={saveProfile}><section className="content-card"><div className="card-heading"><div><h2>Researcher Information</h2><p>Core identity and organization details.</p></div>{editing ? <div className="record-actions"><button className="button button-primary" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</button><button className="button button-secondary" type="button" onClick={cancelProfileEdit} disabled={saving}>Cancel</button></div> : null}</div><div className="info-grid">{profileFields.map(([key, label, required]) => editing ? <label className="form-field" key={key}><span>{label}{required ? ' *' : ''}</span><input name={key} value={profile[key]} required={required} onChange={(event) => setProfile((current) => ({ ...current, [key]: event.target.value }))} /></label> : <div className="info-item" key={key}><span>{label}</span><strong>{profile[key] || 'Not provided'}</strong></div>)}</div></section></form>
    <section className="content-card"><div className="card-heading"><div><h2>Research Expertise</h2><p>Areas and technologies that describe your work.</p></div></div><div className="expertise-grid">{listFields.map(([key, label]) => <div className="expertise-item" key={key}><h3>{label}</h3><Tags values={profile[key]} onRemove={editing ? (value) => setProfile((current) => ({ ...current, [key]: current[key].filter((item) => item !== value) })) : null} />{editing ? <div className="tag-input"><input value={tagDrafts[key] || ''} placeholder={`Add ${label.toLowerCase()}`} onChange={(event) => setTagDrafts((current) => ({ ...current, [key]: event.target.value }))} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addTag(key); } }} /><button className="button button-secondary" type="button" onClick={() => addTag(key)}>Add</button></div> : null}</div>)}</div></section>
    <RecordsSection type="publication" records={publications} onRefresh={refreshRecords} onMessage={message} onError={setError} /><RecordsSection type="patent" records={patents} onRefresh={refreshRecords} onMessage={message} onError={setError} />
  </div></main>;
}
